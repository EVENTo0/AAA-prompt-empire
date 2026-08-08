---
name: game-xr-simulation
description: Architect, build, profile, and verify games, 2D/3D simulations, VR/XR/spatial experiences, gameplay systems, networking, animation, rendering, and content pipelines. Use for interactive realtime projects.
---

# Game, XR & Simulation

1. Define target devices/platforms, input modes, performance targets, gameplay loop, content scale, networking, persistence, accessibility and distribution constraints.
2. Select engine/framework from platform support, rendering/physics needs, licensing, content pipeline, build infrastructure, team workflow and measured performance.
3. Establish a playable vertical slice early: input → simulation/gameplay → feedback → save/network/content path as applicable.
4. Separate deterministic/core simulation from presentation where it improves testing/networking/replay.
5. Set CPU/GPU/frame-time, memory, loading, battery/thermal and network budgets appropriate to devices.
6. Validate animation/physics/collision/camera/input under representative frame rates and edge conditions.
7. For multiplayer, test authority, reconciliation, latency/loss, abuse/cheat boundaries and soak behavior.
8. For VR/XR, validate comfort, locomotion, interaction reach, frame stability and accessibility on target hardware.
9. Maintain reproducible content/import/build pipelines and avoid irreversible asset transformations without source copies.

Deliver playable/simulated evidence, performance captures, target-device results, known content/runtime risks and build/release path.
