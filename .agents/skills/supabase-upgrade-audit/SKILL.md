---
name: supabase-upgrade-audit
description: Audit hosted and self-hosted Supabase upgrades, deprecations, runtime compatibility, observability migrations, extension behavior, security impact, deadline failures, and rollback evidence before production mutation.
---

# Supabase Upgrade Audit

## Purpose
Keep Supabase-dependent projects aligned with verified platform reality without applying speculative or irreversible Production changes.

## Required preflight
1. Identify hosted vs self-hosted, project Postgres/runtime/client versions, Supabase CLI/version, and custom gateway/compose/extensions.
2. Verify current official Supabase changelog, deprecations, security advisories, and project advisors before mutation.
3. Record `checked_at`, affected surface, migration deadline, compatibility impact, rollback path and evidence.
4. Treat historical changes as baseline facts, not as current-week releases.

## 2026 verified guards
- Management API callers using `analytics/endpoints/logs.all` must migrate before its 2026-09-23 removal to the ClickHouse-backed `analytics/endpoints/logs` endpoint and ClickHouse SQL. Dashboard Logs Explorer usage alone is not impacted.
- `logs.all` deadline behavior is executable: before 2026-09-23, detected direct callers return `MIGRATION_REQUIRED`; on or after 2026-09-23, any production/release path that still depends on `logs.all` returns `FAIL`. Never downgrade this to a warning because a dashboard log view still works.
- Supabase MCP integrations that depended on `get_logs` must verify they use a version that no longer calls `logs.all`; current official guidance identifies `mcp-server-supabase` v0.10.0 as the migration floor, subject to fresh verification before consequential use.
- From 2026-08-05, explicit Postgres extension versions in `CREATE EXTENSION ... VERSION` or `ALTER EXTENSION ... UPDATE TO` are ignored on hosted Supabase and emit a warning. Do not claim an explicitly requested extension version was installed; verify the actual installed/default version after migration.
- Supabase JavaScript libraries no longer support Node.js 20 after 2026-06-30. New or upgraded server runtimes using current `supabase-js` packages must use a supported Node release (22+ unless current official guidance changes).
- Self-hosted gateway migrations must detect Kong-specific listeners, `kong.yml`, service names and custom compose assumptions before accepting an Envoy-default upgrade.

## Security and release gate
- Never apply generated migrations directly to Production without schema reconciliation and staged evidence.
- Run security/performance advisors after DDL or auth/RLS changes.
- Preserve RLS, auth, API, Edge Function and client compatibility through cross-user/anonymous negative tests where relevant.
- If official guidance conflicts or freshness is insufficient, return `VERIFY_REQUIRED` rather than guessing.

## Output
Emit hosted/self-hosted mode, versions, official sources, deadlines, affected assets, required changes, test plan, advisor findings, rollback, PASS/FAIL/VERIFY_REQUIRED/MIGRATION_REQUIRED and next review date.
