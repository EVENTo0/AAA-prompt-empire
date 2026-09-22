#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPONENT_CATEGORIES = {"runner", "toolchain", "model"}
RETIREMENT_CATEGORIES = {"action-runtime", "model"}
ALLOWED_DEBT_STATUS = {"detected", "resolved", "resolved-in-pr-26", "accepted-exception"}
RETIRED_ACTION_MARKERS = ("actions/checkout@v4", "actions/setup-node@v4", "actions/setup-python@v5")


def parse_date(value: object, label: str, errors: list[str]) -> dt.date | None:
    try:
        return dt.date.fromisoformat(str(value))
    except (TypeError, ValueError):
        errors.append(f"{label}: invalid date")
        return None


def audit(data: dict, today: dt.date) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    policy = data.get("policy", {})
    if policy.get("corePromotion") != "prohibited-by-this-change":
        errors.append("core promotion must remain prohibited")
    if policy.get("siblingRepositoryUpgrade") != "isolated-owner-gated-pr":
        errors.append("sibling repository upgrades must remain isolated and owner-gated")

    components = data.get("components", [])
    seen: set[str] = set()
    for item in components:
        ident = item.get("id")
        if not ident or ident in seen:
            errors.append(f"duplicate or missing component id: {ident!r}")
        seen.add(ident)
        if item.get("category") not in COMPONENT_CATEGORIES:
            errors.append(f"{ident}: invalid component category")
        for key in ("selection", "owner", "evidence", "reviewBy"):
            if not item.get(key):
                errors.append(f"{ident}: missing {key}")
        review_by = parse_date(item.get("reviewBy"), f"{ident}.reviewBy", errors)
        if review_by and review_by < today:
            errors.append(f"{ident}: lifecycle review expired")
    if {item.get("category") for item in components} != COMPONENT_CATEGORIES:
        errors.append("runner, toolchain, and model coverage are all required")

    retirements = data.get("retirements", [])
    retirement_ids: set[str] = set()
    action_deadline: dt.date | None = None
    for item in retirements:
        ident = item.get("id")
        if not ident or ident in retirement_ids:
            errors.append(f"duplicate or missing retirement id: {ident!r}")
        retirement_ids.add(ident)
        if item.get("category") not in RETIREMENT_CATEGORIES:
            errors.append(f"{ident}: invalid retirement category")
        for key in ("deadline", "status", "owner", "affectedSelections", "evidence"):
            if not item.get(key):
                errors.append(f"{ident}: missing {key}")
        deadline = parse_date(item.get("deadline"), f"{ident}.deadline", errors)
        if item.get("category") == "action-runtime":
            action_deadline = deadline
        elif deadline and deadline >= today:
            warnings.append(
                f"{ident}: scheduled model retirement on {deadline.isoformat()}: "
                + ", ".join(item.get("affectedSelections", []))
            )
    required_retirements = {
        "github-actions-node20-runtime",
        "github-copilot-models-2026-10-02",
        "github-copilot-models-2026-10-19",
    }
    missing_retirements = required_retirements - retirement_ids
    if missing_retirements:
        errors.append(f"missing required retirement records: {sorted(missing_retirements)}")

    debt = data.get("actionRuntimeDebt", [])
    debt_repositories: set[str] = set()
    for item in debt:
        repository = item.get("repository")
        if not repository or repository in debt_repositories:
            errors.append(f"duplicate or missing action debt repository: {repository!r}")
        debt_repositories.add(repository)
        status = item.get("status")
        if status not in ALLOWED_DEBT_STATUS:
            errors.append(f"{repository}: invalid action debt status {status!r}")
        for key in ("defaultBranchRef", "ownerGate", "workflows", "detectedActions"):
            if not item.get(key):
                errors.append(f"{repository}: missing {key}")
        if status == "detected":
            evidence = ", ".join(
                f"{workflow} [{', '.join(item.get('detectedActions', []))}]"
                for workflow in item.get("workflows", [])
            )
            message = f"{repository}: detected Node20-era action debt: {evidence}"
            if action_deadline and today >= action_deadline:
                errors.append(message)
            else:
                warnings.append(message)

    if len(debt_repositories) != 9:
        errors.append(f"expected exact evidence for 9 affected repositories, found {len(debt_repositories)}")

    for root in (ROOT / ".github" / "workflows", ROOT / "templates"):
        if not root.exists():
            continue
        for path in (*root.rglob("*.yml"), *root.rglob("*.yaml")):
            text = path.read_text(encoding="utf-8")
            for marker in RETIRED_ACTION_MARKERS:
                if marker in text:
                    errors.append(f"{path.relative_to(ROOT)}: unresolved local Node20-era action {marker}")

    return errors, warnings


def validate(path: Path, today: dt.date) -> list[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    errors, _ = audit(data, today)
    return errors


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, default=ROOT / "registry/runtime-lifecycle.json")
    parser.add_argument("--today", type=dt.date.fromisoformat, default=dt.date.today())
    args = parser.parse_args()
    lifecycle = json.loads(args.file.read_text(encoding="utf-8"))
    failures, warnings = audit(lifecycle, args.today)
    for warning in warnings:
        print(f"WARNING: {warning}")
    if failures:
        print("Runtime lifecycle preflight failed:")
        print("\n".join(f"- {failure}" for failure in failures))
        raise SystemExit(1)
    print("Runtime lifecycle preflight passed.")
