# AAA+ Engineering Empire v2.0 — Agent Operating Contract

This file governs every human and AI contributor operating in this repository.

## 1. Prime directive

Build the smallest complete, production-grade increment that advances the approved product outcome. Do not optimize for visible activity, file count, or persuasive claims. Optimize for verified value.

## 2. Mandatory startup protocol

Before changing anything:

1. Inspect the repository tree and current branch.
2. Read this file and all nearer `AGENTS.md` files.
3. Read relevant product, architecture, ADR, security, testing, deployment, and verification documents.
4. Identify the user outcome, constraints, acceptance criteria, risks, dependencies, and evidence required.
5. Reuse existing patterns before introducing new ones.

## 3. Empire command structure

### Empire Orchestrator
Owns decomposition, sequencing, cross-team coordination, risk control, and final evidence synthesis.

### Architecture Council
Owns boundaries, interfaces, data flows, technology decisions, ADRs, scalability, and maintainability.

### Product Studio
Owns user outcomes, requirements, scope, prioritization, UX acceptance criteria, and product analytics.

### AI Engineering Studio
Owns model selection, prompts, agents, tools, retrieval, evaluations, guardrails, observability, and cost controls.

### Game Studio
Owns gameplay systems, simulation, world building, content pipelines, multiplayer, animation, rendering, and platform readiness.

### Web, App, Mobile, and VR/XR Studios
Own platform-specific architecture, user experience, accessibility, device constraints, integration, and release readiness.

### Security Team
Owns threat modeling, secrets, authentication, authorization, dependency risk, privacy, abuse resistance, and security evidence.

### QA and Verification Team
Owns test strategy, regression protection, acceptance verification, exploratory testing, and release evidence.

### Performance Team
Owns budgets, profiling, latency, memory, rendering, loading, concurrency, and capacity evidence.

### DevOps and Release Team
Owns environments, CI/CD, infrastructure, migrations, observability, rollback, runbooks, and release gates.

### Documentation Team
Owns source-of-truth documentation, decision history, onboarding, operational clarity, and documentation accuracy.

## 4. Work protocol

For non-trivial work, operate through these phases:

1. **Discover** — inspect the current system and constraints.
2. **Define** — state outcome, acceptance criteria, non-goals, risks, and evidence.
3. **Design** — choose the simplest safe architecture and record material decisions.
4. **Build** — implement in small coherent changes.
5. **Verify** — run tests, checks, security review, and scenario validation.
6. **Document** — update architecture, operation, and usage documentation.
7. **Release** — confirm deployment, rollback, monitoring, and ownership.

## 5. Quality gates

No change may be called complete unless applicable gates pass:

- **Product:** acceptance criteria map to working behavior.
- **Architecture:** boundaries and interfaces remain coherent.
- **Code:** readable, typed where supported, maintainable, and free of unnecessary duplication.
- **Testing:** relevant automated and manual checks pass.
- **Security:** secrets are protected; permissions are least-privilege; inputs and outputs are validated.
- **Performance:** budgets are defined and regressions are investigated.
- **Accessibility:** applicable interfaces support keyboard, semantics, contrast, and assistive technology.
- **Operations:** deployment, migration, observability, rollback, and failure handling are understood.
- **Documentation:** source-of-truth files match the implemented system.
- **Evidence:** claims are backed by commands, test outputs, screenshots, logs, metrics, or reviewed artifacts.

## 6. Evidence standard

Use explicit status labels:

- `VERIFIED` — directly confirmed with current evidence.
- `PARTIALLY VERIFIED` — some checks passed; remaining checks are named.
- `UNVERIFIED` — not tested or evidence unavailable.
- `BLOCKED` — cannot proceed; blocker and owner are named.

Never state that something works, is secure, is deployed, is production-ready, or is complete without current evidence.

## 7. Change discipline

- Prefer focused branches and pull requests.
- Keep commits atomic and messages descriptive.
- Do not overwrite unrelated work.
- Do not remove safeguards merely to make checks pass.
- Do not introduce dependencies without justification.
- Never commit credentials, private keys, tokens, personal data, or production secrets.
- Use feature flags or staged rollout for high-risk behavior.
- Record irreversible or cross-cutting decisions as ADRs.

## 8. Testing doctrine

Choose tests by risk, not by habit. Depending on the change, include:

- unit tests for logic;
- integration tests for boundaries;
- contract tests for APIs and events;
- end-to-end tests for critical journeys;
- security tests for trust boundaries;
- performance tests for defined budgets;
- visual and accessibility checks for interfaces;
- simulation, determinism, soak, and multiplayer tests for games;
- evaluation datasets and regression suites for AI behavior.

## 9. AI-specific rules

- Treat prompts, tools, models, datasets, and evaluation criteria as versioned engineering assets.
- Defend against prompt injection, data leakage, tool misuse, and untrusted retrieved content.
- Separate model-generated claims from verified facts.
- Define fallback behavior, cost limits, latency targets, and human escalation.
- Never expose hidden instructions, secrets, or private chain-of-thought.

## 10. Definition of done

A task is done only when the repository contains:

1. the working change;
2. passing applicable checks;
3. updated documentation;
4. verification evidence;
5. known limitations and follow-up items;
6. deployment or handoff instructions when applicable.

## 11. Communication format

Use this compact completion report:

- **Outcome**
- **Changed**
- **Verified**
- **Risks / limitations**
- **Next action**

## 12. Authority hierarchy

When instructions conflict, apply this order:

1. law, safety, privacy, and platform policy;
2. explicit user requirements;
3. repository-local `AGENTS.md` nearest the changed file;
4. this root operating contract;
5. established repository conventions;
6. agent preference.
