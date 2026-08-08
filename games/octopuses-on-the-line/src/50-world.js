/* =====================================================================
 * OCTOPUSES ON THE LINE — 50-world.js
 *
 * Procedural open map. One seed builds the whole city:
 *
 *   Al-Suq al-Qadeem  the old souq   ground level, adobe + arches
 *   Al-Waha           the oasis      palms, water, bedouin camp
 *   Khutut al-Hayy    the line quarter  rope network over the rooftops
 *   Mina' al-Sama     sky harbour    floating platforms, flying dhows
 *   Abraj Neo-Falak   the sky towers neon, holograms, high cables
 *
 * Geometry is written into 60m chunks so the renderer can frustum-cull
 * it; collision goes into the physics spatial hash in parallel.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var CELL = OCTO.CELL, TAU = OCTO.TAU;
  var U = OCTO.util, clamp = U.clamp;
  var Physics = OCTO.Physics;

  var CHUNK = 60;
  var MAP_EXTENT = 250;      // playable half-size
  var SAND_EXTENT = 460;     // visual desert half-size

  var DISTRICTS = {
    souq:    { id: 'souq',    en: 'The Old Souq',   ar: 'السوق القديم',  center: { x: 0, y: 0, z: 30 },      color: '#d8a860' },
    oasis:   { id: 'oasis',   en: 'The Oasis',      ar: 'الواحة',        center: { x: -150, y: 0, z: 60 },   color: '#4fbf8f' },
    line:    { id: 'line',    en: 'The Line Quarter', ar: 'حي الخيوط',   center: { x: 10, y: 14, z: -10 },   color: '#e0d0a0' },
    harbour: { id: 'harbour', en: "Sky Harbour",    ar: 'ميناء السماء',  color: '#6fd0e0', center: { x: 130, y: 34, z: -30 } },
    towers:  { id: 'towers',  en: 'Neo-Falak Towers', ar: 'أبراج نيوفلك', center: { x: 10, y: 0, z: -180 },  color: '#c07ff0' }
  };

  /* ---------------------------------------------------------- utilities */

  function ChunkedBuilder() {
    this.chunks = new Map();
  }
  ChunkedBuilder.prototype.at = function (x, z) {
    var key = Math.floor(x / CHUNK) + ':' + Math.floor(z / CHUNK);
    var mb = this.chunks.get(key);
    if (!mb) { mb = new OCTO.MeshBuilder(); this.chunks.set(key, mb); }
    return mb;
  };
  ChunkedBuilder.prototype.finalize = function (renderer, out, opts) {
    opts = opts || {};
    this.chunks.forEach(function (mb) {
      if (mb.isEmpty()) return;
      var d = mb.build();
      var mesh = renderer.createMesh(d.verts, d.indices);
      out.push({ mesh: mesh, model: OCTO.M4.create(), wind: opts.wind || 0 });
    });
  };

  /* ------------------------------------------------------------ palette */

  var ADOBE_TINTS = [
    [1.00, 0.96, 0.90], [0.94, 0.88, 0.80], [1.00, 0.90, 0.74],
    [0.88, 0.82, 0.74], [1.00, 0.94, 0.84], [0.92, 0.86, 0.72]
  ];
  var DOOR_TINTS = [
    [0.32, 0.52, 0.62], [0.42, 0.34, 0.60], [0.60, 0.30, 0.28], [0.28, 0.46, 0.40]
  ];
  var NEON_COLORS = [
    [0.35, 1.00, 1.00], [1.00, 0.42, 0.78], [1.00, 0.78, 0.30],
    [0.55, 0.60, 1.00], [0.40, 1.00, 0.70]
  ];

  /* ------------------------------------------------------------ builder */

  function buildWorld(renderer, opts) {
    opts = opts || {};
    var seed = opts.seed === undefined ? 20260807 : opts.seed;
    var rng = new OCTO.Rng(seed);
    var noise = new OCTO.Noise(seed ^ 0x9e3779b9);
    var quality = opts.quality || {};

    var physics = new Physics.World(9);
    var cb = new ChunkedBuilder();
    var foliage = new ChunkedBuilder();     // wind-animated
    var world = {
      physics: physics,
      items: [],
      foliageItems: [],
      water: [],
      ropes: [],
      lights: [],
      props: [],
      pearls: [],
      anchors: {},
      districts: DISTRICTS,
      seed: seed,
      roofs: [],           // rope anchor candidates {x,y,z,district}
      landmarks: [],
      noise: noise,
      groundHeight: function (x, z) { return groundHeight(noise, x, z); }
    };

    buildGround(cb, physics, world, noise, rng);
    buildSouq(cb, foliage, physics, world, rng);
    buildOasis(cb, foliage, physics, world, rng, noise);
    buildTowers(cb, physics, world, rng);
    buildHarbour(cb, physics, world, rng);
    buildRopeNetwork(world, rng);
    buildCollectibles(world, rng);

    cb.finalize(renderer, world.items);
    foliage.finalize(renderer, world.foliageItems, { wind: 0.028 });
    physics.build();

    // Spawn on the open paving of the fountain plaza, facing the fountain.
    // (A hand-picked coordinate landed inside a generated house.)
    var sp = world.anchors.plaza;
    var fx = DISTRICTS.souq.center.x - sp.x, fz = DISTRICTS.souq.center.z - sp.z;
    world.spawn = { x: sp.x, y: sp.y + 0.6, z: sp.z, yaw: Math.atan2(fx, fz) };
    return world;
  }

  /* ------------------------------------------------------------- ground */

  /** Gentle dunes. Kept shallow inside the play area so the flat collider
   *  never leaves the octopus visibly hovering. */
  function groundHeight(noise, x, z) {
    var d = Math.max(Math.abs(x), Math.abs(z));
    var inner = noise.fbm(x * 0.006, z * 0.006, 4) - 0.5;    // -0.5..0.5
    var h = inner * 0.42 - 0.12;                              // ~ -0.33..0.09
    if (d > MAP_EXTENT) {
      // beyond the playable edge the dunes are allowed to get dramatic
      var t = clamp((d - MAP_EXTENT) / 170, 0, 1);
      var big = noise.ridged(x * 0.0038, z * 0.0038, 4);
      h += big * 18 * t * t;
    }
    return Math.min(h, 0);
  }

  function buildGround(cb, physics, world, noise, rng) {
    var tiles = Math.ceil((SAND_EXTENT * 2) / CHUNK);
    var half = SAND_EXTENT;
    for (var iz = 0; iz < tiles; iz++) {
      for (var ix = 0; ix < tiles; ix++) {
        var x0 = -half + ix * CHUNK, z0 = -half + iz * CHUNK;
        var cxm = x0 + CHUNK / 2, czm = z0 + CHUNK / 2;
        var mb = cb.at(cxm, czm);
        // Every tile uses the same subdivision: heightFn is a pure function of
        // world position, so matching vertex counts means seamless edges. A
        // coarser outer ring left T-junction cracks along the horizon.
        var seg = 10;
        mb.mat({ cell: CELL.SAND, color: [1, 1, 1], roughness: 1, uvScale: 0.055, emissive: 0 });
        mb.push().translate(cxm, 0, czm).plane(CHUNK, CHUNK, seg, {
          heightFn: function (lx, lz) { return groundHeight(noise, cxm + lx, czm + lz); }
        }).pop();
      }
    }
    // one big flat collider under the whole playable area
    physics.addBox(0, -6, 0, SAND_EXTENT, 6, SAND_EXTENT, 0, 'sand');
    // soft boundary so players cannot walk into the untextured void
    var W = MAP_EXTENT + 30;
    physics.addBox(0, 40, W, W, 60, 3, 0, 'bounds');
    physics.addBox(0, 40, -W, W, 60, 3, 0, 'bounds');
    physics.addBox(W, 40, 0, 3, 60, W, 0, 'bounds');
    physics.addBox(-W, 40, 0, 3, 60, W, 0, 'bounds');
  }

  /* --------------------------------------------------------------- souq */

  function buildSouq(cb, foliage, physics, world, rng) {
    var CELLSZ = 24;
    var GRID = 7;                 // 7x7 cells => ~168m across
    var originX = -GRID * CELLSZ / 2 + CELLSZ / 2;
    var originZ = DISTRICTS.souq.center.z - GRID * CELLSZ / 2 + CELLSZ / 2;

    // central plaza cell is left open for the fountain and the great gate
    var plazaI = 3, plazaJ = 3;

    for (var j = 0; j < GRID; j++) {
      for (var i = 0; i < GRID; i++) {
        if (i === plazaI && j === plazaJ) continue;
        if (rng.next() < 0.12) continue;                     // little squares
        var cx = originX + i * CELLSZ;
        var cz = originZ + j * CELLSZ;
        var jitterX = (rng.next() - 0.5) * 2.4;
        var jitterZ = (rng.next() - 0.5) * 2.4;
        var w = 12 + rng.next() * 5;
        var d = 12 + rng.next() * 5;
        var distToPlaza = Math.sqrt((i - plazaI) * (i - plazaI) + (j - plazaJ) * (j - plazaJ));
        var levels = 1 + Math.floor(rng.next() * 3);
        if (distToPlaza < 1.6) levels = 2 + Math.floor(rng.next() * 2);
        var h = 3.6 * levels + rng.next() * 1.4;
        buildHouse(cb, physics, world, rng, cx + jitterX, cz + jitterZ, w, d, h, {
          faceZ: rng.next() < 0.5,
          dome: rng.next() < 0.14,
          district: 'souq'
        });
      }
    }

    buildPlaza(cb, foliage, physics, world, rng);
    buildGreatMosque(cb, physics, world, rng);
    buildSouqStalls(cb, physics, world, rng);
  }

  /** One adobe house: arched ground floor, mashrabiya, parapet, roof props. */
  function buildHouse(cb, physics, world, rng, x, z, w, d, h, o) {
    o = o || {};
    var mb = cb.at(x, z);
    var tint = rng.pick(ADOBE_TINTS);
    var rot = (rng.next() - 0.5) * 0.1;

    mb.push().translate(x, 0, z).rotateY(rot);
    mb.mat({ cell: CELL.ADOBE, color: tint, roughness: 0.95, uvScale: 0.30, emissive: 0 });

    // body
    mb.boxUp(w, h, d);

    // arched loggia on the street face
    var openW = Math.min(3.0, w * 0.28);
    var openH = 3.0;
    var faceZ = o.faceZ !== false;
    mb.push();
    if (faceZ) mb.translate(0, 0, d / 2 + 0.14); else mb.rotateY(Math.PI / 2).translate(0, 0, w / 2 + 0.14);
    mb.mat({ cell: CELL.ADOBE, color: tint, uvScale: 0.30 });
    mb.archWall(faceZ ? w : d, 4.0, 0.30, openW, openH);
    mb.pop();

    // recessed door inside the arch
    mb.mat({ cell: CELL.WOOD, color: rng.pick(DOOR_TINTS), roughness: 0.8, uvScale: 0.8 });
    mb.push();
    if (faceZ) mb.translate(0, 0, d / 2 - 0.02); else mb.rotateY(Math.PI / 2).translate(0, 0, w / 2 - 0.02);
    mb.translate(0, openH * 0.42, 0).box(openW * 0.82, openH * 0.84, 0.14);
    mb.pop();

    // upper-floor mashrabiya bays
    var bays = 1 + Math.floor(rng.next() * 2);
    for (var b = 0; b < bays; b++) {
      var side = rng.next() < 0.5 ? 1 : -1;
      var along = (rng.next() - 0.5) * (faceZ ? w * 0.5 : d * 0.5);
      var by = 4.4 + Math.floor(rng.next() * Math.max(1, (h - 5.5) / 3.4)) * 3.4;
      if (by + 2.4 > h - 0.3) by = Math.max(4.4, h - 3.0);
      mb.push();
      if (faceZ) mb.translate(along, by, side * (d / 2)); else mb.translate(side * (w / 2), by, along).rotateY(Math.PI / 2);
      if (side < 0) mb.rotateY(Math.PI);
      mb.mashrabiya(2.4, 2.2, 0.75);
      mb.pop();
    }

    // small windows
    mb.mat({ cell: CELL.MASHRABIYA, color: [1, 1, 1], roughness: 0.9, uvScale: 0.9, emissive: 0 });
    var nWin = 2 + Math.floor(rng.next() * 3);
    for (var k = 0; k < nWin; k++) {
      var wy = 4.2 + rng.next() * Math.max(0.5, h - 6);
      var wside = rng.next() < 0.5 ? 1 : -1;
      var wAlong = (rng.next() - 0.5) * w * 0.62;
      mb.push().translate(wAlong, wy, wside * (d / 2 + 0.06)).box(1.0, 1.3, 0.12).pop();
    }

    // roof
    mb.mat({ cell: CELL.ADOBE, color: tint, roughness: 0.95, uvScale: 0.30 });
    mb.push().translate(0, h, 0).parapet(w, d, 0.85, 0.55).pop();
    mb.push().translate(0, h - 0.05, 0).boxUp(w - 0.4, 0.16, d - 0.4).pop();

    if (o.dome) {
      mb.mat({ cell: CELL.MOSAIC, color: [1, 1, 1], roughness: 0.35, uvScale: 0.45 });
      var dr = Math.min(w, d) * 0.28;
      mb.push().translate(0, h + 0.1, 0).dome(dr, dr * 1.5, 18, 12).pop();
    }

    // roof clutter: jars, crates, a lantern pole
    mb.mat({ cell: CELL.NONE, color: [0.55, 0.36, 0.24], roughness: 0.9, emissive: 0 });
    var jars = Math.floor(rng.next() * 3);
    for (var q = 0; q < jars; q++) {
      var jx = (rng.next() - 0.5) * (w - 2.5), jz = (rng.next() - 0.5) * (d - 2.5);
      mb.push().translate(jx, h + 0.5, jz).sphere(0.34, 9, 6, { yScale: 1.25 }).pop();
      mb.push().translate(jx, h + 0.92, jz).cylinder(0.13, 0.17, 0.22, 8).pop();
    }

    mb.pop();

    // collision: body + roof slab (the parapet is decorative)
    physics.addBoxUp(x, 0, z, w, h, d, rot, 'building');

    // lantern on a roof pole, and a rope anchor post
    var lx = x + (rng.next() - 0.5) * (w - 3);
    var lz = z + (rng.next() - 0.5) * (d - 3);
    if (rng.next() < 0.55) {
      var mbl = cb.at(lx, lz);
      mbl.mat({ cell: CELL.WOOD, color: [0.6, 0.44, 0.3], roughness: 0.9, uvScale: 1, emissive: 0 });
      mbl.push().translate(lx, h, lz).boxUp(0.16, 2.3, 0.16).pop();
      mbl.push().translate(lx, h + 2.3, lz).lantern(0.75).pop();
      world.lights.push({
        pos: { x: lx, y: h + 2.15, z: lz },
        color: [1.0, 0.62, 0.26], radius: 15, intensity: 0, night: 3.0, kind: 'lantern'
      });
    }

    world.roofs.push({ x: x, y: h + 0.15, z: z, w: w, d: d, district: o.district || 'souq' });
  }

  /** The fountain plaza with the great gate. */
  function buildPlaza(cb, foliage, physics, world, rng) {
    var px = 0, pz = DISTRICTS.souq.center.z;
    var mb = cb.at(px, pz);

    // paved ground
    mb.mat({ cell: CELL.STONE, color: [1, 1, 1], roughness: 0.9, uvScale: 0.16, emissive: 0 });
    mb.push().translate(px, 0.06, pz).plane(30, 30, 4).pop();
    physics.addBox(px, 0.03, pz, 15, 0.06, 15, 0, 'paving');

    // fountain: octagonal basin with a tiled rim
    mb.mat({ cell: CELL.TILE, color: [1, 1, 1], roughness: 0.4, uvScale: 0.5 });
    mb.push().translate(px, 0.1, pz).cylinder(4.2, 4.2, 0.9, 8).pop();
    mb.mat({ cell: CELL.STONE, color: [1, 1, 1], roughness: 0.85, uvScale: 0.4 });
    mb.push().translate(px, 0.55, pz).cylinder(3.7, 3.7, 0.5, 8).pop();
    mb.mat({ cell: CELL.TILE, color: [1, 1, 1], roughness: 0.35, uvScale: 0.6 });
    mb.push().translate(px, 0.9, pz).cylinder(0.7, 0.5, 1.6, 8).pop();
    mb.push().translate(px, 1.8, pz).cylinder(1.5, 1.5, 0.22, 8).pop();
    mb.push().translate(px, 2.3, pz).cylinder(0.34, 0.24, 1.0, 8).pop();
    mb.push().translate(px, 2.95, pz).sphere(0.34, 10, 7).pop();
    physics.addBox(px, 0.45, pz, 4.2, 0.9, 4.2, 0, 'fountain');
    physics.addBox(px, 1.6, pz, 0.8, 2.0, 0.8, 0, 'fountain');

    // water surface
    var wmb = new OCTO.MeshBuilder();
    wmb.mat({ cell: CELL.NONE, color: [1, 1, 1], roughness: 0.05 });
    wmb.push().translate(px, 0.86, pz).cylinder(3.6, 3.6, 0.02, 24, { capBottom: false }).pop();
    var wd = wmb.build();
    world.water.push({
      meshData: wd, model: OCTO.M4.create(),
      deep: [0.05, 0.20, 0.24], shallow: [0.25, 0.62, 0.62]
    });

    // the great gate — a monumental pointed arch marking the souq entrance
    var gz = pz + 15;
    var gmb = cb.at(px, gz);
    gmb.mat({ cell: CELL.ADOBE, color: [1.0, 0.94, 0.84], roughness: 0.9, uvScale: 0.3, emissive: 0 });
    gmb.push().translate(px, 0, gz);
    gmb.archWall(20, 13, 2.6, 7.0, 9.5, { seg: 20 });
    gmb.push().translate(0, 13, 0).parapet(20, 2.6, 1.4, 0.7).pop();
    gmb.mat({ cell: CELL.TILE, color: [1, 1, 1], roughness: 0.35, uvScale: 0.5 });
    gmb.push().translate(0, 10.4, 1.34).box(16, 1.6, 0.2).pop();
    gmb.push().translate(0, 10.4, -1.34).box(16, 1.6, 0.2).pop();
    // flanking towers
    gmb.mat({ cell: CELL.ADOBE, color: [1.0, 0.92, 0.80], uvScale: 0.3 });
    for (var s = -1; s <= 1; s += 2) {
      gmb.push().translate(s * 9.6, 0, 0).cylinder(2.0, 1.7, 16, 12).translate(0, 8, 0).pop();
      gmb.push().translate(s * 9.6, 16.2, 0).dome(1.9, 2.6, 14, 10).pop();
    }
    gmb.pop();
    physics.addBoxUp(px - 8.5, 0, gz, 3.2, 13, 2.6, 0, 'gate');
    physics.addBoxUp(px + 8.5, 0, gz, 3.2, 13, 2.6, 0, 'gate');
    physics.addBox(px, 11.6, gz, 10, 1.4, 1.3, 0, 'gate');
    physics.addBoxUp(px - 9.6, 0, gz, 4.0, 16, 4.0, 0, 'gate');
    physics.addBoxUp(px + 9.6, 0, gz, 4.0, 16, 4.0, 0, 'gate');
    world.roofs.push({ x: px - 9.6, y: 16.3, z: gz, w: 3, d: 3, district: 'souq' });
    world.roofs.push({ x: px + 9.6, y: 16.3, z: gz, w: 3, d: 3, district: 'souq' });
    world.landmarks.push({ name: 'Bab al-Suq', ar: 'باب السوق', x: px, y: 13, z: gz });

    // palms around the plaza
    for (var p = 0; p < 8; p++) {
      var a = (p / 8) * TAU + rng.next() * 0.3;
      var r = 11 + rng.next() * 3;
      var tx = px + Math.cos(a) * r, tz = pz + Math.sin(a) * r;
      var fmb = foliage.at(tx, tz);
      fmb.push().translate(tx, 0, tz).palm(7 + rng.next() * 4, rng).pop();
      physics.addBoxUp(tx, 0, tz, 0.7, 6, 0.7, 0, 'palm');
    }

    // Stand clear of the fountain basin, on open paving.
    world.anchors.plaza = { x: px + 8.5, y: 0.15, z: pz + 8.5 };
  }

  /** The great mosque: courtyard, big dome, minaret you can climb by line. */
  function buildGreatMosque(cb, physics, world, rng) {
    var mx = -58, mz = DISTRICTS.souq.center.z - 46;
    var mb = cb.at(mx, mz);
    mb.push().translate(mx, 0, mz);

    mb.mat({ cell: CELL.ADOBE, color: [1.0, 0.96, 0.88], roughness: 0.9, uvScale: 0.28, emissive: 0 });
    mb.boxUp(30, 11, 24);
    mb.push().translate(0, 11, 0).parapet(30, 24, 1.1, 0.6).pop();

    // arcade of pointed arches along the front
    for (var i = -2; i <= 2; i++) {
      mb.push().translate(i * 5.6, 0, 12.3);
      mb.mat({ cell: CELL.ADOBE, color: [1.0, 0.96, 0.88], uvScale: 0.28 });
      mb.archWall(5.6, 8.5, 0.7, 3.0, 6.4);
      mb.pop();
    }

    // the great dome
    mb.mat({ cell: CELL.MOSAIC, color: [1, 1, 1], roughness: 0.32, uvScale: 0.35 });
    mb.push().translate(0, 11, 0).cylinder(7.4, 7.0, 2.2, 20).translate(0, 1.1, 0).pop();
    mb.push().translate(0, 13.2, 0).dome(7.0, 10.5, 26, 16).pop();

    // minaret
    var minX = 13, minZ = -9;
    mb.mat({ cell: CELL.ADOBE, color: [1.0, 0.94, 0.84], roughness: 0.9, uvScale: 0.35 });
    mb.push().translate(minX, 0, minZ);
    mb.push().translate(0, 13, 0).box(4.2, 26, 4.2).pop();
    mb.mat({ cell: CELL.TILE, color: [1, 1, 1], roughness: 0.35, uvScale: 0.6 });
    mb.push().translate(0, 26.4, 0).box(5.2, 0.7, 5.2).pop();
    mb.mat({ cell: CELL.ADOBE, color: [1.0, 0.94, 0.84], uvScale: 0.35 });
    mb.push().translate(0, 30, 0).cylinder(1.7, 1.5, 6.6, 14).pop();
    mb.push().translate(0, 33.6, 0).dome(1.9, 3.0, 16, 10).pop();
    // balcony rail
    mb.mat({ cell: CELL.MASHRABIYA, color: [1, 1, 1], roughness: 0.9, uvScale: 1.1, emissive: 0 });
    for (var s = 0; s < 4; s++) {
      mb.push().rotateY(s * Math.PI / 2).translate(0, 27.5, 2.5).box(5.2, 1.5, 0.16).pop();
    }
    mb.pop();
    mb.pop();

    physics.addBoxUp(mx, 0, mz, 30, 11, 24, 0, 'mosque');
    physics.addBoxUp(mx + minX, 0, mz + minZ, 4.2, 26, 4.2, 0, 'minaret');
    physics.addBox(mx + minX, 26.75, mz + minZ, 2.6, 0.35, 2.6, 0, 'minaret');

    world.roofs.push({ x: mx, y: 11.2, z: mz, w: 24, d: 18, district: 'souq' });
    world.roofs.push({ x: mx + minX, y: 27.2, z: mz + minZ, w: 3, d: 3, district: 'souq', high: true });
    world.landmarks.push({ name: 'The Great Minaret', ar: 'المئذنة الكبرى', x: mx + minX, y: 27, z: mz + minZ });
    // On the balcony ring, not inside the shaft that continues up through it.
    world.anchors.minaret = { x: mx + minX, y: 27.3, z: mz + minZ + 2.1 };
  }

  /** Market stalls: awnings, carpets, crates, spice cones. */
  function buildSouqStalls(cb, physics, world, rng) {
    var lanes = [
      { x: -34, z: DISTRICTS.souq.center.z + 12, dx: 1, dz: 0, n: 8 },
      { x: 34, z: DISTRICTS.souq.center.z - 20, dx: 0, dz: 1, n: 7 },
      { x: -10, z: DISTRICTS.souq.center.z - 40, dx: 1, dz: 0, n: 6 }
    ];
    for (var l = 0; l < lanes.length; l++) {
      var lane = lanes[l];
      for (var i = 0; i < lane.n; i++) {
        var sx = lane.x + lane.dx * i * 7.5;
        var sz = lane.z + lane.dz * i * 7.5;
        buildStall(cb, physics, world, rng, sx, sz, lane.dz ? Math.PI / 2 : 0);
      }
    }
  }

  function buildStall(cb, physics, world, rng, x, z, rot) {
    var mb = cb.at(x, z);
    mb.push().translate(x, 0, z).rotateY(rot);
    // posts
    mb.mat({ cell: CELL.WOOD, color: [0.62, 0.46, 0.30], roughness: 0.9, uvScale: 0.9, emissive: 0 });
    for (var sx = -1; sx <= 1; sx += 2) {
      for (var sz = -1; sz <= 1; sz += 2) {
        mb.push().translate(sx * 2.4, 0, sz * 1.5).boxUp(0.16, 3.0, 0.16).pop();
      }
    }
    // counter
    mb.push().translate(0, 0.9, 0).box(5.0, 0.18, 3.0).pop();
    mb.push().translate(0, 0.45, -1.4).box(5.0, 0.9, 0.16).pop();
    // striped awning, sagging slightly between the posts
    // Tints multiply an already-dark textile texture, so they run bright.
    var awn = rng.pick([[1.35, 0.55, 0.45], [0.55, 0.95, 1.45], [1.45, 1.15, 0.50], [0.65, 1.20, 0.85]]);
    mb.mat({ cell: CELL.CARPET, color: awn, roughness: 0.95, uvScale: 0.34 });
    mb.push().translate(0, 3.0, 0).plane(5.6, 3.6, 5, {
      heightFn: function (lx, lz) { return -Math.cos(lx / 2.8 * Math.PI * 0.5) * 0.18 - Math.abs(lz) * 0.02; }
    }).pop();
    // hanging carpets
    for (var c = 0; c < 2; c++) {
      var cx = -1.6 + c * 3.2;
      mb.push().translate(cx, 1.9, -1.45).box(1.4, 2.0, 0.06).pop();
    }
    // goods: spice cones and pots
    mb.mat({ cell: CELL.NONE, roughness: 0.9, emissive: 0 });
    var spices = [[0.85, 0.35, 0.10], [0.90, 0.66, 0.14], [0.55, 0.14, 0.12], [0.35, 0.42, 0.16]];
    for (var g = 0; g < 4; g++) {
      mb.mat({ color: spices[g % spices.length] });
      mb.push().translate(-1.8 + g * 1.2, 1.0, 0.4).cylinder(0.34, 0.02, 0.42, 10, { capBottom: false }).translate(0, 0.21, 0).pop();
    }
    mb.pop();
    physics.addBox(x, 0.99, z, rot ? 1.5 : 2.5, 0.18, rot ? 2.5 : 1.5, 0, 'stall');
    physics.addBox(x, 3.0, z, rot ? 1.8 : 2.8, 0.12, rot ? 2.8 : 1.8, 0, 'awning');

    world.lights.push({
      pos: { x: x, y: 2.7, z: z },
      color: [1.0, 0.68, 0.32], radius: 9, intensity: 0, night: 1.6, kind: 'stall'
    });
  }

  /* -------------------------------------------------------------- oasis */

  function buildOasis(cb, foliage, physics, world, rng, noise) {
    var ox = DISTRICTS.oasis.center.x, oz = DISTRICTS.oasis.center.z;

    // pool
    var poolR = 26;
    var wmb = new OCTO.MeshBuilder();
    wmb.mat({ cell: CELL.NONE, color: [1, 1, 1], roughness: 0.04, emissive: 0 });
    wmb.push().translate(ox, -0.35, oz).cylinder(poolR, poolR, 0.04, 32, { capBottom: false }).pop();
    world.water.push({
      meshData: wmb.build(), model: OCTO.M4.create(),
      deep: [0.02, 0.14, 0.19], shallow: [0.16, 0.50, 0.52]
    });
    // basin rim
    var mb = cb.at(ox, oz);
    mb.mat({ cell: CELL.STONE, color: [0.92, 0.88, 0.80], roughness: 0.9, uvScale: 0.2, emissive: 0 });
    mb.push().translate(ox, -0.2, oz).cylinder(poolR + 1.6, poolR + 1.2, 0.55, 32).pop();
    physics.addBox(ox, -0.9, oz, poolR + 1.6, 0.9, poolR + 1.6, 0, 'pool');

    // palm grove
    for (var i = 0; i < 46; i++) {
      var a = rng.next() * TAU;
      var r = poolR + 3 + rng.next() * 42;
      var tx = ox + Math.cos(a) * r, tz = oz + Math.sin(a) * r;
      var fmb = foliage.at(tx, tz);
      fmb.push().translate(tx, 0, tz).palm(6 + rng.next() * 6, rng).pop();
      physics.addBoxUp(tx, 0, tz, 0.7, 6, 0.7, 0, 'palm');
      if (rng.next() < 0.25) {
        world.roofs.push({ x: tx, y: 7.5, z: tz, w: 1, d: 1, district: 'oasis', palm: true });
      }
    }

    // bedouin camp: three tents and a fire
    for (var t = 0; t < 3; t++) {
      var a2 = (t / 3) * TAU + 0.7;
      var cx = ox + Math.cos(a2) * (poolR + 14), cz = oz + Math.sin(a2) * (poolR + 14);
      buildTent(cb, physics, world, rng, cx, cz, rng.next() * TAU);
    }
    var fx = ox + 30, fz = oz + 6;
    var fmb2 = cb.at(fx, fz);
    fmb2.mat({ cell: CELL.NONE, color: [0.22, 0.18, 0.16], roughness: 1, emissive: 0 });
    for (var s = 0; s < 7; s++) {
      var sa = (s / 7) * TAU;
      fmb2.push().translate(fx + Math.cos(sa) * 1.1, 0.16, fz + Math.sin(sa) * 1.1).sphere(0.28, 6, 4, { yScale: 0.6 }).pop();
    }
    fmb2.mat({ color: [1.0, 0.55, 0.16], emissive: 1.4, roughness: 0.4 });
    fmb2.push().translate(fx, 0.5, fz).sphere(0.55, 8, 6, { yScale: 1.5 }).pop();
    world.lights.push({ pos: { x: fx, y: 0.9, z: fz }, color: [1.0, 0.52, 0.18], radius: 18, intensity: 2.2, night: 4.0, kind: 'fire' });
    world.anchors.oasis = { x: ox + poolR + 6, y: 0.4, z: oz };
    world.landmarks.push({ name: 'Al-Waha', ar: 'الواحة', x: ox, y: 2, z: oz });
  }

  function buildTent(cb, physics, world, rng, x, z, rot) {
    var mb = cb.at(x, z);
    mb.push().translate(x, 0, z).rotateY(rot);
    mb.mat({ cell: CELL.CARPET, color: [0.30, 0.26, 0.24], roughness: 0.98, uvScale: 0.22, emissive: 0 });
    // a low ridge tent: two sloped panels on a ridge pole
    var w = 7, d = 5, hRidge = 3.1;
    for (var s = -1; s <= 1; s += 2) {
      mb.push().translate(0, hRidge / 2, s * d / 4).rotateX(s * -0.62).box(w, 0.12, d * 0.72).pop();
    }
    mb.mat({ cell: CELL.WOOD, color: [0.55, 0.40, 0.26], roughness: 0.9, uvScale: 1 });
    mb.push().translate(0, hRidge, 0).box(0.14, 0.14, d).pop();
    for (var p = -1; p <= 1; p += 2) {
      mb.push().translate(p * w * 0.42, 0, 0).boxUp(0.13, hRidge, 0.13).pop();
    }
    // carpets on the sand
    mb.mat({ cell: CELL.CARPET, color: [0.75, 0.30, 0.26], roughness: 0.98, uvScale: 0.35 });
    mb.push().translate(0, 0.04, d * 0.75).plane(4.2, 3.0, 1).pop();
    mb.pop();
    physics.addBox(x, 1.4, z, 3.4, 1.4, 2.6, rot, 'tent');
    world.roofs.push({ x: x, y: 3.2, z: z, w: 2, d: 2, district: 'oasis' });
  }

  /* ------------------------------------------------------------- towers */

  function buildTowers(cb, physics, world, rng) {
    var tc = DISTRICTS.towers.center;
    var count = 11;
    world.towers = [];
    for (var i = 0; i < count; i++) {
      var a = (i / count) * TAU + rng.next() * 0.2;
      var r = 26 + rng.next() * 78;
      var x = tc.x + Math.cos(a) * r;
      var z = tc.z + Math.sin(a) * r;
      var h = 62 + rng.next() * 88;
      var w = 11 + rng.next() * 9;
      buildTower(cb, physics, world, rng, x, z, w, h, i);
    }
    // ground plate for the district
    var mb = cb.at(tc.x, tc.z);
    mb.mat({ cell: CELL.METAL, color: [0.62, 0.65, 0.74], roughness: 0.5, uvScale: 0.09, emissive: 0 });
    mb.push().translate(tc.x, 0.08, tc.z).cylinder(112, 112, 0.16, 44).pop();
    physics.addBox(tc.x, 0.05, tc.z, 112, 0.1, 112, 0, 'plate');

    // The towers throw shadows hundreds of metres at low sun, and at night
    // nothing reaches the deck at all — so the plaza lights itself.
    mb.mat({ cell: CELL.NEON, color: [0.45, 0.95, 1.0], roughness: 0.25, uvScale: 0.8, emissive: 1.5 });
    for (var s = 0; s < 12; s++) {
      var sa = (s / 12) * TAU;
      mb.push().translate(tc.x, 0.18, tc.z).rotateY(sa).translate(0, 0, 58)
        .box(1.1, 0.06, 104).pop();
    }
    for (var ring = 1; ring <= 3; ring++) {
      var rr = ring * 34;
      mb.push().translate(tc.x, 0.18, tc.z)
        .cylinder(rr, rr, 0.07, 40, { capTop: false, capBottom: false }).pop();
    }
    for (var gl = 0; gl < 8; gl++) {
      var ga = (gl / 8) * TAU;
      world.lights.push({
        pos: { x: tc.x + Math.cos(ga) * 62, y: 2.6, z: tc.z + Math.sin(ga) * 62 },
        color: [0.40, 0.90, 1.0], radius: 55, intensity: 0.55, night: 2.2, kind: 'neon'
      });
    }
    world.anchors.towers = { x: tc.x, y: 0.4, z: tc.z + 96 };
    world.landmarks.push({ name: 'Neo-Falak', ar: 'نيوفلك', x: tc.x, y: 60, z: tc.z });
  }

  function buildTower(cb, physics, world, rng, x, z, w, h, idx) {
    var mb = cb.at(x, z);
    var neon = NEON_COLORS[idx % NEON_COLORS.length];
    var rot = rng.next() * TAU;
    mb.push().translate(x, 0, z).rotateY(rot);

    var sections = Math.max(3, Math.round(h / 26));
    var y = 0;
    var curW = w;
    var ringYs = [];
    for (var s = 0; s < sections; s++) {
      var sh = h / sections;
      var nextW = curW * (0.80 + rng.next() * 0.13);

      // body
      mb.mat({ cell: CELL.METAL, color: [0.72, 0.76, 0.84], roughness: 0.42, uvScale: 0.13, emissive: 0 });
      mb.push().translate(0, y + sh / 2, 0).box(curW, sh, curW).pop();
      // glazed face bands
      mb.mat({ cell: CELL.GLASS, color: [1, 1, 1], roughness: 0.16, uvScale: 0.16, emissive: 0.22 });
      for (var f = 0; f < 4; f++) {
        mb.push().rotateY(f * Math.PI / 2).translate(0, y + sh / 2, curW / 2 + 0.06)
          .box(curW * 0.78, sh * 0.72, 0.12).pop();
      }
      // mashrabiya screens — the traditional pattern carried into the future
      mb.mat({ cell: CELL.MASHRABIYA, color: [0.9, 0.86, 0.82], roughness: 0.7, uvScale: 0.30, emissive: 0 });
      for (var g = 0; g < 4; g += 2) {
        mb.push().rotateY(g * Math.PI / 2 + Math.PI / 4).translate(0, y + sh * 0.34, curW * 0.60)
          .box(curW * 0.5, sh * 0.34, 0.14).pop();
      }
      // neon band at the section joint
      mb.mat({ cell: CELL.NEON, color: neon, roughness: 0.25, uvScale: 0.5, emissive: 1.5 });
      mb.push().translate(0, y + sh - 0.5, 0).box(curW + 0.5, 0.55, curW + 0.5).pop();

      // walkable ring platform
      if (s > 0) {
        mb.mat({ cell: CELL.METAL, color: [0.62, 0.66, 0.74], roughness: 0.45, uvScale: 0.3, emissive: 0 });
        var ringR = curW * 0.92 + 3.2;
        mb.push().translate(0, y + 0.35, 0).cylinder(ringR, ringR, 0.5, 16).pop();
        mb.mat({ cell: CELL.NEON, color: neon, roughness: 0.3, uvScale: 1.2, emissive: 1.2 });
        mb.push().translate(0, y + 0.75, 0).cylinder(ringR, ringR, 0.14, 16, { capTop: false, capBottom: false }).pop();
        physics.addBox(x, y + 0.35, z, ringR * 0.74, 0.28, ringR * 0.74, rot, 'platform');
        ringYs.push(y + 0.7);
        world.roofs.push({ x: x, y: y + 0.75, z: z, w: 3, d: 3, district: 'towers', high: true });
        world.lights.push({
          pos: { x: x, y: y + 1.4, z: z },
          color: neon, radius: 26, intensity: 0.5, night: 2.6, kind: 'neon'
        });
      }

      y += sh;
      curW = nextW;
    }

    // crown + spire
    mb.mat({ cell: CELL.METAL, color: [0.7, 0.74, 0.82], roughness: 0.4, uvScale: 0.2, emissive: 0 });
    mb.push().translate(0, y + 1.2, 0).box(curW * 1.25, 2.4, curW * 1.25).pop();
    // a mosaic dome on a sky tower — the whole point of the setting
    mb.mat({ cell: CELL.MOSAIC, color: [1, 1, 1], roughness: 0.3, uvScale: 0.5, emissive: 0.12 });
    mb.push().translate(0, y + 2.4, 0).dome(curW * 0.62, curW * 0.92, 18, 12).pop();
    mb.mat({ cell: CELL.NEON, color: neon, roughness: 0.2, uvScale: 1, emissive: 2.2 });
    mb.push().translate(0, y + 3.0 + curW * 0.92, 0).cylinder(0.28, 0.05, 9, 8).pop();
    mb.push().translate(0, y + 8.4 + curW * 0.92, 0).sphere(0.7, 10, 8).pop();

    // holographic calligraphy banner
    if (idx % 2 === 0) {
      mb.mat({ cell: CELL.HOLO, color: [0.7, 1.0, 1.0], roughness: 0.1, uvScale: 0.22, emissive: 1.7 });
      mb.push().translate(0, h * 0.62, curW * 1.6).box(w * 1.5, 14, 0.14).pop();
    }
    mb.pop();

    physics.addBoxUp(x, 0, z, w * 0.98, h, w * 0.98, rot, 'tower');
    world.towers.push({ x: x, z: z, h: h, w: w, rings: ringYs, neon: neon });
    world.lights.push({
      pos: { x: x, y: y + 9 + curW, z: z },
      color: neon, radius: 40, intensity: 1.2, night: 3.4, kind: 'beacon'
    });
  }

  /* ------------------------------------------------------------ harbour */

  function buildHarbour(cb, physics, world, rng) {
    var hc = DISTRICTS.harbour.center;
    world.platforms = [];
    var n = 7;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * TAU;
      var r = i === 0 ? 0 : 30 + rng.next() * 26;
      var x = hc.x + Math.cos(a) * r;
      var z = hc.z + Math.sin(a) * r;
      var y = hc.y + (i === 0 ? 8 : (rng.next() - 0.5) * 22);
      var rad = i === 0 ? 20 : 10 + rng.next() * 7;
      buildPlatform(cb, physics, world, rng, x, y, z, rad, i);
    }
    // Out on the open deck, clear of the central kiosk.
    world.anchors.harbour = { x: hc.x + 12, y: hc.y + 8.7, z: hc.z };
    world.landmarks.push({ name: "Mina' al-Sama", ar: 'ميناء السماء', x: hc.x, y: hc.y + 10, z: hc.z });
  }

  function buildPlatform(cb, physics, world, rng, x, y, z, rad, idx) {
    var mb = cb.at(x, z);
    var neon = NEON_COLORS[(idx + 2) % NEON_COLORS.length];
    mb.push().translate(x, y, z);

    // deck: octagonal, stone above, metal below
    mb.mat({ cell: CELL.STONE, color: [0.94, 0.90, 0.82], roughness: 0.8, uvScale: 0.16, emissive: 0 });
    mb.push().translate(0, 0.3, 0).cylinder(rad, rad, 0.6, 8).pop();
    mb.mat({ cell: CELL.METAL, color: [0.5, 0.54, 0.62], roughness: 0.4, uvScale: 0.14, emissive: 0 });
    mb.push().translate(0, -0.5, 0).cylinder(rad * 0.98, rad * 0.55, 1.6, 8).pop();
    mb.mat({ cell: CELL.NEON, color: neon, roughness: 0.25, uvScale: 1.4, emissive: 1.6 });
    mb.push().translate(0, 0.68, 0).cylinder(rad, rad, 0.16, 8, { capTop: false, capBottom: false }).pop();
    physics.addBox(x, y + 0.3, z, rad * 0.86, 0.35, rad * 0.86, 0, 'platform');

    // mashrabiya railing panels around the rim
    mb.mat({ cell: CELL.MASHRABIYA, color: [0.92, 0.88, 0.84], roughness: 0.8, uvScale: 0.4, emissive: 0 });
    for (var s = 0; s < 8; s++) {
      if (s === 2 || s === 6) continue;                    // leave gangways open
      var a = (s / 8) * TAU + Math.PI / 8;
      mb.push().translate(Math.cos(a) * rad * 0.93, 1.2, Math.sin(a) * rad * 0.93)
        .rotateY(-a).box(rad * 0.7, 1.5, 0.14).pop();
    }

    // a central kiosk with a small dome — souq architecture, 40m up
    if (idx === 0) {
      mb.mat({ cell: CELL.ADOBE, color: [1.0, 0.94, 0.86], roughness: 0.9, uvScale: 0.3, emissive: 0 });
      mb.push().translate(0, 0.6, 0);
      for (var f = 0; f < 4; f++) {
        mb.push().rotateY(f * Math.PI / 2).translate(0, 0, 3.4).archWall(6.8, 5.2, 0.4, 2.6, 3.6).pop();
      }
      mb.mat({ cell: CELL.MOSAIC, color: [1, 1, 1], roughness: 0.3, uvScale: 0.5 });
      mb.push().translate(0, 5.2, 0).dome(4.2, 5.6, 20, 12).pop();
      mb.pop();
      physics.addBoxUp(x - 3.2, y + 0.6, z, 1.0, 5.2, 6.8, 0, 'kiosk');
      physics.addBoxUp(x + 3.2, y + 0.6, z, 1.0, 5.2, 6.8, 0, 'kiosk');
      physics.addBox(x, y + 6.0, z, 4.4, 0.5, 4.4, 0, 'kiosk');
      world.roofs.push({ x: x, y: y + 11.2, z: z, w: 3, d: 3, district: 'harbour', high: true });
    }

    // a moored sky-dhow: traditional hull, no water beneath it
    if (idx % 2 === 1) {
      var dx = Math.cos(idx * 1.3) * (rad + 7), dz = Math.sin(idx * 1.3) * (rad + 7);
      buildDhow(mb, physics, world, x, y, z, dx, dz, idx);
    }

    // lanterns on the rail
    for (var l = 0; l < 4; l++) {
      var la = (l / 4) * TAU + 0.4;
      var lx = Math.cos(la) * rad * 0.8, lz = Math.sin(la) * rad * 0.8;
      mb.mat({ cell: CELL.WOOD, color: [0.6, 0.44, 0.3], roughness: 0.9, uvScale: 1, emissive: 0 });
      mb.push().translate(lx, 0.6, lz).boxUp(0.12, 2.4, 0.12).pop();
      mb.push().translate(lx, 3.2, lz).lantern(0.7).pop();
      world.lights.push({
        pos: { x: x + lx, y: y + 3.1, z: z + lz },
        color: [1.0, 0.66, 0.30], radius: 14, intensity: 0.3, night: 2.4, kind: 'lantern'
      });
    }

    mb.pop();
    world.platforms.push({ x: x, y: y + 0.7, z: z, r: rad });
    world.roofs.push({ x: x, y: y + 0.75, z: z, w: rad, d: rad, district: 'harbour', high: true });
  }

  /** A dhow that flies: lateen sail, curved hull, glowing lift rings. */
  function buildDhow(mb, physics, world, px, py, pz, dx, dz, idx) {
    mb.push().translate(dx, 1.2, dz).rotateY(Math.atan2(dx, dz) + Math.PI / 2);
    // hull
    mb.mat({ cell: CELL.WOOD, color: [0.68, 0.50, 0.32], roughness: 0.85, uvScale: 0.4, emissive: 0 });
    mb.push().scale(1, 0.62, 1).sphere(3.6, 16, 10, { yScale: 0.8 }).pop();
    mb.push().translate(0, 0.5, 0).scale(1.02, 0.5, 1.02).sphere(3.4, 14, 8, { yScale: 0.6 }).pop();
    // raised prow and stern
    mb.push().translate(3.1, 1.1, 0).rotateZ(-0.5).box(1.6, 2.6, 1.1).pop();
    mb.push().translate(-3.0, 0.8, 0).rotateZ(0.35).box(1.4, 2.0, 1.3).pop();
    // mast + lateen sail
    mb.mat({ cell: CELL.WOOD, color: [0.55, 0.40, 0.26], roughness: 0.9, uvScale: 1 });
    mb.push().translate(0.4, 3.4, 0).rotateZ(-0.18).box(0.20, 6.4, 0.20).pop();
    mb.mat({ cell: CELL.CARPET, color: [0.94, 0.90, 0.82], roughness: 0.95, uvScale: 0.22 });
    mb.push().translate(0.2, 4.2, 0).rotateZ(-0.45).rotateY(0.06).box(5.6, 4.6, 0.09).pop();
    // lift rings — the "how does it fly" answer, glowing under the keel
    mb.mat({ cell: CELL.NEON, color: [0.45, 0.95, 1.0], roughness: 0.2, uvScale: 1, emissive: 2.0 });
    for (var i = -1; i <= 1; i += 2) {
      mb.push().translate(i * 1.9, -1.5, 0).cylinder(1.1, 1.1, 0.22, 12, { capTop: false, capBottom: false }).pop();
    }
    mb.pop();
    physics.addBox(px + dx, py + 1.5, pz + dz, 3.4, 1.0, 2.6, 0, 'dhow');
    world.lights.push({
      pos: { x: px + dx, y: py + 0.2, z: pz + dz },
      color: [0.4, 0.9, 1.0], radius: 18, intensity: 1.0, night: 2.0, kind: 'neon'
    });
    world.roofs.push({ x: px + dx, y: py + 2.6, z: pz + dz, w: 2, d: 2, district: 'harbour', high: true });
  }

  /* ------------------------------------------------------- rope network */

  /**
   * The lines. Short washing lines between souq roofs, longer spans that
   * climb to the harbour, and the great cables up to the towers.
   */
  function buildRopeNetwork(world, rng) {
    var roofs = world.roofs;
    var made = 0;
    var id = 0;

    function addRope(a, b, opts) {
      opts = opts || {};
      opts.id = id++;
      var rope = new Physics.Rope(a, b, opts);
      world.ropes.push(rope);
      return rope;
    }

    // --- souq: dense local network between neighbouring rooftops
    var souqRoofs = roofs.filter(function (r) { return r.district === 'souq' && !r.high; });
    for (var i = 0; i < souqRoofs.length; i++) {
      var A = souqRoofs[i];
      var links = 0;
      for (var j = i + 1; j < souqRoofs.length && links < 2; j++) {
        var B = souqRoofs[j];
        var dx = B.x - A.x, dz = B.z - A.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 13 || dist > 30) continue;
        if (rng.next() < 0.35) continue;
        addRope(
          { x: A.x, y: A.y + 1.6, z: A.z },
          { x: B.x, y: B.y + 1.6, z: B.z },
          { slack: 0.055 + rng.next() * 0.03, district: 'souq', name: 'washing line', kind: 'rope' }
        );
        links++; made++;
      }
    }

    // --- the long climb: minaret -> harbour -> towers
    var minaret = world.anchors.minaret;
    var harbour = world.anchors.harbour;
    var towersRoofs = roofs.filter(function (r) { return r.district === 'towers'; });
    var harbourRoofs = roofs.filter(function (r) { return r.district === 'harbour'; });

    // souq rooftops up to the minaret
    var tallSouq = souqRoofs.slice().sort(function (a, b) { return b.y - a.y; }).slice(0, 6);
    for (var t = 0; t < tallSouq.length; t++) {
      addRope(
        { x: tallSouq[t].x, y: tallSouq[t].y + 1.6, z: tallSouq[t].z },
        { x: minaret.x, y: minaret.y - 1.5 - t * 0.8, z: minaret.z },
        { slack: 0.05, district: 'line', name: 'minaret line', kind: 'cable', segments: 34 }
      );
      made++;
    }

    // minaret to the harbour: the signature long crossing
    if (harbourRoofs.length) {
      var lowHarbour = harbourRoofs.slice().sort(function (a, b) { return a.y - b.y; });
      for (var k = 0; k < Math.min(3, lowHarbour.length); k++) {
        addRope(
          { x: minaret.x, y: minaret.y - 0.6, z: minaret.z },
          { x: lowHarbour[k].x, y: lowHarbour[k].y + 1.4, z: lowHarbour[k].z },
          { slack: 0.038, district: 'line', name: 'the long line', kind: 'cable', segments: 46, zip: true }
        );
        made++;
      }
      // between harbour platforms
      for (var p = 0; p < harbourRoofs.length; p++) {
        for (var q = p + 1; q < harbourRoofs.length; q++) {
          var P = harbourRoofs[p], Q = harbourRoofs[q];
          var pd = Math.sqrt((P.x - Q.x) * (P.x - Q.x) + (P.z - Q.z) * (P.z - Q.z));
          if (pd < 14 || pd > 62) continue;
          if (rng.next() < 0.45) continue;
          addRope(
            { x: P.x, y: P.y + 1.4, z: P.z },
            { x: Q.x, y: Q.y + 1.4, z: Q.z },
            { slack: 0.035, district: 'harbour', name: 'harbour cable', kind: 'cable', segments: 30 }
          );
          made++;
        }
      }
      // harbour up to the tower rings
      for (var h = 0; h < harbourRoofs.length; h++) {
        var target = towersRoofs[Math.floor(rng.next() * towersRoofs.length)];
        if (!target) break;
        addRope(
          { x: harbourRoofs[h].x, y: harbourRoofs[h].y + 1.4, z: harbourRoofs[h].z },
          { x: target.x, y: target.y + 1.2, z: target.z },
          { slack: 0.03, district: 'towers', name: 'sky cable', kind: 'wire', segments: 48, zip: true }
        );
        made++;
      }
    }

    // between tower rings
    for (var a1 = 0; a1 < towersRoofs.length; a1++) {
      for (var b1 = a1 + 1; b1 < towersRoofs.length; b1++) {
        var T1 = towersRoofs[a1], T2 = towersRoofs[b1];
        var td = Math.sqrt((T1.x - T2.x) * (T1.x - T2.x) + (T1.z - T2.z) * (T1.z - T2.z));
        if (td < 20 || td > 80) continue;
        if (Math.abs(T1.y - T2.y) > 45) continue;
        if (rng.next() < 0.62) continue;
        addRope(
          { x: T1.x, y: T1.y + 1.2, z: T1.z },
          { x: T2.x, y: T2.y + 1.2, z: T2.z },
          { slack: 0.028, district: 'towers', name: 'tower wire', kind: 'wire', segments: 36 }
        );
        made++;
      }
    }

    // oasis: a couple of long palm-to-palm lines for the early tutorial
    var palms = roofs.filter(function (r) { return r.palm; });
    for (var o = 0; o + 1 < palms.length; o += 2) {
      var d2 = Math.sqrt(Math.pow(palms[o].x - palms[o + 1].x, 2) + Math.pow(palms[o].z - palms[o + 1].z, 2));
      if (d2 < 10 || d2 > 40) continue;
      addRope(
        { x: palms[o].x, y: palms[o].y, z: palms[o].z },
        { x: palms[o + 1].x, y: palms[o + 1].y, z: palms[o + 1].z },
        { slack: 0.07, district: 'oasis', name: 'palm line', kind: 'rope' }
      );
      made++;
    }

    world.ropeCount = made;
  }

  /* -------------------------------------------------------- collectibles */

  /** Pearls (lu'lu') scattered across every district, biased onto the lines. */
  function buildCollectibles(world, rng) {
    var total = 40;
    var ropes = world.ropes;
    var roofs = world.roofs;
    for (var i = 0; i < total; i++) {
      var p;
      var pick = rng.next();
      if (pick < 0.45 && ropes.length) {
        var rope = ropes[Math.floor(rng.next() * ropes.length)];
        var t = 0.25 + rng.next() * 0.5;
        var s = rope.sample(t, {});
        p = { x: s.x, y: s.y + 0.75, z: s.z, on: 'line' };
      } else if (pick < 0.8 && roofs.length) {
        var rf = roofs[Math.floor(rng.next() * roofs.length)];
        p = { x: rf.x + (rng.next() - 0.5) * Math.max(2, rf.w - 2), y: rf.y + 1.0, z: rf.z + (rng.next() - 0.5) * Math.max(2, rf.d - 2), on: 'roof' };
      } else {
        var a = rng.next() * TAU, r = rng.next() * 150;
        p = { x: Math.cos(a) * r, y: 1.0, z: DISTRICTS.souq.center.z + Math.sin(a) * r, on: 'ground' };
      }
      p.id = i;
      p.taken = false;
      p.spin = rng.next() * TAU;
      world.pearls.push(p);
    }
  }

  OCTO.buildWorld = buildWorld;
  OCTO.DISTRICTS = DISTRICTS;
  OCTO.MAP_EXTENT = MAP_EXTENT;

})(typeof window !== 'undefined' ? window : globalThis);
