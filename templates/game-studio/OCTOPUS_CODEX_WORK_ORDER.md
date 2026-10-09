# OCTOPUS — Codex Primary Engineering Work Order

## Role
You are the **primary engineering execution engine** for the OCTOPUS product repository.

ChatGPT Work owns product/game direction, scope, acceptance criteria and decision memory.
Codex owns focused engineering implementation and evidence-producing PR work.
Claude Code is an independent reviewer/secondary engineering cell and must use a separate branch/worktree when writing code.
GitHub is the source of truth.

## Mandatory startup
Before material work:
1. Read the repository `AGENTS.md` and nearest scoped instructions.
2. Read the OCTOPUS project brief and vertical slice plan.
3. Inspect repository state, branch, files, Unreal project metadata, build scripts, tests, CI, LFS config and recent PRs.
4. Verify fast-moving engine/mobile/toolchain assumptions against current primary documentation when the task depends on them.
5. State the current Gate, objective, acceptance criteria, evidence required and non-goals.
6. Select only the existing Empire skills/agents needed; do not create redundant orchestration layers.

## Execution loop
For every task use:
`inspect → plan smallest increment → branch/worktree → implement → compile/test → gameplay/device verify where applicable → correct → document → PR`

Never convert generated files, compile success or unit tests alone into a `PLAYABLE`, `MOBILE READY`, `BETA READY` or `DONE` claim.

## Phase 0 — dedicated repository bootstrap
### Objective
Create and validate the dedicated private product repository `EVENTo0/OCTOPUS` if repository creation authority/tooling is available. If repository creation is not available, produce an exact repository bootstrap handoff and stop before pretending the repo exists.

### Seed requirements
- default protected branch intended as `main`;
- Unreal C++ project name: `Octopus`;
- current baseline: Unreal Engine 5.8, but re-verify before pinning;
- Git LFS patterns established before committing significant binary assets;
- no credentials/signing material in Git;
- product-level `AGENTS.md` adapted from Empire rules;
- source-of-truth docs seeded minimally, not as empty bureaucracy;
- issue/PR workflow enabled;
- CI may validate text/config/governance before Unreal build infrastructure exists, but must not masquerade as an Unreal compile.

### Initial repository files
At minimum create/adapt:
- `AGENTS.md`
- `README.md`
- `PROJECT_STATUS.md`
- `docs/GAME_VISION.md`
- `docs/COMBAT_SPEC.md`
- `docs/ABILITY_SYSTEM.md`
- `docs/ARCHITECTURE.md`
- `docs/PERFORMANCE_BUDGETS.md`
- `docs/TEST_PLAN.md`
- `docs/BACKLOG.md`
- `.gitattributes`
- `.gitignore`

### Phase 0 evidence
Report:
- repository URL;
- default branch;
- seed commit SHA;
- Unreal project generation/open/compile status;
- LFS status;
- configured checks;
- VERIFIED / PARTIALLY VERIFIED / UNVERIFIED / BLOCKED items.

## Phase 1 — Unreal foundation
Create the smallest coherent Unreal C++ foundation required for the first playable.

### Required runtime foundation
- `AOctopusCharacter` or equivalent product-specific character class;
- player controller where required;
- game mode/state only when required by the playable slice;
- isometric camera rig;
- Enhanced Input integration;
- Ability System Component ownership model documented;
- health and one combat-resource attribute set;
- base gameplay tags;
- minimal damage/event path;
- death/recovery path;
- debug-visible state sufficient for development.

### Architecture rule
Keep logical boundaries inside the main game module until a measurable compile/reuse/ownership reason justifies additional modules/plugins.

## Phase 2 — movement, attack and dodge
### Acceptance criteria
- controlled character moves predictably in an isometric arena;
- input path can support touch and controller without duplicating gameplay logic;
- basic attack triggers a gameplay-authoritative damage path;
- dodge has an explicit documented policy for invulnerability/collision/cancel behavior;
- combat behavior remains frame-rate independent;
- debug feedback makes failures diagnosable;
- applicable automation/unit tests exist for deterministic rules;
- local/editor play evidence is recorded.

Do not add complex animation/VFX before the gameplay path is reliable.

## Phase 3 — GAS / Eightfold proof
Implement only the three abilities required to prove the design:

### `Fang Strike`
Purpose: immediate directional damage and hit feedback.

### `Ink Pool`
Purpose: persistent area/status surface with clear ownership and lifetime.

### `Tidal Pull`
Purpose: displacement/control with bounded physics/gameplay behavior.

### `Black Tide`
Rule hypothesis:
When a valid player-created Ink Pool receives the qualifying Tide interaction, create one explicit Black Tide gameplay state/effect. Enemies within the defined interaction region are pulled toward the pool center according to bounded gameplay rules and receive the defined Ink/Tide status or effect.

Requirements:
- use Gameplay Tags to express domain/state relationships;
- separate gameplay rule from VFX;
- avoid tick-heavy brute force when an event/overlap/timed approach is sufficient;
- add deterministic tests for the interaction logic where Unreal automation permits;
- expose tuning through appropriate data/config assets rather than scattering constants.

## Phase 4 — enemy combat proof
### Normal enemy
Implement one melee/chaser archetype with:
`detect/acquire → approach → telegraph → attack → recover → react to control → death → loot event`.

### Elite
Reuse the same foundation plus exactly one modifier that changes positioning or timing decisions. Do not use health inflation as the only difference.

### Boss
Build one compact boss encounter with roughly three learnable mechanics:
1. telegraphed direct threat;
2. movement/area-denial check;
3. phase or pressure mechanic.

Boss telegraphs must remain readable at intended phone display scale.

## Phase 5 — loot and recovery proof
Implement only enough product surface to prove the loop:
- item definition schema;
- one basic affix;
- one trait/mutation that changes gameplay behavior;
- drop event;
- pickup;
- inventory/equipment stub;
- concise mobile-readable tooltip;
- local save/recovery for equipped item/loadout/settings needed by the slice.

No cloud save, economy backend or live-service inventory in this phase.

## Phase 6 — Android-oriented build and measured performance
Before claiming mobile success:
1. Re-verify current Android/Google Play engine/toolchain requirements.
2. Configure Android project/toolchain and Unreal Device Profiles as applicable.
3. Produce a development artifact when build infrastructure/signing prerequisites permit.
4. Test on a representative physical device or validated device-farm path.
5. Capture frame rate/frame times, CPU/GPU bottleneck observations, memory, loading and thermal/battery observations where tooling permits.
6. Record limitations rather than hiding them.

Target hypotheses:
- premium tier: sustainable 60 FPS where achievable;
- supported fallback tier: stable 30 FPS;
- gameplay simulation cannot depend on either target frame rate.

## PR discipline
Each substantive increment uses one focused PR.

PR body must include:
- Outcome
- Issue/task
- Changed
- Architecture decisions
- Tests run
- Playable/test path
- Performance/device evidence where applicable
- Screenshots/video only as supplemental evidence
- Risks/limitations
- Rollback/handoff
- Next highest-value action

Do not enable auto-merge for protected product changes without owner policy explicitly allowing it.

## Working branch examples
- `bootstrap/unreal-foundation`
- `feat/player-combat-foundation`
- `feat/eightfold-black-tide`
- `feat/enemy-combat-proof`
- `feat/loot-save-proof`
- `perf/android-first-playable`

Agents working concurrently must use separate worktrees/branches and independent file ownership where possible.

## Testing minimums
Choose tests by risk, including as applicable:
- Unreal Automation tests for deterministic gameplay rules;
- attribute/effect calculation tests;
- Gameplay Tag interaction tests;
- save serialization/recovery tests;
- AI state-transition checks;
- input mapping sanity checks;
- map smoke test;
- manual PIE gameplay evidence;
- representative Android device evidence before mobile-ready claims.

## Security / repository hygiene
Never commit:
- signing certificates/profiles;
- keystores;
- access tokens;
- `.env` secrets;
- reusable approval codes;
- private user/tester data.

Keep third-party and AI-generated asset provenance/license information in the asset register before shipping.

## Stop conditions
Stop scope expansion and return to the core if any of these fail:
- movement quality;
- attack responsiveness;
- dodge reliability/readability;
- enemy telegraph readability;
- Black Tide gameplay value;
- boss learning loop;
- phone-scale readability;
- current performance budget on the representative target path.

## First command for Codex
Execute the highest-value currently possible action, starting with repository bootstrap.

If the dedicated OCTOPUS repo does not exist and you have authority/tooling to create it, create it and seed the approved minimum files.

If you cannot create repositories from the current environment, do **not** repurpose OCTORIMAL or another product repository. Produce the exact bootstrap command/files needed, mark repository creation `BLOCKED`, and continue only with work that is safe to prepare without falsifying product-repository state.

After bootstrap, move directly to the smallest compileable Unreal foundation PR. Do not brainstorm additional systems unless a current acceptance criterion requires them.
