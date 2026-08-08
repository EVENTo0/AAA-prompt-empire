# AAA+ Engineering Empire v2.2 — Evaluated, Governed & Self-Improving Agent System

Status: active design for v2.2

## Objective

Move Empire from a collection of executable skills and agents to a testable control system with explicit registries, routing contracts, permission ceilings, dependency relationships, regression checks, and a learning loop.

## Control model

`AGENTS.md` remains the governing human-readable contract. `.agents/skills/` remains the canonical skill source. Codex/Claude agent definitions remain executable adapters. The `registry/` layer makes their identity, dependencies, permissions, and routing machine-readable. `evals/` tests stable orchestration contracts. `Empire Guard v2` blocks structural and governance regressions.

## Invariants

- Canonical skills live only under `.agents/skills/`.
- Claude skill definitions are adapters and must reference the canonical skill path.
- Every skill and agent is registered.
- Read-only agents cannot gain write/deploy permission through registry drift.
- No agent may self-approve.
- Skill dependencies must be acyclic and reference registered skills.
- Routing contracts may use only registered skills/agents.
- Critical route coverage must include the required skill set through the selected agents and their dependency closure.
- Unknown task tags must fail closed instead of silently selecting an unrelated route.

## Evaluation layers

1. **Structural validation:** file presence, frontmatter, paths, mirrors, registry parity, dependency graph, secret hygiene.
2. **Contract routing evaluations:** deterministic task tags resolve to the expected route and specialist set.
3. **Permission regression evaluations:** read-only agents and route-level forbidden permissions remain enforced.
4. **Project behavioral evaluations:** individual product repositories should add representative end-to-end tasks for their own agents, tools, and acceptance criteria.
5. **Production evidence:** real deployments, device/browser tests, security checks, AI evals, and operational evidence remain required; contract tests alone do not prove product quality.

## Learning loop

A recurring defect or successful workflow should first be documented in the affected project. If repeated and verified, propose a registry/skill/eval change in Empire. Add or change behavior only with a regression case. Backport to Core only when broadly useful.

## Versioning

Skills and agents use semantic version fields in the registry. A material behavior, permission, or routing change should increment the relevant version and add or update an evaluation case. Pure documentation clarification may keep the current behavior version.

## Next evolution

Future versions may add runtime telemetry, evaluation result history, policy-as-code integration with the mobile control plane, signed release manifests, and project-specific capability discovery. These should be added only when a real workflow proves the need.
