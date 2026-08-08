/* =====================================================================
 * OCTOPUSES ON THE LINE — 80-game.js
 *
 * The simulation shell: owns the world, the octopus, the inhabitants and
 * the jobs board; runs the day/night cycle; assembles the draw list every
 * frame; and persists progress to localStorage.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var M4 = OCTO.M4, CELL = OCTO.CELL, TAU = OCTO.TAU;
  var U = OCTO.util, clamp = U.clamp, lerp = U.lerp, damp = U.damp;
  var Physics = OCTO.Physics;

  var SAVE_KEY = 'octopuses-on-the-line:v1';
  var VERSION = '1.0.0';

  /* ------------------------------------------------------------ quality */

  var QUALITY = {
    low: {
      name: 'Low', shadows: false, bloom: false, fxaa: false, water: true, lights: 4,
      drawDistance: 260, renderScale: 0.7, shadowSize: 1024, maxPixels: 800000,
      bodySegs: 10, bodyRings: 7, tentacleSides: 5, suckers: false,
      npcSegs: 7, npcRings: 5, npcTentacleSides: 4, npcDistance: 70,
      ropeSides: 4, ropeDistance: 110, particles: 40
    },
    medium: {
      name: 'Medium', shadows: true, bloom: true, fxaa: true, water: true, lights: 8,
      drawDistance: 380, renderScale: 0.85, shadowSize: 1024, maxPixels: 1500000,
      bodySegs: 14, bodyRings: 9, tentacleSides: 6, suckers: false,
      npcSegs: 9, npcRings: 6, npcTentacleSides: 4, npcDistance: 110,
      ropeSides: 5, ropeDistance: 160, particles: 90
    },
    high: {
      name: 'High', shadows: true, bloom: true, fxaa: true, water: true, lights: 12,
      drawDistance: 520, renderScale: 1, shadowSize: 2048, maxPixels: 2600000,
      bodySegs: 18, bodyRings: 12, tentacleSides: 7, suckers: true,
      npcSegs: 11, npcRings: 8, npcTentacleSides: 5, npcDistance: 150,
      ropeSides: 6, ropeDistance: 220, particles: 150
    },
    ultra: {
      name: 'Ultra', shadows: true, bloom: true, fxaa: true, water: true, lights: 16,
      drawDistance: 700, renderScale: 1, shadowSize: 2048, maxPixels: 4000000,
      bodySegs: 24, bodyRings: 16, tentacleSides: 9, suckers: true,
      npcSegs: 14, npcRings: 10, npcTentacleSides: 6, npcDistance: 220,
      ropeSides: 8, ropeDistance: 300, particles: 240
    }
  };

  /* -------------------------------------------------------- time of day */

  // Keyframed sky. Hours are 0..24; the table wraps.
  var TIME_KEYS = [
    { h: 0.0,  sunCol: [0.16, 0.18, 0.34], skyCol: [0.05, 0.07, 0.15], groundCol: [0.02, 0.02, 0.05],
      fogCol: [0.05, 0.06, 0.13], zenith: [0.01, 0.02, 0.07], horizon: [0.08, 0.07, 0.16],
      groundSky: [0.03, 0.03, 0.06], stars: 1.0, exposure: 1.30, fogDensity: 0.0032, emissive: 3.4, bloom: 1.05 },
    { h: 5.0,  sunCol: [0.34, 0.28, 0.42], skyCol: [0.12, 0.13, 0.24], groundCol: [0.06, 0.05, 0.07],
      fogCol: [0.20, 0.16, 0.24], zenith: [0.05, 0.07, 0.20], horizon: [0.34, 0.22, 0.28],
      groundSky: [0.10, 0.08, 0.09], stars: 0.55, exposure: 1.20, fogDensity: 0.0034, emissive: 3.0, bloom: 0.95 },
    { h: 6.6,  sunCol: [1.15, 0.58, 0.34], skyCol: [0.30, 0.26, 0.32], groundCol: [0.18, 0.13, 0.11],
      fogCol: [0.62, 0.42, 0.34], zenith: [0.14, 0.24, 0.50], horizon: [0.92, 0.56, 0.38],
      groundSky: [0.30, 0.20, 0.16], stars: 0.10, exposure: 1.05, fogDensity: 0.0038, emissive: 2.4, bloom: 0.90 },
    // groundCol is the warm bounce off the sand; in a desert it is strong, and
    // it is what keeps shadowed walls readable instead of flat blue.
    { h: 9.0,  sunCol: [1.22, 0.98, 0.68], skyCol: [0.23, 0.26, 0.34], groundCol: [0.32, 0.23, 0.13],
      fogCol: [0.78, 0.62, 0.42], zenith: [0.16, 0.30, 0.58], horizon: [0.94, 0.76, 0.50],
      groundSky: [0.28, 0.23, 0.17], stars: 0, exposure: 1.00, fogDensity: 0.0034, emissive: 1.6, bloom: 0.70 },
    { h: 13.0, sunCol: [1.26, 1.10, 0.86], skyCol: [0.26, 0.30, 0.40], groundCol: [0.36, 0.27, 0.16],
      fogCol: [0.82, 0.71, 0.54], zenith: [0.13, 0.29, 0.62], horizon: [0.92, 0.80, 0.58],
      groundSky: [0.30, 0.26, 0.20], stars: 0, exposure: 0.96, fogDensity: 0.0030, emissive: 1.3, bloom: 0.60 },
    { h: 17.0, sunCol: [1.34, 0.94, 0.56], skyCol: [0.26, 0.26, 0.33], groundCol: [0.34, 0.23, 0.12],
      fogCol: [0.90, 0.68, 0.42], zenith: [0.14, 0.26, 0.54], horizon: [1.00, 0.76, 0.44],
      groundSky: [0.30, 0.23, 0.16], stars: 0, exposure: 1.00, fogDensity: 0.0038, emissive: 1.8, bloom: 0.75 },
    { h: 19.2, sunCol: [1.25, 0.50, 0.26], skyCol: [0.26, 0.20, 0.26], groundCol: [0.16, 0.10, 0.09],
      fogCol: [0.66, 0.38, 0.30], zenith: [0.10, 0.16, 0.42], horizon: [0.96, 0.46, 0.28],
      groundSky: [0.26, 0.14, 0.12], stars: 0.08, exposure: 1.06, fogDensity: 0.0036, emissive: 2.6, bloom: 1.00 },
    { h: 20.6, sunCol: [0.50, 0.30, 0.44], skyCol: [0.14, 0.13, 0.24], groundCol: [0.07, 0.06, 0.09],
      fogCol: [0.26, 0.18, 0.26], zenith: [0.04, 0.06, 0.20], horizon: [0.42, 0.20, 0.30],
      groundSky: [0.12, 0.08, 0.10], stars: 0.60, exposure: 1.20, fogDensity: 0.0036, emissive: 3.2, bloom: 1.05 },
    { h: 22.0, sunCol: [0.18, 0.20, 0.36], skyCol: [0.06, 0.08, 0.16], groundCol: [0.02, 0.03, 0.06],
      fogCol: [0.06, 0.07, 0.14], zenith: [0.01, 0.02, 0.08], horizon: [0.10, 0.08, 0.18],
      groundSky: [0.03, 0.03, 0.07], stars: 1.0, exposure: 1.30, fogDensity: 0.0032, emissive: 3.4, bloom: 1.05 },
    { h: 24.0, sunCol: [0.16, 0.18, 0.34], skyCol: [0.05, 0.07, 0.15], groundCol: [0.02, 0.02, 0.05],
      fogCol: [0.05, 0.06, 0.13], zenith: [0.01, 0.02, 0.07], horizon: [0.08, 0.07, 0.16],
      groundSky: [0.03, 0.03, 0.06], stars: 1.0, exposure: 1.30, fogDensity: 0.0032, emissive: 3.4, bloom: 1.05 }
  ];

  function sampleTime(hour) {
    hour = ((hour % 24) + 24) % 24;
    var a = TIME_KEYS[0], b = TIME_KEYS[TIME_KEYS.length - 1];
    for (var i = 0; i < TIME_KEYS.length - 1; i++) {
      if (hour >= TIME_KEYS[i].h && hour <= TIME_KEYS[i + 1].h) { a = TIME_KEYS[i]; b = TIME_KEYS[i + 1]; break; }
    }
    var t = (b.h - a.h) < 1e-6 ? 0 : (hour - a.h) / (b.h - a.h);
    t = U.smoothstep(0, 1, t);
    var out = {};
    for (var k in a) {
      if (k === 'h') continue;
      if (Array.isArray(a[k])) {
        out[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t), lerp(a[k][2], b[k][2], t)];
      } else out[k] = lerp(a[k], b[k], t);
    }
    return out;
  }

  /* ------------------------------------------------------------ missions */

  function makeMissions() {
    return [
      {
        id: 'lanterns', en: 'Lantern Lighter', ar: 'مُشعِل الفوانيس',
        descEn: 'Dusk is falling on the souq. Light eight rooftop lanterns before the quarter goes dark.',
        descAr: 'يحل الغروب على السوق. أشعل ثمانية فوانيس على السطوح قبل أن يعم الظلام.',
        district: 'souq', reward: 140, target: 8, order: 1
      },
      {
        id: 'spice', en: 'Spice Courier', ar: 'ساعي البهارات',
        descEn: 'Carry the saffron crate from the market to the oasis camp without losing it.',
        descAr: 'احمل صندوق الزعفران من السوق إلى مخيّم الواحة دون أن تفقده.',
        district: 'souq', reward: 180, target: 1, order: 2
      },
      {
        id: 'longline', en: 'The Long Line', ar: 'الخيط الطويل',
        descEn: 'Climb the great minaret and cross the long line all the way to Sky Harbour.',
        descAr: 'اصعد المئذنة الكبرى واعبر الخيط الطويل حتى ميناء السماء.',
        district: 'line', reward: 240, target: 1, order: 3
      },
      {
        id: 'drones', en: 'Drone Roundup', ar: 'جمع الطائرات',
        descEn: 'Five harbour drones slipped their moorings. Touch each one to call it home.',
        descAr: 'انفلتت خمس طائرات من الميناء. المس كل واحدة لتعيدها.',
        district: 'harbour', reward: 260, target: 5, order: 4
      },
      {
        id: 'beacons', en: 'Calligraphy Beacons', ar: 'منارات الخط',
        descEn: 'Wake the four calligraphy beacons on the Neo-Falak rings.',
        descAr: 'أيقظ منارات الخط الأربع على حلقات نيوفلك.',
        district: 'towers', reward: 320, target: 4, order: 5
      },
      {
        id: 'pearls', en: 'Pearls of the Quarter', ar: 'لآلئ الحي',
        descEn: 'Forty pearls are hidden across the map, most of them out on the lines.',
        descAr: 'أربعون لؤلؤة مخبأة في الخريطة، أغلبها على الخيوط.',
        district: 'all', reward: 500, target: 40, order: 6, passive: true
      }
    ];
  }

  var SHOP = [
    { id: 'hat_tarbush', en: 'Tarbush', ar: 'طربوش', price: 120, kind: 'hat', value: 'tarbush' },
    { id: 'hat_ghutra', en: 'Ghutra', ar: 'غترة', price: 160, kind: 'hat', value: 'ghutra' },
    { id: 'hat_helmet', en: 'Sky Helmet', ar: 'خوذة السماء', price: 320, kind: 'hat', value: 'helmet' },
    { id: 'hat_crown', en: 'Falak Crown', ar: 'تاج فلك', price: 640, kind: 'hat', value: 'crown' },
    { id: 'skin_sand', en: 'Desert Skin', ar: 'جلد الصحراء', price: 140, kind: 'skin', value: [0.86, 0.66, 0.40], accent: [0.98, 0.88, 0.70] },
    { id: 'skin_indigo', en: 'Indigo Skin', ar: 'جلد النيلة', price: 220, kind: 'skin', value: [0.24, 0.28, 0.56], accent: [0.60, 0.72, 0.98] },
    { id: 'skin_neon', en: 'Neon Skin', ar: 'جلد النيون', price: 480, kind: 'skin', value: [0.14, 0.72, 0.74], accent: [0.40, 1.00, 0.96] },
    { id: 'skin_gold', en: 'Gold Skin', ar: 'جلد ذهبي', price: 900, kind: 'skin', value: [0.86, 0.68, 0.22], accent: [1.00, 0.92, 0.58] },
    { id: 'up_grip', en: 'Sucker Grip', ar: 'قبضة الممصات', price: 300, kind: 'upgrade', value: 'grip' },
    { id: 'up_dash', en: 'Ink Booster', ar: 'معزز الحبر', price: 380, kind: 'upgrade', value: 'dash' },
    { id: 'up_jump', en: 'Spring Arms', ar: 'أذرع نابضة', price: 420, kind: 'upgrade', value: 'jump' }
  ];

  /* ---------------------------------------------------------------- game */

  function Game(renderer, canvas, opts) {
    opts = opts || {};
    this.renderer = renderer;
    this.canvas = canvas;
    this.version = VERSION;
    this.qualityName = opts.quality || 'high';
    this.quality = QUALITY[this.qualityName] || QUALITY.high;
    this.time = 0;                       // seconds since boot
    this.hour = opts.hour === undefined ? 17.2 : opts.hour;
    this.dayLength = 900;                // seconds per in-game day
    this.timeFrozen = false;
    this.paused = false;
    this.windStrength = 0.35;
    this.deterministic = !!opts.deterministic;

    this.scene = { items: [], water: [], lights: [] };
    this.activeLights = [];
    this.frame = 0;
    this.fps = 0;
    this._fpsAcc = 0; this._fpsCount = 0;

    this.save = loadSave();
    this.dirhams = this.save.dirhams || 0;
    this.missions = makeMissions();
    this.shop = SHOP;
    this.progress = this.save.progress || {};
    this.owned = this.save.owned || {};
    this.upgrades = this.save.upgrades || {};
    this.activeMission = null;
    this.toasts = [];
    this.lang = this.save.lang || 'en';
    this.muted = !!this.save.muted;

    this.lastCheckpoint = null;
    this.particles = [];
    this.markers = [];
    this.interactable = null;
  }

  Game.prototype.build = function (opts) {
    var t0 = (root.performance || Date).now();
    var renderer = this.renderer;
    renderer.shadowSize = this.quality.shadowSize;
    applyQuality(renderer, this.quality);

    this.world = OCTO.buildWorld(renderer, { seed: (opts && opts.seed) || 20260807, quality: this.quality });
    this.ropes = this.world.ropes;
    this.props = [];
    this.pearls = this.world.pearls;

    // water surfaces need real GPU meshes
    for (var i = 0; i < this.world.water.length; i++) {
      var w = this.world.water[i];
      w.mesh = renderer.createMesh(w.meshData.verts, w.meshData.indices);
      delete w.meshData;
    }

    var spawn = this.world.spawn;
    spawn.classId = this.save.classId || 'muqatil';
    spawn.form = 'human';
    this.player = new OCTO.Octopus(this, spawn);
    this.camera = new OCTO.Camera(this.player);
    this.camera.yaw = this.world.spawn.yaw;
    this.lastCheckpoint = { x: this.world.spawn.x, y: this.world.spawn.y, z: this.world.spawn.z, yaw: this.world.spawn.yaw };

    var rng = new OCTO.Rng(0xC0FFEE);
    this.npcs = OCTO.npc.populate(this.world, rng);

    this._buildSharedMeshes();
    this._setupMissions(rng);
    this._applyCosmetics();

    this.ropeBuilder = new OCTO.MeshBuilder();
    this.npcBuilder = new OCTO.MeshBuilder();
    this.fxBuilder = new OCTO.MeshBuilder();
    this.ropeMesh = null;
    this.npcMesh = null;
    this.fxMesh = null;
    this.identity = M4.create();
    this.frameCamera();

    this.buildMs = (root.performance || Date).now() - t0;
    this.booted = true;
    return this;
  };

  function applyQuality(renderer, q) {
    renderer.quality.shadows = q.shadows;
    renderer.quality.bloom = q.bloom;
    renderer.quality.fxaa = q.fxaa;
    renderer.quality.water = q.water;
    renderer.quality.lights = q.lights;
    renderer.quality.drawDistance = q.drawDistance;
    renderer.quality.renderScale = q.renderScale;
    renderer.quality.maxPixels = q.maxPixels;
  }

  Game.prototype.setQuality = function (name) {
    if (!QUALITY[name]) return;
    this.qualityName = name;
    this.quality = QUALITY[name];
    applyQuality(this.renderer, this.quality);
    this.renderer.resize(this.canvas.clientWidth || 1280, this.canvas.clientHeight || 720, this.pixelRatio || 1);
    this.persist();
  };

  /** Meshes reused across many instances, each drawn with its own matrix. */
  Game.prototype._buildSharedMeshes = function () {
    var r = this.renderer;
    var mb = new OCTO.MeshBuilder();

    // pearl
    mb.reset().mat({ cell: CELL.NONE, color: [1.0, 0.96, 0.92], roughness: 0.08, emissive: 0.9 });
    mb.sphere(0.30, 14, 10);
    mb.mat({ color: [0.75, 0.92, 1.0], emissive: 1.6, roughness: 0.1 });
    mb.push().scale(1.28, 1.28, 1.28).sphere(0.30, 10, 8).pop();
    this.pearlMesh = mb.toMesh(r);

    // crate
    mb.reset().mat({ cell: CELL.WOOD, color: [0.82, 0.62, 0.38], roughness: 0.9, uvScale: 1.6, emissive: 0 });
    mb.box(0.78, 0.78, 0.78);
    mb.mat({ cell: CELL.WOOD, color: [0.55, 0.40, 0.25], uvScale: 2.4 });
    for (var e = -1; e <= 1; e += 2) {
      mb.push().translate(0, e * 0.40, 0).box(0.84, 0.08, 0.84).pop();
    }
    mb.mat({ cell: CELL.CARPET, color: [0.85, 0.55, 0.20], uvScale: 1.2, roughness: 0.95 });
    mb.push().translate(0, 0, 0.40).box(0.44, 0.30, 0.03).pop();
    this.crateMesh = mb.toMesh(r);

    // objective marker: a slowly turning glowing diamond
    mb.reset().mat({ cell: CELL.NONE, color: [1.0, 0.85, 0.35], roughness: 0.1, emissive: 2.2 });
    mb.push().translate(0, 0.35, 0).cylinder(0.30, 0.001, 0.7, 4).pop();
    mb.push().translate(0, -0.35, 0).cylinder(0.001, 0.30, 0.7, 4).pop();
    this.markerMesh = mb.toMesh(r);

    // beacon pillar for the tower mission
    mb.reset().mat({ cell: CELL.METAL, color: [0.7, 0.74, 0.82], roughness: 0.4, uvScale: 1.4, emissive: 0 });
    mb.boxUp(0.7, 1.4, 0.7);
    mb.mat({ cell: CELL.HOLO, color: [0.7, 1.0, 1.0], roughness: 0.1, uvScale: 0.9, emissive: 1.4 });
    mb.push().translate(0, 2.4, 0).box(1.5, 1.9, 0.10).pop();
    this.beaconMesh = mb.toMesh(r);
  };

  /* ------------------------------------------------------- mission setup */

  Game.prototype._setupMissions = function (rng) {
    var self = this;
    // lantern targets: eight souq lanterns
    var lanterns = this.world.lights.filter(function (l) { return l.kind === 'lantern' && l.pos.y < 30; });
    shuffle(lanterns, rng);
    this.lanternTargets = lanterns.slice(0, 8).map(function (l) {
      l.missionLantern = true;
      l.lit = false;
      return l;
    });

    // spice crate at a stall, delivered to the oasis camp
    var stall = this.world.lights.filter(function (l) { return l.kind === 'stall'; })[0];
    var sx = stall ? stall.pos.x : 0, sz = stall ? stall.pos.z : 30;
    this.spiceStart = { x: sx + 1.2, y: 1.4, z: sz + 1.2 };
    this.spiceCrate = new Physics.Prop(this.spiceStart.x, this.spiceStart.y, this.spiceStart.z, {
      kind: 'spice', size: { x: 0.78, y: 0.78, z: 0.78 }, radius: 0.46, tag: 'spice'
    });
    this.spiceCrate.model = M4.create();
    this.props.push(this.spiceCrate);
    var oasis = this.world.anchors.oasis;
    this.spiceDropoff = { x: oasis.x + 4, y: 0.6, z: oasis.z + 4 };

    // loose crates to play with
    var plaza = this.world.anchors.plaza;
    for (var i = 0; i < 10; i++) {
      var a = rng.next() * TAU, r = 6 + rng.next() * 26;
      var p = new Physics.Prop(plaza.x + Math.cos(a) * r, 2.5 + rng.next() * 2, plaza.z + Math.sin(a) * r, {
        kind: 'crate', radius: 0.46
      });
      p.model = M4.create();
      this.props.push(p);
    }

    // beacons on tower rings
    this.beacons = [];
    var towerRoofs = this.world.roofs.filter(function (r2) { return r2.district === 'towers'; });
    shuffle(towerRoofs, rng);
    for (var b = 0; b < Math.min(4, towerRoofs.length); b++) {
      var t = towerRoofs[b];
      this.beacons.push({
        x: t.x + 2.2, y: t.y, z: t.z + 2.2, active: false, model: M4.create(), id: b
      });
    }

    // drone targets
    this.droneTargets = this.npcs.filter(function (n) { return n.kind === 'drone'; }).slice(0, 5);

    // pearls get a model matrix each
    for (var k = 0; k < this.pearls.length; k++) this.pearls[k].model = M4.create();

    // restore progress
    this.missions.forEach(function (m) {
      var p = self.progress[m.id];
      m.count = p ? (p.count || 0) : 0;
      m.state = p ? (p.state || 'available') : 'available';
      if (m.state === 'active') self.activeMission = m;
    });
    var taken = this.save.pearls || [];
    for (var q = 0; q < this.pearls.length; q++) {
      if (taken.indexOf(this.pearls[q].id) >= 0) this.pearls[q].taken = true;
    }
    var litIds = this.save.lanterns || [];
    for (var l2 = 0; l2 < this.lanternTargets.length; l2++) {
      if (litIds.indexOf(l2) >= 0) this.lanternTargets[l2].lit = true;
    }
  };

  function shuffle(arr, rng) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng.next() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* -------------------------------------------------------------- update */

  Game.prototype.update = function (dt, input) {
    if (this.paused) { input.endFrame(); return; }
    dt = Math.min(dt, 1 / 20);           // never let a stall launch the octopus
    this.time += dt;
    this.frame++;

    if (!this.timeFrozen) this.hour = (this.hour + (dt / this.dayLength) * 24) % 24;
    this._updateEnvironment();

    this.windStrength = 0.25 + Math.sin(this.time * 0.13) * 0.12 + Math.sin(this.time * 0.041) * 0.10;

    // ropes near the player simulate; distant ones idle
    var px = this.player.pos.x, py = this.player.pos.y, pz = this.player.pos.z;
    var simDist = 190 * 190;
    for (var i = 0; i < this.ropes.length; i++) {
      var rope = this.ropes[i];
      var mx = (rope.a.x + rope.b.x) * 0.5 - px, mz = (rope.a.z + rope.b.z) * 0.5 - pz;
      var my = (rope.a.y + rope.b.y) * 0.5 - py;
      rope._d2 = mx * mx + my * my + mz * mz;
      if (rope._d2 < simDist || rope === this.player.line) {
        rope.update(dt, this.windStrength * (rope.kind === 'wire' ? 0.4 : 1), this.time);
      }
    }

    var scripted = (this.cine && this.cine.active) || this.selecting;
    // During the opening and character select the world keeps living, but the
    // camera is authored and the player takes no input.
    this.player.update(dt, scripted ? NULL_INPUT : input, this.camera);
    this.player.updateCarry(dt);
    var aspect = this.renderer.width / Math.max(1, this.renderer.height);
    this.camera.aspectBoost = aspect < 0.8 ? clamp(1 + (0.8 - aspect) * 1.1, 1, 1.55) : 1;
    if (this.cine && this.cine.active) this.cine.update(dt, this.camera);
    else if (this.selecting) this._selectCamera(dt);
    else this.camera.update(dt, input, this.world.physics);

    for (var n = 0; n < this.npcs.length; n++) {
      var npc = this.npcs[n];
      var d2 = sq(npc.pos.x - px) + sq(npc.pos.z - pz);
      if (d2 < 260 * 260) npc.update(dt, this);
    }

    for (var p = 0; p < this.props.length; p++) {
      var prop = this.props[p];
      if (!prop.alive) continue;
      prop.update(dt, this.world.physics, {});
      if (prop.pos.y < -50) {
        // recover a lost spice crate rather than softlocking the job
        if (prop.tag === 'spice') this.resetSpice();
        else prop.alive = false;
      }
    }

    this._updateParticles(dt);
    this._updatePearls(dt);
    this._updateInteraction(input);
    this._updateMissions(dt);
    this._updateToasts(dt);
    this._updateCheckpoint();

    this.audio && this.audio.setWind(clamp(this.windStrength + (this.player.pos.y / 200), 0, 1));
    this.audio && this.audio.setDistrict(this.currentDistrict());

    input.endFrame();
  };

  function sq(v) { return v * v; }

  /** An input that never reports anything, for scripted sequences. */
  var NULL_INPUT = {
    moveAxis: function (o) { o = o || {}; o.x = 0; o.y = 0; return o; },
    lookDelta: function (o) { o = o || {}; o.x = 0; o.y = 0; return o; },
    held: function () { return false; },
    hit: function () { return false; },
    endFrame: function () {},
    poll: function () {},
    mouse: { dx: 0, dy: 0, wheel: 0, locked: false, left: false, right: false },
    touch: { active: false, move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, buttons: {}, pressed: {} },
    invertY: false
  };

  /**
   * Find somewhere the avatar can be shown from every angle. The spawn sits
   * among market stalls, and an orbiting camera there spends most of its
   * circle inside a hanging carpet.
   */
  Game.prototype.findOpenSpot = function (center) {
    var phys = this.world.physics;
    var best = null, bestClear = -1;
    for (var i = 0; i < 32; i++) {
      var a = (i / 32) * TAU;
      var r = 5 + (i % 4) * 5;
      var x = center.x + Math.cos(a) * r;
      var z = center.z + Math.sin(a) * r;
      var gy = phys.groundHeight(x, center.y + 30, z, 40);
      if (!isFinite(gy)) continue;
      var eye = { x: x, y: gy + 1.3, z: z };
      var minClear = 99;
      for (var k = 0; k < 10; k++) {
        var ka = (k / 10) * TAU;
        var hit = phys.raycast(eye, { x: Math.cos(ka), y: 0.06, z: Math.sin(ka) }, 9);
        var clear = hit ? hit.t : 9;
        if (clear < minClear) minClear = clear;
      }
      if (minClear > bestClear) { bestClear = minClear; best = { x: x, y: gy, z: z }; }
    }
    return best || { x: center.x, y: center.y, z: center.z };
  };

  /** Stage the avatar for character select. */
  Game.prototype.prepareSelect = function () {
    var spot = this.findOpenSpot(this.world.anchors.plaza);
    this.player.teleport(spot.x, spot.y + 0.4, spot.z, 0);
    this.player.lineCooldown = 999;      // no grabbing ropes on the podium
    this.selectAngle = 0;
    this.selecting = true;
  };

  /** Slow orbit that frames the avatar during character select. */
  Game.prototype._selectCamera = function (dt) {
    var c = this.camera, p = this.player.pos;
    this.selectAngle = (this.selectAngle || 0) + dt * 0.22;
    var portrait = this.renderer.width < this.renderer.height;
    var dist = portrait ? 4.2 : 3.4;
    var eye = { x: p.x, y: p.y + 0.92, z: p.z };
    c.free = true;
    // The plaza has stalls and awnings in it, and an orbit that ignores them
    // ends up inside a hanging carpet with the avatar nowhere in frame.
    var dir = { x: Math.sin(this.selectAngle), y: 0.09, z: Math.cos(this.selectAngle) };
    var dl = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z) || 1;
    dir.x /= dl; dir.y /= dl; dir.z /= dl;
    var hit = this.world.physics.raycast(eye, dir, dist + 0.5);
    if (hit) dist = Math.max(1.9, hit.t - 0.4);
    c.pos.x = damp(c.pos.x, eye.x + dir.x * dist, 6, dt);
    c.pos.y = damp(c.pos.y, eye.y + 0.30 + dir.y * dist, 6, dt);
    c.pos.z = damp(c.pos.z, eye.z + dir.z * dist, 6, dt);
    c.target.x = eye.x; c.target.y = eye.y; c.target.z = eye.z;
    c.fov = (portrait ? 46 : 40) * OCTO.DEG;
    // Face the camera. The camera sits at angle (sin, cos) from the avatar, so
    // the avatar's yaw is that same angle — adding PI turns its back to us.
    this.player.yaw = U.dampAngle(this.player.yaw, this.selectAngle, 4, dt);
  };

  Game.prototype._updateEnvironment = function () {
    var env = sampleTime(this.hour);
    var r = this.renderer.env;
    r.sunCol = env.sunCol; r.skyCol = env.skyCol; r.groundCol = env.groundCol;
    r.fogCol = env.fogCol; r.zenith = env.zenith; r.horizon = env.horizon;
    r.groundSky = env.groundSky; r.stars = env.stars; r.exposure = env.exposure;
    r.fogDensity = env.fogDensity; r.emissive = env.emissive; r.bloom = env.bloom;

    // sun/moon direction
    var t = (this.hour - 6) / 12;
    var ang = t * Math.PI;
    var y = Math.sin(ang), x = Math.cos(ang);
    var az = 0.42;
    if (y > 0.02) {
      r.sunDir = { x: -x * 0.85, y: Math.max(y, 0.05), z: az };
      this.nightAmount = 0;
    } else {
      // moon: opposite side of the sky, always usefully high
      var ml = Math.sqrt(x * x + 0.36);
      r.sunDir = { x: x * 0.7 / ml, y: 0.42, z: -az };
      this.nightAmount = clamp(-y * 3, 0, 1);
    }
    var l = Math.sqrt(r.sunDir.x * r.sunDir.x + r.sunDir.y * r.sunDir.y + r.sunDir.z * r.sunDir.z);
    r.sunDir.x /= l; r.sunDir.y /= l; r.sunDir.z /= l;

    this.night = clamp(U.invLerp(0.28, -0.05, y), 0, 1);
  };

  Game.prototype.currentDistrict = function () {
    var p = this.player.pos;
    var best = 'souq', bestD = Infinity;
    var D = this.world.districts;
    for (var k in D) {
      var c = D[k].center;
      var d = sq(p.x - c.x) + sq(p.z - c.z) * 1.0 + sq((p.y - c.y) * 0.5);
      if (d < bestD) { bestD = d; best = k; }
    }
    if (this.player.state === 'line' && p.y > 12) best = 'line';
    return best;
  };

  /* ---------------------------------------------------------- collectibles */

  Game.prototype._updatePearls = function (dt) {
    var p = this.player.pos;
    for (var i = 0; i < this.pearls.length; i++) {
      var pearl = this.pearls[i];
      if (pearl.taken) continue;
      pearl.spin += dt * 1.6;
      var d2 = sq(pearl.x - p.x) + sq(pearl.y - (p.y + 0.8)) + sq(pearl.z - p.z);
      if (d2 < 2.0 * 2.0) {
        pearl.taken = true;
        this.addDirhams(15);
        this.audio && this.audio.play('pearl');
        this.spawnSparkle(pearl, 12);
        var m = this.missionById('pearls');
        m.count = this.pearlsTaken();
        if (m.count >= m.target && m.state !== 'complete') this.completeMission(m);
        this.toast(this.lang === 'ar' ? 'لؤلؤة ' + m.count + '/40' : 'Pearl ' + m.count + '/40', 'pearl');
        this.persist();
      }
    }
  };

  Game.prototype.pearlsTaken = function () {
    var n = 0;
    for (var i = 0; i < this.pearls.length; i++) if (this.pearls[i].taken) n++;
    return n;
  };

  /* -------------------------------------------------------- interaction */

  Game.prototype._updateInteraction = function (input) {
    var p = this.player.pos;
    var best = null, bestD = 3.2 * 3.2;

    // lanterns
    for (var i = 0; i < this.lanternTargets.length; i++) {
      var l = this.lanternTargets[i];
      if (l.lit) continue;
      var d = sq(l.pos.x - p.x) + sq(l.pos.y - (p.y + 1)) + sq(l.pos.z - p.z);
      if (d < bestD) { bestD = d; best = { kind: 'lantern', obj: l, index: i, en: 'Light the lantern', ar: 'أشعل الفانوس' }; }
    }
    // beacons
    for (var b = 0; b < this.beacons.length; b++) {
      var bc = this.beacons[b];
      if (bc.active) continue;
      var db = sq(bc.x - p.x) + sq(bc.y - p.y) + sq(bc.z - p.z);
      if (db < bestD) { bestD = db; best = { kind: 'beacon', obj: bc, index: b, en: 'Wake the beacon', ar: 'أيقظ المنارة' }; }
    }
    // merchants
    for (var m = 0; m < this.npcs.length; m++) {
      var npc = this.npcs[m];
      if (npc.kind !== 'merchant' || !npc.role) continue;
      var mission = this.missionById(npc.role);
      if (!mission || mission.state === 'complete') continue;
      var dm = sq(npc.pos.x - p.x) + sq(npc.pos.z - p.z);
      if (dm < bestD) {
        bestD = dm;
        best = {
          kind: 'merchant', obj: npc, mission: mission,
          en: (mission.state === 'active' ? 'Talk: ' : 'Take job: ') + mission.en,
          ar: (mission.state === 'active' ? 'تحدّث: ' : 'اقبل العمل: ') + mission.ar
        };
      }
    }
    // carryables
    if (!this.player.carry) {
      for (var c = 0; c < this.props.length; c++) {
        var prop = this.props[c];
        if (!prop.alive || prop.held) continue;
        var dp = sq(prop.pos.x - p.x) + sq(prop.pos.y - (p.y + 0.7)) + sq(prop.pos.z - p.z);
        if (dp < Math.min(bestD, 2.4 * 2.4)) {
          bestD = dp;
          best = { kind: 'prop', obj: prop, en: prop.tag === 'spice' ? 'Pick up saffron crate' : 'Pick up crate', ar: prop.tag === 'spice' ? 'احمل صندوق الزعفران' : 'احمل الصندوق' };
        }
      }
    }

    this.interactable = best;

    if (input.hit('grab')) {
      if (this.player.carry) {
        this.player.dropCarry(input.held('sprint'));
      } else if (best) {
        this.interact(best);
      } else {
        this.player.tryGrab(this.props, 2.2);
      }
    }
  };

  Game.prototype.interact = function (target) {
    if (!target) return;
    if (target.kind === 'lantern') {
      target.obj.lit = true;
      this.audio && this.audio.play('coin');
      this.spawnSparkle({ x: target.obj.pos.x, y: target.obj.pos.y, z: target.obj.pos.z }, 10);
      var m = this.missionById('lanterns');
      m.count = this.lanternTargets.filter(function (l) { return l.lit; }).length;
      this.toast((this.lang === 'ar' ? 'فوانيس ' : 'Lanterns ') + m.count + '/' + m.target, 'ok');
      if (m.state === 'active' && m.count >= m.target) this.completeMission(m);
      this.persist();
    } else if (target.kind === 'beacon') {
      target.obj.active = true;
      this.audio && this.audio.play('coin');
      this.spawnSparkle({ x: target.obj.x, y: target.obj.y + 2.4, z: target.obj.z }, 16);
      var mb2 = this.missionById('beacons');
      mb2.count = this.beacons.filter(function (b) { return b.active; }).length;
      this.toast((this.lang === 'ar' ? 'منارات ' : 'Beacons ') + mb2.count + '/' + mb2.target, 'ok');
      if (mb2.state === 'active' && mb2.count >= mb2.target) this.completeMission(mb2);
      this.persist();
    } else if (target.kind === 'merchant') {
      var mission = target.mission;
      if (mission.state === 'available') this.startMission(mission);
      else this.toast(this.lang === 'ar' ? mission.ar + ' — جارٍ' : mission.en + ' — in progress', 'info');
      target.obj.talk = 2.5;
    } else if (target.kind === 'prop') {
      target.obj.held = true;
      this.player.carry = target.obj;
      this.audio && this.audio.play('grab');
    }
  };

  /* ------------------------------------------------------------ missions */

  Game.prototype.missionById = function (id) {
    for (var i = 0; i < this.missions.length; i++) if (this.missions[i].id === id) return this.missions[i];
    return null;
  };

  Game.prototype.startMission = function (mission) {
    if (mission.state === 'complete') return;
    if (this.activeMission && this.activeMission !== mission && !this.activeMission.passive) {
      this.activeMission.state = 'available';
    }
    mission.state = 'active';
    this.activeMission = mission;
    if (mission.id === 'spice') this.resetSpice();
    if (mission.id === 'longline') this.longlineStage = 0;
    this.audio && this.audio.play('success', 0.6);
    this.toast((this.lang === 'ar' ? 'مهمة جديدة: ' : 'New job: ') + (this.lang === 'ar' ? mission.ar : mission.en), 'mission');
    this.persist();
  };

  Game.prototype.completeMission = function (mission) {
    if (mission.state === 'complete') return;
    mission.state = 'complete';
    mission.count = mission.target;
    this.addDirhams(mission.reward);
    this.audio && this.audio.play('success');
    this.camera.addShake(0.3);
    this.toast(
      (this.lang === 'ar' ? 'اكتملت: ' : 'Complete: ') + (this.lang === 'ar' ? mission.ar : mission.en) +
      '  +' + mission.reward + (this.lang === 'ar' ? ' درهم' : ' dh'), 'success');
    if (this.activeMission === mission) this.activeMission = null;
    this.persist();
  };

  Game.prototype.resetSpice = function () {
    var c = this.spiceCrate;
    c.alive = true;
    c.held = false;
    if (this.player.carry === c) this.player.carry = null;
    c.pos.x = this.spiceStart.x; c.pos.y = this.spiceStart.y; c.pos.z = this.spiceStart.z;
    c.vel.x = c.vel.y = c.vel.z = 0;
    c.sleep = 0;
  };

  Game.prototype._updateMissions = function (dt) {
    var m;
    // spice delivery
    m = this.missionById('spice');
    if (m.state === 'active') {
      var c = this.spiceCrate;
      var d = Math.sqrt(sq(c.pos.x - this.spiceDropoff.x) + sq(c.pos.z - this.spiceDropoff.z));
      if (d < 4.5 && Math.abs(c.pos.y - this.spiceDropoff.y) < 6) {
        if (this.player.carry === c) this.player.dropCarry();
        m.count = 1;
        this.completeMission(m);
      }
    }
    // long line: minaret -> harbour
    m = this.missionById('longline');
    if (m.state === 'active') {
      var p = this.player.pos;
      var min = this.world.anchors.minaret;
      if (this.longlineStage === 0 && Math.abs(p.y - min.y) < 6 && sq(p.x - min.x) + sq(p.z - min.z) < 100) {
        this.longlineStage = 1;
        this.toast(this.lang === 'ar' ? 'الآن اعبر إلى ميناء السماء' : 'Now cross to Sky Harbour', 'info');
      }
      if (this.longlineStage >= 1) {
        for (var i = 0; i < this.world.platforms.length; i++) {
          var pl = this.world.platforms[i];
          if (sq(p.x - pl.x) + sq(p.z - pl.z) < pl.r * pl.r && Math.abs(p.y - pl.y) < 6) {
            m.count = 1;
            this.completeMission(m);
            break;
          }
        }
      }
    }
    // drones
    m = this.missionById('drones');
    if (m.state === 'active') {
      var pp = this.player.pos;
      for (var d2 = 0; d2 < this.droneTargets.length; d2++) {
        var dr = this.droneTargets[d2];
        if (dr.caught) continue;
        if (sq(dr.pos.x - pp.x) + sq(dr.pos.y - (pp.y + 0.9)) + sq(dr.pos.z - pp.z) < 2.6 * 2.6) {
          dr.caught = true;
          this.audio && this.audio.play('coin');
          this.spawnSparkle(dr.pos, 14);
          m.count = this.droneTargets.filter(function (x) { return x.caught; }).length;
          this.toast((this.lang === 'ar' ? 'طائرات ' : 'Drones ') + m.count + '/' + m.target, 'ok');
          if (m.count >= m.target) this.completeMission(m);
        }
      }
    }
    // pearls tick along passively
    m = this.missionById('pearls');
    m.count = this.pearlsTaken();
    if (m.count >= m.target && m.state !== 'complete') this.completeMission(m);

    this._rebuildMarkers();
  };

  /** Objective markers for whatever the player is currently chasing. */
  Game.prototype._rebuildMarkers = function () {
    this.markers.length = 0;
    var am = this.activeMission;
    if (!am) return;
    var self = this;
    function add(x, y, z, color) { self.markers.push({ x: x, y: y, z: z, color: color || [1.0, 0.85, 0.35] }); }
    if (am.id === 'lanterns') {
      this.lanternTargets.forEach(function (l) { if (!l.lit) add(l.pos.x, l.pos.y + 1.6, l.pos.z); });
    } else if (am.id === 'spice') {
      if (this.player.carry === this.spiceCrate) add(this.spiceDropoff.x, this.spiceDropoff.y + 2.2, this.spiceDropoff.z, [0.4, 1.0, 0.6]);
      else add(this.spiceCrate.pos.x, this.spiceCrate.pos.y + 1.6, this.spiceCrate.pos.z);
    } else if (am.id === 'longline') {
      var min = this.world.anchors.minaret;
      if (this.longlineStage === 0) add(min.x, min.y + 2.5, min.z);
      else { var h = this.world.anchors.harbour; add(h.x, h.y + 3, h.z, [0.4, 1.0, 0.9]); }
    } else if (am.id === 'drones') {
      this.droneTargets.forEach(function (d) { if (!d.caught) add(d.pos.x, d.pos.y + 1.2, d.pos.z, [0.4, 0.95, 1.0]); });
    } else if (am.id === 'beacons') {
      this.beacons.forEach(function (b) { if (!b.active) add(b.x, b.y + 3.4, b.z, [0.8, 0.6, 1.0]); });
    }
  };

  /* ---------------------------------------------------------- economy */

  Game.prototype.addDirhams = function (n) {
    this.dirhams += n;
    this.persist();
  };

  Game.prototype.buy = function (itemId) {
    var item = null;
    for (var i = 0; i < SHOP.length; i++) if (SHOP[i].id === itemId) item = SHOP[i];
    if (!item) return { ok: false, reason: 'unknown' };
    if (this.owned[itemId]) { this.equip(itemId); return { ok: true, equipped: true }; }
    if (this.dirhams < item.price) {
      this.audio && this.audio.play('fail');
      return { ok: false, reason: 'funds' };
    }
    this.dirhams -= item.price;
    this.owned[itemId] = true;
    this.equip(itemId);
    this.audio && this.audio.play('coin');
    this.persist();
    return { ok: true };
  };

  Game.prototype.equip = function (itemId) {
    var item = null;
    for (var i = 0; i < SHOP.length; i++) if (SHOP[i].id === itemId) item = SHOP[i];
    if (!item || !this.owned[itemId]) return false;
    if (item.kind === 'hat') this.save.hat = item.value;
    else if (item.kind === 'skin') { this.save.skin = item.value; this.save.skinAccent = item.accent; }
    else if (item.kind === 'upgrade') this.upgrades[item.value] = true;
    this._applyCosmetics();
    this.persist();
    return true;
  };

  Game.prototype._applyCosmetics = function () {
    if (!this.player) return;
    if (this.save.skin) this.player.skin.body = this.save.skin;
    if (this.save.skinAccent) this.player.skin.accent = this.save.skinAccent;
    this.player.skin.hat = this.save.hat || 'none';
    this.player.upgrades = this.upgrades;
    this.player.applyClass();
  };

  /* --------------------------------------------------------- particles */

  Game.prototype.spawnInk = function (pos, n) {
    var max = this.quality.particles;
    for (var i = 0; i < n && this.particles.length < max; i++) {
      this.particles.push({
        x: pos.x, y: pos.y + 0.6, z: pos.z,
        vx: (Math.random() - 0.5) * 4, vy: Math.random() * 2.2, vz: (Math.random() - 0.5) * 4,
        life: 0.9 + Math.random() * 0.6, maxLife: 1.5,
        size: 0.14 + Math.random() * 0.2,
        color: [0.10, 0.06, 0.16], emissive: 0, gravity: -3
      });
    }
  };

  Game.prototype.spawnSparkle = function (pos, n) {
    var max = this.quality.particles;
    for (var i = 0; i < n && this.particles.length < max; i++) {
      this.particles.push({
        x: pos.x, y: pos.y, z: pos.z,
        vx: (Math.random() - 0.5) * 3.4, vy: Math.random() * 3.4, vz: (Math.random() - 0.5) * 3.4,
        life: 0.7 + Math.random() * 0.5, maxLife: 1.2,
        size: 0.07 + Math.random() * 0.07,
        color: [1.0, 0.9, 0.55], emissive: 2.4, gravity: -5
      });
    }
  };

  Game.prototype.spawnDust = function (pos, n) {
    var max = this.quality.particles;
    for (var i = 0; i < n && this.particles.length < max; i++) {
      this.particles.push({
        x: pos.x + (Math.random() - 0.5) * 0.6, y: pos.y + 0.06, z: pos.z + (Math.random() - 0.5) * 0.6,
        vx: (Math.random() - 0.5) * 1.6, vy: Math.random() * 1.1, vz: (Math.random() - 0.5) * 1.6,
        life: 0.5 + Math.random() * 0.4, maxLife: 0.9,
        size: 0.16 + Math.random() * 0.16,
        color: [0.80, 0.70, 0.52], emissive: 0, gravity: -1.4
      });
    }
  };

  Game.prototype._updateParticles = function (dt) {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.vx *= 0.97; p.vz *= 0.97;
    }
  };

  /* ------------------------------------------------------------- toasts */

  Game.prototype.toast = function (text, kind) {
    this.toasts.push({ text: text, kind: kind || 'info', life: 3.4, t: 0 });
    if (this.toasts.length > 5) this.toasts.shift();
  };
  Game.prototype._updateToasts = function (dt) {
    for (var i = this.toasts.length - 1; i >= 0; i--) {
      this.toasts[i].life -= dt;
      this.toasts[i].t += dt;
      if (this.toasts[i].life <= 0) this.toasts.splice(i, 1);
    }
  };

  Game.prototype._updateCheckpoint = function () {
    var p = this.player;
    if (p.state === 'ground' && p.grounded && p.pos.y > -2) {
      if (!this.lastCheckpoint || sq(p.pos.x - this.lastCheckpoint.x) + sq(p.pos.z - this.lastCheckpoint.z) > 64) {
        this.lastCheckpoint = { x: p.pos.x, y: p.pos.y + 0.3, z: p.pos.z, yaw: p.yaw };
      }
    }
  };

  Game.prototype.onLand = function (v) {
    if (v > 6) this.spawnDust(this.player.pos, Math.min(10, Math.floor(v / 2)));
    if (v > 12) this.camera.addShake(clamp(v / 60, 0, 0.5));
  };
  Game.prototype.onHardLanding = function () {
    this.camera.addShake(0.55);
    this.toast(this.lang === 'ar' ? 'أخ! سقطة قوية' : 'Ouch! Hard landing', 'warn');
  };
  Game.prototype.onLineFall = function () {
    this.camera.addShake(0.3);
    this.toast(this.lang === 'ar' ? 'فقدت توازنك!' : 'You lost your balance!', 'warn');
  };
  Game.prototype.onRespawn = function () {
    this.toast(this.lang === 'ar' ? 'عدت إلى آخر نقطة' : 'Back to the last safe spot', 'info');
  };

  /* ------------------------------------------------------------ persistence */

  function loadSave() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(SAVE_KEY);
      if (!raw) return {};
      var s = JSON.parse(raw);
      return (s && typeof s === 'object') ? s : {};
    } catch (e) { return {}; }
  }

  Game.prototype.persist = function () {
    if (this.deterministic) return;
    try {
      if (!root.localStorage) return;
      var progress = {};
      this.missions.forEach(function (m) { progress[m.id] = { count: m.count, state: m.state }; });
      var pearls = [];
      for (var i = 0; i < this.pearls.length; i++) if (this.pearls[i].taken) pearls.push(this.pearls[i].id);
      var lanterns = [];
      for (var l = 0; l < this.lanternTargets.length; l++) if (this.lanternTargets[l].lit) lanterns.push(l);
      this.save.dirhams = this.dirhams;
      this.save.progress = progress;
      this.save.pearls = pearls;
      this.save.lanterns = lanterns;
      this.save.owned = this.owned;
      this.save.upgrades = this.upgrades;
      this.save.lang = this.lang;
      this.save.quality = this.qualityName;
      this.save.version = VERSION;
      this.save.stats = this.player ? this.player.stats : {};
      root.localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
    } catch (e) { /* private mode / quota — progress simply will not persist */ }
  };

  Game.prototype.resetSave = function () {
    try { root.localStorage && root.localStorage.removeItem(SAVE_KEY); } catch (e) { /* nothing to clear */ }
  };

  /* ---------------------------------------------------------- draw list */

  Game.prototype.buildScene = function () {
    var scene = this.scene;
    scene.items.length = 0;
    scene.water.length = 0;
    scene.lights.length = 0;

    var w = this.world;
    var q = this.quality;
    var cam = this.camera.pos;

    // The titan is a horizon landmark: never culled by distance, and its
    // eyes breathe so it reads as alive from anywhere in the city.
    if (w.titan) {
      var pulse = 0.82 + 0.18 * Math.sin(this.time * 0.55);
      scene.items.push({
        mesh: w.titan.mesh, model: w.titan.model,
        emissive: 2.2 + pulse * 1.4, alwaysVisible: true, noShadow: true
      });
      for (var te = 0; te < w.titan.eyes.length; te++) {
        scene.lights.push({
          pos: w.titan.eyes[te], color: OCTO.landmarks.CYAN,
          radius: 90, intensity: 2.2 * pulse
        });
      }
    }
    if (w.gates) {
      for (var gi = 0; gi < w.gates.length; gi++) {
        var gt = w.gates[gi];
        var gdx = gt.x - cam.x, gdz = gt.z - cam.z;
        if (gdx * gdx + gdz * gdz > 460 * 460) continue;
        scene.items.push({
          mesh: gt.mesh, model: gt.model,
          emissive: 2.4 + Math.sin(this.time * 1.3 + gi) * 0.6
        });
      }
    }

    // static chunks
    for (var i = 0; i < w.items.length; i++) scene.items.push(w.items[i]);
    for (var f = 0; f < w.foliageItems.length; f++) scene.items.push(w.foliageItems[f]);
    for (var wa = 0; wa < w.water.length; wa++) scene.water.push(w.water[wa]);

    // lights: day/night intensity
    var night = this.night;
    for (var l = 0; l < w.lights.length; l++) {
      var light = w.lights[l];
      var base = light.intensity + (light.night || 0) * night;
      if (light.missionLantern) base = light.lit ? (light.night || 2) * Math.max(night, 0.55) * 1.6 : base * 0.15;
      if (base <= 0.01) continue;
      scene.lights.push({ pos: light.pos, color: light.color, radius: light.radius, intensity: base });
    }

    // player
    scene.items.push(this.player.buildMesh(this.renderer, q));

    // A character standing in a shadowed alley otherwise reads as a black
    // silhouette. A soft fill travelling with the avatar keeps it legible
    // without lighting the world around it; character select gets a stronger
    // key from the camera side, the way a portrait would be lit.
    var pp = this.player.pos;
    scene.lights.push({
      pos: { x: pp.x, y: pp.y + 1.25, z: pp.z },
      color: [1.0, 0.94, 0.86], radius: 3.6, intensity: 0.55
    });
    if (this.selecting) {
      var toCam = { x: cam.x - pp.x, z: cam.z - pp.z };
      var l = Math.sqrt(toCam.x * toCam.x + toCam.z * toCam.z) || 1;
      scene.lights.push({
        pos: { x: pp.x + (toCam.x / l) * 2.0, y: pp.y + 2.1, z: pp.z + (toCam.z / l) * 2.0 },
        color: [1.0, 0.90, 0.76], radius: 7.5, intensity: 1.45
      });
      scene.lights.push({
        pos: { x: pp.x - (toCam.x / l) * 2.4, y: pp.y + 1.7, z: pp.z - (toCam.z / l) * 2.4 },
        color: [0.55, 0.78, 1.0], radius: 6.5, intensity: 1.0   // cool rim from behind
      });
    }

    // ropes near the camera, rebuilt as one mesh
    var rb = this.ropeBuilder.reset();
    var rd2 = q.ropeDistance * q.ropeDistance;
    for (var r = 0; r < this.ropes.length; r++) {
      var rope = this.ropes[r];
      if (rope._d2 === undefined) rope._d2 = 0;
      var mx = (rope.a.x + rope.b.x) * 0.5 - cam.x, my = (rope.a.y + rope.b.y) * 0.5 - cam.y, mz = (rope.a.z + rope.b.z) * 0.5 - cam.z;
      if (mx * mx + my * my + mz * mz > rd2) continue;
      var col = rope.kind === 'wire' ? [0.55, 0.60, 0.68] : (rope.kind === 'cable' ? [0.72, 0.66, 0.52] : [0.86, 0.80, 0.64]);
      rb.mat({
        cell: rope.kind === 'wire' ? CELL.METAL : CELL.ROPE,
        color: col, roughness: 0.8, uvScale: 1, emissive: 0
      });
      rb.tube(rope.points(), rope.radius, q.ropeSides, { vScale: rope.segments * 1.4 });
    }
    if (!rb.isEmpty()) {
      var rdata = rb.build();
      if (!this.ropeMesh) this.ropeMesh = this.renderer.createMesh(rdata.verts, rdata.indices, true);
      else this.ropeMesh.update(rdata.verts, rdata.indices);
      scene.items.push({ mesh: this.ropeMesh, model: this.identity, noShadow: false });
    }

    // NPCs
    var nb = this.npcBuilder.reset();
    var nd2 = q.npcDistance * q.npcDistance;
    var any = false;
    for (var n = 0; n < this.npcs.length; n++) {
      var npc = this.npcs[n];
      if (npc.caught) continue;
      var dx = npc.pos.x - cam.x, dy = npc.pos.y - cam.y, dz = npc.pos.z - cam.z;
      if (dx * dx + dy * dy + dz * dz > nd2) continue;
      if (npc.kind === 'drone') OCTO.npc.buildDroneMesh(nb, npc, this.time);
      else OCTO.npc.buildNpcMesh(nb, npc, this.time, q);
      any = true;
    }
    if (any && !nb.isEmpty()) {
      var ndata = nb.build();
      if (!this.npcMesh) this.npcMesh = this.renderer.createMesh(ndata.verts, ndata.indices, true);
      else this.npcMesh.update(ndata.verts, ndata.indices);
      scene.items.push({ mesh: this.npcMesh, model: this.identity });
    }

    // pearls
    for (var pe = 0; pe < this.pearls.length; pe++) {
      var pearl = this.pearls[pe];
      if (pearl.taken) continue;
      var pdx = pearl.x - cam.x, pdz = pearl.z - cam.z;
      if (pdx * pdx + pdz * pdz > 200 * 200) continue;
      M4.compose(pearl.model,
        { x: pearl.x, y: pearl.y + Math.sin(this.time * 1.6 + pearl.id) * 0.14, z: pearl.z },
        { x: 0, y: pearl.spin, z: 0 }, 1);
      scene.items.push({ mesh: this.pearlMesh, model: pearl.model, noShadow: true, emissive: 3.0 });
      scene.lights.push({ pos: { x: pearl.x, y: pearl.y, z: pearl.z }, color: [0.7, 0.9, 1.0], radius: 5, intensity: 0.7 });
    }

    // props
    for (var pr = 0; pr < this.props.length; pr++) {
      var prop = this.props[pr];
      if (!prop.alive) continue;
      var qdx = prop.pos.x - cam.x, qdz = prop.pos.z - cam.z;
      if (qdx * qdx + qdz * qdz > 160 * 160) continue;
      M4.compose(prop.model, prop.pos, { x: prop.tilt, y: prop.rot, z: 0 }, 1);
      scene.items.push({
        mesh: this.crateMesh, model: prop.model,
        tint: prop.tag === 'spice' ? [1.15, 0.85, 0.45] : null
      });
    }

    // beacons
    for (var bn = 0; bn < this.beacons.length; bn++) {
      var b = this.beacons[bn];
      M4.compose(b.model, { x: b.x, y: b.y, z: b.z }, { x: 0, y: this.time * 0.4 + bn, z: 0 }, 1);
      scene.items.push({
        mesh: this.beaconMesh, model: b.model,
        tint: b.active ? [1.2, 1.1, 0.7] : [0.5, 0.55, 0.6],
        emissive: b.active ? 3.4 : 0.5
      });
      if (b.active) scene.lights.push({ pos: { x: b.x, y: b.y + 2.4, z: b.z }, color: [0.7, 1.0, 1.0], radius: 22, intensity: 2.4 });
    }

    // objective markers
    for (var mk = 0; mk < this.markers.length; mk++) {
      var m = this.markers[mk];
      if (!m.model) m.model = M4.create();
      M4.compose(m.model,
        { x: m.x, y: m.y + Math.sin(this.time * 2 + mk) * 0.18, z: m.z },
        { x: 0, y: this.time * 1.5, z: 0 }, 1);
      scene.items.push({ mesh: this.markerMesh, model: m.model, tint: m.color, emissive: 3.2, noShadow: true });
    }

    // particles
    if (this.particles.length) {
      var fb = this.fxBuilder.reset();
      for (var pt = 0; pt < this.particles.length; pt++) {
        var part = this.particles[pt];
        var fade = clamp(part.life / part.maxLife, 0, 1);
        fb.mat({ cell: CELL.NONE, color: part.color, roughness: 0.6, emissive: part.emissive * fade });
        fb.push().translate(part.x, part.y, part.z).sphere(part.size * (0.4 + fade * 0.6), 5, 4).pop();
      }
      if (!fb.isEmpty()) {
        var fdata = fb.build();
        if (!this.fxMesh) this.fxMesh = this.renderer.createMesh(fdata.verts, fdata.indices, true);
        else this.fxMesh.update(fdata.verts, fdata.indices);
        scene.items.push({ mesh: this.fxMesh, model: this.identity, noShadow: true });
      }
    }

    return scene;
  };

  Game.prototype.render = function (dt) {
    var scene = this.buildScene();
    this.renderer.render(this.camera, scene, dt);
  };

  /* ------------------------------------------------------ test/dev hooks */

  Game.prototype.teleportTo = function (districtId) {
    var a = this.world.anchors;
    var map = {
      souq: a.plaza,
      oasis: a.oasis,
      line: this.world.anchors.minaret,
      harbour: a.harbour,
      towers: a.towers
    };
    var t = map[districtId];
    if (!t) return false;
    this.player.teleport(t.x, t.y + 1.2, t.z, this.player.yaw);
    // Don't let the auto-grab snatch a nearby rope the instant we land.
    this.player.lineCooldown = 1.2;
    this.lastCheckpoint = { x: t.x, y: t.y + 1.2, z: t.z, yaw: this.player.yaw };
    this.frameCamera();
    return true;
  };

  /**
   * Snap the camera to a clear angle around the octopus. Spawning on a
   * minaret balcony or beside a souq wall otherwise leaves it jammed
   * against geometry until the player moves.
   */
  Game.prototype.frameCamera = function () {
    var c = this.camera, p = this.player.pos;
    var eye = { x: p.x, y: p.y + 2.3, z: p.z };
    var bestYaw = c.yaw, bestClear = -1;
    for (var i = 0; i < 12; i++) {
      var yaw = (i / 12) * TAU;
      var dir = { x: -Math.sin(yaw), y: Math.sin(c.pitch), z: -Math.cos(yaw) };
      var l = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z) || 1;
      dir.x /= l; dir.y /= l; dir.z /= l;
      var hit = this.world.physics.raycast(eye, dir, c.targetDistance + 1);
      var clear = hit ? hit.t : c.targetDistance + 1;
      if (clear > bestClear) { bestClear = clear; bestYaw = yaw; }
    }
    c.yaw = bestYaw;
    c._smoothTarget.x = eye.x; c._smoothTarget.y = eye.y; c._smoothTarget.z = eye.z;
    var d = Math.min(c.targetDistance, Math.max(1.6, bestClear - 0.4));
    c.distance = d;
    c.pos.x = eye.x - Math.sin(c.yaw) * d;
    c.pos.y = eye.y + d * Math.sin(c.pitch);
    c.pos.z = eye.z - Math.cos(c.yaw) * d;
    c.target.x = eye.x; c.target.y = eye.y; c.target.z = eye.z;
  };

  Game.prototype.report = function () {
    return {
      version: VERSION,
      quality: this.qualityName,
      buildMs: Math.round(this.buildMs),
      chunks: this.world.items.length + this.world.foliageItems.length,
      colliders: this.world.physics.boxes.length,
      ropes: this.ropes.length,
      npcs: this.npcs.length,
      pearls: this.pearls.length,
      props: this.props.length,
      lights: this.world.lights.length,
      draws: this.renderer.stats.draws,
      tris: Math.round(this.renderer.stats.tris),
      player: {
        state: this.player.state,
        x: +this.player.pos.x.toFixed(2),
        y: +this.player.pos.y.toFixed(2),
        z: +this.player.pos.z.toFixed(2)
      },
      hour: +this.hour.toFixed(2),
      dirhams: this.dirhams,
      fps: Math.round(this.fps)
    };
  };

  OCTO.Game = Game;
  OCTO.QUALITY = QUALITY;
  OCTO.SHOP = SHOP;
  OCTO.sampleTime = sampleTime;
  OCTO.VERSION = VERSION;

})(typeof window !== 'undefined' ? window : globalThis);
