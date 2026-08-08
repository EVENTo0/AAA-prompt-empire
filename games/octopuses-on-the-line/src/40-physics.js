/* =====================================================================
 * OCTOPUSES ON THE LINE — 40-physics.js
 *
 *   World    — Y-rotated box colliders in a 3D spatial hash, sphere
 *              resolution and raycasts.
 *   Rope     — verlet chain with pinned ends. This is "the line": it
 *              sags under the player's weight, swings, and can be
 *              walked, slid and jumped from.
 *   Verlet   — generic point/constraint solver used by the octopus
 *              tentacles and the wobbly ragdoll.
 *   Prop     — light rigid body for crates, pearls and carryables.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var V3 = OCTO.V3, clamp = OCTO.util.clamp;
  var GRAVITY = -22.0; // heavier than real gravity; reads better at game scale

  /* --------------------------------------------------------------- world */

  function World(cellSize) {
    this.cell = cellSize || 8;
    this.boxes = [];
    this.grid = new Map();
    this.built = false;
    this.bounds = { min: { x: 1e9, y: 1e9, z: 1e9 }, max: { x: -1e9, y: -1e9, z: -1e9 } };
  }

  /**
   * Add a box collider. rot is a rotation about Y (radians).
   * cx/cy/cz is the CENTRE; hx/hy/hz are half-extents.
   */
  World.prototype.addBox = function (cx, cy, cz, hx, hy, hz, rot, tag) {
    rot = rot || 0;
    var c = Math.cos(rot), s = Math.sin(rot);
    // Conservative world AABB of the rotated box, for the broadphase.
    var ax = Math.abs(c) * hx + Math.abs(s) * hz;
    var az = Math.abs(s) * hx + Math.abs(c) * hz;
    var b = {
      x: cx, y: cy, z: cz, hx: hx, hy: hy, hz: hz,
      rot: rot, c: c, s: s, tag: tag || 'solid',
      minx: cx - ax, maxx: cx + ax, miny: cy - hy, maxy: cy + hy, minz: cz - az, maxz: cz + az
    };
    this.boxes.push(b);
    this.built = false;
    var bb = this.bounds;
    if (b.minx < bb.min.x) bb.min.x = b.minx;
    if (b.miny < bb.min.y) bb.min.y = b.miny;
    if (b.minz < bb.min.z) bb.min.z = b.minz;
    if (b.maxx > bb.max.x) bb.max.x = b.maxx;
    if (b.maxy > bb.max.y) bb.max.y = b.maxy;
    if (b.maxz > bb.max.z) bb.max.z = b.maxz;
    return b;
  };

  /** Convenience: a box whose base sits at y = baseY. */
  World.prototype.addBoxUp = function (cx, baseY, cz, sx, sy, sz, rot, tag) {
    return this.addBox(cx, baseY + sy / 2, cz, sx / 2, sy / 2, sz / 2, rot, tag);
  };

  World.prototype._key = function (ix, iy, iz) {
    // Pack three 11-bit cell coords (biased) into one integer key.
    return ((ix + 1024) & 2047) * 4194304 + ((iy + 256) & 511) * 8192 + ((iz + 1024) & 2047);
  };

  World.prototype.build = function () {
    this.grid.clear();
    var cs = this.cell;
    for (var i = 0; i < this.boxes.length; i++) {
      var b = this.boxes[i];
      var x0 = Math.floor(b.minx / cs), x1 = Math.floor(b.maxx / cs);
      var y0 = Math.floor(b.miny / cs), y1 = Math.floor(b.maxy / cs);
      var z0 = Math.floor(b.minz / cs), z1 = Math.floor(b.maxz / cs);
      for (var x = x0; x <= x1; x++) {
        for (var y = y0; y <= y1; y++) {
          for (var z = z0; z <= z1; z++) {
            var k = this._key(x, y, z);
            var arr = this.grid.get(k);
            if (!arr) { arr = []; this.grid.set(k, arr); }
            arr.push(b);
          }
        }
      }
    }
    this.built = true;
    return this;
  };

  var _scratch = [];
  var _seen = new Set();
  /** Gather colliders overlapping an AABB. Reuses one array — copy if kept. */
  World.prototype.query = function (minx, miny, minz, maxx, maxy, maxz) {
    if (!this.built) this.build();
    _scratch.length = 0;
    _seen.clear();
    var cs = this.cell;
    var x0 = Math.floor(minx / cs), x1 = Math.floor(maxx / cs);
    var y0 = Math.floor(miny / cs), y1 = Math.floor(maxy / cs);
    var z0 = Math.floor(minz / cs), z1 = Math.floor(maxz / cs);
    for (var x = x0; x <= x1; x++) {
      for (var y = y0; y <= y1; y++) {
        for (var z = z0; z <= z1; z++) {
          var arr = this.grid.get(this._key(x, y, z));
          if (!arr) continue;
          for (var i = 0; i < arr.length; i++) {
            var b = arr[i];
            if (_seen.has(b)) continue;
            _seen.add(b);
            if (b.maxx < minx || b.minx > maxx || b.maxy < miny || b.miny > maxy || b.maxz < minz || b.minz > maxz) continue;
            _scratch.push(b);
          }
        }
      }
    }
    return _scratch;
  };

  /**
   * Push a sphere out of every box it overlaps.
   * Writes the contact summary into `out` and mutates `p`.
   */
  var _hitNormal = { x: 0, y: 0, z: 0 };
  World.prototype.resolveSphere = function (p, r, out, iterations) {
    out = out || {};
    out.hit = false; out.grounded = false; out.ceiling = false;
    out.nx = 0; out.ny = 0; out.nz = 0; out.groundTag = null; out.wall = false;
    iterations = iterations || 3;
    for (var it = 0; it < iterations; it++) {
      var boxes = this.query(p.x - r, p.y - r, p.z - r, p.x + r, p.y + r, p.z + r);
      if (!boxes.length) break;
      var any = false;
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        // world -> box local (inverse Y rotation)
        var dx = p.x - b.x, dy = p.y - b.y, dz = p.z - b.z;
        var lx = dx * b.c + dz * -b.s;
        var lz = dx * b.s + dz * b.c;
        var ly = dy;
        var qx = clamp(lx, -b.hx, b.hx);
        var qy = clamp(ly, -b.hy, b.hy);
        var qz = clamp(lz, -b.hz, b.hz);
        var vx = lx - qx, vy = ly - qy, vz = lz - qz;
        var d2 = vx * vx + vy * vy + vz * vz;
        var nx, ny, nz, depth;
        if (d2 > 1e-10) {
          if (d2 >= r * r) continue;
          var d = Math.sqrt(d2);
          nx = vx / d; ny = vy / d; nz = vz / d;
          depth = r - d;
        } else {
          // Centre is inside the box: escape along the shallowest axis.
          var px = b.hx - Math.abs(lx), py = b.hy - Math.abs(ly), pz = b.hz - Math.abs(lz);
          if (px <= py && px <= pz) { nx = lx < 0 ? -1 : 1; ny = 0; nz = 0; depth = px + r; }
          else if (py <= pz) { nx = 0; ny = ly < 0 ? -1 : 1; nz = 0; depth = py + r; }
          else { nx = 0; ny = 0; nz = lz < 0 ? -1 : 1; depth = pz + r; }
        }
        // box local -> world
        var wnx = nx * b.c + nz * b.s;
        var wnz = nx * -b.s + nz * b.c;
        var wny = ny;
        p.x += wnx * depth; p.y += wny * depth; p.z += wnz * depth;
        any = true;
        out.hit = true;
        if (wny > 0.5) {
          out.grounded = true;
          out.groundTag = b.tag;
          if (wny > out.ny) { out.nx = wnx; out.ny = wny; out.nz = wnz; }
        } else if (wny < -0.5) {
          out.ceiling = true;
        } else {
          out.wall = true;
          if (out.ny <= 0) { out.nx = wnx; out.ny = wny; out.nz = wnz; }
        }
      }
      if (!any) break;
    }
    return out;
  };

  /** Slab raycast against every nearby OBB. Returns null or a hit record. */
  World.prototype.raycast = function (o, dir, maxDist, filter) {
    var minx = Math.min(o.x, o.x + dir.x * maxDist), maxx = Math.max(o.x, o.x + dir.x * maxDist);
    var miny = Math.min(o.y, o.y + dir.y * maxDist), maxy = Math.max(o.y, o.y + dir.y * maxDist);
    var minz = Math.min(o.z, o.z + dir.z * maxDist), maxz = Math.max(o.z, o.z + dir.z * maxDist);
    var boxes = this.query(minx - 0.1, miny - 0.1, minz - 0.1, maxx + 0.1, maxy + 0.1, maxz + 0.1);
    var best = null, bestT = maxDist;
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (filter && !filter(b)) continue;
      var dx = o.x - b.x, dz = o.z - b.z;
      var ox = dx * b.c + dz * -b.s, oz = dx * b.s + dz * b.c, oy = o.y - b.y;
      var rx = dir.x * b.c + dir.z * -b.s, rz = dir.x * b.s + dir.z * b.c, ry = dir.y;
      var t0 = 0, t1 = bestT, axis = -1, sgn = 1;
      var ok = true;
      var o3 = [ox, oy, oz], r3 = [rx, ry, rz], h3 = [b.hx, b.hy, b.hz];
      for (var a = 0; a < 3; a++) {
        if (Math.abs(r3[a]) < 1e-8) {
          if (o3[a] < -h3[a] || o3[a] > h3[a]) { ok = false; break; }
          continue;
        }
        var inv = 1 / r3[a];
        var ta = (-h3[a] - o3[a]) * inv, tb = (h3[a] - o3[a]) * inv;
        var s = -1;
        if (ta > tb) { var tmp = ta; ta = tb; tb = tmp; s = 1; }
        if (ta > t0) { t0 = ta; axis = a; sgn = s; }
        if (tb < t1) t1 = tb;
        if (t0 > t1) { ok = false; break; }
      }
      if (!ok || axis < 0 || t0 < 0 || t0 >= bestT) continue;
      bestT = t0;
      var ln = [0, 0, 0];
      ln[axis] = sgn;
      best = {
        t: t0, box: b,
        point: { x: o.x + dir.x * t0, y: o.y + dir.y * t0, z: o.z + dir.z * t0 },
        normal: { x: ln[0] * b.c + ln[2] * b.s, y: ln[1], z: ln[0] * -b.s + ln[2] * b.c }
      };
    }
    return best;
  };

  /** Height of the highest solid surface under a point, or -Infinity. */
  World.prototype.groundHeight = function (x, y, z, maxDrop) {
    var hit = this.raycast({ x: x, y: y + 0.2, z: z }, { x: 0, y: -1, z: 0 }, (maxDrop || 60) + 0.2);
    return hit ? hit.point.y : -Infinity;
  };

  /* -------------------------------------------------------------- verlet */

  /**
   * Generic verlet solver. Points hold current and previous positions;
   * constraints are distance links. Cheap, stable, and exactly the right
   * feel for tentacles and a wobbly ragdoll.
   */
  function Verlet() {
    this.p = [];       // {x,y,z, px,py,pz, pinned, r, damp, mass}
    this.c = [];       // {a,b,len,stiff}
    this.gravity = GRAVITY;
    this.damping = 0.986;
  }
  Verlet.prototype.point = function (x, y, z, o) {
    o = o || {};
    var pt = {
      x: x, y: y, z: z, px: x, py: y, pz: z,
      pinned: !!o.pinned, r: o.r === undefined ? 0 : o.r,
      damp: o.damp === undefined ? 1 : o.damp,
      mass: o.mass === undefined ? 1 : o.mass,
      ax: 0, ay: 0, az: 0, collide: o.collide !== false
    };
    this.p.push(pt);
    return pt;
  };
  Verlet.prototype.link = function (a, b, stiff, len) {
    var A = this.p[a], B = this.p[b];
    this.c.push({
      a: a, b: b,
      len: len === undefined ? Math.sqrt((A.x - B.x) * (A.x - B.x) + (A.y - B.y) * (A.y - B.y) + (A.z - B.z) * (A.z - B.z)) : len,
      stiff: stiff === undefined ? 1 : stiff
    });
    return this;
  };
  Verlet.prototype.addForce = function (i, x, y, z) {
    var p = this.p[i];
    p.ax += x; p.ay += y; p.az += z;
  };
  Verlet.prototype.integrate = function (dt, gravityScale) {
    var g = this.gravity * (gravityScale === undefined ? 1 : gravityScale);
    var dt2 = dt * dt;
    for (var i = 0; i < this.p.length; i++) {
      var p = this.p[i];
      if (p.pinned) { p.px = p.x; p.py = p.y; p.pz = p.z; p.ax = p.ay = p.az = 0; continue; }
      var vx = (p.x - p.px) * this.damping * p.damp;
      var vy = (p.y - p.py) * this.damping * p.damp;
      var vz = (p.z - p.pz) * this.damping * p.damp;
      p.px = p.x; p.py = p.y; p.pz = p.z;
      p.x += vx + p.ax * dt2;
      p.y += vy + (p.ay + g) * dt2;
      p.z += vz + p.az * dt2;
      p.ax = p.ay = p.az = 0;
    }
  };
  Verlet.prototype.solve = function (iterations) {
    iterations = iterations || 4;
    for (var it = 0; it < iterations; it++) {
      for (var i = 0; i < this.c.length; i++) {
        var l = this.c[i];
        var A = this.p[l.a], B = this.p[l.b];
        var dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z;
        var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 1e-9) continue;
        var diff = (d - l.len) / d * l.stiff * 0.5;
        var mx = dx * diff, my = dy * diff, mz = dz * diff;
        if (!A.pinned) { A.x += mx; A.y += my; A.z += mz; }
        if (!B.pinned) { B.x -= mx; B.y -= my; B.z -= mz; }
      }
    }
  };
  Verlet.prototype.collide = function (world, out) {
    for (var i = 0; i < this.p.length; i++) {
      var p = this.p[i];
      if (p.pinned || !p.collide || p.r <= 0) continue;
      world.resolveSphere(p, p.r, out || {}, 2);
    }
  };

  /* ---------------------------------------------------------------- rope */

  /**
   * "The line." A verlet chain pinned at both ends with a rest length a
   * little shorter than the anchor span, so it hangs in a believable
   * catenary and dips when the player steps on.
   */
  function Rope(a, b, opts) {
    opts = opts || {};
    this.a = { x: a.x, y: a.y, z: a.z };
    this.b = { x: b.x, y: b.y, z: b.z };
    this.id = opts.id || 0;
    this.name = opts.name || '';
    this.district = opts.district || '';
    this.radius = opts.radius || 0.075;
    this.kind = opts.kind || 'rope'; // rope | cable | wire
    this.zip = !!opts.zip;
    var span = V3.dist(a, b);
    this.segments = opts.segments || Math.max(8, Math.min(48, Math.round(span / 1.4)));
    this.slack = opts.slack === undefined ? 0.045 : opts.slack;
    this.stiff = opts.stiff === undefined ? 0.92 : opts.stiff;
    this.verlet = new Verlet();
    this.verlet.damping = 0.992;
    var n = this.segments;
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var p = this.verlet.point(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * span * this.slack,
        a.z + (b.z - a.z) * t,
        { pinned: i === 0 || i === n, collide: false }
      );
      p.rest = t;
    }
    var seg = span * (1 + this.slack * 0.9) / n;
    for (var j = 0; j < n; j++) this.verlet.link(j, j + 1, this.stiff, seg);
    this.span = span;
    this.load = null;      // {index, weight} applied by whoever is standing on it
    this.windPhase = Math.random() * 6.28;
    this.length = span;
  }

  Rope.prototype.update = function (dt, wind, time) {
    var v = this.verlet;
    var n = v.p.length;
    // wind + a little idle sway so the whole district feels alive
    var w = wind || 0;
    for (var i = 1; i < n - 1; i++) {
      var p = v.p[i];
      var s = Math.sin(time * 1.3 + this.windPhase + i * 0.5);
      var c = Math.cos(time * 0.9 + this.windPhase + i * 0.31);
      v.addForce(i, s * w * 0.9, c * w * 0.22, c * w * 0.9);
    }
    if (this.load) {
      var idx = clamp(this.load.index | 0, 0, n - 1);
      var spread = 2;
      for (var k = -spread; k <= spread; k++) {
        var ii = idx + k;
        if (ii <= 0 || ii >= n - 1) continue;
        var falloff = 1 - Math.abs(k) / (spread + 1);
        v.addForce(ii, 0, -this.load.weight * falloff, 0);
      }
    }
    v.integrate(dt, 1);
    v.solve(6);
    this.load = null;
    // cached arc length for parameterisation
    var total = 0;
    for (var m = 0; m < n - 1; m++) total += V3.dist(v.p[m], v.p[m + 1]);
    this.length = total;
  };

  /** Nearest point on the chain to p. Returns {dist, t, index, pos, tangent}. */
  var _cp = { x: 0, y: 0, z: 0 };
  Rope.prototype.nearest = function (p, out) {
    out = out || {};
    var v = this.verlet.p, n = v.length;
    var bestD = Infinity, bestI = 0, bestT = 0;
    for (var i = 0; i < n - 1; i++) {
      var t = OCTO.util.closestPointOnSegment(_cp, p, v[i], v[i + 1]);
      var d = V3.dist2(_cp, p);
      if (d < bestD) { bestD = d; bestI = i; bestT = t; }
    }
    var A = v[bestI], B = v[bestI + 1];
    out.dist = Math.sqrt(bestD);
    out.index = bestI;
    out.localT = bestT;
    out.t = (bestI + bestT) / (n - 1);
    out.pos = {
      x: A.x + (B.x - A.x) * bestT,
      y: A.y + (B.y - A.y) * bestT,
      z: A.z + (B.z - A.z) * bestT
    };
    var tx = B.x - A.x, ty = B.y - A.y, tz = B.z - A.z;
    var l = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
    out.tangent = { x: tx / l, y: ty / l, z: tz / l };
    return out;
  };

  /** Position at normalised parameter t (0..1 across the whole chain). */
  Rope.prototype.sample = function (t, out) {
    out = out || { x: 0, y: 0, z: 0 };
    var v = this.verlet.p, n = v.length - 1;
    var f = clamp(t, 0, 1) * n;
    var i = Math.min(n - 1, Math.floor(f));
    var lt = f - i;
    var A = v[i], B = v[i + 1];
    out.x = A.x + (B.x - A.x) * lt;
    out.y = A.y + (B.y - A.y) * lt;
    out.z = A.z + (B.z - A.z) * lt;
    return out;
  };

  Rope.prototype.tangentAt = function (t, out) {
    out = out || { x: 0, y: 0, z: 0 };
    var v = this.verlet.p, n = v.length - 1;
    var i = clamp(Math.floor(clamp(t, 0, 1) * n), 0, n - 1);
    var A = v[i], B = v[i + 1];
    return V3.norm(out, { x: B.x - A.x, y: B.y - A.y, z: B.z - A.z });
  };

  /** Points for rendering (the tube builder consumes this directly). */
  Rope.prototype.points = function () { return this.verlet.p; };

  /* --------------------------------------------------------------- props */

  /** A carryable/kickable box. Rotation is Y-only; tumble is cosmetic. */
  function Prop(x, y, z, opts) {
    opts = opts || {};
    this.pos = { x: x, y: y, z: z };
    this.vel = { x: 0, y: 0, z: 0 };
    this.rot = opts.rot || 0;
    this.rotVel = 0;
    this.tilt = 0; this.tiltVel = 0;
    this.size = opts.size || { x: 0.6, y: 0.6, z: 0.6 };
    this.radius = opts.radius || Math.max(this.size.x, this.size.z) * 0.55;
    this.kind = opts.kind || 'crate';
    this.mesh = opts.mesh || null;
    this.tint = opts.tint || null;
    this.held = false;
    this.grounded = false;
    this.sleep = 0;
    this.restitution = opts.restitution === undefined ? 0.25 : opts.restitution;
    this.tag = opts.tag || null;
    this.alive = true;
  }
  Prop.prototype.update = function (dt, world, contact) {
    if (this.held) { this.sleep = 0; return; }
    if (this.sleep > 1.2) return;
    this.vel.y += GRAVITY * dt;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.z += this.vel.z * dt;
    var before = this.pos.y;
    var c = world.resolveSphere(this.pos, this.radius, contact || {}, 2);
    if (c.hit) {
      if (c.grounded) {
        if (this.vel.y < -0.5) this.vel.y = -this.vel.y * this.restitution;
        else this.vel.y = 0;
        this.vel.x *= 0.82; this.vel.z *= 0.82;
        this.grounded = true;
      } else {
        // slide along the wall
        var d = this.vel.x * c.nx + this.vel.y * c.ny + this.vel.z * c.nz;
        if (d < 0) {
          this.vel.x -= c.nx * d * 1.4;
          this.vel.y -= c.ny * d * 1.4;
          this.vel.z -= c.nz * d * 1.4;
        }
        this.vel.x *= 0.9; this.vel.z *= 0.9;
      }
    } else {
      this.grounded = false;
    }
    this.rot += this.rotVel * dt;
    this.rotVel *= 0.96;
    this.tiltVel *= 0.94;
    this.tilt = this.tilt * 0.94 + this.tiltVel * dt;
    if (this.pos.y < -60) { this.alive = false; }
    var speed = Math.abs(this.vel.x) + Math.abs(this.vel.z) + Math.abs(this.vel.y);
    if (this.grounded && speed < 0.25) this.sleep += dt; else this.sleep = 0;
    if (Math.abs(this.pos.y - before) < 1e-6 && this.grounded) this.vel.y = 0;
  };
  Prop.prototype.impulse = function (x, y, z) {
    this.vel.x += x; this.vel.y += y; this.vel.z += z;
    this.rotVel += (x + z) * 0.35;
    this.sleep = 0;
  };

  OCTO.Physics = {
    World: World,
    Verlet: Verlet,
    Rope: Rope,
    Prop: Prop,
    GRAVITY: GRAVITY
  };

})(typeof window !== 'undefined' ? window : globalThis);
