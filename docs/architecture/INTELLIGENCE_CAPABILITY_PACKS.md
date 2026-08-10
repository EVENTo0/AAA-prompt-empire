# Empire Intelligence & Capability Packs — v2.4

## Purpose

This layer extends AAA+ Engineering Empire with evidence-backed intelligence, capability curation, safe project continuity, integration planning, and cost/reliability optimization. It does **not** replace product repositories, the Mobile Control Plane, existing delivery specialists, or owner review.

## Pack A — Technology & Evidence Intelligence

Canonical skills:
- `evergreen-technology-intelligence`
- `evidence-research-synthesis`

Specialist: `technology_intelligence` (read-only).

Use for consequential decisions involving fast-moving models, SDKs, frameworks, developer tools, stores, cloud services, deprecations, migrations, and external technical claims. Current primary documentation and repository evidence outrank remembered or stale assumptions.

## Pack B — Capability Curation & Learning

Canonical skills:
- `capability-gap-analysis`
- `regression-learning-curation`

Specialist: `capability_curator` (branch-write only; no deploy permission; no self-approval).

Use to identify missing/weak/duplicated capabilities and convert repeated verified lessons into the smallest durable improvement. Reuse existing skills first. Capture regressions/evals before broadening behavior when practical. Governance changes remain reviewable PR work and must pass Empire Guard/evals.

This is controlled repository learning, not autonomous self-modification. Empire may not silently rewrite its governing behavior from conversation history, hidden reasoning, unverified anecdotes, private client data, or secrets.

## Pack C — Project Continuity & Recovery

Canonical skill:
- `project-continuity-recovery`

Specialist: `continuity_analyst` (read-only).

Use when projects are paused, fragmented across chats/branches/repositories, or handed between agents. Reconstruct state from project-local source of truth, active branches/PRs, ADRs, deployments, registry data, and verification evidence. Produce a compact phone-friendly continuation packet without overwriting parallel work.

## Pack D — Integration & Systems Optimization

Canonical skills:
- `integration-capability-planning`
- `cost-reliability-optimization`

Specialist: `systems_optimizer` (read-only).

Use for provider/service integration architecture and measurable cost, latency, reliability, maintenance, and operator optimization. Explicitly model credentials, trust boundaries, scopes, failures, retries/idempotency, environments, budget thresholds, and rollback.

## Permission model

| Specialist | Posture | Permissions | Intended output |
|---|---|---|---|
| `technology_intelligence` | read-only | `read` | current evidence + recommendation |
| `capability_curator` | implementation | `read`, `write_branch` | reviewable skill/agent/eval/template change |
| `continuity_analyst` | read-only | `read` | source-linked continuation packet |
| `systems_optimizer` | read-only | `read` | integration/optimization decision package |

No new specialist receives `deploy_preview`, production publication, destructive-operation, secret-management, or self-approval authority.

## Routing contracts

New deterministic routes:
- `technology-intelligence`
- `capability-curation`
- `project-continuity`
- `integration-planning`
- `systems-optimization`

`evals/contract-routing.json` includes explicit cases for every route and permission boundary.

## Learning lifecycle

1. Observe source-linked project evidence or a reproduced regression.
2. Classify local preference vs reusable Empire behavior.
3. Capture the failure/desired behavior as an eval when practical.
4. Run capability-gap analysis and reuse existing capability first.
5. Implement the smallest improvement on a focused branch.
6. Run Empire Guard and routing/permission evals.
7. Review through PR; never self-approve.
8. Backport to `AAA-prompt` Core only if broadly reusable and low-overhead.

## Non-goals

- No EVENTO product source changes.
- No Mobile Control Plane product changes.
- No production deployment or store publication authority.
- No automatic ingestion of private conversations or client data into reusable skills.
- No claim that external research equals project verification.
- No uncontrolled creation of large agent/skill inventories.

## Definition of done for a new capability pack

A reusable pack is accepted only when its outcome is clear, canonical skill boundaries are non-duplicative, agent permissions are least-privilege, registry/routing parity exists, deterministic evals cover the contract, documentation explains handoff/rollback, and applicable Empire Guard checks pass.