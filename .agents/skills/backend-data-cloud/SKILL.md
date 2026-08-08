---
name: backend-data-cloud
description: Design, build, migrate, verify, and operate APIs, databases, authentication, storage, queues, realtime systems, serverless/edge functions, and cloud services. Use for backend or data work.
---

# Backend, Data & Cloud

1. Model domain boundaries, API/event contracts, identity/authz, data ownership, consistency and retention before implementation.
2. Choose managed/serverless/containerized infrastructure from workload, portability, security, latency, operational burden and cost—not fashion.
3. Design schemas and migrations with forward/backward compatibility, backup/recovery, idempotency and rollback where feasible.
4. Validate inputs, authorization on every privileged operation, rate/abuse limits where material, and safe handling of third-party failures.
5. Protect secrets with platform secret stores/OIDC/short-lived credentials when supported.
6. Add structured logs, metrics/traces where useful, health/failure signals, and cost/usage visibility.
7. Test API/data contracts, migrations, concurrency/retries and failure modes appropriate to risk.
8. For free-tier or low-cost infrastructure, verify current quotas, sleeping/expiry, egress/storage limits, region and upgrade behavior before relying on it.

Deliver architecture/data contracts, migration evidence, security boundaries, deploy/rollback procedure and operational risks.
