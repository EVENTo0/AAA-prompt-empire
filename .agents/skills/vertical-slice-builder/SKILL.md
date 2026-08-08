---
name: vertical-slice-builder
description: Build a small end-to-end production-grade feature through UI/client, API/domain, data/integrations, errors, tests, observability, preview, and documentation. Use for normal feature implementation.
---

# Vertical Slice Builder

1. Define one user-visible outcome and explicit acceptance criteria.
2. Trace the real execution path before editing.
3. Implement the smallest coherent slice across every required boundary rather than disconnected scaffolding.
4. Include validation, authorization, loading/empty/error/retry behavior, migrations, telemetry/logging, and accessibility as applicable.
5. Add tests at the cheapest layers that protect the highest risks; include end-to-end coverage for critical journeys when feasible.
6. Produce a runnable preview/build and test it in a representative environment/device.
7. Review the diff for unrelated change, secret leakage, dependency creep, and accidental compatibility breaks.
8. Update source-of-truth docs and verification evidence.

Do not replace real integrations with mocks in production paths, silently skip failing checks, or call compile success equivalent to product completion.
