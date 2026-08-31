---
name: automation-platform-upgrade-audit
description: Audit upgrades and configuration changes for agentic and automation platforms such as Codex, Claude Code, n8n, Zapier, MCP runtimes, and comparable systems before production mutation.
---

# Automation Platform Upgrade Audit

## Purpose
Safely evaluate upgrades, deprecations and configuration changes for agentic/automation platforms such as Codex, Claude Code, n8n, Zapier and comparable systems.

## Required preflight
1. Identify installed/current version, release channel, install method and hosting mode.
2. Verify official changelog/security/deprecation notes and evidence timestamp.
3. Detect breaking changes in CLI names, runtime versions, auth, storage, source-control semantics, app-server/MCP/tool exposure and migration rules.
4. Inventory credentials, webhooks, plugins/community nodes, custom scripts and production dependencies.
5. Classify change as security-required, retirement-required, breaking-required, compatibility-only, optional adapter capability or watchlist.
6. Define rollback/pinning and migration evidence before mutation.
7. Reject new adoption of officially retired or blocked-for-new-use platforms even if existing deployments still run.

## OpenAI Codex lifecycle rule
- `codex mcp-server` is deprecated as of 2026-08-24. Do not create new dependencies, templates or automation paths around it.
- Use the Codex app server for new Codex integrations unless newer official guidance supersedes it.
- Existing `codex mcp-server` usage is migration-only and must emit `MIGRATION_REQUIRED`; if a workflow attempts fresh adoption, return `FAIL`.
- Keep the provider-neutral agent-harness contract above the Codex transport so future surface changes do not require architecture rewrites.

## Claude Code rules
- Verify the installed version and official Anthropic changelog before relying on specific safety controls.
- Where supported, use `--safe-mode` / `CLAUDE_CODE_SAFE_MODE` to reproduce issues without CLAUDE.md, plugins, skills, hooks or MCP customizations.
- Where supported, prefer `sandbox.network.strictAllowlist` for high-trust automation that needs explicit sandbox egress control.
- Never normalize `--dangerously-skip-permissions` as an unattended automation default.
- If a required control is unavailable or version evidence is stale, return `VERIFY_REQUIRED` rather than silently weakening the execution boundary.

## n8n self-hosted security gate
- Check the latest official n8n security advisories for the installed release branch before Production use. Historical patched-version floors are not proof that an instance is currently safe.
- Run `n8n audit` (or the authenticated `/audit` equivalent) and retain its credential, database, filesystem, risky-node and instance findings as evidence.
- Treat an outdated instance, unresolved critical/high advisory, exposed risky/custom/community node, unsafe webhook, or missing security setting as a release blocker until mitigated or explicitly accepted.
- Maintain an expedited patch path for critical advisories and keep rollback/backups for self-hosted upgrades.
- Do not upgrade clustered components independently without main/worker/runner compatibility evidence.

## Optional adapter rule: Hostinger Reach
- Hostinger Reach integration is an optional adapter through the existing capability broker, not a new Agent.
- Prefer the official Reach public API or Hostinger API n8n Community Node and verify the currently exposed operations before use.
- Default discovery/read operations to read-only. Contact/campaign mutation, deletion or send/activation actions require the broker's approval policy and scoped credentials.
- Do not auto-install community nodes from arbitrary sources; only allowlisted trusted sources may participate in automated installation/update flows.

## Security rules
- Never default to bypassed permissions or unrestricted tool execution.
- Separate capability discovery from installation/execution.
- Scope MCP/connectors/actions to the minimum required set.
- Prefer protected production environments and one-direction promotion flows.
- Run platform-provided security audits when available.
- Treat beta/preview SDKs and agent runtimes as isolated scouting unless an ADR explicitly approves production use.

## Evidence output
Emit version/channel, official sources, lifecycle state, effective dates, breaking/security findings, compatibility matrix, test plan, audit output, rollback, PASS/FAIL/VERIFY_REQUIRED/MIGRATION_REQUIRED and next review date.
