/* =====================================================================
 * OCTOPUSES ON THE LINE — 70-npc.js
 *
 * Inhabitants. Cheaper than the player: tentacles are procedural bezier
 * curves rather than verlet chains, and every NPC in view is merged into
 * a single dynamic mesh each frame.
 *
 *   merchant   — minds a stall, sways, hands out work
 *   wanderer   — strolls the souq between waypoints
 *   linewalker — an octopus crossing a rope overhead
 *   drone      — hovering sky-harbour drone (mission target)
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var CELL = OCTO.CELL, TAU = OCTO.TAU;
  var U = OCTO.util, clamp = U.clamp, damp = U.damp;

  var NPC_SKINS = [
    { body: [0.72, 0.36, 0.30], accent: [0.96, 0.72, 0.48] },
    { body: [0.42, 0.34, 0.58], accent: [0.86, 0.72, 0.92] },
    { body: [0.30, 0.52, 0.50], accent: [0.78, 0.94, 0.86] },
    { body: [0.78, 0.56, 0.24], accent: [0.98, 0.86, 0.58] },
    { body: [0.56, 0.24, 0.42], accent: [0.94, 0.60, 0.62] },
    { body: [0.34, 0.42, 0.66], accent: [0.70, 0.86, 1.00] }
  ];
  var NPC_HATS = ['tarbush', 'ghutra', 'none', 'ghutra', 'tarbush', 'none'];

  function Npc(kind, x, y, z, rng, opts) {
    opts = opts || {};
    this.kind = kind;
    this.pos = { x: x, y: y, z: z };
    this.home = { x: x, y: y, z: z };
    this.vel = { x: 0, y: 0, z: 0 };
    this.yaw = rng.next() * TAU;
    this.targetYaw = this.yaw;
    this.scale = 0.78 + rng.next() * 0.22;
    var s = NPC_SKINS[Math.floor(rng.next() * NPC_SKINS.length)];
    this.skin = { body: s.body, accent: s.accent, eye: [0.97, 0.95, 0.88] };
    this.hat = opts.hat !== undefined ? opts.hat : NPC_HATS[Math.floor(rng.next() * NPC_HATS.length)];
    this.phase = rng.next() * TAU;
    this.bob = rng.next() * TAU;
    this.speed = 0;
    this.state = 'idle';
    this.timer = rng.next() * 3;
    this.waypoints = opts.waypoints || null;
    this.wp = 0;
    this.rope = opts.rope || null;
    this.ropeT = opts.ropeT || rng.next();
    this.ropeDir = rng.next() < 0.5 ? 1 : -1;
    this.name = opts.name || '';
    this.nameAr = opts.nameAr || '';
    this.role = opts.role || null;      // mission id this NPC hands out
    this.caught = false;
    this.id = opts.id || 0;
    this.talk = 0;
    this.rng = rng;
  }

  Npc.prototype.update = function (dt, game) {
    this.phase += dt;
    this.bob += dt * (1.2 + this.speed);
    this.talk = Math.max(0, this.talk - dt);

    if (this.kind === 'merchant') {
      // idle sway, turn toward the player when close
      var d = U.lerp(0, 1, 0);
      var dx = game.player.pos.x - this.pos.x, dz = game.player.pos.z - this.pos.z;
      var dist2 = dx * dx + dz * dz;
      if (dist2 < 100) this.targetYaw = Math.atan2(dx, dz);
      this.yaw = U.dampAngle(this.yaw, this.targetYaw, 4, dt);
      this.speed = 0;
    } else if (this.kind === 'wanderer') {
      this._wander(dt, game);
    } else if (this.kind === 'linewalker') {
      this._walkLine(dt, game);
    } else if (this.kind === 'drone') {
      this._drone(dt, game);
    }
  };

  Npc.prototype._wander = function (dt, game) {
    this.timer -= dt;
    if (!this.waypoints || !this.waypoints.length) { this.speed = 0; return; }
    var target = this.waypoints[this.wp];
    var dx = target.x - this.pos.x, dz = target.z - this.pos.z;
    var d = Math.sqrt(dx * dx + dz * dz);
    if (d < 1.4 || this.timer < -8) {
      this.wp = (this.wp + 1) % this.waypoints.length;
      this.timer = 3 + this.rng.next() * 4;
      return;
    }
    if (this.timer > 0 && this.state === 'pause') { this.speed = damp(this.speed, 0, 6, dt); return; }
    var sp = 1.8;
    this.pos.x += (dx / d) * sp * dt;
    this.pos.z += (dz / d) * sp * dt;
    var gy = game.world.physics.groundHeight(this.pos.x, this.pos.y + 2.5, this.pos.z, 8);
    if (isFinite(gy)) this.pos.y = damp(this.pos.y, gy, 10, dt);
    this.targetYaw = Math.atan2(dx, dz);
    this.yaw = U.dampAngle(this.yaw, this.targetYaw, 6, dt);
    this.speed = sp;
  };

  Npc.prototype._walkLine = function (dt, game) {
    var rope = this.rope;
    if (!rope) return;
    var sp = 0.85;
    this.ropeT += (sp * this.ropeDir * dt) / Math.max(rope.length, 1);
    if (this.ropeT > 0.96) { this.ropeT = 0.96; this.ropeDir = -1; }
    if (this.ropeT < 0.04) { this.ropeT = 0.04; this.ropeDir = 1; }
    var p = rope.sample(this.ropeT, {});
    this.pos.x = p.x; this.pos.y = p.y + 0.12; this.pos.z = p.z;
    var t = rope.tangentAt(this.ropeT, {});
    this.targetYaw = Math.atan2(t.x * this.ropeDir, t.z * this.ropeDir);
    this.yaw = U.dampAngle(this.yaw, this.targetYaw, 8, dt);
    this.speed = sp;
    // they wobble too — it sells the difficulty of the mechanic
    this.wobbleTilt = Math.sin(this.phase * 2.2 + this.bob) * 0.20;
  };

  Npc.prototype._drone = function (dt, game) {
    if (this.caught) return;
    var p = game.player.pos;
    var dx = p.x - this.pos.x, dy = (p.y + 1) - this.pos.y, dz = p.z - this.pos.z;
    var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    // skittish: drifts around its post, bolts if you get close
    var hx = this.home.x + Math.sin(this.phase * 0.6 + this.id) * 7;
    var hy = this.home.y + Math.sin(this.phase * 0.9 + this.id * 2) * 2.4;
    var hz = this.home.z + Math.cos(this.phase * 0.5 + this.id) * 7;
    var tx = hx, ty = hy, tz = hz;
    if (d < 9) {
      tx = this.pos.x - dx / d * 12;
      ty = this.pos.y + 3;
      tz = this.pos.z - dz / d * 12;
      this.state = 'flee';
    } else this.state = 'idle';
    this.pos.x = damp(this.pos.x, tx, this.state === 'flee' ? 2.6 : 1.1, dt);
    this.pos.y = damp(this.pos.y, ty, this.state === 'flee' ? 2.6 : 1.1, dt);
    this.pos.z = damp(this.pos.z, tz, this.state === 'flee' ? 2.6 : 1.1, dt);
    this.yaw += dt * (this.state === 'flee' ? 4 : 1.2);
  };

  /* ------------------------------------------------------------- meshes */

  /** A compact octopus: mantle, eyes, and eight swaying bezier arms. */
  function buildNpcMesh(mb, npc, time, quality) {
    var s = npc.scale;
    mb.identity();
    mb.translate(npc.pos.x, npc.pos.y, npc.pos.z);
    mb.rotateY(npc.yaw);
    if (npc.wobbleTilt) mb.rotateZ(npc.wobbleTilt);
    mb.scale(s, s, s);

    var bob = Math.sin(npc.bob * 2) * 0.035;
    var skin = npc.skin;

    mb.push();
    mb.translate(0, 0.72 + bob, 0);
    mb.mat({ cell: CELL.NONE, color: skin.body, roughness: 0.6, emissive: 0 });
    mb.push().translate(0, 0.22, -0.02).sphere(0.44, quality.npcSegs, quality.npcRings, { yScale: 1.20 }).pop();
    mb.push().translate(0, 0.50, -0.24).rotateX(-0.5).sphere(0.19, quality.npcSegs, 5, { yScale: 1.6 }).pop();
    mb.push().translate(0, -0.02, 0.05).sphere(0.37, quality.npcSegs, quality.npcRings, { yScale: 0.86 }).pop();

    // eyes
    for (var e = -1; e <= 1; e += 2) {
      mb.push().translate(e * 0.22, 0.15, 0.26).rotateY(e * 0.28);
      mb.mat({ color: skin.body, roughness: 0.5 });
      mb.push().sphere(0.155, 8, 6).pop();
      mb.mat({ color: skin.eye, roughness: 0.22 });
      mb.push().translate(0, 0.01, 0.09).sphere(0.115, 8, 6, { yScale: 0.9 }).pop();
      mb.mat({ color: [0.05, 0.04, 0.06], roughness: 0.15 });
      mb.push().translate(0, 0.01, 0.17).box(0.135, 0.042, 0.05).pop();
      mb.pop();
    }
    // hat
    if (npc.hat === 'tarbush') {
      mb.mat({ cell: CELL.NONE, color: [0.60, 0.11, 0.13], roughness: 0.85, emissive: 0 });
      mb.push().translate(0, 0.62, 0).cylinder(0.25, 0.23, 0.28, 12).pop();
    } else if (npc.hat === 'ghutra') {
      mb.mat({ cell: CELL.NONE, color: [0.93, 0.91, 0.85], roughness: 0.95, emissive: 0 });
      mb.push().translate(0, 0.46, -0.03).sphere(0.42, 10, 6, { yScale: 0.6 }).pop();
      mb.mat({ color: [0.10, 0.10, 0.12], roughness: 0.6 });
      mb.push().translate(0, 0.54, 0).cylinder(0.36, 0.36, 0.05, 12, { capTop: false, capBottom: false }).pop();
    }
    mb.pop();

    // eight arms, curled with a travelling wave
    mb.mat({ cell: CELL.NONE, color: skin.body, roughness: 0.62, emissive: 0 });
    var walkPhase = time * (2.4 + npc.speed * 1.6);
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * TAU;
      var swing = Math.sin(walkPhase + i * 0.8) * (0.10 + npc.speed * 0.12);
      var lift = Math.max(0, Math.sin(walkPhase + i * 0.8)) * npc.speed * 0.18;
      var pts = [];
      for (var k = 0; k <= 5; k++) {
        var t = k / 5;
        var reach = 0.26 + t * 0.52;
        pts.push({
          x: Math.cos(a) * reach + Math.cos(a + 1.57) * swing * t,
          y: 0.56 - t * t * 0.52 + lift * Math.sin(t * Math.PI) + Math.sin(npc.bob + i) * 0.01,
          z: Math.sin(a) * reach + Math.sin(a + 1.57) * swing * t
        });
      }
      mb.mat({ color: i % 2 ? skin.body : mixc(skin.body, skin.accent, 0.2) });
      mb.tube(pts, function (t) { return 0.105 * Math.pow(1 - t, 0.7) + 0.016; }, quality.npcTentacleSides, { vScale: 2 });
    }
    mb.identity();
  }

  function mixc(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  /** Sky-harbour drone: brass body, mashrabiya cage, glowing lift ring. */
  function buildDroneMesh(mb, npc, time) {
    if (npc.caught) return;
    mb.identity();
    mb.translate(npc.pos.x, npc.pos.y, npc.pos.z);
    mb.rotateY(npc.yaw);
    mb.rotateZ(Math.sin(time * 2 + npc.id) * 0.12);
    mb.mat({ cell: CELL.BRASS, color: [1, 1, 1], roughness: 0.35, uvScale: 2.2, emissive: 0 });
    mb.push().sphere(0.36, 10, 7, { yScale: 0.78 }).pop();
    mb.mat({ cell: CELL.MASHRABIYA, color: [0.95, 0.9, 0.85], roughness: 0.7, uvScale: 1.6, emissive: 0 });
    mb.push().translate(0, 0.10, 0).cylinder(0.42, 0.42, 0.26, 10, { capTop: false, capBottom: false }).pop();
    mb.mat({ cell: CELL.NONE, color: [0.35, 1.0, 1.0], roughness: 0.15, emissive: 1.8 });
    mb.push().translate(0, -0.26, 0).cylinder(0.30, 0.30, 0.07, 12, { capTop: false, capBottom: false }).pop();
    mb.push().translate(0, 0.02, 0.34).sphere(0.075, 7, 5).pop();
    // rotor arms
    mb.mat({ cell: CELL.METAL, color: [0.7, 0.74, 0.8], roughness: 0.4, uvScale: 2, emissive: 0 });
    for (var i = 0; i < 3; i++) {
      var a = (i / 3) * TAU + time * 6;
      mb.push().translate(Math.cos(a) * 0.42, 0.24, Math.sin(a) * 0.42)
        .rotateY(-a).box(0.34, 0.03, 0.10).pop();
    }
    mb.identity();
  }

  /* -------------------------------------------------------- population */

  function populate(world, rng) {
    var npcs = [];
    var id = 0;

    // merchants at the market stalls
    var stalls = world.lights.filter(function (l) { return l.kind === 'stall'; });
    var merchantRoles = ['spice', 'lanterns', null, 'drones', null, 'beacons', null, 'longline'];
    for (var i = 0; i < stalls.length; i++) {
      var s = stalls[i];
      var n = new Npc('merchant', s.pos.x + (rng.next() - 0.5) * 1.2, 0, s.pos.z - 2.1, rng, {
        id: id++, role: merchantRoles[i % merchantRoles.length]
      });
      var gy = world.physics.groundHeight(n.pos.x, 4, n.pos.z, 8);
      n.pos.y = isFinite(gy) ? gy : 0;
      n.home.y = n.pos.y;
      npcs.push(n);
    }

    // wanderers in the souq
    var plaza = world.anchors.plaza || { x: 0, y: 0, z: 30 };
    for (var w = 0; w < 9; w++) {
      var wps = [];
      for (var k = 0; k < 4; k++) {
        var a = rng.next() * TAU, r = 8 + rng.next() * 44;
        wps.push({ x: plaza.x + Math.cos(a) * r, z: plaza.z + Math.sin(a) * r });
      }
      var wn = new Npc('wanderer', wps[0].x, 0, wps[0].z, rng, { id: id++, waypoints: wps });
      var wy = world.physics.groundHeight(wn.pos.x, 4, wn.pos.z, 8);
      wn.pos.y = isFinite(wy) ? wy : 0;
      npcs.push(wn);
    }

    // line walkers on souq ropes
    var souqRopes = world.ropes.filter(function (r) { return r.district === 'souq' || r.district === 'line'; });
    for (var l = 0; l < Math.min(6, souqRopes.length); l++) {
      var rope = souqRopes[Math.floor(rng.next() * souqRopes.length)];
      npcs.push(new Npc('linewalker', rope.a.x, rope.a.y, rope.a.z, rng, {
        id: id++, rope: rope, ropeT: 0.2 + rng.next() * 0.6
      }));
    }

    // drones over the sky harbour
    var hc = world.districts.harbour.center;
    for (var d = 0; d < 8; d++) {
      var da = (d / 8) * TAU;
      var dr = 18 + rng.next() * 40;
      npcs.push(new Npc('drone', hc.x + Math.cos(da) * dr, hc.y + 8 + rng.next() * 16, hc.z + Math.sin(da) * dr, rng, { id: id++ }));
    }

    return npcs;
  }

  OCTO.Npc = Npc;
  OCTO.npc = {
    populate: populate,
    buildNpcMesh: buildNpcMesh,
    buildDroneMesh: buildDroneMesh
  };

})(typeof window !== 'undefined' ? window : globalThis);
