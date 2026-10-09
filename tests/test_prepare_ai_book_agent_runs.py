#!/usr/bin/env python3
"""Synthetic-only tests for deterministic pilot preparation, not model quality."""
from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path

from scripts import prepare_ai_book_agent_runs as packer

ROOT = Path(__file__).resolve().parents[1]


class TestPreparedPilot(unittest.TestCase):
    def test_pack_has_exactly_ten_unexecuted_prompts(self):
        with tempfile.TemporaryDirectory() as td:
            out = Path(td) / "pack"
            p = packer.prepare(ROOT, out)
            self.assertEqual(p["status"], "PREPARED_NO_REAL_AGENT_RUNS")
            self.assertEqual(p["real_runs_collected"], 0)
            self.assertEqual(p["required_real_runs"], 10)
            self.assertFalse(p["provider_billing_authorized"])
            self.assertEqual(p["unapproved_spend_limit_usd"], 0)
            self.assertEqual(len(p["prompts"]), 10)
            self.assertEqual(len(list((out / "prompts").glob("*.txt"))), 10)
            pairs = {}
            for r in p["prompts"]:
                pairs.setdefault(r["case_id"], {})[r["variant"]] = r
                self.assertEqual(r["status"], "NOT_EXECUTED")
                self.assertEqual(len(r["prompt_sha256"]), 64)
            self.assertEqual(len(pairs), 5)
            for a in pairs.values():
                self.assertEqual(a["baseline"]["task_input_sha256"], a["candidate"]["task_input_sha256"])
                self.assertEqual(a["baseline"]["source_snapshot_sha256"], a["candidate"]["source_snapshot_sha256"])
                self.assertNotEqual(a["baseline"]["prompt_sha256"], a["candidate"]["prompt_sha256"])

    def test_agent_prompts_cannot_see_hidden_expected_answers(self):
        suite = json.loads((ROOT / packer.SUITE).read_text(encoding="utf-8"))
        with tempfile.TemporaryDirectory() as td:
            out = Path(td) / "pack"
            packer.prepare(ROOT, out)
            for c in suite["cases"]:
                for v in ("baseline", "candidate"):
                    text = (out / "prompts" / f"{c['id']}_{v}.txt").read_text(encoding="utf-8")
                    self.assertIn(c["task"], text)
                    self.assertNotIn(c["expected"], text)
                    self.assertNotIn("PROPOSED RESEARCH EXPERIMENTAL GUIDANCE", text) if v == "baseline" else self.assertIn(
                        "PROPOSED RESEARCH EXPERIMENTAL GUIDANCE", text
                    )

    def test_complete_agent_contract_is_embedded_and_hashed(self):
        with tempfile.TemporaryDirectory() as td:
            pack = packer.prepare(ROOT, Path(td) / "pack")
            for name in (packer.ROOT_CONTRACT, packer.AGENT_REGISTRY, packer.EVERGREEN_SKILL):
                self.assertIn(name, pack["source_files_sha256"])
                self.assertEqual(len(pack["source_files_sha256"][name]), 64)
            content = (Path(td) / "pack" / "prompts" / "TI-01_baseline.txt").read_text(encoding="utf-8")
            self.assertIn("GOVERNING REPOSITORY CONTRACT", content)
            self.assertIn("CANONICAL EVERGREEN TECHNOLOGY SKILL", content)
            self.assertIn("# Evergreen Technology Intelligence", content)

    def test_evergreen_skill_drift_changes_snapshot_hash(self):
        with tempfile.TemporaryDirectory() as td:
            repo = Path(td) / "source"
            files = [packer.SUITE, packer.AGENT, packer.SKILL, packer.EVERGREEN_SKILL,
                     packer.ROOT_CONTRACT, packer.AGENT_REGISTRY,
                     packer.SOURCES, packer.GOVERNANCE]
            for name in files:
                (repo / name).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / name, repo / name)
            original = packer.prepare(repo, Path(td) / "pack1")
            skill_file = repo / packer.EVERGREEN_SKILL
            skill_file.write_text(skill_file.read_text(encoding="utf-8") + "\n", encoding="utf-8")
            changed = packer.prepare(repo, Path(td) / "pack2")
            self.assertNotEqual(original["source_snapshot_sha256"], changed["source_snapshot_sha256"])

    def test_fails_closed_on_permission_drift(self):
        with tempfile.TemporaryDirectory() as td:
            repo = Path(td) / "source"
            files = [packer.SUITE, packer.AGENT, packer.SKILL, packer.EVERGREEN_SKILL,
                     packer.ROOT_CONTRACT, packer.AGENT_REGISTRY,
                     packer.SOURCES, packer.GOVERNANCE]
            for name in files:
                (repo / name).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / name, repo / name)
            registry_file = repo / packer.AGENT_REGISTRY
            registry = json.loads(registry_file.read_text(encoding="utf-8"))
            agent = next(x for x in registry["agents"] if x["id"] == "technology_intelligence")
            agent["permissions"] = ["read", "write_branch"]
            registry_file.write_text(json.dumps(registry), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "permissions/skills mismatch"):
                packer.prepare(repo, Path(td) / "unsafe")

    def test_repeat_build_is_deterministic(self):
        with tempfile.TemporaryDirectory() as td:
            a, b = Path(td) / "a", Path(td) / "b"
            p1, p2 = packer.prepare(ROOT, a), packer.prepare(ROOT, b)
            self.assertEqual(p1, p2)
            self.assertEqual((a / "experiment-preparation.json").read_bytes(),
                             (b / "experiment-preparation.json").read_bytes())

    def test_refuse_overwrite(self):
        with tempfile.TemporaryDirectory() as td:
            out = Path(td) / "pack"
            out.mkdir()
            (out / "keep.txt").write_text("do not overwrite", encoding="utf-8")
            with self.assertRaises(FileExistsError):
                packer.prepare(ROOT, out)
            self.assertEqual((out / "keep.txt").read_text(), "do not overwrite")

    def test_refuse_output_inside_repository(self):
        with self.assertRaises(ValueError):
            packer.prepare(ROOT, ROOT / "tmp" / "not-allowed")

    def test_source_change_changes_snapshot_hash(self):
        with tempfile.TemporaryDirectory() as td:
            repo = Path(td) / "source"
            files = [packer.SUITE, packer.AGENT, packer.SKILL, packer.EVERGREEN_SKILL,
                     packer.ROOT_CONTRACT, packer.AGENT_REGISTRY,
                     packer.SOURCES, packer.GOVERNANCE]
            for name in files:
                (repo / name).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / name, repo / name)
            x = packer.prepare(repo, Path(td) / "pack1")
            source_file = repo / packer.GOVERNANCE
            source_file.write_text(source_file.read_text(encoding="utf-8") + "\n", encoding="utf-8")
            y = packer.prepare(repo, Path(td) / "pack2")
            self.assertNotEqual(x["source_snapshot_sha256"], y["source_snapshot_sha256"])


if __name__ == "__main__":
    unittest.main()
