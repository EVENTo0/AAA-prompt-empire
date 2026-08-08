# Story & World Bible — Octopuses on the Line

Proposed direction for **v2.0 — "Ra's al-Khayt"**.
This document defines the fiction, the cast and the progression structure the
RPG build hangs off. Nothing here is implemented yet; `v1.0.3` is the physics
sandbox this is designed to grow out of.

---

## 1. Why the title means something

**Octopuses on the Line — أخطبوطات على الخيط**

The phrase carries three meanings at once, and the story earns all three:

1. **Literally** — there are octopuses standing on the ropes above your head.
2. **On the front line** — the Line-Walkers who defend the city.
3. **Hanging in the balance** — the city itself is on the line.

The player should understand all three by the end of the opening.

---

## 2. The city

**Samarā' (سَمَراء)** was built upward, not outward. The desert would not let it
spread, so it climbed: the old souq on the sand, Sky Harbour above it, and the
Neo-Falak towers above that.

Nothing connects those levels but **the Lines (الخيوط)** — a web of rope, cable
and wire that is the city's only road network. Cargo, water, messages and people
all move along them. There are no stairs between the world below and the world
above.

> **Whoever holds the Lines holds Samarā'.**

That single sentence is the premise. It is why balance is the core skill of
every class, and why the game is named after a rope.

---

## 3. The antagonist

Beneath the souq lie the flooded **cisterns (الصهاريج)** that watered Samarā'
before the towers were built. Something in them woke up.

**رأس الخيط — Ra's al-Khayt, "The Head of the Line"**

An ancient ink-mage cephalopod, vast and patient. It is not a beast; it is an
architect with a grievance. It remembers when the water was the city's life and
resents what was built on top of it.

It does not attack Samarā'. **It holds it.** Each of its eight arms grips one of
the city's eight great cables, and it is pulling — slowly, over years — dragging
the sky city down into the sand. The towers already lean.

Its lesser kin patrol the Lines above, keeping them clear for their master and
tangled for everyone else. **That is why there are octopuses on the line.**

This recasts the v1 octopus from player to boss without discarding a single
asset: the tentacle rig, the ink, the balance model and the rope network all
become the antagonist's vocabulary.

---

## 4. The player

You are a **Line-Walker (مَاشِي الخَيط)** — the guild sworn to keep the Lines
open. Human, and a little more than human: every Line-Walker carries a shard of
the old water-magic, which is what lets them keep their footing where nobody
else can.

You are not the chosen one. You are the newest member of a working guild, and
the guild is losing.

### The five disciplines

Every class must cross the same ropes — so every class is defined by **how it
changes the Line**, not just by its damage type. That is the hook that keeps
this game distinct from a generic party RPG.

| Class | | Role | How it changes the Line |
|---|---|---|---|
| **الصيّاد** | **Sayyād** — Archer | Ranged burst | Fires a **grapple line** and creates a temporary rope across any gap |
| **المقاتل** | **Muqātil** — Fighter | Melee sustain | Fastest traversal; can **run** a line at full speed without losing balance |
| **الدِّرع** | **Ad-Dir'** — Tank | Frontline | Heaviest — **sags the rope hardest**, which is a weakness alone and a tool in a party: a sagging line becomes a bridge for shorter allies |
| **الشافي** | **Ash-Shāfī** — Healer | Support | **Steadies allies' balance** at range; the only class that can save a falling teammate |
| **الساحر** | **As-Sāḥir** — Mage | Control / burst | **Conjures new lines** from light where none exist, opening routes nobody else can take |

Weight, balance recovery, traversal speed and reach differ per class and feed
straight into the existing inverted-pendulum model. A Tank genuinely plays
differently on a rope than an Archer — using systems that already exist.

---

## 5. Progression

### The Eight Anchors

Ra's al-Khayt's eight arms are fastened at eight **Anchors (المراسي)** across
the city. Each Anchor is a **dungeon**: a self-contained stage ending in the
arm's grip-point. Cut an Anchor and one arm releases; the city rises slightly,
and a new part of the map becomes reachable.

| # | Anchor | | Level | District |
|---|---|---|---|---|
| 1 | The Cistern Mouth | فم الصهريج | 5 | Old Souq |
| 2 | The Spice Vault | قبو البهارات | 10 | Old Souq |
| 3 | The Palm Well | بئر النخل | 16 | Oasis |
| 4 | The Minaret Spine | عمود المئذنة | 22 | Line Quarter |
| 5 | The Harbour Keel | عارضة الميناء | 30 | Sky Harbour |
| 6 | The Dhow Graveyard | مقبرة السفن | 38 | Sky Harbour |
| 7 | The Falak Crown | تاج فلك | 46 | Neo-Falak |
| 8 | The Leaning Tower | البرج المائل | 55 | Neo-Falak |
| — | **The Cistern** | **الصهريج** | **60** | Beneath everything — Ra's al-Khayt |

Eight arms, eight dungeons. The structure comes from the monster's anatomy,
which is the kind of detail that makes a world feel authored rather than
assembled.

### Levels and gates

- **Level 1–60.** XP from Anchors, Line contracts, and clearing lesser octopuses.
- Each Anchor is **level-gated**: the door reads your level and refuses you.
  This is the "enter the dungeon at the right level" structure requested.
- **Gates (البوابات)** — teleport doors between districts, unlocked by clearing
  the Anchor that powers them. Fast travel is diegetic: cutting an arm frees a
  cable, and a freed cable becomes a transit line.

### Party

Five disciplines that genuinely complement each other on a rope — the Healer
who catches a falling Tank is a real interaction, not a stat check. Designed so
co-op is the natural end state, single-player with a hired guild-mate the
starting point.

---

## 6. The opening

Roughly 70 seconds, rendered in-engine — no video file, consistent with the
project's no-assets rule. Camera moves and title cards over the real world.

1. **Black.** A rope creaks. Wind.
2. **The cistern.** Camera rises through dark water. Eight arms, each gripping
   a cable that vanishes upward. Title card: *"Something under the city is
   pulling."*
3. **The cables tighten.** Cut up the cable line: souq → Sky Harbour → towers.
   The towers lean, visibly.
4. **The souq at dawn.** Ordinary life. A lantern swings. Octopuses watch from
   the lines above, unmoving.
5. **Title:** أخطبوطات على الخيط / **Octopuses on the Line** — and beneath it,
   *Head of the Line*.
6. **Guild hall.** Your five disciplines, silhouetted. → character select.

Skippable, and never shown twice unless asked for from the menu.

---

## 7. What this preserves

Every system already built keeps its job:

| Existing | New role |
|---|---|
| The rope/balance model | The core skill of all five classes |
| Octopus character rig | Ra's al-Khayt and its lesser kin — the enemies |
| Five districts | The world map, gated and unlocked by Anchors |
| 144 rope lines | The road network and the boss's grip |
| Jobs system | Line contracts — the repeatable XP loop |
| Dirham economy | Gear and consumables |
| Day/night cycle | Anchors behave differently at night |
| Pearls | Water-magic shards — the levelling currency |

Nothing is thrown away. The sandbox becomes the traversal layer of an RPG.
