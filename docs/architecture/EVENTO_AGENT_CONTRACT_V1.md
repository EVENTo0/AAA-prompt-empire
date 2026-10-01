# EVENTO Agent Contract v1

Status: Proposed implementation
Parent control plane: AAA+ Engineering Empire
Memory dependency: EVENTO Memory Architecture v1

## Purpose
Define one provider-neutral execution contract for Codex, Claude Code, Antigravity, OpenHands, Cline and future agents.

The project is the source of truth. The agent is replaceable.

## Required lifecycle
Every material task follows:

1. inspect_project()
2. create_context_pack()
3. create_plan()
4. classify_risk()
5. select_agent_and_tools()
6. create_worktree_or_branch()
7. implement_task()
8. run_tests()
9. verify_ui_or_runtime()
10. produce_evidence()
11. capture_learning()
12. request_approval_if_required()
13. finalize_change()

No step may claim completion without evidence appropriate to the risk.

## Agent invariants
- Agents never self-approve.
- Unknown routing fails closed.
- Credentials and production secrets never enter prompts, commits, logs, screenshots or memory records.
- Write, deploy, migration, payment, publication and secret-binding authority are distinct.
- Project-local instructions override general adapters only when they do not weaken governance/security.
- Fast-moving toolchain facts must be reverified from primary sources before release-sensitive changes.
- A provider-specific feature must not become a hard dependency unless documented and justified.

## Task input contract
Every task should define:
- project_id
- objective
- acceptance criteria
- non-goals
- target platforms
- risk level
- required evidence
- dependencies
- cost constraints
- allowed writes/actions
- deployment trigger
- rollback expectation

## Evidence contract
Evidence may include:
- exact commit/PR head
- CI run
- test output
- authenticated behavior proof
- physical-device proof
- preview URL
- build artifact
- database migration/test output
- screenshot/video only when visual proof is relevant
- source citations for knowledge claims

Evidence types are not interchangeable.

## Memory contract
Before execution the agent receives a minimal Context Pack.
After execution it may propose:
- facts
- decisions
- lessons
- patterns
- anti-patterns
- rules

Only independently supported knowledge is promoted to VERIFIED/ACTIVE.

## Reuse rule
If a solution is:
1. proven,
2. generalizable,
3. lower-cost than rebuilding,
4. safe to reuse,
then propose promotion to EVENTO shared capability.

## Execution modes
### PLAN
Read-only investigation and plan.

### BUILD
Code/data/content/asset change on isolated branch/worktree.

### VERIFY
Independent tests/review; no self-approval.

### PREVIEW
Create inspectable preview/build/simulation without production release.

### RELEASE
Protected action requiring the relevant approval gate.

### LEARN
Capture verified reusable knowledge and regression coverage.

## Specialized domains
The contract applies to:
- web/PWA
- backend/data/Supabase
- mobile Android/iOS
- desktop
- Unity/game/XR/simulation
- Blender/3D/assets
- AI/agents
- content/knowledge/print
- CI/release/operations
- portfolio orchestration

## Definition of Done
A task is DONE only when:
- objective is satisfied;
- acceptance evidence exists;
- applicable tests/gates pass;
- remaining unknowns are explicit;
- source-of-truth docs/registry are updated when behavior changed;
- reusable learning is captured when appropriate;
- release/deploy state is truthfully reported.
