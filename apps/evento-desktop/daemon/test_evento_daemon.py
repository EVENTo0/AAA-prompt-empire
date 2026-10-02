import importlib.util
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

MODULE_PATH = pathlib.Path(__file__).with_name("evento_daemon.py")
SPEC = importlib.util.spec_from_file_location("evento_daemon", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class EventoDaemonTests(unittest.TestCase):
    def test_binds_localhost_only(self):
        self.assertEqual(MODULE.HOST, "127.0.0.1")

    def test_release_and_arbitrary_shell_are_never_exposed(self):
        data = MODULE.capabilities()
        self.assertFalse(data["daemon"]["release"])
        self.assertFalse(data["daemon"]["arbitrary_shell"])

    def test_connector_release_is_disabled(self):
        for connector in MODULE.capabilities()["connectors"]:
            self.assertFalse(connector["release"])

    def test_diagnostics_remain_allowlisted(self):
        data = MODULE.load_local_actions()
        self.assertEqual(data["policy"]["default"], "deny")
        self.assertFalse(data["policy"]["arbitrary_shell"])
        with self.assertRaises(KeyError):
            MODULE.run_diagnostic("rm-everything")

    def test_write_registry_requires_separate_gate(self):
        data = MODULE.load_local_write_actions()
        self.assertEqual(data["policy"]["default"], "deny")
        self.assertTrue(data["policy"]["requires_write_token"])
        self.assertTrue(data["policy"]["requires_write_enable"])
        self.assertFalse(data["policy"]["arbitrary_shell"])
        self.assertFalse(data["policy"]["release"])

    def test_workspace_path_blocks_escape(self):
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td).resolve()
            with patch.object(MODULE, "workspace_roots", return_value=(root,)):
                good = MODULE.safe_workspace_path("project/readme.txt")
                self.assertTrue(str(good).startswith(str(root)))
                with self.assertRaises(PermissionError):
                    MODULE.safe_workspace_path("../escape.txt")

    def test_workspace_text_write_is_bounded(self):
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td).resolve()
            with patch.object(MODULE, "workspace_roots", return_value=(root,)):
                result = MODULE.workspace_write_text("alpha/note.txt", "hello")
                self.assertEqual((root / "alpha" / "note.txt").read_text(), "hello")
                self.assertEqual(result["bytes"], 5)

    def test_unknown_write_action_fails_closed(self):
        with self.assertRaises(KeyError):
            MODULE.run_write_action("arbitrary-shell", {})

    def test_python_adapter_rejects_inline_or_unapproved_script(self):
        with self.assertRaises(PermissionError):
            MODULE.approved_script_path("-c")
        with self.assertRaises(PermissionError):
            MODULE.approved_script_path("../../outside.py")

    def test_workspace_registry_contains_no_machine_paths(self):
        raw = MODULE.PROJECT_WORKSPACES.read_text(encoding="utf-8")
        data = json.loads(raw)
        self.assertTrue(data["policy"]["local_paths_are_device_specific"])
        for project in data["projects"]:
            self.assertIn("local_path_env", project)
            self.assertNotIn("local_path", project)

    def test_workspace_snapshot_is_unconfigured_without_env(self):
        registry = MODULE.load_project_workspaces()
        keys = [p["local_path_env"] for p in registry["projects"]]
        clean = {key: "" for key in keys}
        with patch.dict("os.environ", clean, clear=False):
            snap = MODULE.project_workspace_snapshot()
            self.assertTrue(all(not x["configured"] for x in snap["projects"]))

    def test_registry_never_contains_runtime_secret_values(self):
        raw = MODULE.CONNECTOR_REGISTRY.read_text(encoding="utf-8")
        parsed = json.loads(raw)
        self.assertNotIn("token_value", raw)
        self.assertFalse(parsed["policy"]["raw_secrets_in_browser"])


if __name__ == "__main__":
    unittest.main()
