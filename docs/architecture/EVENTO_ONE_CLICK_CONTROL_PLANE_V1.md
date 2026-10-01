# EVENTO One-Click Control Plane v1

## Vision
EVENTO sits at the top of the main dashboard as the operator-facing command surface for the whole portfolio.

"One click" means one bounded command that can:
- inspect current truth;
- choose the next approved task;
- assemble Context Pack;
- route the right agent/tool;
- execute in isolation;
- run quality gates;
- generate preview/build/simulation;
- return evidence and next action.

It does NOT mean bypassing approvals, releases, security or physical-device gates.

## Dashboard hierarchy

EVENTO
├── Portfolio
├── Current Objective
├── Next Action
├── Run
├── Memory
├── Agents
├── Evidence
├── Previews / Builds / Simulations
├── Approvals
└── Future Lab

## Canonical project states
- Active
- Supporting
- Queued
- Blocked
- Preview
- Awaiting Approval
- Done
- Archived

## Portfolio constraint
Maximum operational focus:
- 3 Active
- 5 Supporting

New work must not silently create a fourth active build.

## One-click actions
### CONTINUE
Run the highest-value bounded next step toward DONE.

### PLAN
Refresh truth, dependencies, risks and exact next action.

### BUILD
Implement the approved smallest vertical slice.

### VERIFY
Run independent applicable gates.

### PREVIEW
Produce a source-linked web/mobile/desktop/Unity/Blender preview or artifact.

### LEARN
Convert verified outcomes into memory, regression tests or reusable capabilities.

### RELEASE
Protected; never implied by BUILD/PREVIEW.

## Project card
Every project card should expose:
- project name / repo
- role in EVENTO
- status
- current objective
- exact SHA / PR / run where relevant
- blocker
- next action
- agent currently assigned
- evidence state
- preview/build links
- target platforms
- toolchain health
- memory/reuse count
- deployment/release gate

## Runtime lanes
- Web / Vercel
- Data / Supabase
- Android
- iOS / Xcode
- Desktop
- Unity simulator
- Blender asset pipeline
- AI/Agent automation

## Truth model
Dashboard status must be derived from evidence, not agent claims.

## Security
- server-side provider credentials
- allowlisted repos/actions
- writes disabled by default unless task contract authorizes them
- no production deployment through generic CONTINUE
- release/payment/secret/migration actions use separate approvals

## Reuse
Before creating new work, search:
1. project memory
2. EVENTO shared memory
3. existing skills/agents
4. reusable templates
5. prior validated assets/components

Reuse before rebuild.
