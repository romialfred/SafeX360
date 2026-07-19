import io
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "security"))

import scan_tracked_secrets as scanner  # noqa: E402


class SecretScanTest(unittest.TestCase):

    def test_detects_literal_without_disclosing_value(self):
        sensitive_name = "DEMO_" + "PASSWORD"
        sensitive_value = "ephemeral" + "-only-value"
        source = f'{sensitive_name} = "{sensitive_value}"\n'

        findings = scanner.scan_text("example.py", source)

        self.assertEqual(1, len(findings))
        output = io.StringIO()
        with redirect_stdout(output):
            for finding in findings:
                print(f"[secret-scan] {finding.rule} {finding.path}:{finding.line}")
        self.assertNotIn(sensitive_value, output.getvalue())

    def test_accepts_environment_reference(self):
        source = 'SECRET="$INTERNAL_GATEWAY_SECRET"\n'
        self.assertEqual([], scanner.scan_text("safe.sh", source))

    def test_current_tracked_tree_is_clean(self):
        findings = scanner.scan_files(ROOT, scanner.tracked_files(ROOT))
        self.assertEqual([], findings)


if __name__ == "__main__":
    unittest.main()
