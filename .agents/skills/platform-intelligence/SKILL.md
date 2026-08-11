# Skill: platform-intelligence

## Purpose
Continuously keep Empire engineering guidance aligned with verified official platform reality without destabilizing Core.

## Procedure
1. Inventory tracked platforms and repository references.
2. If a platform has never received a baseline audit, perform catch-up from the latest stable/current official documentation plus relevant deprecations, migrations and security notices; do not limit review to the current week.
3. Thereafter perform weekly delta review from primary/official sources.
4. Classify each finding: urgent-upgrade, correction, new-skill, new-agent, workflow-change, architecture-change, watchlist, or no-action.
5. Evaluate model/runtime choices on quality, latency, cost and availability; include surface/auth constraints and sunset dates.
6. Enforce release channels: stable=production candidate; RC=compatibility/staging; beta/canary/nightly=isolated evaluation unless explicitly approved.
7. For connectors/MCP use least privilege, scoped credentials, destructive-write approval and audit logs.
8. For generated/untrusted code prefer isolated sandbox execution with restricted secrets/network and retained evidence.
9. Produce reproducible evidence and rollback instructions.
10. Keep changes on an isolated branch/Draft PR. Never self-approve or mutate AAA-prompt Core automatically.

## Promotion
A capability may be proposed to AAA-prompt Core only after representative validation proves it general, low-cost, stable, documented and rollback-safe. Owner review remains mandatory.
