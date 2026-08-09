/* =====================================================================
 * OCTOPUSES ON THE LINE — 60-player.js
 *
 * The octopus. A capsule character controller wearing eight verlet
 * tentacles whose tips are pinned to gait targets on the ground, to the
 * rope when balancing, or to nothing at all when the whole thing goes
 * wobbly.
 *
 * States: ground | air | line | climb | ragdoll
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var V3 = OCTO.V3, M4 = OCTO.M4, CELL = OCTO.CELL;
  var U = OCTO.util, clamp = U.clamp, damp = U.damp, TAU = OCTO.TAU;
  var GRAVITY = OCTO.Physics.GRAVITY;

  var TENTACLES = 8;
  var SEGMENTS = 8;          // points per tentacle
  var BODY_RADIUS = 0.45;
  var BODY_HEIGHT = 1.55;
  var SOCKET_Y = 0.60;       // tentacle attachment height above the feet
  var SOCKET_R = 0.32;

  var TUNING = {
    walkSpeed: 5.6,
    sprintSpeed: 9.2,
    groundAccel: 38,
    airAccel: 13,
    groundFriction: 11,
    jumpVelocity: 9.4,
    coyoteTime: 0.13,
    jumpBuffer: 0.14,
    dashSpeed: 16.5,
    dashCooldown: 1.5,
    dashDuration: 0.24,
    climbSpeed: 3.4,
    lineWalkSpeed: 2.5,
    lineSprintSpeed: 4.4,
    lineZipSpeed: 11.0,
    stepHeight: 0.55,
    maxFallSpeed: -34,
    terminalDamage: -26   // fall speed past which you crumple on landing
  };

  /* ------------------------------------------------------------ octopus */

  function Octopus(game, spawn) {
    this.game = game;
    this.world = game.world.physics;
    this.pos = { x: spawn.x, y: spawn.y, z: spawn.z };
    this.vel = { x: 0, y: 0, z: 0 };
    this.spawn = { x: spawn.x, y: spawn.y, z: spawn.z };
    this.yaw = spawn.yaw || 0;
    this.visualYaw = this.yaw;
    this.state = 'air';
    this.radius = BODY_RADIUS;
    this.height = BODY_HEIGHT;

    this.grounded = false;
    this.groundNormal = { x: 0, y: 1, z: 0 };
    this.coyote = 0;
    this.jumpBuffered = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.wobble = 0;            // 0..1 how floppy the body currently is
    this.ragdollTimer = 0;
    this.stunTimer = 0;
    this.airTime = 0;
    this.lastGroundY = spawn.y;
    this.speed = 0;

    // body secondary motion
    this.squash = 1;
    this.lean = { x: 0, z: 0 };
    this.bob = 0;
    this.bodyTilt = { x: 0, z: 0 };
    this.bodyTiltVel = { x: 0, z: 0 };
    this.blink = 0;
    this.blinkTimer = 2;
    this.inkTimer = 0;

    // line riding
    this.line = null;
    this.lineT = 0;
    this.lineDir = 1;
    this.lineSpeed = 0;
    this.tilt = 0;
    this.tiltVel = 0;
    this.gripping = false;
    this.lineCooldown = 0;
    this.balanceNoise = new OCTO.Noise(4242);
    this.noiseT = Math.random() * 100;

    // climbing
    this.climbNormal = { x: 0, y: 0, z: 1 };

    // carrying
    this.carry = null;
    this.carryOffset = { x: 0, y: 1.15, z: 0.62 };

    // cosmetics
    this.skin = {
      body: [0.62, 0.24, 0.42],
      accent: [0.95, 0.55, 0.42],
      eye: [0.97, 0.95, 0.88],
      hat: 'none'
    };

    // Form and discipline. The octopus rig is kept for NPCs and for the
    // antagonist; the player is a Line-Walker.
    this.form = spawn.form || 'human';
    this.classId = spawn.classId || 'muqatil';
    this.classDef = OCTO.classById(this.classId);
    this.upgrades = {};
    this.tune = {};
    this.applyClass(this.classId);
    this.walkPhase = 0;

    this.gaitTime = 0;
    this.tentacles = [];
    this._initTentacles();

    this.builder = new OCTO.MeshBuilder();
    this.mesh = null;
    this.contact = {};
    this._tmp = { x: 0, y: 0, z: 0 };
    this._tmp2 = { x: 0, y: 0, z: 0 };
    this._near = {};
    this.stats = { distance: 0, falls: 0, jumps: 0, lineMeters: 0 };

    // Place the limbs properly: without this the gait targets sit at the world
    // origin until each tentacle takes its first step, and the tentacles are
    // drawn stretched across the map in the meantime.
    this.teleport(this.pos.x, this.pos.y, this.pos.z, this.yaw);
  }

  /** Longest a tentacle can physically reach from its socket. */
  var MAX_REACH = SEGMENTS * 0.175 * 0.96;

  Octopus.prototype._initTentacles = function () {
    for (var i = 0; i < TENTACLES; i++) {
      var a = (i / TENTACLES) * TAU;
      var v = new OCTO.Physics.Verlet();
      v.damping = 0.90;
      v.gravity = GRAVITY * 0.55;
      var segLen = 0.175;
      for (var j = 0; j < SEGMENTS; j++) {
        var p = v.point(
          this.pos.x + Math.cos(a) * (SOCKET_R + j * segLen * 0.7),
          this.pos.y + SOCKET_Y - j * segLen * 0.5,
          this.pos.z + Math.sin(a) * (SOCKET_R + j * segLen * 0.7),
          { pinned: j === 0, r: 0.10, collide: false, damp: 1 - j * 0.02 }
        );
        p.idx = j;
      }
      for (var k = 0; k < SEGMENTS - 1; k++) v.link(k, k + 1, 1.0, segLen);
      // slack "muscle" links across two joints keep the limb from folding flat
      for (var m = 0; m < SEGMENTS - 2; m++) v.link(m, m + 2, 0.22, segLen * 1.86);
      this.tentacles.push({
        verlet: v,
        angle: a,
        phase: (i % 2 === 0 ? 0 : 0.5) + (i / TENTACLES) * 0.22,
        planted: true,
        foot: { x: 0, y: 0, z: 0 },
        prevFoot: { x: 0, y: 0, z: 0 },
        nextFoot: { x: 0, y: 0, z: 0 },
        stepT: 1,
        grounded: true,
        segLen: segLen
      });
    }
  };

  /**
   * Fold the discipline's stats — and any purchased upgrades — into this
   * octopus's own tuning. Nothing is stored globally, so two Line-Walkers of
   * different classes can coexist.
   */
  Octopus.prototype.applyClass = function (classId) {
    if (classId) { this.classId = classId; this.classDef = OCTO.classById(classId); }
    var t = this.tune;
    for (var k in TUNING) t[k] = TUNING[k];
    var st = this.classDef.stats;
    for (var j in st) t[j] = st[j];
    t.balanceControl = st.balanceControl;
    t.lineWeight = st.lineWeight;
    t.destabilise = st.destabilise;
    if (this.upgrades.jump) t.jumpVelocity *= 1.17;
    if (this.upgrades.dash) t.dashCooldown = 0.85;
    if (this.upgrades.grip) t.balanceControl *= 1.25;

    // Worn gear feeds the same two numbers the rope simulation reads, so a
    // heavy hauberk genuinely makes the crossing harder while it makes the
    // fight easier. No item carries a stat that only exists on its tooltip.
    if (this.game && this.game.inventory) {
      var b = this.game.inventory.bonuses();
      t.balanceControl = Math.max(1.2, t.balanceControl + (b.grip || 0));
      t.lineWeight = Math.max(12, t.lineWeight + (b.weight || 0));
    }
    // A grip passive belongs to the pendulum, not to a stat block, so it
    // is applied here rather than folded into the combat vitals.
    if (this.game && this.game.combat) {
      this.game.combat.applyClass();
      var pas = OCTO.combat.passivesFor(this.classId);
      for (var pj = 0; pj < pas.length; pj++) {
        if (pas[pj].stat !== 'grip') continue;
        var rk = this.game.combat.rankOf(pas[pj].id);
        if (rk) t.balanceControl *= (1 + pas[pj].per * rk);
      }
    }
    return this;
  };

  /** Advance the biped walk cycle. Cheap: no verlet, no IK. */
  Octopus.prototype._updateBiped = function (dt) {
    var moving = this.speed > 0.35 && (this.state === 'ground' || this.state === 'line');
    var rate = this.state === 'line'
      ? 2.2 + this.speed * 1.6
      : 2.6 + (this.speed / Math.max(1, this.tune.walkSpeed)) * 7.0;
    if (moving) this.walkPhase += dt * rate;
    else this.walkPhase += dt * 0.9;   // idle sway keeps the pose alive
    if (this.walkPhase > 1e6) this.walkPhase = 0;
  };

  /* --------------------------------------------------------------- api */

  Octopus.prototype.teleport = function (x, y, z, yaw) {
    this.pos.x = x; this.pos.y = y; this.pos.z = z;
    this.vel.x = this.vel.y = this.vel.z = 0;
    if (yaw !== undefined) { this.yaw = yaw; this.visualYaw = yaw; }
    this.detachLine();
    this.state = 'air';
    this.ragdollTimer = 0;
    this.stunTimer = 0;
    this.lastGroundY = y;
    for (var i = 0; i < this.tentacles.length; i++) {
      var t = this.tentacles[i];
      var v = t.verlet.p;
      for (var j = 0; j < v.length; j++) {
        v[j].x = x + Math.cos(t.angle) * (SOCKET_R + j * 0.1);
        v[j].y = y + SOCKET_Y - j * 0.08;
        v[j].z = z + Math.sin(t.angle) * (SOCKET_R + j * 0.1);
        v[j].px = v[j].x; v[j].py = v[j].y; v[j].pz = v[j].z;
      }
      t.foot.x = t.nextFoot.x = t.prevFoot.x = x + Math.cos(t.angle) * 0.85;
      t.foot.y = t.nextFoot.y = t.prevFoot.y = y;
      t.foot.z = t.nextFoot.z = t.prevFoot.z = z + Math.sin(t.angle) * 0.85;
    }
  };

  Octopus.prototype.eyePos = function (out) {
    out = out || {};
    out.x = this.pos.x; out.y = this.pos.y + 1.15; out.z = this.pos.z;
    return out;
  };

  Octopus.prototype.forward = function (out) {
    out = out || {};
    out.x = Math.sin(this.yaw); out.y = 0; out.z = Math.cos(this.yaw);
    return out;
  };

  Octopus.prototype.isRagdoll = function () { return this.state === 'ragdoll'; };

  /* ------------------------------------------------------------ update */

  Octopus.prototype.update = function (dt, input, camera) {
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.lineCooldown = Math.max(0, this.lineCooldown - dt);
    this.inkTimer = Math.max(0, this.inkTimer - dt);
    this.noiseT += dt;

    var startX = this.pos.x, startZ = this.pos.z;

    if (this.state === 'ragdoll') this._updateRagdoll(dt, input);
    else if (this.state === 'line') this._updateLine(dt, input, camera);
    else if (this.state === 'climb') this._updateClimb(dt, input, camera);
    else this._updateWalk(dt, input, camera);

    this._updateBodyMotion(dt);
    if (this.form === 'octopus') this._updateTentacles(dt);
    else this._updateBiped(dt);

    var dx = this.pos.x - startX, dz = this.pos.z - startZ;
    this.stats.distance += Math.sqrt(dx * dx + dz * dz);
    if (this.state === 'line') this.stats.lineMeters += Math.sqrt(dx * dx + dz * dz);

    // out-of-world guard
    if (this.pos.y < -80) this.respawn();
  };

  Octopus.prototype.respawn = function () {
    var s = this.game.lastCheckpoint || this.spawn;
    this.teleport(s.x, s.y + 0.5, s.z, s.yaw);
    this.stats.falls++;
    if (this.game.onRespawn) this.game.onRespawn();
  };

  /* -------------------------------------------------------- walk / air */

  Octopus.prototype._updateWalk = function (dt, input, camera) {
    var move = input.moveAxis(this._tmp2);
    var sprint = input.held('sprint');
    var wantMove = (move.x !== 0 || move.y !== 0);

    // camera-relative desired direction
    // Camera-relative basis. The right vector is (-cos, sin), NOT
    // (cos, -sin): the renderer's view matrix puts camera-right there, and
    // the sign was flipped, so every left/right input drove the character
    // the opposite way while forward/back behaved. Verified by dotting the
    // real movement against row 0 of the live view matrix.
    var cy = camera ? camera.yaw : this.yaw;
    var fx = Math.sin(cy), fz = Math.cos(cy);
    var rx = -Math.cos(cy), rz = Math.sin(cy);
    var wishX = fx * move.y + rx * move.x;
    var wishZ = fz * move.y + rz * move.x;
    var wishLen = Math.sqrt(wishX * wishX + wishZ * wishZ);
    if (wishLen > 1e-4) { wishX /= wishLen; wishZ /= wishLen; }

    var maxSpeed = sprint ? this.tune.sprintSpeed : this.tune.walkSpeed;
    if (this.carry) maxSpeed *= 0.82;
    var accel = this.grounded ? this.tune.groundAccel : this.tune.airAccel;

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      maxSpeed = this.tune.dashSpeed;
      accel = 60;
      if (wishLen < 1e-4) { wishX = Math.sin(this.yaw); wishZ = Math.cos(this.yaw); wishLen = 1; }
    }

    if (wishLen > 1e-4) {
      var targetX = wishX * maxSpeed, targetZ = wishZ * maxSpeed;
      this.vel.x += (targetX - this.vel.x) * clamp(accel * dt / maxSpeed, 0, 1);
      this.vel.z += (targetZ - this.vel.z) * clamp(accel * dt / maxSpeed, 0, 1);
      this.yaw = U.dampAngle(this.yaw, Math.atan2(wishX, wishZ), this.grounded ? 13 : 7, dt);
    } else if (this.grounded) {
      var f = Math.exp(-this.tune.groundFriction * dt);
      this.vel.x *= f; this.vel.z *= f;
    }

    // gravity
    this.vel.y += GRAVITY * dt;
    if (this.vel.y < this.tune.maxFallSpeed) this.vel.y = this.tune.maxFallSpeed;

    // jump
    if (input.hit('jump')) this.jumpBuffered = this.tune.jumpBuffer;
    this.jumpBuffered = Math.max(0, this.jumpBuffered - dt);
    if (this.jumpBuffered > 0 && (this.grounded || this.coyote > 0)) {
      this.vel.y = this.tune.jumpVelocity;
      this.jumpBuffered = 0;
      this.coyote = 0;
      this.grounded = false;
      this.squash = 0.80;
      this.stats.jumps++;
      this.game.audio && this.game.audio.play('jump');
    }

    // ink dash
    if (input.hit('dash') && this.dashCooldown <= 0) {
      this.dashTimer = this.tune.dashDuration;
      this.dashCooldown = this.tune.dashCooldown;
      this.inkTimer = 0.5;
      var dirX = wishLen > 1e-4 ? wishX : Math.sin(this.yaw);
      var dirZ = wishLen > 1e-4 ? wishZ : Math.cos(this.yaw);
      this.vel.x = dirX * this.tune.dashSpeed;
      this.vel.z = dirZ * this.tune.dashSpeed;
      if (!this.grounded) this.vel.y = Math.max(this.vel.y, 1.5);
      this.game.audio && this.game.audio.play('dash');
      this.game.spawnInk && this.game.spawnInk(this.pos, 14);
    }

    // deliberate wobble — hold to go floppy, the signature of the genre
    var wantWobble = input.held('wobble');
    this.wobble = damp(this.wobble, wantWobble ? 1 : 0, 9, dt);
    if (wantWobble) {
      this.vel.x *= Math.exp(-2.2 * dt);
      this.vel.z *= Math.exp(-2.2 * dt);
    }

    this._integrateAndCollide(dt);

    // wall climbing (suction) — needs a wall contact and the climb key
    if (input.held('climb') && this.contact.wall && !this.grounded) {
      this.state = 'climb';
      this.climbNormal.x = this.contact.nx; this.climbNormal.y = this.contact.ny; this.climbNormal.z = this.contact.nz;
      this.vel.x = this.vel.y = this.vel.z = 0;
      this.game.audio && this.game.audio.play('stick');
      return;
    }

    // grab a line we are near
    if (this.lineCooldown <= 0) {
      var rope = this._findLine(0.95);
      if (rope && (input.held('grip') || (this.vel.y < -0.5 && rope.dist < 0.62) || input.hit('grab'))) {
        this.attachLine(rope.rope, rope.near);
        return;
      }
    }

    this.state = this.grounded ? 'ground' : 'air';
    this.speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.z * this.vel.z);
  };

  Octopus.prototype._integrateAndCollide = function (dt) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.z += this.vel.z * dt;

    var wasGrounded = this.grounded;
    this.grounded = false;
    var c = this.contact;
    c.hit = false; c.grounded = false; c.wall = false; c.ceiling = false;
    c.nx = 0; c.ny = 0; c.nz = 0;

    var r = this.radius;
    var feet = this._tmp;
    // Two spheres approximate the capsule: feet and shoulders.
    feet.x = this.pos.x; feet.y = this.pos.y + r; feet.z = this.pos.z;
    var res = this.world.resolveSphere(feet, r, {}, 3);
    this.pos.x = feet.x; this.pos.y = feet.y - r; this.pos.z = feet.z;
    mergeContact(c, res);

    var head = this._tmp;
    head.x = this.pos.x; head.y = this.pos.y + this.height - r; head.z = this.pos.z;
    var res2 = this.world.resolveSphere(head, r, {}, 3);
    this.pos.x = head.x; this.pos.y = head.y - (this.height - r); this.pos.z = head.z;
    mergeContact(c, res2);

    if (c.grounded) {
      this.grounded = true;
      this.groundNormal.x = c.nx; this.groundNormal.y = c.ny; this.groundNormal.z = c.nz;
      if (this.vel.y < 0) {
        var impact = this.vel.y;
        this.vel.y = 0;
        if (!wasGrounded) this._land(impact);
      }
      this.coyote = this.tune.coyoteTime;
      this.lastGroundY = this.pos.y;
      this.airTime = 0;
    } else {
      this.coyote = Math.max(0, this.coyote - dt);
      this.airTime += dt;
    }
    if (c.ceiling && this.vel.y > 0) this.vel.y = 0;
    if (c.wall) {
      // cancel the into-wall component so we slide instead of sticking
      var d = this.vel.x * c.nx + this.vel.z * c.nz;
      if (d < 0) { this.vel.x -= c.nx * d; this.vel.z -= c.nz * d; }
    }
  };

  function mergeContact(c, res) {
    if (!res.hit) return;
    c.hit = true;
    if (res.grounded) {
      c.grounded = true;
      if (res.ny > c.ny) { c.nx = res.nx; c.ny = res.ny; c.nz = res.nz; }
    }
    if (res.ceiling) c.ceiling = true;
    if (res.wall) {
      c.wall = true;
      if (!c.grounded) { c.nx = res.nx; c.ny = res.ny; c.nz = res.nz; }
    }
  }

  Octopus.prototype._land = function (impactVel) {
    var v = Math.abs(impactVel);
    this.squash = clamp(1 - v * 0.022, 0.55, 1);
    this.game.audio && this.game.audio.play('land', clamp(v / 20, 0.2, 1));
    if (impactVel < this.tune.terminalDamage) {
      this.enterRagdoll(1.5);
      this.game.onHardLanding && this.game.onHardLanding(v);
    }
    this.game.onLand && this.game.onLand(v);
  };

  /* ------------------------------------------------------------- climb */

  Octopus.prototype._updateClimb = function (dt, input, camera) {
    if (!input.held('climb')) { this.state = 'air'; this.vel.y = 1.5; return; }
    var move = input.moveAxis(this._tmp2);
    var n = this.climbNormal;
    // Build a basis on the wall: up is world up projected, right is n x up.
    var upx = 0, upy = 1, upz = 0;
    var rx = upy * n.z - upz * n.y, ry = upz * n.x - upx * n.z, rz = upx * n.y - upy * n.x;
    var rl = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
    rx /= rl; ry /= rl; rz /= rl;
    var s = this.tune.climbSpeed * (input.held('sprint') ? 1.6 : 1);
    this.vel.x = rx * move.x * s;
    this.vel.y = move.y * s;
    this.vel.z = rz * move.x * s;
    // stay suctioned to the surface
    this.vel.x -= n.x * 2.0;
    this.vel.z -= n.z * 2.0;
    this.yaw = U.dampAngle(this.yaw, Math.atan2(-n.x, -n.z), 10, dt);

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.z += this.vel.z * dt;

    var c = this.contact;
    c.hit = false; c.grounded = false; c.wall = false;
    var feet = this._tmp;
    feet.x = this.pos.x; feet.y = this.pos.y + this.radius; feet.z = this.pos.z;
    mergeContact(c, this.world.resolveSphere(feet, this.radius, {}, 3));
    this.pos.x = feet.x; this.pos.y = feet.y - this.radius; this.pos.z = feet.z;
    var head = this._tmp;
    head.x = this.pos.x; head.y = this.pos.y + this.height - this.radius; head.z = this.pos.z;
    mergeContact(c, this.world.resolveSphere(head, this.radius, {}, 3));
    this.pos.x = head.x; this.pos.y = head.y - (this.height - this.radius); this.pos.z = head.z;

    if (c.wall) { this.climbNormal.x = c.nx; this.climbNormal.y = c.ny; this.climbNormal.z = c.nz; }
    if (!c.hit) { this.state = 'air'; this.vel.y = 0; }
    if (c.grounded && move.y < 0) { this.state = 'ground'; }
    if (input.hit('jump')) {
      this.state = 'air';
      this.vel.x = n.x * 7 + this.vel.x * 0.3;
      this.vel.z = n.z * 7 + this.vel.z * 0.3;
      this.vel.y = this.tune.jumpVelocity * 0.85;
      this.game.audio && this.game.audio.play('jump');
    }
    this.speed = this.tune.climbSpeed * Math.abs(move.x || move.y);
  };

  /* -------------------------------------------------------------- line */

  /** Find the closest rope within `reach` of the body centre. */
  Octopus.prototype._findLine = function (reach) {
    var ropes = this.game.ropes;
    if (!ropes || !ropes.length) return null;
    var p = this._tmp;
    p.x = this.pos.x; p.y = this.pos.y + 0.5; p.z = this.pos.z;
    var best = null, bestD = reach;
    for (var i = 0; i < ropes.length; i++) {
      var rope = ropes[i];
      // cheap reject against the straight-line span first
      if (Math.abs(rope.a.x - p.x) > 200 && Math.abs(rope.b.x - p.x) > 200) continue;
      var n = rope.nearest(p, this._near);
      if (n.dist < bestD) {
        bestD = n.dist;
        best = { rope: rope, dist: n.dist, near: { t: n.t, pos: { x: n.pos.x, y: n.pos.y, z: n.pos.z }, tangent: { x: n.tangent.x, y: n.tangent.y, z: n.tangent.z } } };
      }
    }
    return best;
  };

  Octopus.prototype.attachLine = function (rope, near) {
    this.line = rope;
    this.lineT = near.t;
    this.lineEntryT = near.t;      // where the crossing started, for scoring
    this.state = 'line';
    this.tilt = clamp((Math.random() - 0.5) * 0.25, -0.2, 0.2);
    this.tiltVel = 0;
    this.lineSpeed = 0;
    // face along the rope, in whichever direction we were already heading
    var tan = near.tangent;
    var dot = this.vel.x * tan.x + this.vel.z * tan.z;
    this.lineDir = dot >= 0 ? 1 : -1;
    this.vel.x = this.vel.y = this.vel.z = 0;
    this.game.audio && this.game.audio.play('grab');
    this.game.onLineAttach && this.game.onLineAttach(rope);
  };

  Octopus.prototype.detachLine = function (launchVel, cooldown) {
    if (!this.line) return;
    // Crossing a rope is the game's core act, so it is also its repeatable
    // reward. Scored on the way off, and only if most of the span was
    // actually walked — falling off in the middle pays nothing.
    var span = Math.abs(this.lineT - (this.lineEntryT === undefined ? this.lineT : this.lineEntryT));
    if (span > 0.55 && this.game.awardXp) {
      this.game.awardXp(Math.round(OCTO.progress.XP.lineCross * span), 'crossing');
    }
    this.lineEntryT = undefined;
    this.line = null;
    // Long enough that a fall reads as a fall — without it the auto-grab
    // catches the same rope again on the way past.
    this.lineCooldown = cooldown === undefined ? 0.35 : cooldown;
    this.state = 'air';
    if (launchVel) { this.vel.x = launchVel.x; this.vel.y = launchVel.y; this.vel.z = launchVel.z; }
  };

  Octopus.prototype._updateLine = function (dt, input, camera) {
    var rope = this.line;
    if (!rope) { this.state = 'air'; return; }
    var move = input.moveAxis(this._tmp2);
    this.gripping = input.held('grip');

    // ---- travel along the rope
    var sprint = input.held('sprint');
    var target = move.y * (sprint ? this.tune.lineSprintSpeed : this.tune.lineWalkSpeed);
    // A steep rope lets you zip: gravity assists in the downhill direction.
    var tan = rope.tangentAt(this.lineT, this._tmp);
    var slope = tan.y;
    var facingSign = this.lineDir;
    var downhill = -slope * facingSign;
    if (sprint && Math.abs(slope) > 0.08) target += downhill * this.tune.lineZipSpeed;
    this.lineSpeed = damp(this.lineSpeed, target, 6, dt);

    var len = Math.max(1, rope.length);
    this.lineT += (this.lineSpeed * facingSign * dt) / len;

    // ---- balance: an inverted pendulum you keep upright with A/D
    var wind = this.game.windStrength || 0;
    var jitter = (this.balanceNoise.value2(this.noiseT * 1.6, rope.id * 3.1) - 0.5);
    var destab = Math.sin(this.tilt) * 6.2;
    destab += jitter * (1.4 + wind * 2.2);
    destab *= this.tune.destabilise;
    destab += Math.abs(this.lineSpeed) * 0.35 * Math.sin(this.noiseT * 7.0);
    if (this.carry) destab *= 1.35;
    this.tiltVel += destab * dt;
    this.tiltVel -= move.x * this.tune.balanceControl * dt;
    if (this.gripping) {
      this.tiltVel *= Math.exp(-7.5 * dt);
      this.tilt *= Math.exp(-2.6 * dt);
      this.lineSpeed *= Math.exp(-3.0 * dt);
    }
    this.tiltVel *= Math.exp(-0.9 * dt);
    this.tilt += this.tiltVel * dt;

    if (Math.abs(this.tilt) > 1.15) {
      // lost it — peel off the line sideways
      var side = this._lineSide(rope, this.lineT);
      this.detachLine({
        x: side.x * Math.sign(this.tilt) * 2.2,
        y: -0.5,
        z: side.z * Math.sign(this.tilt) * 2.2
      }, 1.4);
      this.enterRagdoll(1.2);
      this.game.onLineFall && this.game.onLineFall();
      return;
    }

    // ---- load the rope so it visibly sags under us
    var n = rope.verlet.p.length;
    // A Tank genuinely bends the rope further than an Archer does.
    rope.load = { index: Math.round(clamp(this.lineT, 0, 1) * (n - 1)), weight: this.tune.lineWeight };

    // ---- ends of the rope: step off onto the anchor
    if (this.lineT <= 0.001 || this.lineT >= 0.999) {
      var end = rope.sample(clamp(this.lineT, 0, 1), this._tmp);
      this.pos.x = end.x; this.pos.y = end.y + 0.1; this.pos.z = end.z;
      var t2 = rope.tangentAt(clamp(this.lineT, 0, 1), this._tmp2);
      this.detachLine({ x: t2.x * facingSign * 3.2, y: 3.2, z: t2.z * facingSign * 3.2 });
      return;
    }

    // ---- jump off
    if (input.hit('jump')) {
      var t3 = rope.tangentAt(this.lineT, this._tmp2);
      this.detachLine({
        x: t3.x * facingSign * Math.abs(this.lineSpeed) + Math.sin(this.yaw) * 2,
        y: this.tune.jumpVelocity * 0.95,
        z: t3.z * facingSign * Math.abs(this.lineSpeed) + Math.cos(this.yaw) * 2
      });
      this.stats.jumps++;
      this.game.audio && this.game.audio.play('jump');
      return;
    }
    if (input.hit('wobble')) {
      this.detachLine({ x: 0, y: 1.0, z: 0 });
      this.enterRagdoll(1.0);
      return;
    }

    // ---- place the body on the rope, rolled by the current tilt
    var p = rope.sample(this.lineT, this._tmp);
    var side = this._lineSide(rope, this.lineT);
    var stand = 0.10;
    var lean = Math.sin(this.tilt);
    var up = Math.cos(this.tilt);
    this.pos.x = p.x + side.x * lean * 0.55;
    this.pos.y = p.y + stand * up;
    this.pos.z = p.z + side.z * lean * 0.55;
    var tanNow = rope.tangentAt(this.lineT, this._tmp2);
    this.yaw = U.dampAngle(this.yaw, Math.atan2(tanNow.x * facingSign, tanNow.z * facingSign), 12, dt);
    this.vel.x = tanNow.x * this.lineSpeed * facingSign;
    this.vel.z = tanNow.z * this.lineSpeed * facingSign;
    this.vel.y = 0;
    this.speed = Math.abs(this.lineSpeed);
    if (move.y < -0.1) this.lineDir = -facingSign === 0 ? 1 : this.lineDir; // keep direction stable
  };

  /** Horizontal vector perpendicular to the rope at t. */
  Octopus.prototype._lineSide = function (rope, t) {
    var tan = rope.tangentAt(t, this._tmp2);
    var sx = -tan.z, sz = tan.x;
    var l = Math.sqrt(sx * sx + sz * sz) || 1;
    return { x: sx / l, y: 0, z: sz / l };
  };

  /* ----------------------------------------------------------- ragdoll */

  Octopus.prototype.enterRagdoll = function (duration) {
    if (this.state === 'ragdoll') { this.ragdollTimer = Math.max(this.ragdollTimer, duration); return; }
    this.detachLine();
    this.state = 'ragdoll';
    this.ragdollTimer = duration || 1.2;
    this.wobble = 1;
    this.bodyTiltVel.x += (Math.random() - 0.5) * 9;
    this.bodyTiltVel.z += (Math.random() - 0.5) * 9;
    this.dropCarry();
    this.game.audio && this.game.audio.play('splat');
  };

  Octopus.prototype._updateRagdoll = function (dt, input) {
    this.ragdollTimer -= dt;
    this.vel.y += GRAVITY * dt;
    if (this.vel.y < this.tune.maxFallSpeed) this.vel.y = this.tune.maxFallSpeed;
    this._integrateAndCollide(dt);
    if (this.grounded) {
      var f = Math.exp(-6.5 * dt);
      this.vel.x *= f; this.vel.z *= f;
    }
    this.wobble = 1;
    this.bodyTiltVel.x *= Math.exp(-1.4 * dt);
    this.bodyTiltVel.z *= Math.exp(-1.4 * dt);
    var canGetUp = this.grounded && Math.abs(this.vel.x) + Math.abs(this.vel.z) < 3.5;
    if ((this.ragdollTimer <= 0 && canGetUp) || (input && input.hit('jump') && canGetUp && this.ragdollTimer <= 0.4)) {
      this.state = 'ground';
      this.wobble = 0.4;
      this.squash = 0.75;
    }
  };

  /* ----------------------------------------------------------- carrying */

  Octopus.prototype.tryGrab = function (props, reach) {
    if (this.carry) { this.dropCarry(true); return null; }
    reach = reach || 2.0;
    var best = null, bestD = reach * reach;
    for (var i = 0; i < props.length; i++) {
      var p = props[i];
      if (!p.alive || p.held || p.kind === 'static') continue;
      var dx = p.pos.x - this.pos.x, dy = p.pos.y - (this.pos.y + 0.7), dz = p.pos.z - this.pos.z;
      var d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < bestD) { bestD = d2; best = p; }
    }
    if (best) {
      best.held = true;
      this.carry = best;
      this.game.audio && this.game.audio.play('grab');
    }
    return best;
  };

  Octopus.prototype.dropCarry = function (thrown) {
    if (!this.carry) return null;
    var p = this.carry;
    p.held = false;
    p.sleep = 0;
    if (thrown) {
      var f = this.forward(this._tmp);
      p.impulse(f.x * 8 + this.vel.x, 4.2, f.z * 8 + this.vel.z);
    } else {
      p.impulse(this.vel.x * 0.5, 0.5, this.vel.z * 0.5);
    }
    this.carry = null;
    return p;
  };

  Octopus.prototype.updateCarry = function (dt) {
    if (!this.carry) return;
    var f = this.forward(this._tmp);
    var tx = this.pos.x + f.x * this.carryOffset.z;
    var ty = this.pos.y + this.carryOffset.y + Math.sin(this.game.time * 3) * 0.03;
    var tz = this.pos.z + f.z * this.carryOffset.z;
    var p = this.carry;
    p.pos.x = damp(p.pos.x, tx, 18, dt);
    p.pos.y = damp(p.pos.y, ty, 18, dt);
    p.pos.z = damp(p.pos.z, tz, 18, dt);
    p.rot = U.dampAngle(p.rot, this.yaw, 12, dt);
    p.vel.x = p.vel.y = p.vel.z = 0;
  };

  /* ------------------------------------------------------ body motion */

  Octopus.prototype._updateBodyMotion = function (dt) {
    this.squash = damp(this.squash, 1, 9, dt);
    this.visualYaw = U.dampAngle(this.visualYaw, this.yaw, 14, dt);

    // lean into acceleration, wobble like jelly
    var targetLeanX = clamp(-this.vel.x * 0.030, -0.42, 0.42);
    var targetLeanZ = clamp(-this.vel.z * 0.030, -0.42, 0.42);
    if (this.state === 'ragdoll') { targetLeanX = 0; targetLeanZ = 0; }
    var k = 26 * (1 - this.wobble * 0.72);
    var d = 2.0 + (1 - this.wobble) * 5.0;
    this.bodyTiltVel.x += (targetLeanX - this.bodyTilt.x) * k * dt;
    this.bodyTiltVel.z += (targetLeanZ - this.bodyTilt.z) * k * dt;
    this.bodyTiltVel.x *= Math.exp(-d * dt);
    this.bodyTiltVel.z *= Math.exp(-d * dt);
    this.bodyTilt.x += this.bodyTiltVel.x * dt;
    this.bodyTilt.z += this.bodyTiltVel.z * dt;
    this.bodyTilt.x = clamp(this.bodyTilt.x, -1.5, 1.5);
    this.bodyTilt.z = clamp(this.bodyTilt.z, -1.5, 1.5);

    var moving = this.speed > 0.4 && (this.state === 'ground' || this.state === 'line');
    this.bob += dt * (moving ? this.speed * 2.2 : 1.2);

    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) { this.blinkTimer = 2.4 + Math.random() * 3.5; this.blink = 0.18; }
    this.blink = Math.max(0, this.blink - dt);
  };

  /* -------------------------------------------------------- tentacles */

  Octopus.prototype._updateTentacles = function (dt) {
    var walking = (this.state === 'ground' || this.state === 'climb');
    var onLine = this.state === 'line';
    var floppy = this.state === 'air' || this.state === 'ragdoll' || this.wobble > 0.6;

    var gaitSpeed = clamp(this.speed / this.tune.walkSpeed, 0, 1.7);
    this.gaitTime += dt * (0.9 + gaitSpeed * 2.6);

    var cy = Math.cos(this.visualYaw), sy = Math.sin(this.visualYaw);
    var stride = clamp(this.speed * 0.22, 0, 1.1);

    for (var i = 0; i < TENTACLES; i++) {
      var t = this.tentacles[i];
      var v = t.verlet;
      var pts = v.p;

      // socket follows the body
      var la = t.angle;
      var ox = Math.cos(la) * SOCKET_R, oz = Math.sin(la) * SOCKET_R;
      var wx = ox * cy + oz * sy;
      var wz = -ox * sy + oz * cy;
      var root = pts[0];
      root.x = this.pos.x + wx;
      root.y = this.pos.y + SOCKET_Y + Math.sin(this.bob + i) * 0.02;
      root.z = this.pos.z + wz;
      root.pinned = true;

      var tip = pts[SEGMENTS - 1];

      if (onLine) {
        // wrap the tips around the rope, alternating fore and aft
        var rope = this.line;
        var off = ((i % 2) === 0 ? 1 : -1) * (0.22 + (i >> 1) * 0.16);
        var tt = clamp(this.lineT + off / Math.max(rope.length, 1), 0, 1);
        var rp = rope.sample(tt, this._tmp);
        var side = this._lineSide(rope, tt);
        var lateral = (i < 4 ? 1 : -1) * 0.13;
        tip.pinned = true;
        tip.x = rp.x + side.x * lateral;
        tip.y = rp.y - 0.06;
        tip.z = rp.z + side.z * lateral;
        t.grounded = true;
      } else if (walking && !floppy) {
        // ---- gait: alternate stepping, plant on real geometry
        var phase = (this.gaitTime * 0.55 + t.phase) % 1;
        var stepping = phase < 0.34;
        if (stepping && t.planted) {
          t.planted = false;
          t.prevFoot.x = t.foot.x; t.prevFoot.y = t.foot.y; t.prevFoot.z = t.foot.z;
          var reach = 0.78 + stride;
          var ax = Math.cos(la) * reach, az = Math.sin(la) * reach;
          var fx = ax * cy + az * sy, fz = -ax * sy + az * cy;
          var tx = this.pos.x + fx + this.vel.x * 0.16;
          var tz = this.pos.z + fz + this.vel.z * 0.16;
          var gy = this.world.groundHeight(tx, this.pos.y + 0.9, tz, 2.4);
          if (!isFinite(gy)) gy = this.pos.y;
          t.nextFoot.x = tx; t.nextFoot.y = gy + 0.04; t.nextFoot.z = tz;
          t.stepT = 0;
        } else if (!stepping) {
          t.planted = true;
        }
        if (t.stepT < 1) {
          t.stepT = clamp(t.stepT + dt * (2.6 + gaitSpeed * 4.5), 0, 1);
          var e = U.smoothstep(0, 1, t.stepT);
          t.foot.x = U.lerp(t.prevFoot.x, t.nextFoot.x, e);
          t.foot.z = U.lerp(t.prevFoot.z, t.nextFoot.z, e);
          t.foot.y = U.lerp(t.prevFoot.y, t.nextFoot.y, e) + Math.sin(e * Math.PI) * this.tune.stepHeight * (0.4 + gaitSpeed * 0.6);
        }
        tip.pinned = true;
        tip.x = t.foot.x; tip.y = t.foot.y; tip.z = t.foot.z;
        t.grounded = true;
      } else {
        // ---- floppy: let it dangle and flail
        tip.pinned = false;
        t.grounded = false;
        t.planted = false;
        t.stepT = 1;
        var flail = this.state === 'ragdoll' ? 5.5 : 2.4;
        var ph = this.game.time * 3.4 + i * 0.9;
        v.addForce(SEGMENTS - 1, Math.sin(ph) * flail, Math.cos(ph * 1.3) * flail * 0.4, Math.cos(ph) * flail);
        // reach out toward the direction of travel when falling
        v.addForce(SEGMENTS - 2, -this.vel.x * 0.5, 0, -this.vel.z * 0.5);
      }

      // A pinned tip must stay within reach of its socket. Any bad target —
      // a stale gait goal, a rope that moved, a teleport mid-step — would
      // otherwise draw the limb as a spike across the world.
      if (tip.pinned) {
        var rx = tip.x - root.x, ry = tip.y - root.y, rz = tip.z - root.z;
        var rl = Math.sqrt(rx * rx + ry * ry + rz * rz);
        if (rl > MAX_REACH) {
          var s = MAX_REACH / rl;
          tip.x = root.x + rx * s;
          tip.y = root.y + ry * s;
          tip.z = root.z + rz * s;
        }
      }

      // gentle arch so planted limbs bow outward instead of sagging flat
      if (t.grounded && !floppy) {
        for (var m = 1; m < SEGMENTS - 1; m++) {
          var w = Math.sin((m / (SEGMENTS - 1)) * Math.PI);
          v.addForce(m, wx * 3.0 * w, 11 * w, wz * 3.0 * w);
        }
      }

      v.integrate(dt, floppy ? 1 : 0.55);
      v.solve(4);
    }
  };

  /* ------------------------------------------------------------ render */

  var _m = null;
  /** Rebuild the octopus mesh in world space. Called once per frame. */
  Octopus.prototype.buildMesh = function (renderer, quality) {
    var mb = this.builder.reset();
    if (this.form === 'human') {
      OCTO.avatar.buildHuman(mb, this, quality);
      var hd = mb.build();
      if (!this.mesh) this.mesh = renderer.createMesh(hd.verts, hd.indices, true);
      else this.mesh.update(hd.verts, hd.indices);
      if (!_m) _m = M4.create();
      return { mesh: this.mesh, model: _m };
    }
    var skin = this.skin;
    var wob = this.wobble;

    var cx = this.pos.x, cy = this.pos.y, cz = this.pos.z;
    var bodyY = cy + 0.74 * this.squash;
    var squash = this.squash;
    var stretch = 1 / Math.sqrt(squash);

    mb.identity();
    mb.translate(cx, bodyY, cz);
    mb.rotateY(this.visualYaw);
    mb.rotateX(this.bodyTilt.z * (1 + wob * 0.8));
    mb.rotateZ(-this.bodyTilt.x * (1 + wob * 0.8));

    // ---- mantle
    mb.mat({ cell: CELL.NONE, color: skin.body, roughness: 0.55, emissive: 0 });
    mb.push();
    mb.scale(stretch, squash, stretch);
    mb.push().translate(0, 0.30, -0.02).sphere(0.52, quality.bodySegs, quality.bodyRings, { yScale: 1.22 }).pop();
    // mantle tip — the pointed hood at the back
    mb.push().translate(0, 0.62, -0.30).rotateX(-0.5).sphere(0.24, quality.bodySegs, 6, { yScale: 1.7 }).pop();
    // head/face lobe
    mb.push().translate(0, 0.02, 0.06).sphere(0.44, quality.bodySegs, quality.bodyRings, { yScale: 0.86 }).pop();
    // underside mouth ring
    mb.mat({ color: skin.accent, roughness: 0.7 });
    mb.push().translate(0, -0.30, 0.06).sphere(0.22, 10, 6, { yScale: 0.55 }).pop();
    mb.pop();

    // ---- eyes: horizontal slit pupils, the octopus signature
    var eyeOpen = 1 - clamp(this.blink / 0.18, 0, 1) * 0.92;
    for (var s = -1; s <= 1; s += 2) {
      mb.push();
      mb.translate(s * 0.27, 0.20, 0.30);
      mb.rotateY(s * 0.30);
      mb.mat({ cell: CELL.NONE, color: skin.body, roughness: 0.5 });
      mb.push().scale(1, 1.05, 1).sphere(0.19, 10, 8).pop();
      mb.mat({ color: skin.eye, roughness: 0.22 });
      mb.push().translate(0, 0.02, 0.10).scale(1, eyeOpen, 1).sphere(0.145, 10, 8, { yScale: 0.9 }).pop();
      mb.mat({ color: [0.05, 0.04, 0.06], roughness: 0.15 });
      mb.push().translate(0, 0.02, 0.20).scale(1, eyeOpen, 1).box(0.17, 0.052, 0.06).pop();
      mb.pop();
    }
    // brow ridges
    mb.mat({ cell: CELL.NONE, color: skin.body, roughness: 0.6 });
    for (var b = -1; b <= 1; b += 2) {
      mb.push().translate(b * 0.27, 0.37, 0.24).rotateZ(b * 0.4).sphere(0.10, 8, 5, { yScale: 0.55 }).pop();
    }

    // ---- cosmetic hat
    this._buildHat(mb, quality);
    mb.identity();

    // ---- tentacles, drawn in world space from the verlet chains
    var taper = quality.tentacleSides;
    for (var i = 0; i < TENTACLES; i++) {
      var t = this.tentacles[i];
      var pts = t.verlet.p;
      var col = i % 2 === 0 ? skin.body : blend(skin.body, skin.accent, 0.22);
      mb.mat({ cell: CELL.NONE, color: col, roughness: 0.6, emissive: 0 });
      mb.tube(pts, tentacleRadius, taper, { vScale: 3 });
      if (quality.suckers) {
        mb.mat({ color: skin.accent, roughness: 0.45 });
        for (var k = 2; k < SEGMENTS - 1; k += 2) {
          var p0 = pts[k], p1 = pts[k + 1] || pts[k];
          var dx = p1.x - p0.x, dy = p1.y - p0.y, dz = p1.z - p0.z;
          var l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
          // offset onto the underside of the limb
          var sx = -dz / l, sz = dx / l;
          var r = tentacleRadius(k / (SEGMENTS - 1), k) * 0.62;
          mb.push().translate(p0.x + sx * r * 0.5, p0.y - r * 0.8, p0.z + sz * r * 0.5)
            .sphere(r * 0.62, 6, 4, { yScale: 0.5 }).pop();
        }
      }
    }

    var data = mb.build();
    if (!this.mesh) this.mesh = renderer.createMesh(data.verts, data.indices, true);
    else this.mesh.update(data.verts, data.indices);
    if (!_m) _m = M4.create();
    return { mesh: this.mesh, model: _m, alwaysVisible: false };
  };

  function tentacleRadius(t) {
    // fat at the base, whip-thin at the tip
    return 0.155 * Math.pow(1 - t, 0.72) + 0.022;
  }

  function blend(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  Octopus.prototype._buildHat = function (mb, quality) {
    var hat = this.skin.hat;
    if (!hat || hat === 'none') return;
    mb.push();
    mb.translate(0, 0.72, 0.02);
    if (hat === 'tarbush') {
      // felt fez with a tassel
      mb.mat({ cell: CELL.NONE, color: [0.62, 0.10, 0.12], roughness: 0.85, emissive: 0 });
      mb.push().translate(0, 0.16, 0).cylinder(0.30, 0.27, 0.34, 14).pop();
      mb.mat({ color: [0.12, 0.12, 0.14], roughness: 0.7 });
      mb.push().translate(0, 0.33, 0).cylinder(0.29, 0.29, 0.03, 14).pop();
      mb.mat({ color: [0.92, 0.78, 0.30], roughness: 0.5 });
      mb.push().translate(0.06, 0.20, 0.18).sphere(0.05, 7, 5).pop();
    } else if (hat === 'ghutra') {
      // headcloth with a doubled black cord
      mb.mat({ cell: CELL.NONE, color: [0.94, 0.92, 0.86], roughness: 0.95, emissive: 0 });
      mb.push().translate(0, 0.06, -0.04).sphere(0.50, 12, 8, { yScale: 0.62 }).pop();
      mb.push().translate(0, -0.10, -0.34).rotateX(0.5).box(0.62, 0.42, 0.10).pop();
      mb.mat({ color: [0.10, 0.10, 0.12], roughness: 0.6 });
      mb.push().translate(0, 0.16, 0).cylinder(0.42, 0.42, 0.05, 14, { capTop: false, capBottom: false }).pop();
      mb.push().translate(0, 0.24, 0).cylinder(0.40, 0.40, 0.05, 14, { capTop: false, capBottom: false }).pop();
    } else if (hat === 'helmet') {
      // sky-diver bubble
      mb.mat({ cell: CELL.NONE, color: [0.72, 0.88, 0.95], roughness: 0.1, emissive: 0.05 });
      mb.push().translate(0, 0.02, 0.04).sphere(0.58, 14, 10).pop();
      mb.mat({ cell: CELL.METAL, color: [1, 1, 1], roughness: 0.3, uvScale: 1.4, emissive: 0 });
      mb.push().translate(0, -0.22, 0).cylinder(0.50, 0.54, 0.14, 14).pop();
    } else if (hat === 'crown') {
      // Neo-Falak circuit crown
      mb.mat({ cell: CELL.NONE, color: [0.98, 0.82, 0.34], roughness: 0.25, emissive: 0.25 });
      mb.push().translate(0, 0.16, 0).cylinder(0.34, 0.34, 0.10, 12, { capTop: false, capBottom: false }).pop();
      for (var i = 0; i < 6; i++) {
        var a = (i / 6) * TAU;
        mb.push().translate(Math.cos(a) * 0.32, 0.28, Math.sin(a) * 0.32).rotateY(-a)
          .cylinder(0.05, 0.005, 0.24, 5).pop();
      }
      mb.mat({ color: [0.4, 1.0, 1.0], emissive: 1.2, roughness: 0.1 });
      mb.push().translate(0, 0.30, 0.30).sphere(0.06, 8, 6).pop();
    }
    mb.pop();
  };

  /* ------------------------------------------------------------ camera */

  function Camera(player, opts) {
    opts = opts || {};
    this.player = player;
    this.yaw = player.yaw;
    this.pitch = 0.22;
    this.distance = 6.4;
    this.targetDistance = 6.4;
    this.minDistance = 1.4;
    this.maxDistance = 13;
    this.pos = { x: 0, y: 0, z: 0 };
    this.target = { x: 0, y: 0, z: 0 };
    this.up = { x: 0, y: 1, z: 0 };
    this.fov = 62 * OCTO.DEG;
    this.baseFov = 62 * OCTO.DEG;
    this.near = 0.08;
    this.far = 900;
    this.shake = 0;
    this.shakeTime = 0;
    // A portrait phone sees far less of the world horizontally than a desktop
    // window; pulling the camera back keeps the octopus and its footing in view.
    this.aspectBoost = 1;
    this.free = false;
    this.freePos = { x: 0, y: 0, z: 0 };
    this._look = { x: 0, y: 0 };
    this._smoothTarget = { x: player.pos.x, y: player.pos.y + 1.2, z: player.pos.z };
  }

  Camera.prototype.update = function (dt, input, world) {
    var look = input.lookDelta(this._look);
    this.yaw -= look.x;
    this.pitch = clamp(this.pitch + look.y, -0.85, 1.15);
    if (input.mouse.wheel) this.targetDistance = clamp(this.targetDistance + input.mouse.wheel * 0.9, this.minDistance, this.maxDistance);
    if (input.held('camNear')) this.targetDistance = clamp(this.targetDistance - dt * 6, this.minDistance, this.maxDistance);
    if (input.held('camFar')) this.targetDistance = clamp(this.targetDistance + dt * 6, this.minDistance, this.maxDistance);

    var p = this.player;

    if (this.free) {
      // photo mode: fly the camera, ignore the player
      var move = input.moveAxis({ x: 0, y: 0 });
      var sp = (input.held('sprint') ? 26 : 9) * dt;
      var fx = Math.sin(this.yaw) * Math.cos(this.pitch), fy = -Math.sin(this.pitch), fz = Math.cos(this.yaw) * Math.cos(this.pitch);
      var rx = -Math.cos(this.yaw), rz = Math.sin(this.yaw);   // see _updateWalk
      this.freePos.x += (fx * move.y + rx * move.x) * sp;
      this.freePos.z += (fz * move.y + rz * move.x) * sp;
      this.freePos.y += (fy * move.y + (input.held('jump') ? 1 : 0) - (input.held('grip') ? 1 : 0)) * sp;
      this.pos.x = this.freePos.x; this.pos.y = this.freePos.y; this.pos.z = this.freePos.z;
      this.target.x = this.pos.x + fx; this.target.y = this.pos.y - Math.sin(this.pitch); this.target.z = this.pos.z + fz;
      return;
    }

    // follow target with a little lag, and lift when looking down
    var ty = p.pos.y + 1.15 + (p.state === 'ragdoll' ? -0.35 : 0);
    var lag = p.state === 'line' ? 12 : 16;
    this._smoothTarget.x = damp(this._smoothTarget.x, p.pos.x, lag, dt);
    this._smoothTarget.y = damp(this._smoothTarget.y, ty, 9, dt);
    this._smoothTarget.z = damp(this._smoothTarget.z, p.pos.z, lag, dt);

    this.distance = damp(this.distance, this.targetDistance * this.aspectBoost, 8, dt);

    var cp = Math.cos(this.pitch), sp2 = Math.sin(this.pitch);
    var dirX = Math.sin(this.yaw) * cp, dirY = sp2, dirZ = Math.cos(this.yaw) * cp;
    var want = {
      x: this._smoothTarget.x - dirX * this.distance,
      y: this._smoothTarget.y + dirY * this.distance + 0.35,
      z: this._smoothTarget.z - dirZ * this.distance
    };

    // pull the camera in when geometry gets between it and the octopus
    var toCam = { x: want.x - this._smoothTarget.x, y: want.y - this._smoothTarget.y, z: want.z - this._smoothTarget.z };
    var len = Math.sqrt(toCam.x * toCam.x + toCam.y * toCam.y + toCam.z * toCam.z) || 1;
    var nd = { x: toCam.x / len, y: toCam.y / len, z: toCam.z / len };
    var hit = world.raycast(this._smoothTarget, nd, len + 0.35);
    if (hit) {
      var d = Math.max(this.minDistance * 0.6, hit.t - 0.35);
      want.x = this._smoothTarget.x + nd.x * d;
      want.y = this._smoothTarget.y + nd.y * d;
      want.z = this._smoothTarget.z + nd.z * d;
    }

    this.pos.x = damp(this.pos.x, want.x, 18, dt);
    this.pos.y = damp(this.pos.y, want.y, 18, dt);
    this.pos.z = damp(this.pos.z, want.z, 18, dt);

    this.target.x = this._smoothTarget.x;
    this.target.y = this._smoothTarget.y;
    this.target.z = this._smoothTarget.z;

    // speed FOV + trauma shake
    var sp3 = Math.sqrt(p.vel.x * p.vel.x + p.vel.z * p.vel.z);
    var fovTarget = this.baseFov + clamp((sp3 - 6) * 0.012, 0, 0.22);
    this.fov = damp(this.fov, fovTarget, 6, dt);

    if (this.shake > 0.001) {
      this.shakeTime += dt * 34;
      var amp = this.shake * this.shake * 0.45;
      this.pos.x += Math.sin(this.shakeTime * 1.7) * amp;
      this.pos.y += Math.sin(this.shakeTime * 2.3 + 1.1) * amp;
      this.pos.z += Math.cos(this.shakeTime * 1.9) * amp;
      this.shake = Math.max(0, this.shake - dt * 1.8);
    }
  };

  Camera.prototype.addShake = function (amount) {
    this.shake = clamp(this.shake + amount, 0, 1.6);
  };

  OCTO.Octopus = Octopus;
  OCTO.Camera = Camera;
  OCTO.PLAYER_TUNING = TUNING;

})(typeof window !== 'undefined' ? window : globalThis);
