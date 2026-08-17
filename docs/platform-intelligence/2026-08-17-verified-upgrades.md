# Verified Platform Upgrades — 2026-08-17

Status: Empire-only implementation evidence. No Core promotion.

## Correction to prior weekly wording
Two items previously described as August 2026 changes were actually August 2025 Supabase changes:
- `realtime-js` / `supabase-js` WebSocket transport behavior for Node.js <22 (2025-08-12).
- Deno 2.1-compatible Edge Functions rollout to all regions (2025-08-15).

They remain useful historical compatibility baseline facts, but must not be reported as new August 2026 releases.

## Verified 2026 Supabase changes
- `analytics/endpoints/logs.all` is scheduled for removal on 2026-09-23. Direct callers must migrate to `analytics/endpoints/logs`, which uses ClickHouse SQL and a unified `logs` table.
- From 2026-08-05, explicit extension version clauses on hosted Supabase are ignored in favor of the instance default version and emit a warning. Verify the installed version rather than trusting the requested clause.
- Supabase JavaScript packages ended Node.js 20 support on 2026-06-30; current server-side integrations should use a supported Node release.
- Self-hosted Supabase moved toward Envoy as the default API gateway in August 2026; Kong-specific customizations require preflight and rollback evidence.

Primary sources:
- https://supabase.com/changelog/48235-migration-of-supabase-management-api-logs-all-analytics-endpoint-to-logs-endpoint
- https://supabase.com/changelog/extension-version-pinning-ignored
- https://supabase.com/changelog/45715-deprecation-notice-dropping-support-for-node-js-20
- https://supabase.com/changelog?types=breaking-change

## Verified GitHub Actions changes
- Workflow execution protections are in public preview and can restrict workflow actors/events through rulesets; `pull_request_target` and `workflow_dispatch` deserve explicit governance.
- `actions/checkout` v7 adds safer defaults against common privileged `pull_request_target` checkout patterns.
- GitHub Enterprise Cloud self-hosted runner minimum-version enforcement begins 2026-09-25; self-hosted runners require freshness verification rather than assumed compatibility.
- Agentic Workflows can use the built-in `GITHUB_TOKEN` instead of long-lived PATs and are read-only/sandboxed by default with safe-output controls.

Primary sources:
- https://github.blog/changelog/2026-06-18-control-who-and-what-triggers-github-actions-workflows/
- https://github.blog/changelog/2026-06-18-safer-pull_request_target-defaults-for-github-actions-checkout/
- https://github.blog/changelog/2026-06-12-github-actions-minimum-version-enforcement-timeline-for-self-hosted-runners/
- https://github.blog/changelog/2026-06-11-agentic-workflows-no-longer-need-a-personal-access-token/

## Verified Claude Code controls
The Anthropic `claude-code` changelog records:
- `--safe-mode` / `CLAUDE_CODE_SAFE_MODE` for troubleshooting with customizations disabled.
- `sandbox.network.strictAllowlist` for denying non-allowlisted sandbox hosts without prompting.

These controls are version-gated. Empire must verify the installed Claude Code version before relying on them and must keep provider-neutral fail-closed behavior as the baseline.

Primary source:
- https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md

## Verified n8n security posture
- n8n exposes `n8n audit` / `/audit` to detect credential, database, filesystem, risky-node and instance risks.
- 2026 advisories include multiple critical RCE/sandbox-escape classes. Historical fixed-version floors are not sufficient evidence of current safety; self-hosted instances must check the latest applicable advisories before Production use.
- n8n moved security-advisory communications to a bi-weekly cadence in 2026 while retaining expedited critical fixes.

Primary sources:
- https://docs.n8n.io/hosting/securing/security-audit/
- https://blog.n8n.io/how-n8n-handles-vulnerability-disclosure-and-why-we-do-it-this-way/
- https://community.n8n.io/c/security-advisories/40

## Verified Vercel / AI SDK reference capability
- AI SDK 7 requires Node.js 22+ and ESM.
- It adds experimental `HarnessAgent` support for harnesses including Claude Code and Codex, plus `WorkflowAgent`, approvals, timeouts, telemetry and sandbox integrations.
- Vercel Sandbox is GA for isolated untrusted-code execution; OIDC is preferred where available. Sandbox sessions can run up to 24 hours on supported paid plans.
- Sandbox Drives remain private beta and should not hold Production data.

Primary sources:
- https://vercel.com/blog/ai-sdk-7
- https://vercel.com/docs/sandbox
- https://vercel.com/changelog/vercel-sandbox-can-now-run-for-up-to-24-hours
- https://vercel.com/changelog/drives-for-vercel-sandbox-in-private-beta

## Implementation decision
Apply these changes only in `AAA-prompt-empire` PR #18. Keep EVENTO, company website/mobile/control-plane repos and `AAA-prompt` Core untouched. Any live harness or sandbox proof must use disposable fixtures, scoped credentials and owner-reviewed write boundaries.
