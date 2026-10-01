import importlib.util
import json
import pathlib
import unittest

MODULE_PATH = pathlib.Path(__file__).with_name("evento_daemon.py")
SPEC = importlib.util.spec_from_file_location("evento_daemon", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class EventoDaemonTests(unittest.TestCase):
    def test_binds_localhost_only(self):
        self.assertEqual(MODULE.HOST, "127.0.0.1")

    def test_v1_has_no_write_execution(self):
        data = MODULE.capabilities()
        self.assertFalse(data["daemon"]["write_execution"])
        self.assertFalse(data["daemon"]["arbitrary_shell"])

    def test_connector_release_is_disabled(self):
        data = MODULE.capabilities()
        self.assertTrue(data["connectors"])
        for connector in data["connectors"]:
            self.assertFalse(connector["release"])

    def test_local_actions_are_diagnostic_and_non_mutating(self):
        data = MODULE.load_local_actions()
        self.assertEqual(data["policy"]["default"], "deny")
        self.assertFalse(data["policy"]["arbitrary_shell"])
        self.assertFalse(data["policy"]["mutations"])
        allowed = {item["id"] for item in data["actions"]}
        self.assertIn("git-status", allowed)
        self.assertIn("python-version", allowed)

    def test_unknown_local_action_fails_closed(self):
        with self.assertRaises(KeyError):
            MODULE.run_diagnostic("rm-everything")

    def test_registry_never_contains_runtime_secret_values(self):
        raw = MODULE.CONNECTOR_REGISTRY.read_text(encoding="utf-8")
        parsed = json.loads(raw)
        self.assertNotIn("token_value", raw)
        self.assertFalse(parsed["policy"]["raw_secrets_in_browser"])


if __name__ == "__main__":
    unittest.main()
