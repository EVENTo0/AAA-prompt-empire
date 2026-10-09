# OCTOPUS Unreal Repository Seed

This directory is a **non-production bootstrap template** for the dedicated `EVENTo0/OCTOPUS` repository.

## Evidence status
- Source/config seed: **PARTIALLY VERIFIED** by static review only.
- Unreal compile: **UNVERIFIED** until materialized into a UE 5.8 environment and built with UnrealBuildTool.
- PIE gameplay: **UNVERIFIED**.
- Android build/device performance: **UNVERIFIED**.

Do not claim the project is playable or mobile-ready from these files alone.

## Seed currently proves intent for
- C++ game module;
- Gameplay Ability System module dependencies;
- Enhanced Input dependency;
- `IAbilitySystemInterface` character foundation;
- Ability System Component ownership on the first hero for the solo prototype;
- Health and combat-resource AttributeSet;
- fixed isometric camera foundation;
- camera-relative movement input function.

## Codex materialization task
1. Create/use the dedicated private `EVENTo0/OCTOPUS` repository. Do not use OCTORIMAL.
2. Read Empire and product `AGENTS.md` instructions.
3. Re-verify the installed/current supported Unreal 5.8 build settings before copying version-sensitive target settings.
4. Create a fresh Unreal Engine 5.8 **Games → Blank → C++** project named `Octopus` using the actual installed toolchain.
5. Compare the engine-generated target/module files with this seed; prefer engine-generated current defaults when they differ.
6. Integrate the character and AttributeSet code rather than blindly overwriting generated files.
7. Enable Gameplay Ability System and Enhanced Input through supported project/plugin configuration.
8. Generate project files and compile `Development Editor`.
9. Fix compiler/UHT/UBT issues; document every deviation from the seed.
10. In Editor, create the minimum content assets:
   - `IA_Move` (Axis2D);
   - `IMC_Player`;
   - `BP_OctopusCharacter` if content-facing defaults are needed;
   - compact test map/arena;
   - game mode/default pawn configuration.
11. Bind keyboard/controller first through the same `IA_Move`; add mobile/touch mapping without duplicating movement gameplay logic.
12. Run PIE and record movement + GAS initialization evidence.
13. Add focused automation tests where deterministic behavior is available.
14. Open a PR with compile/test/play evidence and explicit limitations.

## First implementation PR acceptance criteria
- UE project generates and compiles in the configured environment.
- Test map launches in PIE.
- OCTOPUS character is the controlled pawn.
- Character moves camera-relative in an isometric view.
- Ability System Component initializes with the character as owner/avatar for this solo prototype.
- Health/max-health and combat-resource/max-resource are visible through debug inspection or a minimal debug surface.
- No credentials/signing assets are committed.
- No attack/dodge/loot/world systems are added unless required to make this foundation coherent.

## Next after this seed passes
Create the next focused work item for **basic attack + dodge**, followed by the three Eightfold prototype abilities (`Fang Strike`, `Ink Pool`, `Tidal Pull`) and `Black Tide` interaction.
