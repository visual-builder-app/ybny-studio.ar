"""Local-only lifecycle for the YBNY accounts API container.

Secrets (database URL, service token) live in the user's private Linux home,
outside the checkout, mode 0600, and are never printed. The accounts database
stays private: it publishes no ports and is reachable only inside its network.

Run under Linux/WSL. The only dependency is Docker plus the standard library.
"""

import argparse
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import time
import urllib.request

ROOT = Path(__file__).resolve().parent
STATE = (Path.home() / ".local" / "share" / "ybny-accounts-api").resolve()
DB_STATE = (Path.home() / ".local" / "share" / "ybny-accounts-db").resolve()
CONTAINER = "ybny-accounts-api-local"
DB_CONTAINER = "ybny-accounts-db-local"
DB_HOST = "ybny-accounts-db-local"
DB_NAME = "ybny_accounts"
DB_ROLE = "ybny_access_service"
DB_LABEL_VALUE = "accounts-database-local"
PRIVATE_NETWORK = "ybny-accounts-private-local"
EDGE_NETWORK = "ybny-accounts-api-edge-local"
COMPOSE = ROOT / "docker-compose.yml"
LABEL = "com.ybny.component"
LABEL_VALUE = "accounts-api-local"
HEALTH_URL = "http://127.0.0.1:4000/health"
TOKEN_FILE = "service-token"
URL_FILE = "database-url"
SECRET_FILES = (TOKEN_FILE, URL_FILE)


def current_uid() -> int:
    getuid = getattr(os, "getuid", None)
    if getuid is None:
        raise RuntimeError("Run this local API tool inside WSL/Linux.")
    return getuid()


def current_gid() -> int:
    getgid = getattr(os, "getgid", None)
    if getgid is None:
        raise RuntimeError("Run this local API tool inside WSL/Linux.")
    return getgid()


class AccountsApi:
    state: Path
    prefix: list[str]

    def __init__(self, sudo=False):
        if os.name != "posix":
            raise RuntimeError("Run this local API tool inside WSL/Linux.")
        self.prefix = ["sudo", "-n"] if sudo else []
        self.state = STATE

    def run(self, *args, check=True, timeout=180, sensitive=False):
        result = subprocess.run(
            [*self.prefix, "docker", *args],
            capture_output=True, text=True, timeout=timeout,
        )
        if check and result.returncode:
            detail = (
                "Private operation failed; no secret was printed."
                if sensitive
                else result.stderr.strip()
            )
            raise RuntimeError(detail or f"Docker operation exited with {result.returncode}")
        return result

    def inspect(self, kind, name):
        result = self.run(kind, "inspect", name, check=False, timeout=40)
        if result.returncode:
            return None
        return json.loads(result.stdout)[0]

    def compose(self, *args, check=True, timeout=600):
        # Only a non-secret path is passed through an env file read by the client.
        env_file = self.state / "compose.env"
        result = subprocess.run(
            [
                *self.prefix, "docker", "compose",
                "--env-file", str(env_file),
                "-f", str(COMPOSE), *args,
            ],
            capture_output=True, text=True, timeout=timeout,
        )
        if check and result.returncode:
            raise RuntimeError(result.stderr.strip() or f"compose exited with {result.returncode}")
        return result

    # --- private state ---------------------------------------------------
    def write_secret(self, path, value: str) -> None:
        """Create or replace a 0600 secret file without a readable window."""
        temp = path.with_name(path.name + ".tmp")
        temp.unlink(missing_ok=True)
        fd = os.open(temp, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            stream.write(value + "\n")
        os.replace(temp, path)

    def prepare_secrets(self):
        self.state.mkdir(parents=True, exist_ok=True, mode=0o700)
        os.chmod(self.state, 0o700)
        (self.state / "compose.env").write_text(
            f"YBNY_ACCOUNTS_API_STATE={self.state}\n"
            f"YBNY_ACCOUNTS_API_UID={current_uid()}\n"
            f"YBNY_ACCOUNTS_API_GID={current_gid()}\n",
            encoding="utf-8",
        )
        token_path = self.state / TOKEN_FILE
        if not token_path.exists():
            self.write_secret(token_path, secrets.token_urlsafe(48))
        url_path = self.state / URL_FILE
        self.write_secret(url_path, self.database_url())
        for path in (token_path, url_path):
            if path.is_symlink() or path.stat().st_uid != current_uid() or path.stat().st_mode & 0o077:
                raise RuntimeError("Local secret files must be owned by this user with mode 0600.")
        return token_path

    def database_url(self):
        pgpass = DB_STATE / "runtime.pgpass"
        if not pgpass.exists():
            raise RuntimeError(
                "Start the isolated accounts database first: services/accounts-db/runtime.py start"
            )
        for line in pgpass.read_text(encoding="utf-8").splitlines():
            parts = line.split(":")
            if len(parts) == 5 and parts[3] == DB_ROLE:
                password = parts[4]
                if not re.fullmatch(r"[A-Za-z0-9_-]{40,}", password):
                    raise RuntimeError("Unexpected local credential format.")
                return f"postgresql://{DB_ROLE}:{password}@{DB_HOST}:5432/{DB_NAME}"
        raise RuntimeError("No local credential found for the access service role.")

    # --- guards ----------------------------------------------------------
    def require_database(self):
        info = self.inspect("container", DB_CONTAINER)
        if info is None or not info["State"]["Running"]:
            raise RuntimeError("The isolated accounts database container is not running.")
        labels = info.get("Config", {}).get("Labels") or {}
        if labels.get("com.ybny.component") != DB_LABEL_VALUE:
            raise RuntimeError("The accounts database container is not the managed local one.")
        if info["HostConfig"].get("PortBindings"):
            raise RuntimeError("Refusing: the accounts database must not publish ports.")
        return info

    def require_private_network(self):
        result = self.run("network", "inspect", PRIVATE_NETWORK, check=False, timeout=40)
        if result.returncode:
            raise RuntimeError(
                "The isolated accounts network is missing; start the accounts database first."
            )
        info = json.loads(result.stdout)[0]
        if not info.get("Internal"):
            raise RuntimeError("Refusing: the accounts network must be internal.")
        return info

    def assert_managed_container(self):
        info = self.inspect("container", CONTAINER)
        if info is None:
            raise RuntimeError("Start the local accounts API first: runtime.py up")
        if (info.get("Config", {}).get("Labels") or {}).get(LABEL) != LABEL_VALUE:
            raise RuntimeError("Resource name is already owned by another application; refusing to change it.")
        networks = set(info["NetworkSettings"]["Networks"])
        if not networks <= {PRIVATE_NETWORK, EDGE_NETWORK}:
            raise RuntimeError("Refusing an API container attached to an unexpected network.")
        for bindings in (info["HostConfig"].get("PortBindings") or {}).values():
            for binding in bindings:
                if binding.get("HostIp") != "127.0.0.1":
                    raise RuntimeError("Refusing an API container published beyond loopback.")
        env_names = {entry.split("=", 1)[0] for entry in info["Config"].get("Env") or []}
        if {"ACCOUNTS_API_TOKEN", "ACCOUNTS_DATABASE_URL"} & env_names:
            raise RuntimeError("Refusing: secrets must be mounted as files, not environment variables.")
        return info

    # --- actions ---------------------------------------------------------
    def up(self, build=True):
        self.prepare_secrets()
        self.require_database()
        self.require_private_network()
        self.compose("up", "-d", *(["--build"] if build else []))
        self.wait_healthy()
        return "API container is up and answering health checks on loopback."

    def wait_healthy(self, deadline_seconds=120):
        deadline = time.monotonic() + deadline_seconds
        detail = "no response yet"
        while time.monotonic() < deadline:
            info = self.inspect("container", CONTAINER)
            if info is None:
                detail = "container missing"
            elif not info["State"]["Running"]:
                raise RuntimeError("The API container stopped; inspect local container logs.")
            else:
                try:
                    with urllib.request.urlopen(HEALTH_URL, timeout=2) as response:
                        if response.status == 200:
                            return True
                except OSError as error:
                    detail = type(error).__name__
            time.sleep(1)
        raise RuntimeError(f"The API did not become reachable from the host ({detail}).")

    def status(self):
        info = self.assert_managed_container()
        published = [
            f"{binding.get('HostIp')}:{binding.get('HostPort')}"
            for bindings in (info["HostConfig"].get("PortBindings") or {}).values()
            for binding in bindings
        ]
        reachable = "unreachable"
        try:
            with urllib.request.urlopen(HEALTH_URL, timeout=2) as response:
                reachable = "ok" if response.status == 200 else f"http {response.status}"
        except OSError:
            pass
        print(json.dumps({
            "container": CONTAINER,
            "running": info["State"]["Running"],
            "health": info["State"].get("Health", {}).get("Status"),
            "published": published,
            "networks": sorted(info["NetworkSettings"]["Networks"]),
            "mounts": [mount["Destination"] for mount in info["Mounts"]],
            "secret_files": sorted(name for name in SECRET_FILES if (self.state / name).exists()),
            "private_state_directory": str(self.state),
            "host_health": reachable,
        }, indent=2))

    def down(self):
        self.assert_managed_container()
        self.compose("down")
        return "API container removed; private secrets and the accounts database were kept."


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sudo", action="store_true", help="Use approved passwordless sudo for Docker under WSL.")
    parser.add_argument("action", choices=("provision", "up", "status", "down"))
    args = parser.parse_args()
    api = AccountsApi(sudo=args.sudo)
    if args.action == "provision":
        api.prepare_secrets()
        print("Local API secret files are in place; no value was printed.")
    elif args.action == "up":
        print(api.up())
    elif args.action == "status":
        api.status()
    else:
        print(api.down())


if __name__ == "__main__":
    main()
