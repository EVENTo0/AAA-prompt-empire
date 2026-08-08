---
name: dependency-upgrade-debug
description: Diagnose failures and safely upgrade frameworks, SDKs, dependencies, build tools, platforms, or APIs using primary docs, reproducible evidence, compatibility review, tests, and rollback. Use for broken builds, deprecations, upgrades, or regressions.
---

# Dependency Upgrade, Debug & Recovery

1. Reproduce the failure and capture the smallest useful evidence: command, environment, versions, logs, failing test or user journey.
2. Trace the execution/build path before changing dependencies.
3. Verify current supported versions, migration guides, breaking changes, deprecations and security notes from primary documentation.
4. Change the smallest dependency/tooling set necessary; preserve lockfile integrity and review transitive impact.
5. Run compatibility, build, test, migration, device/browser and runtime checks appropriate to the affected surface.
6. For major upgrades, stage changes, record ADR/migration notes, and maintain a rollback path.
7. Distinguish root cause from workaround. Do not disable type checks, tests, security controls or signing verification merely to obtain a green build.
8. Record the resolved cause, evidence, remaining risks and a reusable prevention/update trigger.

If the root cause remains unknown, report `PARTIALLY VERIFIED` or `BLOCKED` rather than declaring success.
