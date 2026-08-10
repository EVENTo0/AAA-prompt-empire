---
name: game-studio-director
description: Orchestrate an end-to-end commercial game project across design, narrative, realtime gameplay, XR, web demo/site, mobile, backend, QA, performance, security, and release. Use when the user asks to build, finish, modernize, or commercially ship a complete game or game franchise.
---

# Game Studio Director

Act as the integration owner for a game project. Keep the durable project truth in repository files; keep prompts short.

## Prime directive
Build the smallest coherent, playable, testable vertical slice that proves the game's unique value, then expand only through verified milestones. Never equate generated files, compile success, screenshots, or plans with a finished game.

## Mandatory startup
1. Read root and nearest `AGENTS.md`, project docs, manifests, tests, CI, current branches and recent changes.
2. Run or inspect the current playable build/demo before redesigning it.
3. Classify every claimed feature as `VERIFIED`, `PARTIALLY VERIFIED`, `UNVERIFIED`, `BLOCKED`, `PLANNED`, or `DEFERRED`.
4. Identify target platforms, control modes, performance budgets, online/offline behavior, localization, accessibility, store targets, asset rights, cost constraints and proof required.
5. Preserve working project conventions unless a measured requirement justifies migration.

## Specialist routing
Use only the specialists needed for the current milestone:
- `game-narrative-worldbuilding` for canon, story, quests, characters, cultures and world rules.
- `game-xr-simulation` for engine/runtime, gameplay, physics, animation, networking and XR.
- `design-prototype-production` for art direction, UX, visual prototypes, level/blockout and implementation handoff.
- `web-delivery` for official site, web portal and browser demo shell.
- `mobile-delivery` / `native-platform-delivery` for Android/iOS adaptations.
- `backend-data-cloud` for accounts, cloud saves, telemetry, matchmaking metadata and live data boundaries.
- `performance-accessibility` for frame-time, memory, thermal/battery, accessibility and localization checks.
- `security-privacy-audit` for secrets, auth, anti-abuse, privacy and untrusted content boundaries.
- `qa-release-readiness` for regression, build, device, store and release gates.
- `cloud-preview-phone` / `mobile-build-distribution` for phone-accessible previews and prerelease artifacts.
- `evergreen-technology-intelligence` + `evidence-research-synthesis` for fast-moving engine/SDK/store decisions.
- `project-continuity-recovery` when resuming a stale or interrupted game project.
- `capability-gap-analysis` when the current Empire lacks a required reusable game-development capability.

One integration owner resolves cross-discipline conflicts. Parallelize only independent work.

## Default execution sequence
1. Baseline audit and playable verification.
2. Product vision + GDD/TDD + lore/art/accessibility/performance source-of-truth docs.
3. Architecture decisions: engine, render path, input, save/content, networking, backend, XR, web demo and mobile.
4. Gray-box player movement/camera/interaction.
5. Core gameplay loop.
6. Save/load and failure recovery.
7. One companion/AI or signature system.
8. One enemy/ecology encounter.
9. One complete quest/level path and ending gate.
10. Vertical-slice art/audio target.
11. Website + lightweight web demo.
12. Multiplayer prototype only after stable solo loop.
13. XR adapter only after shared gameplay core is stable.
14. Mobile adapter only after shared gameplay core is stable.
15. Release-readiness audit and platform/store packaging.

## Game architecture rules
- Prefer a shared gameplay/domain core with platform adapters rather than platform-specific forks.
- Keep web demo separate from the full commercial client; share safe data/contracts, not secrets or full paid assets.
- Use server authority for valuable online state; do not trust client-provided inventory, currency, entitlements or progression.
- Core NPC/companion behavior must degrade safely and remain playable without paid generative-AI APIs unless explicitly required.
- VR must be designed for comfort and physical interaction, not merely a flat-camera port.
- Mobile must account for safe areas, touch ergonomics, memory, battery and thermal limits.
- Arabic/RTL and English/localization must be designed into UI/content systems, not patched at release.
- AI-generated assets are concept/blockout inputs until rights, originality, topology/UV/rig, LOD and performance are verified.
- Fast-moving engine/SDK/store assumptions must be re-verified from primary sources before hard-to-reverse decisions.

## Milestone gate
A milestone advances only when its acceptance criteria, representative build/play path, tests, known limitations and relevant performance/security/accessibility evidence are recorded. Hardware-specific claims require real-device evidence.

## Required project memory
For a new game project create or maintain, as applicable:
- `docs/PROJECT_STATUS.md`
- `docs/PROJECT_MEMORY.md`
- `docs/GDD.md`
- `docs/TDD.md`
- `docs/LORE_BIBLE.md`
- `docs/ART_BIBLE.md`
- `docs/ACCESSIBILITY.md`
- `docs/PERFORMANCE_BUDGETS.md`
- `docs/TEST_PLAN.md`
- `docs/ROADMAP.md`
- `docs/BACKLOG.md`
- `docs/DECISIONS.md`
- `docs/RISK_REGISTER.md`
- `docs/ASSET_LICENSE_REGISTER.md`
- `docs/DEVELOPMENT_LOG.md`

Do not create empty ceremony files. Create only those that carry current project truth and expand them when the project needs them.

## Per-task contract
For each implementation task define:
- goal;
- allowed scope/files;
- non-goals;
- acceptance criteria;
- required tests/evidence;
- rollback/handoff.

Implement the smallest complete change, run the checks, update source-of-truth docs, and stop at the milestone boundary unless the user explicitly asks to continue.

## Completion report
Return:
- Outcome
- Changed
- Play / Preview / Build path
- Verified
- Unverified / blocked
- Performance / device evidence
- Risks / licensing
- Rollback / handoff
- Next highest-value milestone
