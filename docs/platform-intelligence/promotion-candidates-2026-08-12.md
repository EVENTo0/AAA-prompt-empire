# Empire -> Core Promotion Candidate Report

Date: 2026-08-12
Source branch: `feat/platform-intelligence-2026-08`
PR: #18
Policy: no automatic Core mutation; owner review required.

## Evidence reached in Empire

### CI-integrated and passing
- Empire governance/skill registry validation.
- Existing routing/permission contract evals.
- Platform Intelligence Wave 1/2/3 suite integration.
- Runtime capability invariant checks.
- OpenAI/Codex lifecycle registry consistency checks.
- Deprecated Codex model pin/reference guard for active `.codex` config/agents.
- Sensitive-diff policy.
- Workflow text hygiene.
- GitHub Actions runtime generation upgraded to current v7 major actions.

Latest evidence gate at time of this report: Empire Guard #63 passed.

## Candidate A — evidence-freshness-gate
Recommendation: CANDIDATE FOR CORE AFTER OWNER REVIEW, not auto-promoted.

Why it may qualify:
- provider-neutral;
- very low runtime cost;
- prevents stale `latest/current/supported/recommended` claims becoming architecture truth;
- deterministic behavior (`VERIFY_REQUIRED`) when evidence is missing/stale/conflicting;
- no external provider dependency.

Remaining check before Core proposal:
- confirm Core has no conflicting freshness mechanism and promotion adds no duplicated policy.

## Candidate B — release-channel policy
Recommendation: CANDIDATE FOR CORE AFTER OWNER REVIEW.

Policy:
- stable -> production candidate after compatibility gates;
- RC -> compatibility/staging or explicit ADR;
- beta -> isolated evaluation;
- canary/nightly/preview -> scouting only.

Why it may qualify:
- general across mobile/web/cloud/tooling;
- low cost;
- reduces accidental preview dependencies in production.

## Candidate C — minimal model-lifecycle schema
Recommendation: HOLD / NEEDS MORE PROVIDER COVERAGE.

The schema and routing dimensions are general, but the current populated registry evidence is OpenAI-focused. Do not promote the populated provider registry to Core yet. A future Core candidate should contain only the provider-neutral schema/guard while provider-specific data stays in Empire or dedicated intelligence records.

## Empire-only experimental capabilities

### secure-agent-execution
Status: CONTRACT PASS / RUNTIME NOT YET PROVEN.
Keep Empire-only until at least one actual sandbox backend demonstrates:
- secrets deny-by-default;
- network deny-by-default or explicit allowlist;
- ephemeral/minimal filesystem;
- timeout/resource boundary;
- evidence capture;
- teardown.

### agent-harness-adapter
Status: CONTRACT PASS / LIVE PARITY NOT YET PROVEN.
Keep Empire-only until the same representative task is run through Codex and Claude Code and normalized evidence is compared for plan/tools/permissions/sandbox/skills/subagents/evidence/result.

### capability-broker
Status: CONTRACT PASS / CONNECTOR EXECUTION NOT YET PROVEN.
Keep Empire-only until:
1. a read-only connector/MCP path is verified;
2. a simulated or safely isolated destructive action is blocked pending owner approval;
3. credential scope and audit evidence are demonstrated.

### provider-specific model registry
Status: EMPIRE INTELLIGENCE DATA.
Do not copy provider-specific lifecycle facts into Core as permanent truth. Keep official-source timestamps and freshness gating.

## Explicit non-promotion decisions
- No write to `EVENTo0/AAA-prompt` from this PR or conversation slice.
- No mutation of EVENTO, evento-mobile, control-plane, FamilyOS, OCTORIMAL, EVEX, History-Med-1, OMNIFORM or other sibling repositories.
- No self-approval or automatic merge.

## Next proof gate
Wave 3 runtime proof should focus only on three isolated experiments:
1. sandbox backend fixture;
2. Codex/Claude harness parity fixture;
3. MCP/connector broker approval fixture.

Only after those experiments should PR #18 be considered for Ready-for-Review status. Core promotion remains a separate owner-approved change after this PR is accepted.
