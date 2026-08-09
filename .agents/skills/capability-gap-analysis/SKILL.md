---
name: capability-gap-analysis
description: Audit a project or Empire itself for missing, weak, duplicated, stale, or unsafe skills, agents, tools, integrations, tests, and operating capabilities before adding new machinery.
---

# Capability Gap Analysis

1. Start from approved outcomes and current repository evidence; do not equate a long tool or agent list with capability.
2. Map required jobs-to-be-done to existing skills, agents, tools, routes, templates, tests/evals, environments, and human approvals.
3. Classify each requirement as covered, partially covered, missing, duplicated, stale, unsafe, blocked by credentials/infrastructure, or project-specific.
4. Reuse or strengthen an existing capability before creating a new one when ownership and semantics overlap.
5. Identify permission, privacy, security, cost, device, platform, and lifecycle constraints for any proposed capability.
6. For a new reusable capability, define canonical skill boundary, agent posture, permission ceiling, routing tags, dependencies, deterministic evals, documentation, and rollback/removal criteria.
7. Keep project-specific product logic in the product repository unless repeated evidence proves Empire-level reuse.
8. Do not broaden permissions merely to make a capability convenient.

Deliver a capability matrix, prioritized gaps, reuse-versus-add decisions, proposed pack boundaries, eval requirements, and evidence needed before activation.