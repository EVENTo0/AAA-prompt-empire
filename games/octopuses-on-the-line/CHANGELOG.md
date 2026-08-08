# Changelog — Octopuses on the Line

All notable changes to this project are recorded here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-08-08 — Open Map Beta

First playable release. The full map is open and every system is in place; the
"beta" label reflects that balance tuning and content density are still being
iterated on, not that anything is stubbed.

### Added

**Engine**
- Zero-dependency WebGL 2 forward renderer with a single-atlas material system
  (16 materials, one texture bind for the whole city).
- Two-cascade directional shadow maps with hardware PCF, front-face culling in
  the depth pass and light-space texel snapping.
- HDR pipeline: bright pass, separable bloom, ACES tonemap, FXAA, saturation,
  vignette and film grain, with automatic `RGBA8` fallback where float render
  targets are unavailable.
- Procedural sky: gradient, sun disc, drifting fbm cloud, jittered point stars.
- Hemisphere ambient, wrapped-Lambert sun, Blinn specular, 16 point lights,
  height and aerial fog.
- Frustum culling of 60 m geometry chunks against the camera and both cascades.

**Content generation**
- 2048² procedural texture atlas drawn with Canvas2D: mudbrick plaster, glazed
  geometric zellij, sand, souq paving, wood, textile, palm bark and frond, dome
  mosaic, neon, brushed metal, holographic grid, lit tower glass, brass, rope
  and carved mashrabiya lattice.
- Mesh builder with a transform stack and an architectural primitive set:
  two-centred pointed arches with a real intrados, revolved onion domes,
  crenellated parapets, mashrabiya oriels, date palms, pierced-brass lanterns
  and parallel-transported swept tubes.
- Seeded open map across five districts — the old souq, the oasis, the line
  quarter, Sky Harbour and the Neo-Falak towers — built as ~266 chunks with
  ~224 colliders from one integer seed.

**Simulation**
- Y-rotated box colliders in a 3 D spatial hash, with sphere resolution and
  slab raycasts.
- Verlet solver used for tentacles, ragdoll and ropes.
- 144 live rope lines that sag under the player's weight, swing in the wind and
  can be walked, gripped, zipped and jumped from.
- Inverted-pendulum balance model with grip, carry penalty and a fail state.
- Octopus character: eight verlet tentacles whose tips pin to raycast gait
  targets on the ground, to the rope when balancing, and to nothing in the air.
- Ink dash, suction wall-climb, deliberate wobble, grab/carry/throw.
- Third-person camera with collision, speed FOV, trauma shake and a photo mode.

**Game**
- Six jobs with objective markers, a dirham economy, a cosmetics and upgrade
  shop, 40 collectible pearls, and `localStorage` persistence.
- 44 inhabitants: stall merchants who hand out work, souq wanderers, octopuses
  walking the lines overhead, and skittish harbour drones.
- Keyframed 24-hour day/night cycle driving sun position, sky, fog, exposure,
  bloom and every light in the world.
- Fully bilingual English / العربية interface with RTL layout switching.
- Synthesised score — Karplus-Strong plucked string in maqam Hijaz over a
  maqsoum darbuka pattern, drifting to pads in the sky districts — plus a
  complete procedural SFX set.
- HUD with balance meter, minimap, mission tracker and interaction prompts;
  open-map screen with district fast travel; jobs board; shop; settings.
- Beta test panel (`F1`): live render stats, fast travel, time-of-day scrubber,
  free camera and debug actions.
- Keyboard, mouse, gamepad and touch input with auto-detected quality presets.

**Verification**
- In-engine self-test suite (15 assertions) exposed as `GAME.selfTest()`.
- `tools/verify.js` headless Chromium driver producing screenshot evidence and
  a non-zero exit on any page error or failed assertion.
- `tools/smoke.html` engine scene with per-group isolation for bisecting
  rendering defects.

### Fixed during development

- Dome apex produced a zero-length normal, which became `NaN` in the fragment
  shader and painted the whole primitive black; the profile now closes at the
  apex and normals use a clamped central difference. A guard in the mesh writer
  now catches any degenerate normal at the source.
- Distant dunes cracked along chunk edges because the outer ring used a coarser
  subdivision than the inner one, leaving T-junctions; all ground tiles now
  share a subdivision level.
- Falling off a line could immediately re-grab the same line, cancelling the
  fall; the auto-grab cooldown after a balance failure is now 1.4 s.
- Teleport anchors for the plaza, Sky Harbour and the minaret placed the player
  inside the fountain, the kiosk and the minaret shaft respectively.
- The default spawn point landed inside a procedurally placed house; spawn is
  now derived from the plaza anchor.
- The camera could start jammed against geometry; it now probes twelve
  directions and takes the clearest one on spawn and on every fast travel.
- Scene lighting was over-exposed at noon; ambient, sun intensity and base
  texture values were rebalanced.
- Stars rendered as squares because the star field sampled whole grid cells;
  they are now jittered points.

[1.0.0]: https://github.com/EVENTo0/AAA-prompt-empire
