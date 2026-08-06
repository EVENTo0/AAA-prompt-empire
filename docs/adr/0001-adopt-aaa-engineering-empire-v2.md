# ADR-0001: Adopt AAA+ Engineering Empire v2.0

- Status: Accepted
- Date: 2026-08-06
- Owners: EVENTo0 / Empire Orchestrator

## Context

The project requires a durable operating system for coordinating Codex and specialist engineering agents across software, games, web, mobile, AI, VR/XR, security, quality, performance, DevOps, documentation, and release work.

A large prompt alone is insufficient because instructions become difficult to discover, verify, version, and maintain. The repository must act as the source of truth for operating rules, architecture, decisions, skills, testing, and evidence.

## Decision

Adopt **AAA+ Engineering Empire v2.0 — Codex Operating System** as the repository-wide engineering model.

The operating system is implemented through:

- root `AGENTS.md` governance;
- reusable `.codex/skills/` workflows;
- domain documentation under `docs/`;
- ADRs for material decisions;
- evidence-based quality and release gates;
- focused branches and pull requests for non-trivial changes;
- explicit verification states rather than unsupported completion claims.

The canonical repository is:

`EVENTo0/AAA-prompt-empire`

## Consequences

### Positive

- Instructions are versioned and reviewable.
- Agents share one operating contract.
- Decisions and evidence remain discoverable.
- Quality claims require verification.
- New studios and skills can be added without turning one prompt into an unmaintainable monolith.

### Trade-offs

- Documentation and verification require ongoing discipline.
- Small changes may need additional evidence.
- Teams must maintain skills and ADRs as the system evolves.

## Compliance

Future repository automation, skills, templates, and project scaffolds must comply with `AGENTS.md` and this decision unless superseded by a later accepted ADR.
