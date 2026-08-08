---
name: project-intake-audit
description: Turn a new or existing project request into a verified current-state brief. Use at project start, takeover, rescue, migration, or when requirements/repository state are unclear.
---

# Project Intake & Audit

1. Identify user outcome, users, platforms/devices, business constraints, budget, privacy/security needs, integrations, and success metrics.
2. Inspect repository structure, branches, manifests, lockfiles, tests, CI/CD, environments, docs, recent changes, deployments, and known issues.
3. Separate `VERIFIED`, `PARTIALLY VERIFIED`, `UNVERIFIED`, and `BLOCKED` claims.
4. Detect mock-only paths, placeholders, dead code, duplicated systems, unsafe defaults, missing secrets strategy, unowned migrations, and abandoned experiments.
5. Map critical user journeys and trust boundaries.
6. Produce a prioritized risk/register and the smallest next vertical slice with measurable acceptance criteria.
7. Preserve existing working behavior; do not rewrite merely to standardize style.

Deliver: current-state map, assumptions, risks, dependencies, first acceptance-tested slice, and evidence gaps.
