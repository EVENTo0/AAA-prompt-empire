# Portfolio Registry v2 and runtime lifecycle preflight — 2026-09-09

- Scope: 25 repositories owned by `EVENTo0`, Registry v2, and Empire-only runtime lifecycle governance.
- Branch: `agent/portfolio-registry-v2-20260909`.
- Safety: no merge, deployment, production mutation, payment activation, or Core promotion.
- Hierarchy: 4 company core, 7 internal engineering lab, 13 EVENTO ventures, 1 owner decision required.
- Runtime policy: runner, toolchain, and model selections require an owner, evidence, and a non-expired `reviewBy` date; unknown or expired state fails closed.
- Evidence commands: `python scripts/validate_empire.py`, `python scripts/run_empire_evals.py`, `python scripts/validate_runtime_lifecycle.py --today 2026-09-09`, and the mobile-control-plane contract/type/build checks.
- Limitation: repository presence is verified from the owner inventory; product/runtime readiness remains governed by each repository's own evidence.
- Core status: no changes were made to `AAA-prompt`; promotion is explicitly prohibited by this change.
