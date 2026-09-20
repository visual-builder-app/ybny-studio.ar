"""End-to-end checks against the running local accounts API container.

Verifies the service contract from the host: the /api token guard, request
validation, and a real access lookup through accounts_api.get_access for a
temporary member that is deleted again in a finally block.

Requires the local containers:
    services/accounts-db/runtime.py --sudo start
    services/accounts-api/runtime.py --sudo up
Run with YBNY_ACCOUNTS_DOCKER_SUDO=1 when Docker needs passwordless sudo.
"""

import json
import os
from pathlib import Path
import unittest
from urllib import error, request
from uuid import uuid4
import importlib.util
from datetime import datetime, timezone

API = os.environ.get("YBNY_ACCOUNTS_API_URL", "http://127.0.0.1:4000")
TOKEN_PATH = Path.home() / ".local" / "share" / "ybny-accounts-api" / "service-token"
SERVICE_ROOT = Path(__file__).resolve().parents[1]
RUNTIME_PATH = SERVICE_ROOT.parent / "accounts-db" / "runtime.py"

# Load the accounts-db lifecycle module explicitly; a plain `import runtime`
# would resolve to this service's own runtime.py.
_spec = importlib.util.spec_from_file_location("ybny_accounts_db_runtime", RUNTIME_PATH)
assert _spec is not None and _spec.loader is not None
db_runtime = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(db_runtime)


def call(path, body=None, authorization=None):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if authorization is not None:
        headers["Authorization"] = authorization
    http_request = request.Request(
        API + path, data=data, headers=headers, method="POST" if data else "GET"
    )
    try:
        with request.urlopen(http_request, timeout=10) as response:
            return response.status, json.loads(response.read())
    except error.HTTPError as failure:
        return failure.code, json.loads(failure.read())


class AccountsApiContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not TOKEN_PATH.exists():
            raise RuntimeError(
                "Prerequisites missing: run services/accounts-api/runtime.py up first. "
                "A skipped suite is not a passing suite."
            )
        cls.token = TOKEN_PATH.read_text(encoding="utf-8").strip()
        status, _ = call("/health")
        if status != 200:
            raise RuntimeError(
                f"Prerequisites missing: /health answered {status}. "
                "Run services/accounts-api/runtime.py up first."
            )
        cls.db = db_runtime.LocalDatabase(
            sudo=os.environ.get("YBNY_ACCOUNTS_DOCKER_SUDO") == "1"
        )

    def test_health_is_public_and_does_not_leak_structure(self):
        status, payload = call("/health")
        self.assertEqual(status, 200)
        self.assertEqual(payload, {"status": "ok", "service": "ybny-accounts-api"})

    def test_access_requires_a_service_token(self):
        status, payload = call(
            "/api/access", {"memberId": str(uuid4()), "environment": "test"}
        )
        self.assertEqual(status, 401)
        self.assertEqual(payload, {"error": "Unauthorized"})

    def test_access_rejects_a_wrong_token(self):
        for candidate in ("Bearer wrong", f"Bearer {self.token[:-1]}", self.token):
            with self.subTest(candidate=candidate[:12]):
                status, payload = call(
                    "/api/access",
                    {"memberId": str(uuid4()), "environment": "test"},
                    authorization=candidate,
                )
                self.assertEqual(status, 401)
                self.assertEqual(payload, {"error": "Unauthorized"})

    def test_access_validates_the_request_body(self):
        authorization = f"Bearer {self.token}"
        for body in (
            {},
            {"memberId": "not-a-uuid", "environment": "test"},
            {"memberId": str(uuid4()), "environment": "staging"},
        ):
            with self.subTest(body=body):
                status, payload = call("/api/access", body, authorization=authorization)
                self.assertEqual(status, 400)
                self.assertIn("error", payload)

    def test_access_denies_an_unknown_member(self):
        status, payload = call(
            "/api/access",
            {"memberId": str(uuid4()), "environment": "test"},
            authorization=f"Bearer {self.token}",
        )
        self.assertEqual(status, 200)
        self.assertEqual(payload, {"hasAccess": False, "products": []})

    def test_access_follows_a_real_current_subscription(self):
        member_id, customer_id, subscription_id = str(uuid4()), str(uuid4()), str(uuid4())
        authorization = f"Bearer {self.token}"
        # The same member must be denied while no subscription exists yet.
        status, payload = call(
            "/api/access",
            {"memberId": member_id, "environment": "test"},
            authorization=authorization,
        )
        self.assertEqual(status, 200)
        self.assertEqual(payload, {"hasAccess": False, "products": []})
        try:
            self.db.query(
                f"""INSERT INTO identity.members(id, email, status, email_verified_at)
                    VALUES ('{member_id}', '{member_id}@example.test', 'active', now());""",
                role="ybny_identity_service",
            )
            self.db.query(
                f"""INSERT INTO billing.customers(id, member_id, provider, external_id)
                    VALUES ('{customer_id}', '{member_id}', 'sandbox', 'e2e-{customer_id}');""",
                role="ybny_billing_service",
            )
            self.db.query(
                f"""INSERT INTO billing.subscriptions(id, member_id, customer_id, provider,
                        external_id, product_key, status, period_start, period_end)
                    VALUES ('{subscription_id}', '{member_id}', '{customer_id}', 'sandbox',
                        'e2e-{subscription_id}', 'ybny.studio.pro', 'active',
                        now() - interval '1 hour', now() + interval '1 hour');""",
                role="ybny_billing_service",
            )
            status, payload = call(
                "/api/access",
                {"memberId": member_id, "environment": "test"},
                authorization=authorization,
            )
            self.assertEqual(status, 200)
            self.assertTrue(payload["hasAccess"])
            self.assertEqual(
                [product["productKey"] for product in payload["products"]],
                ["ybny.studio.pro"],
            )
            # expires_at is part of the contract: it bounds any cached authorization.
            expires_at = datetime.fromisoformat(
                payload["products"][0]["expiresAt"].replace("Z", "+00:00")
            )
            self.assertGreater(expires_at, datetime.now(timezone.utc))

            # A test-mode subscription must never unlock the live environment.
            status, payload = call(
                "/api/access",
                {"memberId": member_id, "environment": "live"},
                authorization=authorization,
            )
            self.assertEqual(payload, {"hasAccess": False, "products": []})

            # A suspended member loses access immediately.
            self.db.query(
                f"UPDATE identity.members SET status = 'suspended' WHERE id = '{member_id}';",
                role="ybny_identity_service",
            )
            status, payload = call(
                "/api/access",
                {"memberId": member_id, "environment": "test"},
                authorization=authorization,
            )
            self.assertEqual(payload, {"hasAccess": False, "products": []})
        finally:
            self.db.query(
                f"""DELETE FROM billing.subscriptions WHERE member_id = '{member_id}';
                    DELETE FROM billing.customers WHERE member_id = '{member_id}';
                    DELETE FROM identity.members WHERE id = '{member_id}';"""
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
