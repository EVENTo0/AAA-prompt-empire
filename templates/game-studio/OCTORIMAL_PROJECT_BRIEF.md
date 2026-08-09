# OCTORIMAL — Project Bootstrap Brief

## Identity
- Franchise: **OCTORIMAL**
- First game: **OCTORIMAL: Sands of the First Tide** / **أوكتوريمال: رمال المدّ الأول**
- Genre: original Middle Eastern-inspired survival adventure RPG with cinematic narrative, crafting/building, exploration, creatures, gates/world progression and optional 1–4 player co-op.
- Core protagonist: **Nadir / نادر**.
- Core companion: **Rumayl / رُمَيْل**, a sentient sand octopus whose eight arms map to Survival, Water, Sand, Nature, Memory, Machinery, Gravity and Stars.
- Central phenomenon: **The Still Tide / المدّ الساكن** — sand stores and reveals memories of past civilizations.

## Creative rule
Use other successful games only as quality references. Do not copy protected characters, names, maps, UI, dialogue, music, assets, source code, signature story elements or distinctive expression. Build a coherent original Arabic/Middle Eastern historical-future identity without cultural stereotyping or misuse of religion.

## First commercial proof
Do not build the franchise at once. The first vertical slice should prove a complete 20–45 minute journey:
1. Nadir awakens after a sand-tide event.
2. Meets Rumayl.
3. Reaches an oasis.
4. Manages heat/hydration.
5. Gathers palm wood, dates and flint.
6. Crafts a campfire.
7. Survives the first night against one Mirageborn enemy behavior set.
8. Discovers one memory fragment.
9. Activates the Gate of Dawn.
10. Ends with a complete win/loss and save/recovery flow.

## Platform strategy
Treat the engine decision as an ADR, not a permanent prompt assumption. Current preferred evaluation baseline:
- Commercial realtime client: compare Unity/URP/OpenXR against the verified existing repository and requirements; select one engine only.
- PC/Steam first-class target.
- Meta Quest 3 via OpenXR/XR adapter after shared gameplay core is stable.
- Android/iOS via mobile adapter after shared gameplay core is stable.
- Browser demo as a separate lightweight project sharing safe content/data contracts, not the full production client.
- Official bilingual Arabic/English site as a separate web app.

## Multiplayer rule
Prove solo first. Then prototype private 2-player co-op before public matchmaking. Valuable state must be server-authoritative. Test disconnect/reconnect, duplication, latency/loss and version compatibility before expanding player count.

## Required quality dimensions
- core fun and readability;
- cinematic but gameplay-first direction;
- Arabic/RTL and English localization;
- accessibility and VR comfort;
- frame-time/memory/loading budgets per platform;
- save migration/recovery;
- security/privacy and secret hygiene;
- asset/license/AI-origin ledger;
- reproducible builds/tests;
- store descriptions that match implemented features only.

## Repository memory
Create only as needed and keep current:
`PROJECT_STATUS`, `PROJECT_MEMORY`, `GDD`, `TDD`, `LORE_BIBLE`, `ART_BIBLE`, `ACCESSIBILITY`, `PERFORMANCE_BUDGETS`, `TEST_PLAN`, `ROADMAP`, `BACKLOG`, `DECISIONS`, `RISK_REGISTER`, `ASSET_LICENSE_REGISTER`, `DEVELOPMENT_LOG`.

## Initial execution command
```text
Read AGENTS.md and the OCTORIMAL project brief. Run Phase 0 only: verify repository/Git/build/demo/tests/dependencies/secrets/licenses and create a baseline audit. Do not redesign or migrate the project yet. Report what is VERIFIED, UNVERIFIED and BLOCKED, then recommend one next milestone.
```
