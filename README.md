# AAA+ Engineering Empire v2.1

**Repository-first operating system for Codex + Claude Code to build, repair, verify, preview, deploy, and operate software, websites, mobile/native apps, games, AI systems, automations, data platforms, and XR experiences.**

Status: **v2.1 hardening candidate**  
Owner: **EVENTo0**  
Default branch: `main`

## Prime objective

Turn ambitious requests into the smallest complete, production-grade, verifiable outcomes. Empire optimizes for evidence, maintainability, security, portability, and fast feedback—especially a phone-accessible feedback loop—rather than impressive scaffolding or claims.

## Start here

1. Read `AGENTS.md`.
2. Claude Code also reads `CLAUDE.md`.
3. Audit the repository and current product state before editing.
4. Activate only the skills/agents relevant to the task.
5. Build a vertical slice.
6. Verify independently.
7. Produce a preview/build/test path.
8. Record evidence and release/rollback status.

## Executable control plane

- `.agents/skills/` — canonical repository Agent Skills used by Codex.
- `.claude/skills/` — Claude Code project adapters to the canonical skills.
- `.codex/agents/` — project-scoped Codex custom subagents.
- `.claude/agents/` — project-scoped Claude Code subagents.
- `.codex/config.toml` — bounded Codex multi-agent configuration.
- `.github/workflows/empire-guard.yml` — governance/skills/agents validation.
- `.github/CODEOWNERS` — ownership for protected review flows.
- `scripts/validate_empire.py` — standard-library validator.

## Core skills

Empire v2.1 includes 15 focused skills covering orchestration, intake/audit, architecture/stack routing, vertical slices, web, mobile, Android/iOS native delivery, backend/data/cloud, AI agents, game/XR/simulation, security/privacy, QA/release readiness, performance/accessibility, phone/cloud previews, and dependency upgrade/debugging.

## Executable agents

Empire v2.1 defines 14 specialist subagents in both Codex and Claude Code: repository mapping, solution architecture, product/UX, web, mobile, native platforms, backend/data, AI, game/simulation, security review, QA verification, performance/reliability, release engineering, and red-team review.

These are actual project-scoped agent definitions, not merely role names in a prompt.

## Mobile-first operator model

The phone is treated as a primary operator console and feedback device. Where feasible, projects should return a responsive preview URL, installable development/internal build, device-streaming session, or other source-linked artifact that can be inspected from a phone.

Empire does not pretend a phone replaces Xcode, Android Studio, GPU profilers, or heavy engine tooling when those are genuinely required. It routes such work to suitable cloud/remote/native environments and returns evidence to the phone.

See `docs/mobile/MOBILE_FIRST_OPERATING_MODEL.md`.

## Security and change control

Routine Empire changes belong on branches and pull requests. `main` should be protected with owner review and the Empire Guard check. Repository visibility and branch/ruleset enforcement are GitHub settings; see `docs/security/REPOSITORY_LOCKDOWN.md`.

Never commit reusable approval codes, credentials, private keys, certificates, tokens, production secrets, or personal data.

## Evergreen technology policy

Empire does not permanently pin “the latest” framework/model/SDK into its governing prompt. Fast-moving choices are re-verified from primary documentation at project start or upgrade time, and material choices are recorded in ADRs.

See `docs/architecture/TECHNOLOGY_RADAR.md`.

## Definition of done

A feature/project is complete only when applicable acceptance criteria, tests, security/privacy, accessibility, performance/reliability, deployment/recovery, documentation, and evidence gates are satisfied. A successful compile, screenshot, mockup, generated codebase, or agent confidence alone is not completion proof.

## Version

`AAA+ Engineering Empire v2.1 — Mobile-First Multi-Agent Hardening — 2026.08`
