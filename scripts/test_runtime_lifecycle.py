#!/usr/bin/env python3
"""Exercise lifecycle policy without changing the real current-date gate."""
from __future__ import annotations

import copy
import datetime as dt
import json
import unittest

from validate_runtime_lifecycle import ROOT, audit


class LifecycleContractTests(unittest.TestCase):
    def setUp(self):
        self.registry = json.loads((ROOT / "registry/runtime-lifecycle.json").read_text())

    def test_declared_contract_cases(self):
        cases = json.loads((ROOT / "evals/runtime-lifecycle.json").read_text())["cases"]
        for case in cases:
            with self.subTest(case=case["id"]):
                data = copy.deepcopy(self.registry)
                for dotted_key, value in case.get("mutation", {}).items():
                    parent, child = dotted_key.split(".")
                    data[parent][child] = value
                today = dt.date.fromisoformat(case.get("today", "2026-09-22"))
                errors, warnings = audit(data, today)
                self.assertEqual(bool(errors), case["expect"] == "block", errors)
                if case["expect"] == "pass-with-warning":
                    self.assertTrue(warnings)

    def test_current_audit_dates_block_unmerged_sibling_debt(self):
        for day in ("2026-09-28", "2026-09-29"):
            with self.subTest(day=day):
                errors, _ = audit(self.registry, dt.date.fromisoformat(day))
                self.assertEqual(len(errors), 9, errors)
                self.assertTrue(any("EVENTo0/evex-lab" in error for error in errors))

    def test_omitted_evex_lab_cannot_make_snapshot_complete(self):
        self.registry["actionRuntimeDebt"] = [
            item for item in self.registry["actionRuntimeDebt"]
            if item["repository"] != "EVENTo0/evex-lab"
        ]
        errors, _ = audit(self.registry, dt.date(2026, 9, 22))
        self.assertTrue(any("expected exact evidence for 10" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
