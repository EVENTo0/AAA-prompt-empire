/* =====================================================================
 * OCTOPUSES ON THE LINE — 57-landmarks.js
 *
 * Ra's al-Khayt, and the Gates.
 *
 * Built from the concept film: a colossal amber cephalopod half-risen
 * from the dunes with burning cyan eyes, and a carved stone ring holding
 * a disc of cyan light. The film's whole palette is one idea — warm
 * ochre everywhere, cyan reserved for the eyes, the gates and the
 * weapons — so cyan appears nowhere else in these builders.
 *
 * The titan is a horizon landmark, not an encounter: it is placed far
 * out in the deep desert so that it is visible from the souq rooftops
 * and the tower rings, and the whole city reads as living underneath it.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var CELL = OCTO.CELL, TAU = OCTO.TAU;

  var CYAN = [0.30, 0.92, 1.00];
  var CYAN_DIM = [0.16, 0.55, 0.70];
  var FLESH = [0.80, 0.50, 0.20];
  var FLESH_DEEP = [0.44, 0.26, 0.10];

  /* --------------------------------------------------------------- titan */

  /**
   * The mantle is a stack of squashed spheres rather than one, so the
   * silhouette gets the heavy overhanging brow the concept art has.
   */
  function buildTitan(mb, S) {
    // ---- mantle
    mb.mat({ cell: CELL.BARK, color: FLESH, roughness: 0.82, uvScale: 0.06, emissive: 0 });
    mb.push().translate(0, 0.62 * S, -0.10 * S).sphere(0.52 * S, 30, 20, { yScale: 1.02 }).pop();
    mb.push().translate(0, 0.92 * S, -0.24 * S).sphere(0.36 * S, 26, 16, { yScale: 0.86 }).pop();
    mb.push().translate(0, 1.06 * S, -0.40 * S).sphere(0.22 * S, 20, 12, { yScale: 0.70 }).pop();

    // ---- brow ridge, the shelf the eyes sit under
    mb.mat({ color: [FLESH[0] * 0.88, FLESH[1] * 0.88, FLESH[2] * 0.88], uvScale: 0.08 });
    mb.push().translate(0, 0.52 * S, 0.30 * S).rotateX(-0.30)
      .sphere(0.46 * S, 24, 12, { yScale: 0.34 }).pop();

    // ---- head mass and the beak below it
    mb.mat({ color: FLESH, uvScale: 0.07 });
    mb.push().translate(0, 0.30 * S, 0.10 * S).sphere(0.44 * S, 26, 16, { yScale: 0.78 }).pop();
    mb.mat({ cell: CELL.NONE, color: FLESH_DEEP, roughness: 0.6, emissive: 0 });
    mb.push().translate(0, 0.10 * S, 0.30 * S).rotateX(0.4).cylinder(0.16 * S, 0.03 * S, 0.24 * S, 10).pop();

    // ---- eyes: the one place cyan is allowed on the creature
    for (var e = -1; e <= 1; e += 2) {
      mb.push().translate(e * 0.235 * S, 0.455 * S, 0.285 * S);
      mb.mat({ cell: CELL.NONE, color: [FLESH[0] * 0.7, FLESH[1] * 0.7, FLESH[2] * 0.7], roughness: 0.7, emissive: 0 });
      mb.push().sphere(0.140 * S, 18, 12).pop();
      mb.mat({ color: CYAN, roughness: 0.06, emissive: 5.0 });
      mb.push().translate(0, 0, 0.050 * S).sphere(0.112 * S, 18, 12).pop();
      mb.mat({ color: [0.02, 0.05, 0.07], roughness: 0.1, emissive: 0 });
      mb.push().translate(0, 0, 0.145 * S).sphere(0.050 * S, 12, 8, { yScale: 0.55 }).pop();
      mb.pop();
    }

    // ---- eight arms
    //  Poses lifted from the film: two thrown high into the sky, two
    //  curling forward over the dunes, the rest sprawled and half-buried.
    var arms = [
      { a: -0.30, lift: 1.00, len: 2.35, curl: 1.25, roll: 0.20 },
      { a: 0.34, lift: 0.92, len: 2.20, curl: -1.15, roll: -0.15 },
      { a: -1.05, lift: 0.34, len: 2.60, curl: 0.85, roll: 0.35 },
      { a: 1.10, lift: 0.30, len: 2.55, curl: -0.90, roll: -0.30 },
      { a: -1.85, lift: 0.06, len: 2.10, curl: 0.45, roll: 0.10 },
      { a: 1.90, lift: 0.05, len: 2.05, curl: -0.50, roll: -0.10 },
      { a: -2.65, lift: -0.02, len: 1.70, curl: 0.30, roll: 0 },
      { a: 2.70, lift: -0.03, len: 1.65, curl: -0.28, roll: 0 }
    ];
    mb.mat({ cell: CELL.BARK, color: FLESH, roughness: 0.84, uvScale: 0.05, emissive: 0 });
    for (var i = 0; i < arms.length; i++) {
      var A = arms[i];
      var pts = [];
      var steps = 13;
      for (var k = 0; k <= steps; k++) {
        var t = k / steps;
        // arc outward, rise with `lift`, then curl back down at the tip
        var reach = t * A.len * S;
        var rise = Math.sin(t * Math.PI * 0.72) * A.lift * S * 1.15 - t * t * 0.10 * S;
        var swing = A.curl * t * t * 0.55;
        var ang = A.a + swing;
        pts.push({
          x: Math.sin(ang) * reach,
          y: 0.34 * S + rise,
          z: Math.cos(ang) * reach - 0.05 * S + A.roll * t * 0.4 * S
        });
      }
      mb.tube(pts, function (t) {
        // thick at the shoulder, whip-thin at the tip
        return (0.135 * Math.pow(1 - t, 0.62) + 0.008) * S;
      }, 12, { vScale: 26 });

      // suckers along the underside of the two raised arms
      if (A.lift > 0.8) {
        mb.mat({ cell: CELL.NONE, color: [0.94, 0.78, 0.52], roughness: 0.5, emissive: 0 });
        for (var s = 3; s < steps - 1; s += 2) {
          var p0 = pts[s];
          var r = (0.135 * Math.pow(1 - s / steps, 0.62) + 0.008) * S;
          mb.push().translate(p0.x, p0.y - r * 0.75, p0.z).sphere(r * 0.34, 8, 5, { yScale: 0.5 }).pop();
        }
        mb.mat({ cell: CELL.BARK, color: FLESH, roughness: 0.84, uvScale: 0.05 });
      }
    }
  }

  /**
   * Place the titan far out in the deep desert. It is scenery with a
   * collider, so a player who walks the whole map still cannot reach
   * through it.
   */
  function addTitan(renderer, world, physics) {
    var S = 58;                              // ~120 m to the top of the mantle
    var x = 300, z = 235, y = -0.08 * S;     // half-risen from the dune
    var rot = -2.35;                         // facing back toward the city

    var mb = new OCTO.MeshBuilder();
    mb.push().translate(x, y, z).rotateY(rot);
    buildTitan(mb, S);
    mb.pop();
    var d = mb.build();

    world.titan = {
      mesh: renderer.createMesh(d.verts, d.indices),
      model: OCTO.M4.create(),
      pos: { x: x, y: y, z: z },
      scale: S,
      eyes: [
        { x: x + Math.cos(rot) * 10.3 - Math.sin(rot) * 12.5, y: y + 0.455 * S, z: z - Math.sin(rot) * 10.3 - Math.cos(rot) * 12.5 },
        { x: x - Math.cos(rot) * 10.3 - Math.sin(rot) * 12.5, y: y + 0.455 * S, z: z + Math.sin(rot) * 10.3 - Math.cos(rot) * 12.5 }
      ]
    };

    // a broad, low collider so the silhouette cannot be walked through
    physics.addBox(x, y + 0.5 * S, z, 0.55 * S, 0.55 * S, 0.55 * S, rot, 'titan');

    world.landmarks.push({ name: "Ra's al-Khayt", ar: 'رأس الخيط', x: x, y: y + S, z: z });
    return world.titan;
  }

  /* ---------------------------------------------------------------- gate */

  /**
   * A Gate: carved stone ring, metal banding, and a disc of cyan light.
   * Twelve tapered blocks make the ring, which reads as masonry rather
   * than as a torus primitive would.
   */
  function buildGate(mb, R) {
    var blocks = 14;
    mb.mat({ cell: CELL.STONE, color: [0.92, 0.86, 0.76], roughness: 0.85, uvScale: 0.22, emissive: 0 });
    for (var i = 0; i < blocks; i++) {
      var a = (i / blocks) * TAU;
      var thick = 0.30 + 0.10 * Math.abs(Math.cos(a));    // heavier at the sides
      mb.push()
        .translate(Math.cos(a) * R, Math.sin(a) * R, 0)
        .rotateZ(a + Math.PI / 2)
        .box(R * 0.30, R * (TAU / blocks) * 1.06, R * thick)
        .pop();
    }
    // inner and outer metal banding
    mb.mat({ cell: CELL.METAL, color: [0.72, 0.70, 0.66], roughness: 0.38, uvScale: 0.5, emissive: 0 });
    mb.push().rotateX(Math.PI / 2).cylinder(R * 0.86, R * 0.86, R * 0.22, 28, { capTop: false, capBottom: false }).pop();
    mb.push().rotateX(Math.PI / 2).cylinder(R * 1.16, R * 1.16, R * 0.16, 28, { capTop: false, capBottom: false }).pop();

    // keystone
    mb.mat({ cell: CELL.STONE, color: [0.96, 0.90, 0.80], roughness: 0.8, uvScale: 0.3 });
    mb.push().translate(0, R * 1.08, 0).box(R * 0.34, R * 0.30, R * 0.42).pop();
    mb.mat({ cell: CELL.NONE, color: CYAN, roughness: 0.1, emissive: 2.6 });
    mb.push().translate(0, R * 1.08, R * 0.22).sphere(R * 0.075, 12, 9).pop();

    // the portal itself — a glowing disc, drawn blended
    mb.mat({ cell: CELL.HOLO, color: CYAN, roughness: 0.05, uvScale: 0.35, emissive: 2.9 });
    mb.push().rotateX(Math.PI / 2).cylinder(R * 0.85, R * 0.85, R * 0.03, 30, { capBottom: false }).pop();
  }

  function addGate(renderer, world, physics, opts) {
    var R = opts.r || 7.5;
    var mb = new OCTO.MeshBuilder();
    mb.push().translate(opts.x, opts.y + R * 1.05, opts.z).rotateY(opts.rot || 0);
    buildGate(mb, R);
    mb.pop();
    var d = mb.build();
    var gate = {
      id: opts.id, en: opts.en, ar: opts.ar, district: opts.district,
      mesh: renderer.createMesh(d.verts, d.indices),
      model: OCTO.M4.create(),
      x: opts.x, y: opts.y, z: opts.z, r: R,
      centre: { x: opts.x, y: opts.y + R * 1.05, z: opts.z }
    };
    // legs only: the opening must stay walkable
    var c = Math.cos(opts.rot || 0), s = Math.sin(opts.rot || 0);
    for (var side = -1; side <= 1; side += 2) {
      var ox = side * R * 1.05;
      physics.addBoxUp(opts.x + ox * c, opts.y, opts.z - ox * s, R * 0.42, R * 1.1, R * 0.5, opts.rot || 0, 'gate');
    }
    world.gates.push(gate);
    world.lights.push({
      pos: gate.centre, color: CYAN, radius: R * 5.5, intensity: 1.6, night: 2.2, kind: 'gate'
    });
    return gate;
  }

  /** Gates at the edge of each district, plus the far one by the titan. */
  function addGates(renderer, world, physics) {
    world.gates = [];
    var D = world.districts;
    var a = world.anchors;
    addGate(renderer, world, physics, {
      id: 'souq', en: 'Souq Gate', ar: 'بوابة السوق', district: 'souq',
      x: a.plaza.x - 22, y: 0.1, z: a.plaza.z - 4, rot: Math.PI / 2, r: 7.5
    });
    addGate(renderer, world, physics, {
      id: 'oasis', en: 'Oasis Gate', ar: 'بوابة الواحة', district: 'oasis',
      x: D.oasis.center.x + 44, y: 0.1, z: D.oasis.center.z - 10, rot: Math.PI / 2, r: 7
    });
    addGate(renderer, world, physics, {
      id: 'towers', en: 'Falak Gate', ar: 'بوابة فلك', district: 'towers',
      x: D.towers.center.x, y: 0.2, z: D.towers.center.z + 86, rot: 0, r: 8.5
    });
    // the one from the film, out on the sand beside the titan
    addGate(renderer, world, physics, {
      id: 'deep', en: 'The Far Gate', ar: 'البوابة البعيدة', district: 'desert',
      x: 168, y: 0, z: 268, rot: -1.10, r: 11
    });
  }

  OCTO.landmarks = { addTitan: addTitan, addGates: addGates, CYAN: CYAN };

})(typeof window !== 'undefined' ? window : globalThis);
