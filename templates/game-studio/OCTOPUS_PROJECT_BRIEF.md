# OCTOPUS / الأخطبوط — AAA+ Project Bootstrap Brief

## Identity
- Working franchise: **OCTOPUS / الأخطبوط**
- First release codename: **OCTOPUS: Abyssborn**
- Genre: original mobile-first isometric Action RPG (ARPG), dark oceanic/abyssal fantasy.
- Primary targets: Android and iOS/iPadOS; architecture must remain portable to PC later.
- Current engine baseline: Unreal Engine 5.8, subject to the Empire evergreen verification rule before release-sensitive decisions.
- Creative rule: use successful ARPGs only to study principles such as readability, buildcraft, loot psychology, boss learning and pacing. Never copy protected characters, names, lore, maps, quests, UI, music, assets, dialogue, source code or distinctive expression.

## Product thesis
Build a responsive ARPG whose identity comes from an **Eightfold System** and a risk/reward **World Pressure** loop rather than from copying any existing franchise.

Core loop:
`EXPLORE → FIGHT → LOOT → DECIDE WHETHER TO DESCEND → EXTRACT → UPGRADE → MODIFY BUILD → CHALLENGE STRONGER CONTENT → REPEAT`

## Player fantasy
The player bears an ancient Eightfold Mark linked to a mysterious abyssal entity. Power comes from combining eight gameplay domains rather than following a single fixed class tree.

### Eightfold System v0.1
1. **FANG** — direct damage, burst, melee aggression.
2. **INK** — poison, concealment, corruption, damage over time.
3. **TIDE** — movement, displacement, crowd control, flow.
4. **ABYSS** — forbidden magic, void damage, high-risk power.
5. **SHELL** — defense, guard, resistance, counterplay.
6. **HUNT** — precision, critical strikes, tracking, execution.
7. **CONSUME** — life/resource drain, sacrifice, sustain.
8. **DOMINION** — summons, control, temporary minions/constructs.

Initial synergy examples to prototype, not freeze:
- INK + TIDE → **Black Tide**: an ink pool becomes a pulling hazard/attack surface.
- CONSUME + FANG → **Predator**: aggressive attacks convert pressure into sustain.
- DOMINION + ABYSS → **Abyssal Summoner**: controlled entities gain risky abyssal mutations.

Every synergy must earn its place through playtesting.

## World Pressure v0.1
As the player chooses to go deeper, increase a bounded mix of:
- enemy complexity and elite modifiers;
- environmental hazards;
- rare encounters;
- loot quality and build-changing rewards;
- boss probability or boss mutation intensity.

Do not reduce the system to enemy-health inflation. The player must repeatedly make a meaningful **extract now vs descend deeper** decision.

## Loot philosophy
Preferred data model:
`BASE ITEM → AFFIXES → TRAIT → MUTATION → EIGHTFOLD SYNERGY`

High-value loot should change behavior, interactions or build decisions. Avoid filling the game with low-impact percentage upgrades that do not alter play.

## Combat pillars
1. **Responsiveness** — movement, attack and dodge inputs must feel immediate.
2. **Readability** — incoming danger must remain readable on a phone-sized display.
3. **Impact** — hit-stop, audio, VFX, camera and animation communicate weight without obscuring play.
4. **Positioning** — movement, spacing and enemy telegraphs matter.
5. **Build expression** — abilities and items create visibly different playstyles.
6. **Learnable bosses** — boss success comes from recognizing mechanics, not exhausting oversized health pools.
7. **Mobile-native input** — no PC control scheme merely compressed onto touch.

## First playable — G3 prototype target
Do not build the full game. Prove one compact combat slice containing:
- one playable hero;
- isometric camera and mobile-oriented input layer;
- locomotion;
- basic attack;
- dodge;
- three initial abilities;
- health/resource loop;
- one normal enemy archetype;
- one elite variant;
- one boss arena and one boss encounter;
- basic loot drop;
- basic inventory/equipment stub;
- one Eightfold synergy;
- save/load or recovery proof;
- Android-oriented build path;
- initial performance capture.

## Vertical Slice expansion target
Only after the first playable feels good, expand toward:
- one complete class/archetype;
- approximately 12 meaningful abilities;
- 25–40 useful items;
- several ability/item interactions;
- 4–6 enemy archetypes;
- elite modifiers;
- two dungeon configurations;
- one major boss encounter;
- compact hub;
- progression;
- tutorial;
- coherent audio/VFX/UI pass;
- mobile quality profiles.

## Current technology baseline
- Unreal Engine 5.8
- C++ for core systems
- Blueprints for rapid iteration and content-facing composition where appropriate
- Gameplay Ability System + Gameplay Tags
- Enhanced Input
- UMG/CommonUI
- StateTree and/or Behavior Trees as justified per AI behavior
- PCG Framework only where procedural content materially improves the slice
- Niagara
- Control Rig / UE animation stack
- MetaSounds initially
- Unreal Insights
- Git + GitHub + Git LFS
- GitHub Actions or suitable CI where engine build infrastructure is available

Do not add middleware, backend, live-service infrastructure, multiplayer, store economy, seasonal systems, analytics stacks, or autonomous services until a Stage Gate demonstrates a real requirement.

## AI operating model
### ChatGPT Work — primary product/production direction
Own:
- Game Bible and decision memory;
- requirements and scope;
- story/world direction;
- system specs and balancing hypotheses;
- research synthesis;
- acceptance criteria;
- production sequencing and review.

### Codex — primary engineering execution engine
Own focused engineering tasks:
`issue → inspect repo → branch/worktree → implement → compile/test → verify → document → PR`

Codex may not self-merge protected branches or claim a playable/device result without current evidence.

### Claude Code — independent second engineering cell
Use for:
- architecture review;
- code review;
- targeted alternate implementation when explicitly isolated;
- failure analysis;
- adversarial review of assumptions.

Codex and Claude Code must not modify the same working tree simultaneously.

## Repository rule
OCTOPUS is an independent product with an independent lifecycle and deliverable, so create a dedicated product repository rather than mixing it into OCTORIMAL or another game repository.

Recommended repository: `EVENTo0/OCTOPUS` (private during development).

## Canonical product repository memory
Create only as needed and keep current:
- `AGENTS.md`
- `PROJECT_STATUS.md`
- `GAME_VISION.md`
- `GAME_BIBLE.md`
- `WORLD_BIBLE.md`
- `COMBAT_SPEC.md`
- `ABILITY_SYSTEM.md`
- `LOOT_SYSTEM.md`
- `ENEMY_BIBLE.md`
- `BOSS_BIBLE.md`
- `ART_BIBLE.md`
- `ARCHITECTURE.md`
- `PERFORMANCE_BUDGETS.md`
- `TEST_PLAN.md`
- `BACKLOG.md`
- `RISK_REGISTER.md`
- `ASSET_LICENSE_REGISTER.md`
- `DEVELOPMENT_LOG.md`

## Quality gate before scope expansion
Do not expand beyond the first playable until evidence can answer YES to the applicable questions:
- Is movement satisfying?
- Is basic attack satisfying?
- Is dodge readable and reliable?
- Can players read incoming attacks?
- Is at least one Eightfold synergy meaningful?
- Does loot change gameplay?
- Does the boss test learned mechanics?
- Does the scene remain readable on a phone display?
- Does the representative target device stay within the current performance budget?

If a core answer is NO, fix the core instead of adding content.

## Authority
Routine analysis, specs, code, tests, documentation and PR preparation may proceed autonomously. Owner approval remains required for protected-branch merge, production deployment, store submission, credential changes, financial operations, signing-sensitive actions and irreversible deletion.
