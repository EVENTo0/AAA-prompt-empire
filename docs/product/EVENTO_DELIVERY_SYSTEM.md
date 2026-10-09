# EVENTO Delivery System — how every project gets built

Status: Active
Owner: EVENTO Project Development
Last updated: 2026-08-11

This is the mechanism the company uses to build **its own products**, the
**projects already in progress**, and the **projects clients will request in
future**. There is one pipeline. A client project is not a special case; it
enters the same stages with the same gates and the same evidence.

## 1. Sequence

The build order is deliberate and each step depends on the one before it.

| Step | What it establishes | State |
| --- | --- | --- |
| 1. Parent company surface | The website, the installable app shell and client accounts — the front door every future request arrives through. | Built, verified locally, not deployed |
| 2. Intake and portal | A client can describe an outcome, receive a tracking reference and follow the stage it is in. | Built and verified against a protocol stub; blocked on the database migration |
| 3. Existing project alignment | Projects already in flight are represented with honest stage and evidence states instead of marketing claims. | Registry linked; per-project evidence still owned by each project repository |
| 4. Future client projects | New requests are routed into the same stages, the same specialists and the same gates. | Mechanism defined here; automation not built |

Step 4 does not need new machinery. It needs steps 1–3 to be real, which is
why they come first.

## 2. The eight stages

These are the client-facing projection of the execution lifecycle in the root
`AGENTS.md` §9. They are published at `/[locale]/method` and are the stage
vocabulary stored on every request, so the public promise and the database
cannot drift apart — a contract test fails the build if they do.

| # | Stage | Gate | Evidence the client receives |
| --- | --- | --- | --- |
| 1 | Intake | — | Tracking reference and the recorded brief |
| 2 | Discovery and brief | Client approves acceptance criteria | Brief with measurable acceptance criteria |
| 3 | Architecture and routing | Architecture review | Architecture outline and decision records |
| 4 | Vertical slice build | — | Traceable branches and reviews |
| 5 | Independent verification | Quality gate | Verification record naming what is *not* proven |
| 6 | Preview and prerelease | Client acceptance on a real device | Protected preview URL or installable build |
| 7 | Release | Protected release approval | Release notes and rollback plan |
| 8 | Operate and learn | — | Operations report and the regression tests added |

A stage is never advanced because work "feels done". It advances when the
gate's evidence exists.

## 3. Routing a request to the right build

`apps/evento-web/data/service-catalog.json` maps each service the company sells
to the Empire skill that owns the work. The mapping is validated against
`registry/skills.json` by a contract test, so a service can never advertise a
capability the organisation has not registered.

| Service | Routes to |
| --- | --- |
| Web platforms and PWAs | `web-delivery` |
| Mobile applications | `mobile-delivery` |
| Backend, data and cloud | `backend-data-cloud` |
| AI systems and agents | `ai-agent-engineering` |
| Games, simulation and XR | `game-xr-simulation` |
| Design and prototyping | `design-prototype-production` |
| Delivery and release operations | `qa-release-readiness` |

Stack selection is **not** fixed by the service. It is decided at stage 3 using
`stack-architecture-router` against the actual requirements — target platforms,
native APIs, offline and realtime behaviour, compliance, operator workflow,
build and signing constraints, and total cost. Reusing the current proven stack
is the default; migrating requires a measurable reason recorded as an ADR.

## 4. Engagement sizes

A client picks the smallest commitment that answers their question.

| Engagement | Duration | Ends with |
| --- | --- | --- |
| Assessment and review | 3–7 days | State report with risks and next step; no build commitment |
| Vertical slice | 2–4 weeks | One complete feature, interface to data, with tests and a preview |
| Product build | 2 months+ | Releasable product with infrastructure, monitoring and ownership handover |
| Operate and maintain | Monthly | Security updates, performance tracking, incident handling |

## 5. Where each project's truth lives

The company surface **mirrors** project state; it never becomes the source of
truth for it.

| Project | Source of truth | Mirrored in |
| --- | --- | --- |
| EVENTO Platform (this site) | `EVENTo0/AAA-prompt-empire` → `apps/evento-web` | Portfolio, registry |
| EVENTO Mobile | `EVENTo0/evento-mobile` | Portfolio, registry |
| OCTORIMAL | `EVENTo0/OCTORIMAL` | Portfolio, registry |
| EVEX Official, AithenaX | Their own backends and repositories | Portfolio, registry |
| Client projects | The client's repository | Portal request record |

`EVENTo0/EVENTo0` is developed on a separate track and is **out of scope for
this repository**. Nothing here reads from or writes to it.

Two consequences:

1. A portfolio entry may only claim what the owning repository's verification
   record supports. `data/portfolio.json` carries an explicit evidence state and
   a note saying what is *not* proven, and a contract test rejects a `VERIFIED`
   claim with no published link.
2. Adding a project to the public site requires it to already exist in
   `apps/mobile-control-plane/data/project-registry.json`. A contract test
   enforces this, so the public site cannot advertise an untracked project.

## 6. Adding a new project to the pipeline

1. Register it in `apps/mobile-control-plane/data/project-registry.json`
   (id, kind, status, priority, repository, platforms, workflows).
2. If it should be publicly visible, add an entry to
   `apps/evento-web/data/portfolio.json` with an honest stage and evidence
   state.
3. Run `npm run test:contracts` in `apps/evento-web` — it fails if the registry
   link, stage or evidence vocabulary is wrong.
4. Route the work with `stack-architecture-router`, then build the first
   vertical slice.
5. Record verification in `docs/verification/` before advancing past stage 5.

## 7. What is not automated yet

Stated plainly so nobody assumes otherwise:

- Stage transitions are manual. Nothing yet moves a request from `intake` to
  `discovery` automatically.
- The portal shows the stage field, not live build evidence. Connecting stages
  to real branch, CI, preview and artifact state is the v0.3 step recorded in
  `apps/evento-web/ARCHITECTURE.md`.
- No notification is sent on a stage change.
- Client requests are not yet written to a live database — the migration is
  source-controlled and awaiting the approval described in ARCHITECTURE.md.
