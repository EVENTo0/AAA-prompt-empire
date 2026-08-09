---
name: integration-capability-planning
description: Design safe, portable integrations across repositories, APIs, SaaS, cloud, payments, data, automation, CI/CD, and operator tools with explicit trust, credential, failure, and ownership boundaries.
---

# Integration Capability Planning

1. Define the user outcome and source-of-truth systems before choosing an integration mechanism.
2. Map identities, data ownership, APIs/webhooks/events, credential location, permission scopes, rate limits, retries, idempotency, timeout behavior, auditability, and failure recovery.
3. Prefer supported APIs, short-lived credentials/OIDC, server-side secrets, least privilege, allowlists, and reversible staging over browser automation or shared long-lived keys when practical.
4. Separate read aggregation, controlled write actions, deployment authority, destructive operations, and production publication into appropriately gated capabilities.
5. Keep provider-specific adapters behind stable internal contracts when multiple projects may reuse the pattern.
6. Identify local-development, cloud-CI, phone-first review, sandbox/test-mode, and production paths separately.
7. Define contract tests and degraded behavior for unavailable providers, stale data, permission loss, quota/rate limits, and partial failure.
8. Do not claim an integration works until exercised with current environment evidence.

Deliver an integration contract covering architecture, trust/data flow, scopes, failure modes, test strategy, rollout, observability, and rollback.