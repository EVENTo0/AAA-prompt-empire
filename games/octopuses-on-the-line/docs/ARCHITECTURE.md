# System Architecture — Octopuses on the Line

Version `1.0.0`

## Context and goals

A single-player 3D browser game that must:

- run from `file://` with no build step, no bundler and no server;
- make no network requests at runtime;
- ship no binary assets;
- hold a stable frame rate from a low-end phone to a desktop GPU;
- be verifiable in headless CI.

Those constraints drive every decision below.

## Constraints and quality attributes

| Attribute | Decision |
|---|---|
| Zero install | Classic `<script>` tags, not ES modules — ES modules are blocked by CORS on `file://` |
| Zero dependencies | Custom WebGL 2 renderer, custom math, custom physics |
| Zero assets | Canvas2D texture generation and procedural mesh building at load |
| Determinism | Seeded `mulberry32` RNG; fixed 60 Hz simulation step |
| Testability | `window.GAME` automation surface plus an in-engine assertion suite |

## Module graph

Load order is the file-name prefix. Each file attaches to the single `OCTO`
global; nothing reaches backwards.

```
00-core      math, RNG, noise, frustum          (no deps)
10-gl        renderer, shaders, meshes          → core
20-texgen    texture atlas                      → core, gl
30-geo       mesh builder, architecture         → core, gl, texgen
40-physics   colliders, verlet, ropes, props    → core
45-input     keyboard/mouse/touch/gamepad       → core
50-world     open map generator                 → core, geo, physics, texgen
60-player    octopus + camera                   → core, geo, physics
70-npc       inhabitants                        → core, geo
80-game      missions, economy, draw list       → everything above
85-audio     synthesised score and SFX          → core
90-ui        DOM overlay                        → core, game
99-main      boot, loop, self-test              → everything
```

## Rendering

Forward renderer, three passes plus post.

1. **Shadow pass** — two cascades (46 m / 175 m radius) into depth textures with
   `COMPARE_REF_TO_TEXTURE`, front-face culled, texel-snapped in light space so
   shadows do not shimmer as the camera moves.
2. **Sky** — fullscreen triangle from `gl_VertexID`, ray direction reconstructed
   from the inverse view-projection. Gradient, sun disc, jittered point stars,
   drifting fbm cloud.
3. **Main pass** — one bound texture for the entire city. Materials are encoded
   per-vertex: `pos3 nrm3 uv2 cell1 col3 emissive1 roughness1` (14 floats).
   The `cell` attribute indexes a 4×4 atlas grid; the fragment shader tiles
   inside a cell with `fract` and restores correct mip selection with
   `textureGrad`, so one draw call can carry sixteen materials.
   Lighting is hemisphere ambient + wrapped Lambert sun + Blinn specular +
   up to 16 point lights, then height/aerial fog.
4. **Post** — bright pass → two separable blurs at quarter resolution → composite
   with ACES tonemap, bloom, FXAA, saturation, vignette and grain.

HDR uses `RGBA16F` when `EXT_color_buffer_float` is present and falls back to
`RGBA8` silently.

### Why an atlas rather than instancing

The world is 266 unique chunk meshes, not thousands of repeated props. Atlas +
merged chunks gives 64–95 draw calls after frustum culling, which is already
under budget. Instancing would add complexity for no measured gain.

## Geometry pipeline

`MeshBuilder` holds a matrix stack and a current material, and writes directly
into interleaved arrays. Primitives include the architectural vocabulary the
setting needs: two-centred pointed arches with a real intrados, revolved onion
domes, crenellated parapets, mashrabiya oriels with corbels, date palms, and
parallel-transported swept tubes for ropes and tentacles.

The world generator writes into a `ChunkedBuilder` keyed on a 60 m grid, so
geometry is spatially partitioned for culling as a side effect of being built.

Dynamic geometry (the octopus, ropes in range, NPCs, particles) is rebuilt into
`DYNAMIC_DRAW` meshes every frame. Static geometry is uploaded once.

## Physics

Not a general engine — exactly the three things the game needs.

**Colliders.** Y-rotated boxes in a 3 D spatial hash (9 m cells, packed integer
keys). Sphere resolution transforms into box-local space, clamps to find the
closest point, and escapes along the shallowest axis when the centre is inside.
The character is two spheres approximating a capsule, resolved three times per
frame. Raycasts use a slab test and serve camera collision, gait targeting and
ground queries.

**Verlet.** Points plus distance constraints. Tentacles add slack two-joint
"muscle" links so limbs bow instead of folding flat.

**Ropes.** A verlet chain pinned at both ends with a rest length longer than the
span. Load, wind and the balance model all act on it. Ropes further than 190 m
from the player skip simulation; ropes further than the quality preset's rope
distance skip meshing.

## Simulation loop

Fixed 60 Hz steps with an accumulator, capped at five steps per frame so a
stalled tab cannot launch the octopus across the map. Rendering is decoupled and
runs once per animation frame.

```
poll input → game.update(1/60) × n → ui.update → game.render(dt)
```

`game.update` order matters: environment → ropes → player → camera → NPCs →
props → particles → collectibles → interaction → missions.

## Data and persistence

One `localStorage` key, `octopuses-on-the-line:v1`, holding dirhams, mission
progress, collected pearl ids, lit lanterns, owned and equipped cosmetics,
upgrades, language and quality. Reads and writes are wrapped in `try/catch`:
private-browsing quota failures degrade to a non-persistent session rather than
breaking play.

No accounts, no telemetry, no network. Nothing leaves the machine.

## Security and privacy

The attack surface is close to nil: no remote content is fetched, no user input
is evaluated, no third-party code is loaded. The one piece of untrusted input is
the saved game, which is parsed with `JSON.parse` inside a `try/catch` and only
read for scalars, booleans and id arrays — a corrupted save degrades to defaults
instead of throwing. URL parameters are parsed to numbers or matched against
fixed allow-lists.

## Performance strategy

- Frustum-cull 60 m chunks against the camera and each shadow cascade.
- Distance-gate rope simulation, rope meshing, NPC meshing and prop drawing
  independently, each on its own budget.
- Pick the 16 most relevant point lights per frame by distance/intensity score.
- Quality presets scale render scale, shadow map size, bloom, light count,
  tentacle tessellation, particle cap and draw distance.
- Reuse `MeshBuilder` instances between frames rather than reallocating.

## Failure handling

| Failure | Behaviour |
|---|---|
| No WebGL 2 | Friendly full-screen message naming the cause |
| World build throws | Error surfaced on screen with the stack, boot flagged |
| `localStorage` unavailable | Session runs, progress simply does not persist |
| `AudioContext` blocked | Audio disables itself; the game is unaffected |
| An SFX throws | Caught per call — sound must never take down a frame |
| Player falls out of the world | Respawn at the last ground checkpoint |
| Frame stall | Step accumulator capped at five iterations |

## Verification hooks

`?test=1` exposes `window.GAME` with `report`, `stepFrames`, `teleport`,
`setTime`, `openMap`, `press`, `hold` and `selfTest`. `tools/verify.js` drives
these in headless Chromium under SwiftShader, captures screenshots, and fails
the process on any page error or failed assertion.

## Open decisions

- Whether interiors are worth the collision complexity in a future version.
- Whether rope-to-rope collision (currently absent) would add or muddy the feel.
- Angular dynamics for props, if crate puzzles are ever built on them.
