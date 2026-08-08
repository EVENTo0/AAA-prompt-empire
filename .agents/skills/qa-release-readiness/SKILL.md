---
name: qa-release-readiness
description: Verify acceptance criteria, regressions, critical journeys, device/browser coverage, builds, migrations, recovery, and release evidence. Use before calling a feature or project complete or production-ready.
---

# QA & Release Readiness

1. Convert requirements into a risk-based test matrix; prioritize revenue/safety/data-loss/auth/core journeys.
2. Reproduce the change in a representative environment rather than trusting implementation notes.
3. Use unit, integration, contract, E2E, accessibility, visual, device/browser, security, performance, migration and exploratory testing only where each buys meaningful confidence.
4. Verify happy, empty, loading, error, retry, permission-denied, offline/interrupted and recovery states as applicable.
5. Confirm builds/artifacts are reproducible and install/deploy on the intended target.
6. Validate migrations, rollback/recovery, monitoring/alerts and known limitations for release-impacting changes.
7. Record exact checks as `PASS`, `FAIL`, `BLOCKED`, or `NOT APPLICABLE` with evidence.
8. A failed critical criterion blocks release regardless of how much other work is complete.

Output: acceptance matrix, evidence, failed/blocked items, residual risk, release recommendation and next action.
