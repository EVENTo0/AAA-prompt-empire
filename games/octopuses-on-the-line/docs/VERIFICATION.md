# Verification Evidence — Octopuses on the Line v1.0.0

Status labels follow the repository's evidence standard: `VERIFIED`,
`PARTIALLY VERIFIED`, `UNVERIFIED`, `BLOCKED`.

## Environment

| | |
|---|---|
| Runner | Headless Chromium 1194 via Playwright 1.56.1 |
| GPU | ANGLE / SwiftShader (software rasteriser) |
| Renderer reported | `WebGL 2.0 (OpenGL ES 3.0 Chromium)`, max texture 8192 |
| Extensions present | `EXT_color_buffer_float`, `EXT_texture_filter_anisotropic` |
| Node | v22.22.2 |
| Viewport | 1280 × 720 |
| Loaded from | `file://` — the same path a player uses by double-clicking |

## Commands

```bash
NODE_PATH=$(npm root -g) node tools/verify.js smoke
NODE_PATH=$(npm root -g) node tools/verify.js game
```

Both exit non-zero on any uncaught page error, any failed assertion, or a
non-zero `glGetError`.


## Full acceptance pass — v1.1.0 — `VERIFIED`

```bash
NODE_PATH=$(npm root -g) node tools/verify-all.js
```

One command, four suites, every path a player can take.

```
  desktop   6/6     boot, all five districts, night, map, self-test 16/16
  phone     10/10   touch rig, tap latch, quick bar, gamepad refusal, buffer cap
  flow      6/6     cinematic, skip, five disciplines, class stats, entering play
  dist      5/5     single-file bundle boots and self-tests identically
  TOTAL     27/27
RESULT: PASS  (exit 0)
```

The phone suite reproduces the reported device: 420x880 at dpr 3.25, touch
enabled, and `navigator.getGamepads` overridden to throw the same
`SecurityError` the embed's Permissions-Policy produces.

One assertion was corrected rather than the code: "simulation actually steps"
used a fixed 2.5s delay, which under a software rasteriser at ~2fps measures
the rasteriser rather than the simulation. It now waits for the character to
leave the `air` state, with a timeout.

## Result — v1.0.0 — `VERIFIED`

```
BOOT REPORT
  version    1.0.0
  quality    high
  buildMs    742–1052
  chunks     266
  colliders  224
  ropes      144
  npcs       44
  pearls     40
  props      11
  lights     127
  draws      64–95      (after frustum culling)
  tris       80k–170k   (per frame, by district)

SELF TEST   total 16   passed 16   failed 0
PAGE ERRORS none
RESULT      PASS  (exit 0)
```

### Assertions covered

| # | Assertion | Status |
|---|---|---|
| 1 | World produces geometry chunks | VERIFIED |
| 2 | World produces colliders | VERIFIED |
| 3 | Rope network built (≥ 20 ropes) | VERIFIED |
| 4 | Every rope point is finite across all 144 ropes | VERIFIED |
| 5 | 40 pearls placed | VERIFIED |
| 6 | Inhabitants populated | VERIFIED |
| 7 | Octopus dropped from 30 m lands on solid ground, does not fall through | VERIFIED |
| 8 | Falling onto a line catches it | VERIFIED |
| 9 | Octopus stands on a line **and the rope measurably sags** | VERIFIED |
| 10 | An unattended balance fails and throws the octopus off | VERIFIED |
| 11 | A mission starts and completes through the real interaction path | VERIFIED |
| 12 | Economy and shop transact; cosmetic equips; balance arithmetic correct | VERIFIED |
| 13 | Fast travel reaches all five districts with finite positions | VERIFIED |
| 14 | Day/night keyframes stay finite across all 24 hours | VERIFIED |
| 15 | `glGetError` clean after a full frame | VERIFIED |
| 16 | Frames actually submit geometry | VERIFIED |

Assertion 9 is the important one: it samples the rope's midpoint height before
and after the octopus stands on it and requires a measured drop. The core
mechanic is verified numerically, not by eye.

Assertion 8 exists because the original drop test was written over the souq
plaza and kept "failing": the octopus was landing on a washing line instead of
the ground. That was the auto-grab behaving correctly, so the drop test moved
to open deck and the catch became an assertion in its own right.

## Screenshot evidence

Written to `tools/shots/` on every run:

| File | What it shows |
|---|---|
| `smoke-day.png` | Every atlas material, arch, dome, parapet, mashrabiya, palm, lantern and a hanging line under a day sky |
| `smoke-night.png` | The same scene at night: emissive materials, point lights, bloom, stars |
| `game-01-spawn.png` | Spawn on the fountain plaza — market stalls, merchants, paving, shadows |
| `game-02-souq.png` | The old souq with the sky towers visible on the horizon |
| `game-03-oasis.png` | Palms, water and the bedouin camp |
| `game-04-line.png` | The minaret balcony — mashrabiya rails, zellij band, Sky Harbour beyond |
| `game-05-harbour.png` | Sky Harbour deck, with the balance meter live on a line |
| `game-06-towers.png` | Neo-Falak towers and the lit plaza |
| `game-07-night.png` | The towers at night: lit glass, neon, emissive bloom |
| `game-08-map.png` | The open-map screen with district fast travel |

## Defects found and fixed during verification

Each was found by reading the rendered output or the self-test, not by
inspection alone.

| Defect | Detection | Fix |
|---|---|---|
| Dome apex rendered as a black box | Smoke screenshot, isolated by per-group bisect | Zero-length normal at the apex became `NaN` in the shader; profile now closes and normals use a clamped central difference, plus a guard in the mesh writer |
| Scene blown out at noon | Smoke screenshot | Rebalanced ambient, sun intensity and base texture values |
| Stars rendered as squares | Night smoke screenshot | Star field sampled whole grid cells; now jittered points |
| Player received the world object instead of the physics world | Runtime `TypeError` on first game run | Corrected the reference |
| Self-test ran against a paused game | Assertions failing implausibly | `selfTest()` now closes panels and unpauses first |
| Falling off a line instantly re-grabbed it | Assertion 9 failing | Auto-grab cooldown after a balance failure raised to 1.4 s |
| Fast travel dropped the player inside the fountain, the harbour kiosk and the minaret shaft | District screenshots | Anchors moved onto open deck/paving |
| Spawn point was inside a generated house | Spawn screenshot — camera trapped against the octopus | Spawn derived from the plaza anchor |
| Camera could start jammed in geometry | Spawn and line screenshots | Camera now probes twelve directions and takes the clearest |
| Cracks along the distant dunes | Line screenshot horizon | Outer ground ring used a coarser subdivision, leaving T-junctions; all tiles now share one |
| Tentacles stretched across the map on spawn | Spawn screenshot | Gait targets were uninitialised until the first step; the constructor now seeds them, and pinned tips are clamped to the limb's reach |
| Market awnings read as near-black | Spawn screenshot | Tints multiply an already-dark textile texture; tints raised into HDR range |

## What is *not* verified

Stated plainly rather than implied:

- **Frame rate on real hardware — `UNVERIFIED`.** All measurements come from a
  software rasteriser, which says nothing useful about GPU performance. Draw
  calls, triangle counts and collider counts are within the budgets in
  `GAME-DESIGN.md`, but no timing claim is made.
- **Touch controls on a physical device — `UNVERIFIED`.** The touch rig is wired
  to the same action layer as keyboard and gamepad and is exercised by code
  paths that boot, but it has not been driven by real fingers on a real phone.
- **Gamepad input — `UNVERIFIED`.** No pad is available in the headless runner.
- **Audio output — `PARTIALLY VERIFIED`.** The synthesis graph constructs
  without error and is fully guarded, but headless Chromium produces no audible
  output to check, so the score has not been heard.
- **Cross-browser — `PARTIALLY VERIFIED`.** Verified on Chromium. Firefox and
  Safari are expected to work — nothing outside baseline WebGL 2 is used, and
  float render targets degrade gracefully — but they have not been run.
- **Long-session stability — `UNVERIFIED`.** No soak test beyond the ~500-frame
  verification run.
- **Balance difficulty tuning — `UNVERIFIED`.** The model is verified to work in
  both directions (it fails when untended, holds when gripped); whether it is
  *fun* at the current constants needs human playtesting. This is the main
  reason the release is labelled beta.

## Reproducing

```bash
cd games/octopuses-on-the-line
NODE_PATH=$(npm root -g) node tools/verify.js game
echo $?        # 0 on pass
ls tools/shots # screenshot evidence
```

In a browser, open `index.html?test=1` and run `GAME.selfTest()` in the console.
