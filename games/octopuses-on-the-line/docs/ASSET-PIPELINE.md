# Asset Pipeline — what to send, and what I do with it

You are producing the story and the film with Veo / Seedance and then
extracting 3D from it. This document is the contract between that work and
this engine, so nothing you make gets wasted.

Read the **Reality check** section before you spend money on 3D extraction.

---

## 1. Where the engine is today

| | |
|---|---|
| Assets on disk | **zero** — every texture, mesh and sound is generated at load |
| Model loader | **none** |
| Skeletal animation | **none** — limbs are rigid segments placed by a transform stack |
| Textures | one procedurally drawn 2048² atlas |
| Distribution | one 410 KB HTML file with no external references |

So importing authored 3D is not a drop-in. It requires three real additions:

1. a **glTF 2.0 parser** (geometry, materials, textures, skins, animations);
2. a **skinned rendering path** — joint matrices, per-vertex weights, a second
   vertex shader;
3. an **animation sampler and blender** — clip playback, cross-fades, and
   blending locomotion against the balance lean.

That is the largest single engine addition the project has had. It is
worth doing, and I can do it — but it must be planned, not discovered
halfway through. It also ends the "one file, no assets" property: the game
becomes a page plus an asset folder.

---

## 2. Reality check on video → 3D

This is the part that will waste your time if nobody says it plainly.

Tools that reconstruct 3D from video or images — photogrammetry, NeRF /
Gaussian splatting, single-image-to-3D — output:

- **dense, unstructured meshes** (often 100k–2M triangles) with no clean
  topology;
- **no skeleton and no rig**, so the result cannot walk, or hold a rope, or
  do anything at all;
- **lighting baked into the texture**, which then fights the game's own sun,
  lanterns and neon — a character lit for a sunset video looks wrong at noon
  in the souq;
- **no separation** between character and background.

A reconstructed mesh is a *statue*. This game needs *actors*.

**So: use the video for what it is genuinely excellent at.**

---

## 3. What actually helps, ranked

### Tier 1 — send these first, they need no pipeline at all

**Concept images.** Stills from your film, or frames you like: each class,
the octopus boss, the souq, the towers, the lighting mood. I can match art
direction procedurally *today* — colours, silhouette proportions, gear
shapes, palette, the whole look — with zero loader work and zero risk.
This gives most of the visual upgrade for none of the cost.

**The story text and script.** Shot list, captions, character names, the
lines of dialogue. Directly usable: it rewrites the cinematic, the class
descriptions and the mission text immediately.

### Tier 2 — the highest-value use of the actual video

**Play your film as the opening.** If you produce a 60–90 second intro, the
cheapest and best-looking integration is to play *that video file* as the
game's opening, instead of the in-engine sequence.

- Format: **MP4, H.264, AAC audio**
- 1920×1080, ≤ 8 Mbps, ≤ 25 MB
- Keep a version with no burnt-in subtitles — I overlay bilingual captions
- I keep the in-engine opening as the fallback for slow connections

This needs about an hour of work, not a new renderer.

### Tier 3 — authored 3D characters

Worth doing once the art direction is locked. **Do not reconstruct these
from video** — commission or generate them as proper rigged characters,
using your film only as the reference.

---

## 4. Model specification

If you send 3D, this is what it must be to work here.

### Format
- **glTF 2.0 binary (`.glb`)**, one file per character, **textures embedded**
- Not FBX, not OBJ, not USDZ, not `.blend`

### Transform
- **1 unit = 1 metre**, **Y-up**, character facing **+Z**
- Origin at the **feet**, centred on X and Z
- Bind pose: **A-pose or T-pose**
- All transforms applied (no non-uniform scale left on nodes)

### Budget

| | Triangles | Textures | File |
|---|---|---|---|
| Player character | 8k – 15k | 2048² | ≤ 6 MB |
| NPC | 1.5k – 4k | 1024² | ≤ 2 MB |
| Ra's al-Khayt (boss) | 20k – 40k | 2048² | ≤ 12 MB |

Five playable classes at 6 MB each is already 30 MB. Budget matters — this
game currently loads in under a second on a phone.

### Rig
- Humanoid, **≤ 64 bones**, single skeleton root
- **≤ 4 weights per vertex**, normalised
- Mixamo bone naming is fine and preferred
- No IK constraints, no drivers, no scripted rigs — baked animation only

### Materials
- **PBR metallic-roughness**, one material per character where possible
- `baseColor` required; `emissive` welcome (the Mage and the neon need it)
- **No baked lighting, no baked shadows, no ambient occlusion burnt into
  baseColor** — the engine lights the character itself
- PNG or JPEG, power-of-two dimensions

### Animation clips
Named exactly, baked at **30 fps**, root motion **off** (the game drives
movement):

```
idle, walk, run, jump, fall, land,
balance_idle, balance_walk, balance_stumble, balance_fall,
grab, climb, attack_1, attack_2, hit, die
```

`balance_*` are the ones this game lives on: arms wide, weight shifting,
recovering from a lean. Those four matter more than the combat clips.

---

## 5. Recommended order

1. **You:** produce the film and the story. Send me **stills + the script**.
2. **Me:** rebuild the art direction, cinematic text, class descriptions and
   palettes to match — no pipeline risk, visible immediately.
3. **You:** send the finished video if you want it as the opening.
4. **Me:** wire it in with bilingual captions and an in-engine fallback.
5. **Both:** lock the character designs from the film.
6. **You:** get five rigged `.glb` characters made to the spec above.
7. **Me:** build the glTF loader, skinning and animation blending, and swap
   the procedural avatars for the authored ones.

Steps 1–4 give a large visible upgrade quickly. Step 6–7 is the big one,
and it should start only after the designs are final — reimporting five
rigged characters because the art direction changed is exactly the waste
this document exists to prevent.

---

## 6. How to send files

Attach them to the conversation, or push them to a branch of this
repository under `games/octopuses-on-the-line/assets/`. For anything over
~25 MB, a repository branch is the reliable route.

Tell me, with each batch: what it is, which class or scene it belongs to,
and whether it is **reference** (I look at it) or **integration** (it ships
in the game).
