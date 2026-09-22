# Portfolio Registry v2 and runtime lifecycle preflight — reconciled 2026-09-22

- Scope: 33 repositories owned by `EVENTo0`, Registry v2, canonical-authority boundaries, and Empire-only runtime lifecycle governance.
- Branch: `agent/portfolio-registry-v2-20260909`.
- Safety: no merge, deployment, production mutation, payment activation, or Core promotion.
- Hierarchy: 5 company core, 8 internal engineering/shared capability, 19 EVENTO ventures, 1 owner decision required.
- Authority: every repository has `productKey`, `authority`, and `canonicalRepo`. The acquisition, business-operations, mobile, and orchestration surfaces have bounded scopes. The two Saeed repositories remain explicitly owner-gated with no inferred canonical repository.
- Mirror contract: `Evento-project-development-v1/config/project-universe.json` is a derived mirror only; it has no independent mutation authority and must carry the same `asOf` freshness marker.
- Runtime policy: runner, toolchain, and model selections require an owner, evidence, and a non-expired `reviewBy` date. Detected Node20-era action debt warns before 2026-09-23 and blocks on or after that date.
- Workflow isolation: only `AAA-prompt-empire` action references are upgraded in this branch. Eight sibling repositories remain exact-evidence debt records requiring isolated owner-gated maintenance PRs.
- Model lifecycle: GitHub Copilot retirements on 2026-10-02 and 2026-10-19 are recorded with explicit replacements from GitHub documentation.
- Evidence commands: `python scripts/validate_empire.py`, `python scripts/run_empire_evals.py`, `python scripts/validate_runtime_lifecycle.py --today 2026-09-22`, `python scripts/validate_runtime_lifecycle.py --today 2026-09-23` (expected block while sibling debt remains), and the mobile-control-plane contract/type/build checks.
- Limitation: repository presence is verified from the owner inventory; product/runtime readiness remains governed by each repository's own evidence.
- Core status: no changes were made to `AAA-prompt`; promotion is explicitly prohibited by this change.
- Release status: PR #26 remains Draft. No merge, deployment, production/data mutation, sibling-repository mutation, or Core promotion is authorized.
