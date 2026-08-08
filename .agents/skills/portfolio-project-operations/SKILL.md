---
name: portfolio-project-operations
description: Operate a multi-project portfolio by normalizing project status, priorities, dependencies, repositories, environments, delivery stages, sale readiness, risks, next actions, and evidence without overwriting project-local ownership.
---

# Portfolio & Project Operations

Use this skill when Empire must coordinate many projects, repositories, products, clients, builds, or deployments from one control plane.

1. Treat each project repository and its local `AGENTS.md`/docs as authoritative for implementation. Portfolio data summarizes; it does not silently rewrite project truth.
2. Maintain a normalized registry with project id, owner, type, lifecycle state, priority, repository, deployment/backend links, target platforms, current milestone, blockers, sale status, and last verified evidence.
3. Distinguish `planned`, `active`, `blocked`, `paused`, `ready`, `production`, `sale-ready`, `archived`, and `unknown` states. Never infer healthy/ready merely from stale metadata.
4. Update portfolio status only from source-linked evidence such as commits, PRs, CI runs, deployments, backend health, issue state, accepted product records, or explicit owner decisions.
5. Detect duplicated products/components and opportunities for reusable modules, but never move client-confidential material into shared libraries without rights/privacy review.
6. Prioritize using business value, dependency criticality, risk, deadline, learning value, and effort. Do not start lower-priority work that blocks a P0 dependency unless explicitly approved.
7. For parallel work, assign one integration owner per project and avoid multiple agents editing the same sensitive paths without coordination.
8. Keep project-level roadmaps small and evidence-backed: current outcome, next vertical slice, blockers, verification, and next decision.
9. Track lifecycle from idea → validated brief → build → verify → preview/beta → release → support → productization/reuse where applicable.
10. Surface mobile-friendly operator views: what changed, what failed, what is waiting for approval, what can be tested on phone, and what needs a desktop/cloud-native lane.
11. Record external/manual blockers separately from code blockers so an agent does not repeatedly attempt an impossible action.
12. Preserve history and status provenance. Never delete or overwrite project work merely to simplify the dashboard.

## Deliverables

Return:
- normalized project/portfolio status;
- source evidence and freshness;
- P0/P1 next actions;
- blockers/approvals;
- safe parallel work opportunities;
- reuse/productization candidates;
- stale/unknown records requiring verification.
