# OCTOPUS — Vertical Slice Architecture & Backlog v0.1

## Goal
Reach the smallest end-to-end playable proof of the OCTOPUS combat identity on a mobile-oriented Unreal project before expanding content or platform complexity.

## G0 — Game DNA
### Genre
Original isometric dark-fantasy ARPG with oceanic/abyssal identity.

### Core differentiators to validate
- Eightfold build system.
- World Pressure risk/reward descent loop.
- Loot that changes ability interactions.
- Mobile-native combat readability and controls.

### Non-goals for first playable
- open world;
- multiplayer/co-op;
- PvP;
- clans;
- seasons;
- monetization/store;
- backend account platform;
- procedural world generation beyond a minimal experiment if needed;
- multiple full classes;
- cinematics beyond minimal framing;
- large quest system.

## G1 — Technical architecture baseline
### Unreal modules
Prefer a small number of coherent modules at first.

`Octopus` game module owns product runtime integration.

Suggested logical boundaries inside the module before extracting plugins/modules:
- Core gameplay framework
- Character/player controller
- Ability system
- Combat/damage
- Enemy AI
- Items/loot
- Interaction
- Save/recovery
- UI/input adapters
- Performance/debug instrumentation

Do not split these into multiple Unreal plugins/modules until compile boundaries, ownership or reuse needs justify it.

### Core data-driven assets
Use Unreal data assets/tables/config where appropriate for:
- abilities;
- item definitions;
- affixes/traits/mutations;
- enemy archetype definitions;
- difficulty/World Pressure tuning;
- UI-facing display metadata.

Do not hardcode balance values into unrelated gameplay classes.

### Ability architecture
Use GAS for:
- attributes;
- gameplay effects;
- cooldowns/resources;
- abilities;
- gameplay tags;
- buffs/debuffs;
- status interactions.

Initial tag families may include:
- `Ability.*`
- `Domain.Fang`
- `Domain.Ink`
- `Domain.Tide`
- `Domain.Abyss`
- `Domain.Shell`
- `Domain.Hunt`
- `Domain.Consume`
- `Domain.Dominion`
- `State.*`
- `Damage.*`
- `Status.*`
- `Item.*`
- `Enemy.*`

Keep naming explicit and testable; do not create a sprawling tag taxonomy before features require it.

### Character foundation
First hero needs:
- movement component integration;
- isometric camera rig;
- touch/controller abstraction through Enhanced Input;
- Ability System Component;
- health + one combat resource;
- basic attack;
- dodge with explicit invulnerability/collision decision recorded;
- death/recovery state.

### Initial abilities
Prototype three abilities chosen to prove different system qualities:
1. **Fang Strike** — immediate directional damage; proves targeting, responsiveness and hit feedback.
2. **Ink Pool** — placed/area damage-over-time status surface; proves persistent gameplay effect and readability.
3. **Tidal Pull** — displacement/control; proves positional combat.

### First Eightfold synergy
`Ink Pool + Tidal Pull → Black Tide`

Acceptance hypothesis:
When Tidal Pull interacts with an active player-created Ink Pool, affected enemies are drawn toward the pool center and receive an observable Ink/Tide interaction distinct from either base ability alone.

Keep the implementation deterministic enough to unit/automation-test the rule separately from VFX.

### Combat damage model v0
Start simple:
- health;
- base damage;
- optional armor/resistance placeholder only if boss/elite needs it;
- crit only if needed to prove HUNT later;
- explicit damage/status tags;
- event path suitable for hit reactions and UI.

Avoid a full production stat economy in G1.

### Enemy AI
#### Normal enemy
One readable melee/chaser archetype:
- acquire player;
- approach;
- telegraph;
- attack;
- recover;
- react to control;
- die/drop loot.

#### Elite
Reuse the normal enemy foundation plus one modifier that changes decision-making, not only health/damage.

#### Boss
One compact boss with approximately three learnable mechanics:
- telegraphed direct attack;
- area denial or movement check;
- phase/pressure mechanic interacting with player positioning.

Boss must expose clean telegraphs on a phone display.

### Loot v0
Implement only enough to prove the design:
- item definition;
- rarity or tier placeholder;
- one affix;
- one trait/mutation capable of changing gameplay;
- drop event;
- pickup;
- inventory/equipment stub;
- item tooltip with concise mobile-readable text.

### Save/recovery v0
Persist at minimum:
- player progression stub;
- equipped item(s);
- selected ability loadout if applicable;
- settings required for input/display;
- recovery behavior after an interrupted session.

Do not build cloud save until the local model is proven and a product requirement exists.

## Mobile-first budgets — initial hypotheses
These are starting engineering budgets and must be replaced by measured device evidence.

### Frame targets
- premium/high tier: target 60 FPS where sustainably achievable;
- supported fallback tier: stable 30 FPS minimum target;
- gameplay correctness must not depend on frame rate.

### Frame-time references
- 60 FPS total frame budget ≈ 16.67 ms;
- 30 FPS total frame budget ≈ 33.33 ms.

### Guardrails
- keep combat readability above particle density;
- cap simultaneous enemies/effects by measured device performance;
- configure Device Profiles/Scalability early;
- record CPU, GPU, memory, loading, battery/thermal observations on representative hardware;
- no claim of mobile-ready without a real device or suitable validated device-farm artifact.

## Repository seed layout
```text
OCTOPUS/
├─ AGENTS.md
├─ README.md
├─ PROJECT_STATUS.md
├─ Config/
├─ Content/
│  ├─ Characters/
│  ├─ Abilities/
│  ├─ AI/
│  ├─ Items/
│  ├─ UI/
│  ├─ VFX/
│  ├─ Audio/
│  ├─ Maps/
│  └─ Data/
├─ Source/
│  └─ Octopus/
├─ Tests/
├─ docs/
│  ├─ GAME_VISION.md
│  ├─ GAME_BIBLE.md
│  ├─ WORLD_BIBLE.md
│  ├─ COMBAT_SPEC.md
│  ├─ ABILITY_SYSTEM.md
│  ├─ LOOT_SYSTEM.md
│  ├─ ARCHITECTURE.md
│  ├─ PERFORMANCE_BUDGETS.md
│  ├─ TEST_PLAN.md
│  ├─ BACKLOG.md
│  ├─ RISK_REGISTER.md
│  └─ ASSET_LICENSE_REGISTER.md
└─ .github/
   ├─ ISSUE_TEMPLATE/
   └─ workflows/
```

## First implementation backlog — ordered
### P0 — Repository + engine proof
1. Create private `EVENTo0/OCTOPUS` repository.
2. Seed repo contract/docs from the approved Empire templates.
3. Create Unreal Engine 5.8 C++ project named `Octopus`.
4. Verify project opens and compiles in the supported local/remote toolchain.
5. Establish Git LFS rules for binary Unreal assets before large binary history accumulates.
6. Add a lightweight CI/static repository validation path that does not pretend to replace Unreal builds.

### P1 — Player control proof
7. Implement isometric camera.
8. Implement Enhanced Input abstraction for touch/controller.
9. Implement locomotion.
10. Implement basic attack.
11. Implement dodge.
12. Add health/resource attributes through GAS.
13. Add a minimal combat debug HUD.

### P2 — Eightfold combat proof
14. Implement `Fang Strike`.
15. Implement `Ink Pool`.
16. Implement `Tidal Pull`.
17. Implement `Black Tide` interaction.
18. Add automation tests for tag/interaction rules where feasible.

### P3 — Enemy proof
19. Implement one normal enemy.
20. Implement one elite modifier.
21. Implement boss arena.
22. Implement one boss with three readable mechanics.

### P4 — Loot/save proof
23. Implement item definition schema.
24. Implement one build-changing item mutation.
25. Implement drop/pickup/inventory stub.
26. Implement local save/recovery.

### P5 — Mobile evidence
27. Configure Android project baseline and required target SDK/toolchain current at execution time.
28. Configure Device Profiles/Scalability.
29. Produce an Android development artifact when build infrastructure is available.
30. Capture representative performance evidence.
31. Record thermal/memory/frame limitations.

## First playable acceptance criteria
A milestone may be called `FIRST_PLAYABLE` only when:
- repository state is source-linked and reproducible enough for the configured environment;
- player can move in an isometric arena;
- attack and dodge execute reliably;
- three abilities execute through the agreed architecture;
- Black Tide interaction is observable and testable;
- normal enemy can engage, attack, react and die;
- elite behavior materially differs from the normal archetype;
- boss can be completed or failed with clear mechanics;
- loot can drop and enter a basic inventory/equipment flow;
- save/recovery has been exercised;
- performance status is recorded as VERIFIED, PARTIALLY VERIFIED, UNVERIFIED or BLOCKED with evidence;
- no unsupported claim is made about Android/iOS/store readiness.

## Claude review checklist
Independent review should challenge:
- unnecessary engine/plugin/module complexity;
- incorrect GAS ownership/lifetime decisions;
- hidden frame-rate dependencies;
- touch input latency or ambiguous gesture mapping;
- excessive VFX obscuring combat;
- hardcoded balance/data coupling;
- unsafe binary/Git practices;
- save corruption/recovery gaps;
- performance claims without device evidence;
- copyrighted imitation rather than original interpretation;
- scope creep beyond the vertical slice.
