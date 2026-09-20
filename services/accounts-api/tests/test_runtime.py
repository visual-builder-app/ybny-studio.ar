"""Policy and unit tests for the local accounts API service.

No Docker and no database: run anywhere Python 3.10+ is available.
The end-to-end HTTP/DB contract lives in tests/test_access_end_to_end.py.
"""

import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("ybny_accounts_api_runtime", ROOT / "runtime.py")
assert _spec is not None and _spec.loader is not None
runtime = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(runtime)

COMPOSE = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")
DOCKERFILE = (ROOT / "Dockerfile").read_text(encoding="utf-8")


class ComposePolicyTests(unittest.TestCase):
    """Guards on the shipped compose file; text checks keep this stdlib-only."""

    def test_publishes_only_on_loopback(self):
        self.assertIn('"127.0.0.1:4000:4000"', COMPOSE)
        self.assertNotIn("0.0.0.0:4000:4000", COMPOSE)

    def test_joins_the_edge_bridge_and_the_private_internal_network(self):
        self.assertIn("name: ybny-accounts-private-local", COMPOSE)
        self.assertIn("driver: bridge", COMPOSE)
        self.assertIn("name: ybny-accounts-api-edge-local", COMPOSE)

    def test_secrets_are_mounted_files_not_environment_values(self):
        self.assertIn("/run/ybny-api-secrets:ro", COMPOSE)
        self.assertIn("ACCOUNTS_DATABASE_URL_FILE=", COMPOSE)
        self.assertIn("ACCOUNTS_API_TOKEN_FILE=", COMPOSE)
        self.assertNotIn("ACCOUNTS_API_TOKEN=", COMPOSE)
        self.assertNotIn("ACCOUNTS_DATABASE_URL=", COMPOSE)

    def test_no_plaintext_credentials_in_compose(self):
        # After "://user:" only a ${VAR} substitution may appear.
        self.assertNotRegex(COMPOSE, r"postgres(ql)?://[^\s:@]+:[^\s@$*{][^\s@]*@")

    def test_container_hardening(self):
        self.assertIn("read_only: true", COMPOSE)
        self.assertIn("no-new-privileges:true", COMPOSE)
        self.assertIn("- ALL", COMPOSE)  # cap_drop
        self.assertIn("/tmp", COMPOSE)  # tmpfs
        self.assertIn("user:", COMPOSE)  # host uid mapping for 0600 secret files
        self.assertIn("max-size", COMPOSE)  # log rotation


class DockerfilePolicyTests(unittest.TestCase):
    def test_runtime_is_non_root_and_uses_the_lockfile(self):
        self.assertIn("USER node", DOCKERFILE)
        self.assertIn("npm ci --omit=dev", DOCKERFILE)
        self.assertNotIn("npm install", DOCKERFILE)


class SecretFileTests(unittest.TestCase):
    def api(self):
        # No Docker required for these helpers.
        return runtime.AccountsApi.__new__(runtime.AccountsApi)

    def test_write_secret_creates_a_0600_file(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "database-url"
            self.api().write_secret(target, "postgresql://user:secret@host/db")
            self.assertEqual(target.stat().st_mode & 0o777, 0o600)
            self.assertEqual(
                target.read_text(encoding="utf-8"),
                "postgresql://user:secret@host/db\n",
            )
            self.assertFalse((Path(directory) / "database-url.tmp").exists())

    def test_write_secret_replacement_keeps_the_mode(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "service-token"
            target.write_text("old\n", encoding="utf-8")
            target.chmod(0o600)
            self.api().write_secret(target, "new-value")
            self.assertEqual(target.stat().st_mode & 0o777, 0o600)
            self.assertEqual(target.read_text(encoding="utf-8"), "new-value\n")


class DatabaseUrlTests(unittest.TestCase):
    def with_pgpass(self, content):
        directory = tempfile.TemporaryDirectory()
        state = Path(directory.name)
        (state / "runtime.pgpass").write_text(content, encoding="utf-8")
        return directory, state

    def test_builds_the_private_url_from_the_access_role_only(self):
        directory, state = self.with_pgpass(
            "127.0.0.1:5432:*:ybny_identity_service:" + "i" * 40 + "\n"
            "127.0.0.1:5432:*:ybny_access_service:" + "a" * 40 + "\n"
        )
        original = runtime.DB_STATE
        setattr(runtime, "DB_STATE", state)
        try:
            url = runtime.AccountsApi.__new__(runtime.AccountsApi).database_url()
        finally:
            setattr(runtime, "DB_STATE", original)
            directory.cleanup()
        self.assertEqual(
            url,
            "postgresql://ybny_access_service:"
            + "a" * 40
            + "@ybny-accounts-db-local:5432/ybny_accounts",
        )
        self.assertNotIn("ybny_identity_service", url)

    def test_refuses_an_unexpected_credential_format(self):
        directory, state = self.with_pgpass(
            "127.0.0.1:5432:*:ybny_access_service:too-short\n"
        )
        original = runtime.DB_STATE
        setattr(runtime, "DB_STATE", state)
        try:
            with self.assertRaises(RuntimeError):
                runtime.AccountsApi.__new__(runtime.AccountsApi).database_url()
        finally:
            setattr(runtime, "DB_STATE", original)
            directory.cleanup()

    def test_missing_credentials_fail_closed(self):
        directory = tempfile.TemporaryDirectory()
        original = runtime.DB_STATE
        setattr(runtime, "DB_STATE", Path(directory.name))
        try:
            with self.assertRaises(RuntimeError):
                runtime.AccountsApi.__new__(runtime.AccountsApi).database_url()
        finally:
            setattr(runtime, "DB_STATE", original)
            directory.cleanup()


if __name__ == "__main__":
    unittest.main(verbosity=2)
