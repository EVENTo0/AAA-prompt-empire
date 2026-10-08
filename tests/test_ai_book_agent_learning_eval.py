#!/usr/bin/env python3
"""Offline, synthetic unit cases for the evaluator (NOT agent-performance data)."""
import copy
import unittest

from scripts import run_ai_book_agent_learning_eval as evaluator


def suite():
    return evaluator.load_json(evaluator.DEFAULT_SUITE)


def fixture(s):
    """Fabricated validator inputs, never stored as real benchmark evidence."""
    runs = []
    for case in s["cases"]:
        for variant in ("baseline", "candidate"):
            runs.append({
                "case_id": case["id"],
                "variant": variant,
                "run_id": f"synthetic-{case['id']}-{variant}",
                "model_id": "fixture-model",
                "agent_revision": "a" * 40,
                "prompt_sha256": ("1" if variant == "baseline" else "2") * 64,
                "execution_ref": "https://example.test/synthetic-trace",
                "review_ref": "https://example.test/synthetic-review",
                "reviewer_id": "fixture-test-reviewer",
                "elapsed_ms": 1000,
                "total_cost_usd": 0.02 if variant == "baseline" else 0.01,
                "input_tokens": 100,
                "output_tokens": 50,
                "review": {
                    "task_correct": True,
                    "citations_valid": True,
                    "no_unsupported_claim": True,
                    "no_permission_violation": True,
                    "reviewer_signed_off": True,
                    "correct_refusal": True,
                    "review_notes": "Synthetic validator unit test only, not an agent result.",
                }
            })
    return {
        "experiment_id": s["experiment_id"],
        "agent_id": s["agent_id"],
        "data_kind": "real_agent_runs",  # tests schema path ONLY; not live evidence
        "runs": runs,
    }


class EvalProtocolTest(unittest.TestCase):
    def setUp(self):
        self.s = suite()
        self.data = fixture(self.s)

    def test_suite_is_valid(self):
        self.assertEqual(evaluator.validate_suite(self.s), [])
        self.assertEqual(len(self.s["cases"]), 5)

    def test_missing_real_runs_fail_closed(self):
        self.data["runs"] = []
        report = evaluator.summarize(self.s, self.data)
        self.assertEqual(report["status"], "BLOCKED_INVALID_OR_INCOMPLETE")
        self.assertFalse(report["promoted"])

    def test_synthetic_marker_is_rejected(self):
        self.data["data_kind"] = "synthetic"
        self.assertTrue(any("data_kind" in x for x in evaluator.validate_runs(self.s, self.data)))

    def test_paired_cost_improvement_is_review_only(self):
        # This is a contract unit test with fabricated inputs, NOT observed gain.
        report = evaluator.summarize(self.s, self.data)
        self.assertEqual(report["status"], "REVIEW_CANDIDATE_NOT_VERIFIED")
        self.assertFalse(report["promoted"])
        self.assertFalse(report["external_evidence_verified_by_this_script"])

    def test_candidate_unsafe_action_blocks(self):
        self.data["runs"][1]["review"]["no_permission_violation"] = False
        report = evaluator.summarize(self.s, self.data)
        self.assertEqual(report["status"], "HOLD_NO_PROVEN_GAIN")
        self.assertEqual(report["scores"]["candidate"]["permission_violations"], 1)

    def test_candidate_false_refusal_blocks(self):
        run = next(r for r in self.data["runs"] if r["case_id"] == "TI-03" and r["variant"] == "candidate")
        run["review"]["correct_refusal"] = False
        report = evaluator.summarize(self.s, self.data)
        self.assertEqual(report["status"], "HOLD_NO_PROVEN_GAIN")

    def test_source_evidence_must_be_https(self):
        self.data["runs"][0]["execution_ref"] = "file:///fake-evidence"
        self.assertTrue(any("execution_ref" in x for x in evaluator.validate_runs(self.s, self.data)))

    def test_model_mismatch_blocks_pairing(self):
        self.data["runs"][0]["model_id"] = "different-model"
        self.assertTrue(any("model_id must match" in x for x in evaluator.validate_runs(self.s, self.data)))

    def test_same_prompt_hash_blocks_pairing(self):
        for r in self.data["runs"]:
            r["prompt_sha256"] = "1" * 64
        self.assertTrue(any("prompt hashes must differ" in x for x in evaluator.validate_runs(self.s, self.data)))

    def test_missing_independent_review_blocks(self):
        self.data["runs"][0]["review"]["reviewer_signed_off"] = None
        self.assertTrue(any("review.reviewer_signed_off" in x for x in evaluator.validate_runs(self.s, self.data)))

    def test_no_gain_never_promotes(self):
        for run in self.data["runs"]:
            run["total_cost_usd"] = 0.02
        report = evaluator.summarize(self.s, self.data)
        self.assertEqual(report["status"], "HOLD_NO_PROVEN_GAIN")
        self.assertFalse(report["promoted"])

    def test_input_records_are_not_mutated(self):
        original = copy.deepcopy(self.data)
        evaluator.summarize(self.s, self.data)
        self.assertEqual(self.data, original)


if __name__ == "__main__":
    unittest.main()
