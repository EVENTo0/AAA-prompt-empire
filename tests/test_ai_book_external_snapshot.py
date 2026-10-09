#!/usr/bin/env python3
"""Synthetic/offline integrity tests. NO provider, LLM, browser or paid calls."""
from __future__ import annotations

import contextlib
import copy
import io
import json
import tempfile
import unittest
from pathlib import Path

from scripts import freeze_ai_book_external_sources as frozen
from scripts import prepare_ai_book_agent_runs as packer
from scripts import run_ai_book_agent_learning_eval as evaluator

ROOT = Path(__file__).resolve().parents[1]
STAMP = "2026-10-09T18:00:00Z"


def fake_fetch(url: str) -> tuple[bytes, str, dict]:
    entries = json.loads(frozen.CATALOG.read_text(encoding="utf-8"))["sources"]
    s = next(s for s in entries if s["url"] == url)
    body = ("<!doctype html><html><head><title>EVENTO MOCK TEST</title></head><body>"
            "<h1>Offline synthetic page, never actual source proof</h1><p>"
            + " | ".join(s["markers"]) + "</p><p>"
            + s["observation"] + " This is deliberately invented test text, "
            "not a Next.js or GitHub document. " * 5 + "</p></body></html>").encode("utf-8")
    return body, url, {"content_type": "text/html; charset=utf-8",
                       "etag": "W/test-only", "last_modified": None}


def fake_runs(suite: dict, prepared: dict) -> dict:
    cases = {c["id"]: c for c in suite["cases"]}
    runs = []
    for e in prepared["prompts"]:
        cid, variant = e["case_id"], e["variant"]
        runs.append({
            "case_id": cid, "variant": variant,
            "run_id": "SYNTHETIC-" + cid + "-" + variant,
            "model_id": "FAKE/NOT_AN_EXECUTION", "agent_revision": "a" * 40,
            "source_access_mode": "offline_frozen_only",
            "source_snapshot_sha256": e["source_snapshot_sha256"],
            "external_source_snapshot_sha256": e["external_source_snapshot_sha256"],
            "task_input_sha256": e["task_input_sha256"],
            "prompt_sha256": e["prompt_sha256"],
            "prompt_file_sha256": e["prompt_file_sha256"],
            "execution_ref": "https://example.test/not-a-real-trace/" + cid + "/" + variant,
            "usage_evidence_ref": "https://example.test/not-a-real-receipt",
            "review_ref": "https://example.test/not-a-real-review",
            "reviewer_id": "FAKE_TEST_REVIEWER",
            "elapsed_ms": 100, "total_cost_usd": 0.01, "input_tokens": 10, "output_tokens": 10,
            "review": {"task_correct": True, "citations_valid": True,
                       "no_unsupported_claim": True, "no_permission_violation": True,
                       "reviewer_signed_off": True, "source_access_trace_reviewed": True,
                       "review_notes": "Synthetic validator shape test only.",
                       "correct_refusal": bool(cases[cid].get("negative_action"))},
        })
    return {"experiment_id": suite["experiment_id"], "agent_id": suite["agent_id"],
            "data_kind": "real_agent_runs",  # exercise validation shape ONLY
            "external_source_snapshot_sha256": prepared["external_source_snapshot_sha256"],
            "source_access_mode": "offline_frozen_only",
            "runs": runs}


class SnapshotGateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name)
        self.snapshot = self.path / "snapshot"
        self.manifest = frozen.capture(frozen.CATALOG, self.snapshot, fake_fetch, STAMP)

    def make_pack(self):
        prep_dir = self.path / "private-preparation"
        prep = packer.prepare(ROOT, prep_dir, self.snapshot)
        suite = evaluator.load_json(evaluator.DEFAULT_SUITE)
        return prep_dir, prep, suite, fake_runs(suite, prep)

    def test_freeze_is_offline_verifiable(self):
        doc = frozen.verify(self.snapshot)
        self.assertEqual(doc["snapshot_sha256"], self.manifest["snapshot_sha256"])
        self.assertEqual(len(doc["sources"]), 8)
        self.assertEqual(len(doc["snapshot_sha256"]), 64)

    def test_same_bytes_same_timestamp_same_sha(self):
        other = frozen.capture(frozen.CATALOG, self.path / "second", fake_fetch, STAMP)
        self.assertEqual(self.manifest["snapshot_sha256"], other["snapshot_sha256"])

    def test_source_bytes_tamper_blocks(self):
        path = self.snapshot / self.manifest["sources"][0]["raw_path"]
        path.write_bytes(path.read_bytes() + b"\nINJECTED")
        with self.assertRaisesRegex(ValueError, "tampered"):
            frozen.verify(self.snapshot)

    def test_missing_source_blocks(self):
        (self.snapshot / self.manifest["sources"][1]["text_path"]).unlink()
        with self.assertRaisesRegex(ValueError, "tampered"):
            frozen.verify(self.snapshot)

    def test_missing_capture_timestamp_blocks(self):
        manifest_file = self.snapshot / "snapshot.json"
        doc = json.loads(manifest_file.read_text(encoding="utf-8"))
        doc["sources"][0].pop("retrieved_at_utc")
        manifest_file.write_text(json.dumps(doc), encoding="utf-8")
        with self.assertRaises(ValueError):
            frozen.verify(self.snapshot)

    def test_capture_refuses_unverified_publisher_page(self):
        def bad(url):
            if "v16.3.8" in url:
                return (b"<html><body>" + b"Not the official release " * 20 + b"</body></html>",
                        url, {})
            return fake_fetch(url)
        with self.assertRaisesRegex(ValueError, "missing required markers"):
            frozen.capture(frozen.CATALOG, self.path / "bad", bad, STAMP)

    def test_both_variants_receive_identical_ti02_frozen_evidence(self):
        prep_dir, prep, suite, data = self.make_pack()
        self.assertTrue(prep["external_web_source_snapshot_proven"])
        self.assertEqual(len(prep["prompts"]), 10)
        shared = frozen.shared_prompt_evidence(prep_dir / "external-snapshot",
                                                frozen.verify(prep_dir / "external-snapshot"))
        a = (prep_dir / "prompts/TI-02_baseline.txt").read_text(encoding="utf-8")
        b = (prep_dir / "prompts/TI-02_candidate.txt").read_text(encoding="utf-8")
        self.assertIn(shared, a)
        self.assertIn(shared, b)
        self.assertEqual(evaluator.validate_frozen_comparison(suite, data, self.snapshot, prep_dir), [])

    def test_mismatched_candidate_source_hash_rejected(self):
        prep_dir, prep, suite, data = self.make_pack()
        candidate = next(r for r in data["runs"] if r["case_id"] == "TI-02" and r["variant"] == "candidate")
        candidate["external_source_snapshot_sha256"] = "f" * 64
        errors = evaluator.validate_frozen_comparison(suite, data, self.snapshot, prep_dir)
        self.assertTrue(any("differs" in msg for msg in errors))

    def test_mismatched_manifest_digest_rejected(self):
        prep_dir, prep, suite, data = self.make_pack()
        data["external_source_snapshot_sha256"] = "e" * 64
        self.assertTrue(evaluator.validate_frozen_comparison(suite, data, self.snapshot, prep_dir))

    def test_prepared_prompt_mutation_blocks(self):
        prep_dir, prep, suite, data = self.make_pack()
        prompt = prep_dir / "prompts/TI-02_candidate.txt"
        prompt.write_text(prompt.read_text(encoding="utf-8") + "silently changed", encoding="utf-8")
        self.assertTrue(any("prompt" in x for x in
                            evaluator.validate_frozen_comparison(suite, data, self.snapshot, prep_dir)))

    def test_preparation_snapshot_missing_blocks(self):
        prep_dir, prep, suite, data = self.make_pack()
        (prep_dir / "external-snapshot/snapshot.json").unlink()
        self.assertTrue(evaluator.validate_frozen_comparison(suite, data, self.snapshot, prep_dir))

    def test_live_web_or_unreviewed_trace_blocks_comparison(self):
        prep_dir, prep, suite, data = self.make_pack()
        first = data["runs"][0]
        first["source_access_mode"] = "live_web"
        self.assertTrue(any("live external" in x for x in
                            evaluator.validate_frozen_comparison(suite, data, self.snapshot, prep_dir)))
        first["source_access_mode"] = "offline_frozen_only"
        first["review"]["source_access_trace_reviewed"] = False
        self.assertTrue(any("trace review missing" in x for x in
                            evaluator.validate_frozen_comparison(suite, data, self.snapshot, prep_dir)))

    def test_scoring_cli_blocks_unfrozen_runs_even_with_good_mock_rubric(self):
        prep_dir, prep, suite, data = self.make_pack()
        runs = self.path / "fake-DO-NOT-SCORE.json"
        runs.write_text(json.dumps(data), encoding="utf-8")
        with contextlib.redirect_stdout(io.StringIO()) as captured:
            rc = evaluator.main(["--runs", str(runs)])
        self.assertEqual(rc, 2)
        self.assertEqual(json.loads(captured.getvalue())["status"], "BLOCKED_INVALID_OR_INCOMPLETE")

    def test_scoring_cli_blocks_frozen_source_drift(self):
        prep_dir, prep, suite, data = self.make_pack()
        runs = self.path / "fake-DO-NOT-SCORE.json"
        data["runs"][1]["external_source_snapshot_sha256"] = "f" * 64
        runs.write_text(json.dumps(data), encoding="utf-8")
        with contextlib.redirect_stdout(io.StringIO()) as captured:
            rc = evaluator.main(["--runs", str(runs),
                                 "--preparation", str(prep_dir),
                                 "--external-snapshot", str(self.snapshot)])
        self.assertEqual(rc, 2)
        self.assertEqual(json.loads(captured.getvalue())["status"], "BLOCKED_INVALID_OR_INCOMPLETE")


if __name__ == "__main__":
    unittest.main()
