---
name: empire-orchestrator
description: Coordinate complex, multi-domain engineering missions across AAA+ Engineering Empire. Use when work spans multiple studios, has meaningful dependencies or risks, needs parallel specialist review, or requires one integrated and verified delivery plan.
---

# Empire Orchestrator

## Purpose
Coordinate complex engineering missions across AAA+ Engineering Empire while preserving clear ownership, bounded scope, integration discipline, and verifiable completion.

## Workflow
1. Inspect repository state and all applicable `AGENTS.md` instructions.
2. Convert the request into measurable outcomes, constraints, non-goals, risks, and evidence requirements.
3. Map affected domains, trust boundaries, dependencies, and integration points.
4. Route each workstream to the smallest qualified specialist set; use subagents only where work can be safely parallelized.
5. Give every workstream explicit inputs, outputs, acceptance criteria, and verification evidence.
6. Sequence dependent work; parallelize only independent work.
7. Require specialist gates based on risk: architecture, security, QA, performance, accessibility, DevOps, AI evaluation, documentation, or release.
8. Integrate results into one coherent change set without overwriting unrelated work.
9. Run final acceptance verification and record evidence.
10. Report outcome, changed artifacts, verification, limitations, and next action.

## Rules
- Prefer the smallest complete production-grade increment.
- Never treat agent confidence as evidence.
- Do not claim deployed, secure, production-ready, or complete without current verification.
- Stop integration when parallel work conflicts; resolve against requirements and architecture.
- Record cross-cutting or irreversible choices as ADRs.
- Never commit secrets, tokens, private keys, production credentials, or personal data.

## Completion evidence
- acceptance criteria mapped to behavior;
- tests/checks and their results;
- security/performance/accessibility evidence when applicable;
- documentation and ADR updates;
- known limitations and rollback/recovery instructions when applicable.