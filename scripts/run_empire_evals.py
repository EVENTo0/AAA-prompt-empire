#!/usr/bin/env python3
"""Deterministic contract evaluations for AAA+ Empire skill/agent routing and permissions."""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def load(name: str):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))

def select_route(routes: list[dict], tags: list[str]):
    wanted = set(tags)
    scored = []
    for route in routes:
        score = len(wanted & set(route.get("tags", [])))
        if score:
            scored.append((score, route["id"], route))
    if not scored:
        return None
    scored.sort(key=lambda x: (-x[0], x[1]))
    return scored[0][2]

def skill_closure(skill_id: str, skills: dict[str, dict], seen=None):
    seen = set() if seen is None else seen
    if skill_id in seen:
        return seen
    seen.add(skill_id)
    for dep in skills[skill_id].get("dependencies", []):
        skill_closure(dep, skills, seen)
    return seen

def main() -> int:
    skills = {x["id"]: x for x in load("registry/skills.json")["skills"]}
    agents = {x["id"]: x for x in load("registry/agents.json")["agents"]}
    routes = load("registry/routing.json")["routes"]
    suite = load("evals/contract-routing.json")
    failures: list[str] = []

    for case in suite["cases"]:
        selected = select_route(routes, case["input_tags"])
        expected_route = case.get("route")
        actual_route = selected["id"] if selected else None
        if actual_route != expected_route:
            failures.append(f'{case["id"]}: expected route {expected_route!r}, got {actual_route!r}')
            continue
        if selected is None:
            continue

        expected_agents = case.get("expect_agents", selected.get("preferred_agents", []))
        if selected.get("preferred_agents", []) != expected_agents:
            failures.append(f'{case["id"]}: preferred agent set drifted')

        covered: set[str] = set()
        for aid in selected.get("preferred_agents", []):
            for sid in agents[aid].get("skills", []):
                covered |= skill_closure(sid, skills)
        missing = set(selected.get("required_skills", [])) - covered
        if missing:
            failures.append(f'{case["id"]}: route lacks agent coverage for required skills {sorted(missing)}')

        forbidden = set(selected.get("forbidden_permissions", []))
        for aid in selected.get("preferred_agents", []):
            leaked = forbidden & set(agents[aid].get("permissions", []))
            if leaked:
                failures.append(f'{case["id"]}: {aid} leaks forbidden permissions {sorted(leaked)}')

        expect_no = case.get("expect_no_permission")
        if expect_no:
            for aid in selected.get("preferred_agents", []):
                if expect_no in agents[aid].get("permissions", []):
                    failures.append(f'{case["id"]}: {aid} unexpectedly has {expect_no}')

    for aid, agent in agents.items():
        if agent.get("posture") == "read_only" and set(agent.get("permissions", [])) != {"read"}:
            failures.append(f"{aid}: read_only posture permission regression")
        if agent.get("may_self_approve") is not False:
            failures.append(f"{aid}: self-approval must remain disabled")

    if failures:
        print("EMPIRE CONTRACT EVALS: FAILED")
        for item in failures:
            print(f"- {item}")
        return 1
    print(f'EMPIRE CONTRACT EVALS: PASSED ({len(suite["cases"])} routing/permission cases)')
    return 0

if __name__ == "__main__":
    sys.exit(main())
