# Platform Intelligence Capability Pack — 2026-08

Status: experimental in Empire; promotion to Core requires evidence.

## Operating rule
Official/primary sources are the source of truth. Each tracked platform must receive a baseline catch-up audit before weekly delta-only monitoring begins. A week with no release is not evidence that the repository guidance is current.

## Approved capabilities
1. model-lifecycle: track model/provider/surface/auth availability, sunset dates, fallbacks and migration evidence. Routing evaluates quality, latency, cost and availability.
2. codex-sunset-eval: fail when retired/unsupported Codex defaults, saved configurations, agents or scheduled tasks are introduced.
3. supabase-upgrade-audit: distinguish hosted/self-hosted; audit gateway, Postgres/extensions, Realtime, runtime/client versions, compose/custom configuration and rollback readiness.
4. secure-agent-execution: sandbox abstraction for untrusted/generated code; deny-by-default networking/secrets; evidence capture and teardown.
5. agent-harness-adapter: experimental neutral contract for Codex, Claude Code and other harnesses: plan, tools, permissions, sandbox, skills, subagents, evidence, result.
6. native-toolchain-scout: monitor Xcode/iOS, Android Studio/SDK and Flutter; production remains stable-first.
7. vendor-security-watch: track official advisories/incidents and map affected assets, credentials, rotation, logs and downstream impact.
8. capability-broker: least-privilege MCP/connector discovery and invocation with scoped credentials, approval for destructive writes and audit evidence.

## Release-channel policy
- stable: eligible for production after compatibility gates.
- RC: compatibility CI/staging; production only by explicit ADR/owner approval.
- beta: isolated evaluation only.
- canary/nightly/preview: isolated scouting only; never an implicit production dependency.

## Baseline catch-up matrix
Before claiming CURRENT, inspect official release notes/changelogs/security advisories and current docs for: OpenAI/Codex; Anthropic/Claude Code; GitHub/Actions; Vercel/Next.js/AI SDK/Sandbox; Supabase/Postgres/Auth/Realtime/Edge; Hostinger; n8n; Zapier; Flutter/Dart; Android Studio/Android SDK/Gradle; Apple/Xcode/iOS/Swift; WordPress/Gutenberg; Stripe; Tap Payments; preview/build/deployment tooling; mobile-first workflows; agents/skills/MCP; CI/CD/testing/security; and newly consequential developer platforms.

Record per platform: checked_at, official_sources, current_stable, preview_channels, breaking/deprecation/security changes, repository impact, action (none/watch/skill/agent/workflow/architecture), urgency, evidence, next_review.

## Promotion gate: Empire -> Core
Promote only when capability is general, low-cost, provider-neutral where practical, tested in representative projects, documented, rollback-safe, and owner-reviewed. No self-approval and no automatic cross-repository mutation.
