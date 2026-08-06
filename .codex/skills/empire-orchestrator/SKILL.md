# Empire Orchestrator Skill

## Purpose

Coordinate complex engineering missions across AAA+ Engineering Empire studios while preserving clear ownership, bounded scope, integration discipline, and verifiable completion.

## Activate when

Use this skill when work spans multiple domains, requires more than one specialist team, contains meaningful dependencies or risks, or needs a coordinated delivery plan.

Do not activate for a small isolated edit that one agent can safely complete and verify directly.

## Inputs

- requested outcome;
- repository state;
- constraints and non-goals;
- acceptance criteria;
- affected systems and stakeholders;
- risk level and evidence requirements.

## Workflow

1. Inspect the repository and governing instructions.
2. Convert the request into measurable outcomes and explicit non-goals.
3. Map affected domains, trust boundaries, dependencies, and integration points.
4. Assign one accountable lead per workstream.
5. Define each workstream's inputs, outputs, acceptance criteria, and verification evidence.
6. Sequence dependent work and parallelize only independent work.
7. Establish integration checkpoints and stop conditions.
8. Require specialist reviews based on risk: architecture, security, QA, performance, DevOps, documentation, or release.
9. Integrate results into one coherent change set.
10. Run final acceptance verification and publish the completion report.

## Deliverables

- mission brief;
- workstream ownership map;
- dependency and risk register;
- implementation artifacts;
- verification evidence;
- limitations and follow-up actions.

## Failure modes

- **Unclear outcome:** infer the safest useful outcome from repository context and label assumptions.
- **Conflicting changes:** stop integration, preserve both work products, and resolve against acceptance criteria and architecture.
- **Missing evidence:** mark the affected claim `UNVERIFIED`; never upgrade status based on confidence alone.
- **Blocked dependency:** document the blocker, owner, impact, and the largest safe partial completion.
- **Scope expansion:** defer unrelated improvements unless required for correctness or safety.

## Quality checklist

- [ ] One accountable lead per workstream
- [ ] Dependencies and integration points identified
- [ ] Acceptance criteria measurable
- [ ] Security and privacy risks reviewed
- [ ] Testing and verification plan executed
- [ ] Documentation matches implementation
- [ ] Completion claims backed by current evidence
