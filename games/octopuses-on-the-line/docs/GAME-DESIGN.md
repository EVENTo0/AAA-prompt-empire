# Game Design Record — Octopuses on the Line

Version `1.0.0` — Open Map Beta

## Vision and player promise

You are a small octopus in a desert city where everything worth reaching is
strung above the street. The promise is a specific physical sensation: the
moment you step onto a rope, feel it dip under your weight, feel the wobble
start, and have to fight it with your own hands.

Everything else — the souq, the oasis, the flying dhows, the neon towers — is
built to give that one sensation somewhere interesting to happen.

## Pillars

1. **The line is a real object.** Not a rail, not an animation track. It sags,
   swings, and can throw you off. Every mechanic must respect that.
2. **Comedy through physics, not through jokes.** Wobbly Life's lesson: the
   humour comes from a body that is slightly harder to control than you expect.
   The octopus is deliberately floppy.
3. **One continuous ascent, traditional to future.** The player should be able
   to look up from the fountain plaza and see, without a loading screen, the
   thing they will be standing on in twenty minutes.
4. **No asset dependency.** Everything generated. This keeps the project
   licence-clean, tiny, and instantly playable from a file.

## Target platforms and audience

Desktop and mobile browsers with WebGL 2. Players who enjoy physics sandboxes
(Wobbly Life, Human: Fall Flat, Gang Beasts) and open-map exploration. No
prerequisite skill; the difficulty is in the balance, which is legible.

## Core loop

```
leave a rooftop  →  cross a line  →  balance / grip / zip
                                          ↓
                          reach a new district or objective
                                          ↓
              collect pearls, complete a job, earn dirhams
                                          ↓
                     buy cosmetics and handling upgrades
                                          ↓
                        attempt a longer, higher line
```

Session loop: pick a job from a souq trader, travel to the district, complete
the objective, return or continue upward. A full day/night cycle runs every
15 minutes of play and changes both the look and the lantern jobs.

## Mechanics

### Movement (ground)
Camera-relative acceleration with separate ground and air rates, coyote time
(0.13 s) and a jump buffer (0.14 s). Sprint raises top speed from 5.6 to
9.2 m/s. Gravity is −22 m/s², well above real gravity, because a floaty octopus
reads as weightless rather than comic.

### The line
The mechanic the game is named for.

| Element | Model |
|---|---|
| Rope | Verlet chain, both ends pinned, rest length ~4.5 % longer than the span so it hangs in a catenary |
| Load | Standing applies a downward force spread over five neighbouring points — the rope dips where you are |
| Wind | Per-rope phase offset; strength drifts on two sine terms so the district breathes |
| Balance | Inverted pendulum: `tiltVel += sin(tilt) · 6.2 · dt` plus noise, speed and wind terms |
| Correction | `A`/`D` apply −5.2 rad/s² against the lean |
| Grip (`Q`) | Damps tilt velocity hard (e⁻⁷·⁵ᵈᵗ) and bleeds travel speed — safety costs progress |
| Carrying | Multiplies destabilisation by 1.35 |
| Failure | Past 1.15 rad (~66°) you peel off sideways and go ragdoll for 1.2 s |
| Zip | Sprint on a rope sloping more than ~5° adds up to 11 m/s downhill |

The rope end steps you off onto the anchor rather than dropping you.

### Octopus abilities
- **Ink dash** (`F`) — 16.5 m/s burst, 1.5 s cooldown, spawns ink particles.
- **Suction climb** (`C`) — stick to any wall contact and move in the wall plane.
  Jumping off pushes away from the surface.
- **Go wobbly** (`R`) — deliberately floppy: damps movement, softens the body
  spring, lets the tentacles flail. On a line it drops you off.
- **Grab / carry / throw** (`E`, `Shift`+`E`).

### The body
Eight verlet tentacles of eight points each. The tip is pinned to a gait target
when walking, to the rope when balancing, and to nothing when airborne — which
is what makes all three states read differently without any authored animation.
Gait targets are raycast onto real geometry, so the octopus feels the stairs it
is climbing.

The mantle carries a spring-damper tilt driven by acceleration; the `wobble`
parameter softens that spring, which is the entire "floppy" feel.

## Progression and economy

Currency: **dirham**. Pearls are worth 15 each; jobs pay 140–500.

Six jobs, ordered roughly by the skill they demand — lanterns (walking) →
courier (carrying) → the long line (balance) → drones (aerial navigation) →
beacons (high traversal) → pearls (mastery, 40 collectibles).

The shop sells four hats, four skins, and three upgrades that change handling:
`grip`, `dash` (cooldown 1.5 → 0.85 s), and `jump` (9.4 → 11.0 m/s). Cosmetics
are the reward; upgrades are the power curve.

Progress persists to `localStorage` under `octopuses-on-the-line:v1`.

## World and narrative

No cutscenes and no dialogue trees. The setting carries the story: a traditional
quarter that never stopped being lived in, with a future built directly on top
of it and tied to it by rope. The visual argument is made by putting a mosaic
onion dome on the crown of a glass sky tower, mashrabiya screens on a floating
platform, and lateen sails on a craft held up by glowing rings.

Landmarks: Bab al-Suq (the great gate), the Great Minaret, Al-Waha, Mina'
al-Sama, Neo-Falak.

## Accessibility and input

- Full keyboard, gamepad and touch parity; touch UI appears automatically.
- Bilingual English / العربية with correct RTL layout switching, toggled at any
  time with `L`.
- Balance state is communicated redundantly: the meter, the body roll, and a
  colour change at the danger threshold.
- Invert-look toggle; adjustable master/music/SFX volumes.
- Four quality presets, auto-detected, so low-end phones get a playable frame
  rate.
- `prefers-reduced-motion` disables UI transitions.

## Art, audio and technical budgets

| Budget | Target | Measured |
|---|---|---|
| Static geometry | < 300 chunks | 266 |
| Triangles submitted per frame | < 250 k | 80–170 k |
| Draw calls after culling | < 150 | 64–95 |
| Colliders | < 400 | 224 |
| Simulated ropes | ~150 | 144 |
| World build time | < 2 s | ~0.75–1.1 s |
| Texture memory | one 2048² atlas | one 2048² atlas |

Audio is maqam-based: **Hijaz** in the souq and the line quarter, **Nahawand**
at the oasis, and a wide sky scale in the harbour and towers, over a **maqsoum**
darbuka pattern that thins out as you climb.

## Playtest acceptance criteria

1. From spawn, a player can reach a rope and stand on it without instruction.
2. The rope visibly dips under the player — verified numerically, not by eye.
3. An untended balance fails within a few seconds; a gripped one does not.
4. Falling off a line does not immediately re-grab the same line.
5. All five districts are reachable and none traps the camera in geometry.
6. Every job can be started and completed.
7. No console errors across a full district tour, day and night.

All seven are covered by the automated suite in `src/99-main.js` and the driver
in `tools/verify.js`. See `docs/VERIFICATION.md`.

## Known design gaps

- Buildings are solid volumes; arched openings are facade detail only.
- No multiplayer, no swimming, no NPC dialogue.
- Prop physics has no angular dynamics.
