# Skill: automation-platform-upgrade-audit

## Purpose
Safely evaluate upgrades and configuration changes for agentic/automation platforms such as Claude Code, n8n, Zapier and comparable systems.

## Required preflight
1. Identify installed/current version, release channel, install method and hosting mode.
2. Verify official changelog/security/deprecation notes and evidence timestamp.
3. Detect breaking changes in CLI names, runtime versions, auth, storage, source-control semantics, MCP/tool exposure and migration rules.
4. Inventory credentials, webhooks, plugins/community nodes, custom scripts and production dependencies.
5. Classify change as security-required, breaking-required, compatibility-only, optional capability or watchlist.
6. Define rollback/pinning and migration evidence before mutation.

## Security rules
- Never default to bypassed permissions or unrestricted tool execution.
- Separate capability discovery from installation/execution.
- Scope MCP/connectors/actions to the minimum required set.
- Prefer protected production environments and one-direction promotion flows.
- Run platform-provided security audits when available.
- Treat beta/preview SDKs and agent runtimes as isolated scouting unless an ADR explicitly approves production use.

## Evidence output
Emit version/channel, official sources, breaking/security findings, compatibility matrix, test plan, rollback, PASS/FAIL/VERIFY_REQUIRED and next review date.
