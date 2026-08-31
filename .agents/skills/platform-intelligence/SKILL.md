---
name: platform-intelligence
description: Keep Empire engineering guidance aligned with verified current platform reality through baseline catch-up audits, weekly official-source deltas, release-channel policy, retirement/deadline guards, evidence freshness, and governed promotion to Core.
---

# Platform Intelligence

## Purpose
Continuously keep Empire engineering guidance aligned with verified official platform reality without destabilizing Core.

## Procedure
1. Inventory tracked platforms and repository references.
2. If a platform has never received a baseline audit, perform catch-up from the latest stable/current official documentation plus relevant deprecations, migrations and security notices; do not limit review to the current week.
3. Thereafter perform weekly delta review from primary/official sources.
4. Classify each finding: urgent-upgrade, urgent-retirement, correction, new-skill, adapter-change, workflow-change, architecture-change, watchlist, or no-action. A platform integration does not become a new Agent merely because a vendor exposes an API.
5. Evaluate model/runtime choices on quality, latency, cost and availability; include provider surface, auth constraints, deprecation date, retirement date and approved fallback.
6. Enforce lifecycle before capability ranking: retired or blocked-for-new-use surfaces MUST NOT be selected for new architecture; scheduled retirements MUST reject new pins when an approved replacement exists; hard deadlines MUST become FAIL on or after the effective date.
7. Enforce release channels: stable=production candidate; RC=compatibility/staging; beta/canary/nightly=isolated evaluation unless explicitly approved.
8. For connectors/MCP/adapters use least privilege, scoped credentials, destructive-write approval and audit logs. Prefer adapters behind the existing capability broker over creating vendor-specific Agents when the integration is primarily API/tool access.
9. For generated/untrusted code prefer isolated sandbox execution with restricted secrets/network and retained evidence.
10. Produce reproducible evidence, effective dates, fallback/rollback instructions and a next-review date.
11. Keep changes on an isolated branch/Draft PR. Never self-approve or mutate AAA-prompt Core automatically.

## Retirement-first gate
- A deprecated CLI/runtime/platform with an official successor is migration-only: no new dependency, pin, template or project may adopt it.
- A vendor retirement date is an executable architecture constraint, not informational metadata.
- When an immediate suggested fallback is itself near retirement, route to the durable supported successor after verifying the target surface.
- Marketplace/plugin auto-update is allowed only for explicitly allowlisted trusted sources and still requires version/provenance evidence.

## Promotion
A capability may be proposed to AAA-prompt Core only after representative validation proves it general, low-cost, stable, documented and rollback-safe. Provider Live Parity remains the final evidence gate for provider/runtime claims. Until that evidence passes, Core remains untouched. Owner review remains mandatory.
