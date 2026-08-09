# Octopuses on the Line — أخطبوطات على الخيط

**Open Map Beta · v1.4.0**

A browser action-sandbox about an eight-armed octopus balancing along the washing
lines of an old Arabian souq — and climbing, line by line, into the neon sky
towers built above it.

Wobbly-Life-style physical comedy, Arabian traditional architecture that grows
into a futuristic skyline, and one core mechanic: **the line**.

---

## Play it

Open `index.html`. That is the whole install step.

- **Double-click the file** — it runs straight from `file://`, no server, no build.
- Or serve the folder if you prefer: `npx http-server . -p 8080` then visit `http://localhost:8080/`.

Requires a browser with **WebGL 2** (Chrome, Edge, Firefox, Safari 15+).
Nothing is downloaded at runtime — no CDN, no fonts, no analytics, no network calls at all.

### URL options

| Parameter | Effect |
|---|---|
| `?quality=low\|medium\|high\|ultra` | force a quality preset |
| `?hour=6.5` | start at a given time of day (0–24) |
| `?seed=12345` | generate a different city |
| `?test=1` | boot straight into the world and expose the `window.GAME` automation API |

---

## Controls

| Input | Action |
|---|---|
| `W A S D` | Move |
| Mouse | Look (click the canvas to capture the pointer) |
| `Space` | Jump — and leap off a line |
| `Shift` | Sprint — and **zip** down a sloping line |
| `A` / `D` **on a line** | Correct your balance |
| `Q` | **Grip** — tentacles clamp on, balance steadies, you slow down |
| `C` | Suction-climb a wall |
| `E` | Grab / drop / interact (`Shift`+`E` throws) |
| `F` | Ink dash |
| `R` | Go wobbly |
| `M` | Open map |
| `P` | Photo mode (free camera) |
| `L` | Switch language (English / العربية) |
| `F1` | Beta test panel |
| `Esc` | Pause / jobs board |

Gamepad and touch (twin sticks + action pad) are wired up too; touch controls
appear automatically on touch devices.

---

## The map

Five districts on one continuous 500 × 500 m map — no loading between them.

| District | | What it is |
|---|---|---|
| **Al-Suq al-Qadeem** | السوق القديم | Adobe old town: pointed arches, mashrabiya oriels, crenellated roofs, market stalls, a fountain plaza and the great gate |
| **Al-Waha** | الواحة | Oasis — date palms, open water, a bedouin camp and a fire |
| **Khutut al-Hayy** | حي الخيوط | The line quarter: the rope network strung over the souq roofs and up the great minaret |
| **Mina' al-Sama** | ميناء السماء | Sky Harbour — floating platforms 40 m up, mashrabiya railings, and moored dhows that fly |
| **Abraj Neo-Falak** | أبراج نيوفلك | The sky towers: neon bands, holographic calligraphy, mosaic domes on top of glass towers, ring platforms up to 150 m |

The whole thing is generated from one seed at load: ~270 geometry chunks,
~225 colliders, **144 ropes**, 44 inhabitants, 40 pearls.

---

## The line

Every rope in the game is a live verlet chain pinned at both ends. It is not an
animation:

- it **sags under your weight** where you stand, and springs back when you leave;
- it **swings in the wind**, and the wind changes;
- a sloping line can be **zipped** down at speed with `Shift`;
- standing on one runs an **inverted-pendulum balance model** — it wants to tip
  you off, and `A`/`D` are the only thing stopping it;
- `Q` grips: the tentacle tips clamp onto the rope, damping the wobble at the
  cost of your speed;
- past ~66° of lean you lose it, peel off sideways, and go ragdoll.

The balance meter at the bottom of the screen is the readout. Watch it.

---

## Jobs

| Job | | Reward |
|---|---|---|
| Lantern Lighter | مُشعِل الفوانيس | 140 |
| Spice Courier | ساعي البهارات | 180 |
| The Long Line | الخيط الطويل | 240 |
| Drone Roundup | جمع الطائرات | 260 |
| Calligraphy Beacons | منارات الخط | 320 |
| Pearls of the Quarter (40 pearls) | لآلئ الحي | 500 |

Take work from the traders in the souq (`E`). Each one opens a hand-off scene:
the trader says why the job exists, what it pays in dirhams and experience, and
you accept or leave it on the board. Dirhams buy hats (tarbush, ghutra, sky
helmet, Falak crown), skins, and three upgrades that change how the octopus
handles. Progress saves to `localStorage`.

---

## Levels and the Anchors

Levels 1–60 across nine ranks, from **Rope Novice** to **Thread Sovereign**.

Experience comes from what you were going to do anyway: pearls, lanterns,
drones and beacons on pickup, jobs by tier, a bonus the first time you walk
into a district — and **crossing a rope**, scaled by how much of the span you
actually walked. Fall off in the middle and it pays nothing.

Rank is a key. Eight **Anchors** stand at real tie-off points across the map,
each gated on a level:

| | Anchor | | Level |
|---|---|---|---|
| 1 | Souq Anchor | مرساة السوق | 1 |
| 2 | Oasis Anchor | مرساة الواحة | 5 |
| 3 | Minaret Anchor | مرساة المئذنة | 10 |
| 4 | Harbour Anchor | مرساة الميناء | 16 |
| 5 | Ring Anchor | مرساة الحلقات | 24 |
| 6 | Spire Anchor | مرساة البرج | 32 |
| 7 | Deep Anchor | المرساة العميقة | 42 |
| 8 | Ra's al-Khayt | رأس الخيط | 52 |

A sealed Anchor is visible from across its district with its shard dull and
ochre; when your rank reaches it the shard burns cyan and the post joins the
fast-travel network. You can always see where you are not allowed to go yet —
that is the point. The `Hero` tab lists all eight with their lore, and travels
to the ones you have earned.

---

## Assets

There are none — and that is deliberate. Every texture, mesh, and sound is
generated at load time:

- **Textures** — a 2048² atlas of 16 materials drawn with Canvas2D
  (`src/20-texgen.js`): mudbrick plaster, glazed geometric zellij, sand, souq
  paving, palm bark and fronds, dome mosaic, carved mashrabiya lattice, neon,
  brushed metal, holographic grid, lit tower glass, brass, rope.
- **Geometry** — a transform-stack mesh builder (`src/30-geo.js`) with
  primitives for two-centred pointed arches, onion domes, crenellated parapets,
  mashrabiya oriels, date palms and swept tubes.
- **Audio** — synthesised live (`src/85-audio.js`): a Karplus-Strong plucked
  string playing **maqam Hijaz** over a **maqsoum** darbuka pattern in the old
  town, drifting into detuned pads up in the towers.

So the game is self-contained, has zero third-party licence obligations, and the
whole project is a few hundred KB of plain JavaScript.

---

## Engine

Purpose-built, zero dependencies, WebGL 2:

- one texture atlas → the whole city draws with one bound texture;
- two-cascade directional shadow maps with hardware PCF and texel snapping;
- hemisphere ambient + sun + 16 point lights (lanterns, neon, pearls);
- HDR buffer, bright-pass bloom, ACES tonemap, FXAA, vignette, grain;
- height/aerial fog and a procedural sky with sun, stars and drifting cloud;
- keyframed 24-hour day/night cycle driving every one of the above;
- frustum-culled 60 m chunks; fixed-step simulation at 60 Hz.

Four quality presets (Low → Ultra) scale shadows, bloom, light count, render
scale, tentacle tessellation and draw distance. The preset is auto-detected on
first boot and can be changed in Settings.

---

## Layout

```
index.html          entry point + all UI styling
src/00-core.js      math, seeded RNG, noise, frustum
src/10-gl.js        WebGL2 renderer, shaders, shadows, post
src/20-texgen.js    procedural texture atlas
src/30-geo.js       mesh builder + architectural primitives
src/40-physics.js   colliders, spatial hash, verlet, ropes, props
src/45-input.js     keyboard / mouse / touch / gamepad
src/50-world.js     the open map generator
src/55-classes.js   the five Line-Walker disciplines
src/57-landmarks.js the titan, the gates and the Anchor posts
src/58-progress.js  levels, ranks, experience and the Anchor gates
src/60-player.js    the octopus, its tentacles, and the camera
src/70-npc.js       merchants, wanderers, line walkers, drones
src/80-game.js      missions, economy, day/night, draw list, save
src/85-audio.js     synthesised score and SFX
src/90-ui.js        HUD, map, jobs, shop, settings, beta panel
src/92-frontend.js  generated key art and portraits for the front of the game
src/99-main.js      boot, main loop, automation + self-test hooks
tools/verify.js     headless Chromium verification driver
tools/smoke.html    engine smoke scene
docs/               design, architecture and verification records
```

---

## Verifying it yourself

```bash
NODE_PATH=$(npm root -g) node tools/verify-all.js     # 27 assertions: desktop, phone, flow, dist
NODE_PATH=$(npm root -g) node tools/verify-rpg.js     # 74 assertions: levels, anchors, HUD, front end
NODE_PATH=$(npm root -g) node tools/verify.js smoke   # engine scene, day + night
NODE_PATH=$(npm root -g) node tools/verify.js game    # boot, tour 5 districts, self-test
```

Both write screenshots to `tools/shots/` and exit non-zero on failure. The game
run drives the real build in headless Chromium (SwiftShader), tours every
district, switches to night, opens the map, and then runs the in-engine
self-test suite. See `docs/VERIFICATION.md` for the recorded evidence.

In a browser you can drive the same API by hand with `?test=1`:

```js
GAME.report()            // build stats, draw calls, triangles, player state
GAME.selfTest()          // run the assertion suite
GAME.teleport('towers')  // souq | oasis | line | harbour | towers
GAME.setTime(21.5)       // force the hour
GAME.stepFrames(60)      // advance deterministically
```

---

## Known limitations

- Pointed-arch openings on houses are facade detail; the buildings are solid
  volumes and cannot be entered. Play happens on the streets, the roofs and the
  lines.
- Prop physics is translation-only with cosmetic tumble — crates do not rotate
  under real angular dynamics.
- No multiplayer.
- Water is a shaded surface, not a simulation; you cannot swim in the oasis.
- The desert beyond the playable 500 m square is scenery behind an invisible
  boundary.

---

Part of the **AAA+ Engineering Empire** repository. This project adds only new
files under `games/octopuses-on-the-line/` and changes nothing elsewhere.

---

## Single-file build

```bash
node tools/build-standalone.js
```

Inlines all thirteen scripts into `dist/octopuses-on-the-line.html` — one
354 KB file with no external references at all. Email it, drop it on a USB
stick, or double-click it. `dist/embed.html` is the same page as a body
fragment for hosts that supply their own document shell.

The multi-file layout under `src/` stays the source of truth; this is a
distribution step, not a build step the game depends on.
