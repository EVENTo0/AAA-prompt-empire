# EVENTO Project Development — Company, Engineering Lab & Venture Map

Status: owner-review candidate  
Date: 2026-08-11

## 1. The operating model

EVENTO Project Development is the legal company and the business engine. The GitHub account is the development estate used to build EVENTO itself, create and operate EVENTO-owned ventures, develop customer work, and maintain the internal AI/engineering laboratory that accelerates all of that work.

```text
EVENTO PROJECT DEVELOPMENT — legal company / revenue engine
|
+-- Company Core
|   +-- EVENTO Web / PWA
|   +-- EVENTO Mobile
|   +-- customer requests / orders / payments / delivery / aftercare
|   +-- project catalogue / demos / sales assets
|
+-- Internal Engineering Lab
|   +-- AAA+ Engineering Empire
|   +-- AAA Prompt Core
|   +-- EVENTO Empire Mobile Control Plane
|   +-- OMNIFORM NEXUS PROFESSOR AI
|   +-- future agents / skills / automation / eval / simulation capabilities
|
+-- EVENTO Venture Portfolio
|   +-- OCTORIMAL / isolated Al-Andalus workspace
|   +-- FamilyOS
|   +-- History-Med-1
|   +-- EVEX product family
|   +-- Aetheris Studios
|   +-- AithenaX
|   +-- future original EVENTO products and IP
|
+-- Client Projects
    +-- dedicated repo or explicitly isolated workspace per client/product
    +-- recorded scope / ownership / license / environments / delivery / maintenance terms
```

## 2. Why this structure matters

The company, products and development machinery have different goals:

- **Company Core** exists to win customers, receive orders, sell projects/services, deliver work and manage the business.
- **Internal Engineering Lab** exists to increase speed, quality, reuse, automation, agent effectiveness, testing, simulation, deployment and technology freshness across every project.
- **EVENTO Ventures** exist to become revenue-producing assets: subscription products, licensed software, games/IP, reusable project packages, digital services or assets that can be sold/adapted for customers.
- **Client Projects** exist to satisfy a defined customer contract and must preserve customer-specific ownership and delivery boundaries.

No internal engineering experiment should consume priority merely because it is technically interesting. It must either improve the company revenue engine or materially accelerate/derisk multiple projects.

## 3. Near-term execution order

### Track A — Finish the EVENTO revenue engine first (P0)

1. Reconcile the authoritative EVENTO web repository and split unrelated THE ROOT film work from `EVENTo0/EVENTo0`.
2. Finish the EVENTO public website/PWA around the actual company offer:
   - services;
   - ready/smart projects catalogue;
   - custom project request/intake;
   - AI-assisted scoping;
   - pricing/quotation path;
   - customer account/project status;
   - payment/deposit/final-payment flow where appropriate;
   - delivery/handoff/revision/acceptance;
   - rating/testimonial/aftercare;
   - Arabic/English, mobile-first presentation.
3. Complete EVENTO Mobile RC6 physical-device acceptance and advance through internal/beta distribution before production stores.
4. Make the mobile Control Plane the owner's read-first command center for repositories, PRs, builds, previews, deployments, project gates and weekly portfolio health.
5. Add sales/demo assets only from projects with real evidence; never market an unverified implementation as complete.

### Track B — Turn the Engineering Lab into measured leverage (P0/P1)

For every new agent, skill, model, automation, MCP/tool integration or workflow:

`discover -> official-source verify -> sandbox/eval -> representative project trial -> regression evidence -> Empire adoption -> optional Core promotion`

Measure whether it improves at least one of:
- cycle time;
- defect rate;
- build/release reliability;
- design/visual quality;
- test coverage;
- security/safety;
- development cost;
- phone-first operability;
- project recovery time;
- revenue time-to-market.

If a capability cannot demonstrate value, keep it experimental or remove it rather than accumulating agent/skill complexity.

### Track C — Productize the closest EVENTO ventures (P1)

Use a common commercialization gate for each venture:

`verified build -> usable demo -> beta users -> pricing/package -> legal/privacy/store readiness -> production -> sales channel -> analytics -> maintenance`

Recommended sequencing is dynamic and evidence-based, but projects with a bounded path to a demonstrable mobile/web beta should usually receive priority over very large game productions when the goal is near-term revenue.

Likely near-term candidates:
- FamilyOS: persistent household workflow + Android artifact + beta + subscription/license experiment.
- EVEX Mobile/product family: reconcile security/toolchain/health-safety gates, then beta/store/subscription readiness.
- History-Med-1: searchable evidence PWA + safe reviewer workflow + clearly non-clinical product positioning until human-review gates are satisfied.

Longer-horizon/high-IP tracks:
- OCTORIMAL / Al-Andalus: continue evidence-gated vertical slices; do not skip real engine/build/play evidence.
- Aetheris Studios: recovery before expansion.

### Track D — Recover and classify the backlog (P2)

Every paused, stale or unlinked idea must end in one of five states:
- `resume-now`;
- `incubate`;
- `package-for-sale`;
- `archive`;
- `needs-owner-decision`.

Do not allow forgotten projects to remain permanently ambiguous.

## 4. Revenue paths EVENTO should support

A project can use one or more paths:

- custom project/service delivery;
- fixed-price ready project/package;
- paid customization of a reusable base;
- SaaS/subscription;
- one-time software/app/license sale;
- white-label licensing;
- maintenance/support subscription;
- game/app sales and in-app/subscription revenue where suitable;
- intellectual-property/project acquisition by another buyer;
- consulting/design/simulation deliverables powered by the internal lab.

Every project entering `beta` should select its intended revenue path and define expected costs, gross margin and maintenance burden before production launch.

## 5. Repository rules for future work

### New EVENTO venture
Create a dedicated repository when implementation starts. Register it in Empire with `portfolioLayer: evento-venture`, parent `evento-core`, lifecycle stage, business model hypothesis and next evidence gate.

### New client project
Create a dedicated private repository or strongly isolated workspace. Register it as `client-project` with non-secret client identifier, ownership/delivery boundary, commercial status and project gate. Never mix client code into EVENTO company source.

### New internal agent/skill/tool
Default to `AAA-prompt-empire` or another explicitly internal capability repository. It does not become a commercial product unless EVENTO deliberately productizes it through a separate decision and product repository.

## 6. Owner dashboard fields

The Mobile Control Plane should eventually show, for each project:
- company layer;
- lifecycle stage;
- evidence state;
- priority;
- authoritative repository;
- latest PR/CI/build/preview;
- current blocker;
- recommended next agent/team;
- technology/security freshness;
- estimated path to next gate;
- revenue model;
- production/commercial readiness;
- owner decision required;
- last weekly audit date.

## 7. Definition of portfolio success

The target is not the largest number of repositories, agents or technologies. Success means EVENTO can repeatedly take an idea or customer request through:

`intake -> design -> architecture -> implementation -> simulation/preview -> test -> device/runtime proof -> delivery/deployment -> payment -> support -> continuous improvement`

with less manual coordination, high evidence quality, current supported technology and a growing library of reusable capabilities and sellable assets.
