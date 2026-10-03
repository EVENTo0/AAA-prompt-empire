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

    def test_registered_project_path_requires_registry_and_env(self):
        with self.assertRaises(KeyError):
            MODULE.registered_project_path("not-registered")
        item = MODULE.load_project_workspaces()["projects"][0]
        with patch.dict("os.environ", {item["local_path_env"]: ""}, clear=False):
            with self.assertRaises(ValueError):
                MODULE.registered_project_path(item["project_id"])

    def test_safe_project_child_blocks_escape(self):
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td).resolve()
            with patch.object(MODULE, "registered_project_path", return_value=root):
                self.assertEqual(MODULE.safe_project_child("x", "Assets"), root / "Assets")
                with self.assertRaises(PermissionError):
                    MODULE.safe_project_child("x", "../outside.blend")

    def test_blender_adapter_rejects_non_blend_file_before_launch(self):
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td).resolve()
            (root / "not-blend.txt").write_text("x")
            with patch.object(MODULE, "registered_project_path", return_value=root):
                with self.assertRaises(ValueError):
                    MODULE.blender_open_project("x", "not-blend.txt")

    def test_unity_adapter_requires_unity_project_markers(self):
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td).resolve()
            with patch.object(MODULE, "registered_project_path", return_value=root):
                with self.assertRaises(ValueError):
                    MODULE.unity_open_project("x", ".")

    def test_configured_tool_executable_must_exist(self):
        with patch.dict("os.environ", {"EVENTO_BLENDER_EXECUTABLE": "/definitely/missing/blender"}, clear=False):
            with self.assertRaises(ValueError):
                MODULE._configured_executable("EVENTO_BLENDER_EXECUTABLE", ("blender",))

    def test_android_install_rejects_non_apk_before_adb(self):
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td).resolve()
            bad = root / "build.txt"
            bad.write_text("x")
            with patch.object(MODULE, "registered_project_path", return_value=root):
                with self.assertRaises(ValueError):
                    MODULE.android_install_apk("x", "build.txt")

    def test_blender_export_rejects_non_blend_before_tool(self):
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td).resolve()
            bad = root / "scene.txt"
            bad.write_text("x")
            with patch.object(MODULE, "registered_project_path", return_value=root):
                with self.assertRaises(ValueError):
                    MODULE.blender_export_glb("x", "scene.txt")

    def test_unity_test_adapter_requires_project_markers(self):
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td).resolve()
            with patch.object(MODULE, "registered_project_path", return_value=root):
                with self.assertRaises(ValueError):
                    MODULE.unity_run_editmode_tests("x", ".")

    def test_review_gate_fails_closed_without_registered_project_gate(self):
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td).resolve()
            (root / ".git").mkdir()
            with patch.object(MODULE, "remote_task_worktree", return_value=root):
                with patch.object(MODULE, "load_project_test_gates", return_value={"projects": {}}):
                    with self.assertRaises(PermissionError):
                        MODULE.remote_task_test_gate("unknown", 1)

    def test_handoff_not_ready_without_review_or_gate(self):
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td).resolve()
            with patch.object(MODULE, "safe_workspace_path", return_value=root):
                result = MODULE.remote_task_ready_for_handoff("aaa-empire", 1)
                self.assertFalse(result["ready"])

    def test_remote_build_requires_codex(self):
        with self.assertRaises(PermissionError):
            MODULE.agent_build_worktree("aaa-empire", 1, "inspect", "claude-code")

    def test_remote_build_rejects_invalid_issue(self):
        with self.assertRaises(ValueError):
            MODULE.agent_build_worktree("aaa-empire", 0, "inspect", "codex")

    def test_agent_plan_rejects_unknown_provider(self):
        with self.assertRaises(PermissionError):
            MODULE.agent_plan("unknown", "aaa-empire", "inspect")

    def test_agent_plan_rejects_empty_prompt(self):
        with self.assertRaises(ValueError):
            MODULE.agent_plan("codex", "aaa-empire", "   ")

    def test_agent_cli_diagnostics_are_allowlisted(self):
        data = MODULE.load_local_actions()
        ids = {item["id"] for item in data["actions"]}
        self.assertIn("codex-version", ids)
        self.assertIn("claude-version", ids)

    def test_registry_never_contains_runtime_secret_values(self):
        raw = MODULE.CONNECTOR_REGISTRY.read_text(encoding="utf-8")
        parsed = json.loads(raw)
        self.assertNotIn("token_value", raw)
        self.assertFalse(parsed["policy"]["raw_secrets_in_browser"])


if __name__ == "__main__":
    unittest.main()
