import importlib.util
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch


ROOT = Path(__file__).resolve().parents[2]


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ScriptCredentialTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.modules = [
            load_module("fix_orphans", ROOT / "fix_orphan_audit_programs.py"),
            load_module("seed_activities", ROOT / "seed_reference_activities.py"),
        ]

    def test_missing_credentials_fail_before_network_access(self):
        for module in self.modules:
            with self.subTest(module=module.__name__), \
                    patch.dict(os.environ, {}, clear=True), \
                    patch.object(sys, "argv", [module.__name__]), \
                    patch.object(module.requests, "Session") as session:
                with self.assertRaises(SystemExit) as raised:
                    module.main()
                self.assertEqual(2, raised.exception.code)
                session.assert_not_called()

    def test_environment_credentials_are_injected_without_logging_password(self):
        login = "audit" + "@example.invalid"
        credential = "local" + "-ephemeral-value"
        for module in self.modules:
            response = MagicMock(status_code=200, text="[]")
            response.json.return_value = []
            session = MagicMock()
            session.post.return_value = response
            session.get.return_value = response
            with self.subTest(module=module.__name__), \
                    patch.dict(os.environ, {
                        "SAFEX_ADMIN_LOGIN": login,
                        "SAFEX_ADMIN_PASSWORD": credential,
                    }, clear=True), \
                    patch.object(sys, "argv", [module.__name__]), \
                    patch.object(module.requests, "Session", return_value=session), \
                    patch("builtins.print") as output:
                module.main()
                sent = session.post.call_args.kwargs["json"]
                self.assertEqual(login, sent["login"])
                self.assertEqual(credential, sent["password"])
                rendered = " ".join(str(call) for call in output.call_args_list)
                self.assertNotIn(credential, rendered)


if __name__ == "__main__":
    unittest.main()
