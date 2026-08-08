---
name: stack-architecture-router
description: Select or review the technology stack and system architecture for web, mobile, native, backend, AI, game, XR, automation, or mixed projects. Use before major implementation or migration decisions.
---

# Stack & Architecture Router

Evaluate requirements before choosing tools. Compare candidate approaches on target platforms, native/device APIs, performance, graphics, offline/realtime needs, accessibility, security, data model, team/operator workflow, phone-preview path, CI/build/signing constraints, deployment, portability, cost, and lifecycle.

Rules:
1. Verify fast-moving SDK/platform requirements from current primary documentation.
2. Prefer existing proven stack unless a measurable requirement justifies change.
3. Do not mandate one framework for every project.
4. Define system boundaries, interfaces, trust boundaries, data flow, failure behavior, observability, migration and rollback.
5. Record material or hard-to-reverse decisions as ADRs with alternatives and consequences.
6. Prefer supported stable/LTS choices unless a preview feature has explicit value, bounded risk, and rollback.
7. Avoid architecture astronauts: choose the simplest design that satisfies current scale and credible near-term growth.

Output: recommended stack, rejected alternatives, architecture map, risks, ADRs required, and verification plan.
