# Changelog — Octopuses on the Line

All notable changes to this project are recorded here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] — 2026-08-09 — The front of the game

Seven screenshots of Ragnarok X: Next Generation, and the request to match how
it opens. The pattern in them is a *staged* front end — splash, key-art loader,
title with a service rail, announcement, then character select — where this
game had a progress bar and a menu.

### Added

- **Splash.** The logo alone on black with the build progress underneath and a
  Skip button, then a cross to the loading screen once the world is far enough
  along that there is something to look at.
- **Key art, generated at boot** (`src/92-frontend.js`). No painted assets exist
  in this project and none are going to, so the loading illustration is drawn
  with Canvas2D like the textures and the score: a dusk sky, the old town and
  the Neo-Falak towers in silhouette, Ra's al-Khayt looming behind them, and
  five Line-Walkers strung across the frame at different depths, each rim-lit
  in their discipline's colour. Rendering chibi figures would have looked like
  a bad imitation; a poster of people on ropes is what the game actually is.
  Drawn at the panel's own aspect ratio so a portrait phone crops nothing.
- **Rotating loading tips**, bilingual.
- **Service rail** down the right edge — Notice, Realm, language, Support,
  Reset — with the version stamp under it.
- **Enter pill** as the single primary action, showing which discipline and
  rank you are resuming, over a compact row of secondary buttons.
- **Announcement panel** with three tabbed notices: Fair Play (what this build
  stores and where — nothing leaves the device), The Realm (the five districts
  and the seed), and What's New.
- **Character select rebuilt to the reference layout**: the discipline's name
  above the avatar, the roster as portrait cards down the right edge, the
  tagline and Begin along the bottom, a back button top-left. Portraits are
  generated from each class's own palette, so the card and the character in
  the world agree.

### Fixed

- **The character select screen had no CSS at all** — it had been rendering as
  an unstyled flex column since it was added. It now has a full layout.
- The select camera framed the avatar dead centre at 4.2 m, which on a portrait
  phone cropped it at the knees and put the roster on top of it. Pulled back to
  5.6 m and slid sideways along the camera's own right vector so the character
  stands clear of the cards.
- The title screen's six stacked full-width buttons did not fit a phone and ran
  underneath the service rail. The menu is now a compact wrapping row and the
  title column is inset away from the rail.
- The announcement panel ignored its own `max-height` and grew off-screen — a
  flex child will not shrink below its content without `min-height: 0`.
- The Enter pill was a 38 px touch target, under the 44 px floor, on the one
  control that matters most on that screen. `verify-rpg` now asserts it.

## [1.1.0] — 2026-08-08 — Levels, ranks and the eight Anchors

The progression layer the game was missing. Asked to study Ragnarok X and match
how it paces a player, the honest reading is that RX's loop is not its combat —
it is that every ten seconds something tells you that you got further. This
release builds that loop out of the systems already here rather than bolting a
damage number onto them.

### Added

- **Levels 1–60, nine ranks, and an experience curve.** 120 XP for the first
  level, rising 21% per level. Rank titles run from Rope Novice to Thread
  Sovereign, and the rank — not the level — is what the world reads.
- **Experience flows from what the player already does.** Pearls, lanterns,
  drones and beacons pay on pickup; jobs pay a multiple of their tier; walking
  into a district for the first time pays a discovery bonus. **Crossing a rope
  pays too**, scaled by how much of the span was actually walked — falling off
  in the middle pays nothing. Traversal is the game, so traversal is the grind.
- **The eight Anchors.** Stone posts with a floating shard, standing at real
  tie-off points across the five districts. Each one is gated on a rank. A
  sealed Anchor is visible from across a district with its shard dull and
  ochre; the moment your rank reaches it the shard burns cyan and the post
  joins the fast-travel network. Walking up to a sealed one tells you the level
  it wants. The eighth is Ra's al-Khayt, at level 52.
- **Hero plate on the HUD** — portrait, level badge, rank title and an animated
  experience bar, with a floating `+n XP` on every award. Tapping it opens the
  character sheet.
- **Character sheet** (`Hero` tab): discipline, rank, total experience, the four
  discipline axes, and all eight Anchors listed with their level requirement,
  their lore, and a Travel button on the ones you have earned.
- **Level-up beat** — the full-screen number, the new rank, and a card naming
  each Anchor that just unlocked.
- **Quest hand-off scenes.** Talking to a trader now opens a dialogue with a
  named speaker, a portrait, the job in their own words, what it pays in both
  coin and experience, and Accept / Later. Six speakers written, one per job.
  Declining leaves the work on the board.
- `tools/verify-rpg.js` — 51 assertions across the curve, awarding, the rank
  gates, anchor placement, the HUD, the sheet and the dialogue.

### Fixed

- Anchor positions were first written as literal coordinates, which put stone
  posts in open sand and inside a market stall — a guess against a procedural
  layout is always wrong. Anchors now name a tie-off *site* that the world
  generator computes, plus an offset, and resolve at build time with a spiral
  clearance search so a post never lands inside geometry. `verify-rpg` asserts
  all three failure modes.
- The level-up banner and the toast stack occupied the same band of screen and
  overlapped. The banner now owns the upper third and toasts sit below it.
- The quest dialogue rendered *underneath* the pause panel (z-index 24 against
  the panel's 30). It now outranks the panel, and opening a conversation closes
  any open menu. The probe checks what is painted at the box's centre rather
  than trusting a CSS class, which is what caught this.

## [1.0.4] — 2026-08-08 — Mobile-game controls

Fourth report from the Honor X9d: the player still could not be moved, and the
buttons were "letters, inconsistent with mobile games". Instrumenting the touch
path in an emulated phone showed the joystick logic was sound — a synthetic
drag moved the character 2.07 m — so the fault was ergonomic, not logical: the
stick was a fixed 128 px circle in the corner that required the thumb to land
inside it. On a 6.8" phone held in two hands, the thumb lands where it lands.

### Changed

- **Floating joystick.** Touching anywhere in the left 46% of the screen drops
  the stick centre under the thumb and starts the drag from there. No aiming
  required, and the stick follows if the thumb travels past its 58 px radius.
- **Icon action buttons.** The letter glyphs are gone. There is now a 92 px
  primary **ACT** button with JUMP / GRIP / RUN / DASH / FLOP arranged around
  it as satellites, each with an inline SVG icon and a caption, sized and
  spaced to the same conventions mobile action-RPGs use.
- **Tappable HUD.** The minimap opens the full map, the quest tracker opens
  the mission list, and the purse opens the shop — so every readout on screen
  is something you can press to get a result.
- **Menu routes back into the front-of-game content.** "▶ Watch the intro"
  replays the cinematic and "Change discipline" reopens character select,
  both of which were previously reachable only on a fresh save.

Verified in an emulated Honor X9d viewport: the stick materialises under the
touch point, the move axis reads 0.17 / 0.95 for a diagonal drag, six action
buttons render with six SVG icons, and the character walks on open ground.

## [1.0.3] — 2026-08-08 — The actual cause

Third report from the Honor X9d, this time carrying the diagnostics added in
1.0.2 — which named the bug outright:

```
fps 60          frames 475          frame errors 474
last error  SecurityError: Failed to execute 'getGamepads' on 'Navigator':
            Access to the feature "gamepad" is disallowed by permissions policy.
            at Input.poll
```

### Fixed

- **`navigator.getGamepads()` threw on every frame inside the embed.** The
  gamepad feature is disallowed there by Permissions-Policy, and the call is
  the first statement of the simulation step — so every step aborted before
  anything ran. The game rendered one successful frame and then never
  simulated a single tick, which is why the octopus stayed in the `air` state
  and no input ever had an effect. Performance was never the problem: the
  device was running the render loop at a steady 60fps the whole time. The
  call is now guarded and gamepad polling disables itself permanently after
  the first refusal.

Verified by reproducing the exact environment — `getGamepads` overridden to
throw `SecurityError` — where frame errors go from 474 to 0, the player
transitions from `air` to `ground`, and the jump button moves the octopus.

## [1.0.2] — 2026-08-08 — Phone playability

Reported from an Honor X9d (Adreno 810) running the embedded build: the game
loaded and Play worked, but nothing could be controlled, and there was no way
to turn the sound off.

### Fixed

- **Taps were dropped between simulation frames.** Touch presses were stored as
  a held-state only. A tap that begins and ends inside one frame set and
  cleared the flag before any simulation step read it, so the press was never
  observed. Presses now latch into a separate map that only `endFrame` clears,
  after a step has consumed it. The main loop also no longer calls `endFrame`
  when zero steps ran, which discarded taps and look deltas on high-refresh
  displays for the same reason.
- **The frame loop could die permanently.** An exception inside the loop broke
  the `requestAnimationFrame` chain, leaving a rendered still image, `fps 0`
  and no input — indistinguishable from a frozen game. The frame body is now
  wrapped, errors are recorded and surfaced, and the chain always continues.
- **Frame rate was measured from the clamped simulation delta**, so a device
  running at 3fps reported 15fps — hiding the exact problem the readout exists
  to reveal. It now uses real elapsed time, and reports `frameMs` too.
- **The fragment shader ran a nine-tap PCF shadow lookup even with shadows
  disabled.** At Low quality on a 3.4-megapixel buffer that is tens of millions
  of texture fetches per frame for a result multiplied by zero.
- **Render buffers were unbounded on dense screens.** A tall phone at dpr 3.25
  asked for 1372×2472 — 3.4 megapixels, larger than a 1080p desktop window.
  Buffers are now capped by total pixel count per quality preset, and the
  device pixel ratio is capped harder on touch devices.
- **Quality detection used CSS dimensions.** An embed without a mobile viewport
  tag reports Android's 980px desktop fallback width, which read as "desktop"
  and selected a preset the phone could not sustain. Touch is now the signal,
  and phones start at Low.
- **There was no way to reach Settings on a phone.** The panel opened only via
  `Esc`. A quick bar (menu / mute / diagnostics) now sits above the touch
  overlay, where the camera look area cannot intercept it.

### Added

- One-tap mute, remembered between sessions, plus a Sound row in Settings.
- Diagnostics panel reachable by tapping **i**: fps, frame time, frame count,
  frame errors, last error, quality, render scale, buffer size, touch state,
  iframe, GPU, storage and audio state.
- Automatic quality reduction after three seconds below 20fps, continuing into
  progressive resolution reduction once the lowest preset is reached.
- Touch controls attach on the first touch anywhere, so a failed capability
  check can no longer leave a player with no controls at all.

### Changed

- Larger touch targets (60px → 68px); the camera pulls back on portrait aspect
  ratios, which show far less of the world horizontally.
- Default music volume lowered; the score sits under the game rather than on
  top of it.

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
