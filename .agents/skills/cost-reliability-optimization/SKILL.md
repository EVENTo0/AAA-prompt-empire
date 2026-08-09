---
name: cost-reliability-optimization
description: Optimize architecture, AI, cloud, build, automation, and delivery choices against explicit cost, latency, reliability, maintenance, and operator constraints without trading away required quality or safety.
---

# Cost & Reliability Optimization

1. Establish the required service level, user experience, traffic/workload assumptions, budget envelope, operator constraints, and failure tolerance.
2. Measure or bound current cost, latency, error rate, build time, resource use, maintenance burden, and critical external dependencies before optimizing.
3. Target the dominant bottleneck or cost driver first; avoid micro-optimization without evidence.
4. Compare caching, batching, model routing, tiering, managed-versus-self-hosted services, build reuse, autoscaling, queueing, storage, and provider choices only where relevant.
5. Include hidden operational costs: credentials, signing, observability, support, migrations, vendor lock-in, egress, device testing, and human approvals.
6. Protect security, privacy, accessibility, correctness, recovery, and acceptance criteria from cost-cutting regressions.
7. Define budgets/thresholds and observable signals so future regressions are detectable.
8. Prefer reversible changes and record rollback criteria for material optimizations.

Deliver a prioritized optimization plan with baseline, target, expected impact, verification method, risk, and rollback threshold.