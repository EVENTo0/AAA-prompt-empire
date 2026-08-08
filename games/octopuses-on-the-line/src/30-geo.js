/* =====================================================================
 * OCTOPUSES ON THE LINE — 30-geo.js
 * MeshBuilder: a transform-stack geometry writer producing interleaved
 * vertex buffers for the renderer, plus the primitive vocabulary the
 * world is built from — boxes, domes, pointed arches, mashrabiya bays,
 * palms, and tubes for the ropes and tentacles.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var M4 = OCTO.M4;
  var STRIDE = OCTO.gl.STRIDE_FLOATS;
  var CELL = OCTO.CELL;
  var TAU = OCTO.TAU;

  function MeshBuilder() {
    this.v = [];
    this.i = [];
    this.m = M4.create();
    this.stack = [];
    this.nm = new Float32Array(9);
    this.nmDirty = true;
    this.material = { cell: CELL.ADOBE, color: [1, 1, 1], emissive: 0, roughness: 0.85, uvScale: 1 };
    this._tmp = M4.create();
    this._tmp2 = M4.create();
  }

  MeshBuilder.prototype.reset = function () {
    this.v.length = 0; this.i.length = 0;
    M4.identity(this.m); this.stack.length = 0; this.nmDirty = true;
    return this;
  };
  MeshBuilder.prototype.isEmpty = function () { return this.i.length === 0; };

  /* --------------------------------------------------------- transforms */

  MeshBuilder.prototype.push = function () {
    this.stack.push(new Float32Array(this.m));
    return this;
  };
  MeshBuilder.prototype.pop = function () {
    var m = this.stack.pop();
    if (m) { M4.copy(this.m, m); this.nmDirty = true; }
    return this;
  };
  MeshBuilder.prototype.identity = function () { M4.identity(this.m); this.nmDirty = true; return this; };
  MeshBuilder.prototype.applyMatrix = function (mat) {
    M4.mul(this._tmp, this.m, mat); M4.copy(this.m, this._tmp); this.nmDirty = true; return this;
  };
  MeshBuilder.prototype.translate = function (x, y, z) {
    var t = M4.identity(this._tmp2);
    t[12] = x; t[13] = y; t[14] = z;
    return this.applyMatrix(t);
  };
  MeshBuilder.prototype.rotateY = function (a) {
    var t = M4.identity(this._tmp2), c = Math.cos(a), s = Math.sin(a);
    t[0] = c; t[2] = -s; t[8] = s; t[10] = c;
    return this.applyMatrix(t);
  };
  MeshBuilder.prototype.rotateX = function (a) {
    var t = M4.identity(this._tmp2), c = Math.cos(a), s = Math.sin(a);
    t[5] = c; t[6] = s; t[9] = -s; t[10] = c;
    return this.applyMatrix(t);
  };
  MeshBuilder.prototype.rotateZ = function (a) {
    var t = M4.identity(this._tmp2), c = Math.cos(a), s = Math.sin(a);
    t[0] = c; t[1] = s; t[4] = -s; t[5] = c;
    return this.applyMatrix(t);
  };
  MeshBuilder.prototype.scale = function (x, y, z) {
    if (y === undefined) { y = x; z = x; }
    var t = M4.identity(this._tmp2);
    t[0] = x; t[5] = y; t[10] = z;
    return this.applyMatrix(t);
  };

  /* ---------------------------------------------------------- materials */

  MeshBuilder.prototype.mat = function (o) {
    var m = this.material;
    if (o.cell !== undefined) m.cell = o.cell;
    if (o.color !== undefined) m.color = o.color;
    if (o.emissive !== undefined) m.emissive = o.emissive;
    if (o.roughness !== undefined) m.roughness = o.roughness;
    if (o.uvScale !== undefined) m.uvScale = o.uvScale;
    return this;
  };

  /* ------------------------------------------------------------ writing */

  MeshBuilder.prototype.vert = function (x, y, z, nx, ny, nz, u, vv) {
    if (this.nmDirty) { M4.normalMatrix(this.nm, this.m); this.nmDirty = false; }
    var m = this.m, nm = this.nm, mt = this.material, arr = this.v;
    var wx = m[0] * x + m[4] * y + m[8] * z + m[12];
    var wy = m[1] * x + m[5] * y + m[9] * z + m[13];
    var wz = m[2] * x + m[6] * y + m[10] * z + m[14];
    var ax = nm[0] * nx + nm[3] * ny + nm[6] * nz;
    var ay = nm[1] * nx + nm[4] * ny + nm[7] * nz;
    var az = nm[2] * nx + nm[5] * ny + nm[8] * nz;
    var l = Math.sqrt(ax * ax + ay * ay + az * az);
    // A degenerate normal becomes NaN once the shader normalises it, which
    // paints the whole primitive black. Fail safe to "up" instead.
    if (l < 1e-9) { ax = 0; ay = 1; az = 0; l = 1; }
    var c = mt.color, s = mt.uvScale;
    arr.push(wx, wy, wz, ax / l, ay / l, az / l, u * s, vv * s, mt.cell, c[0], c[1], c[2], mt.emissive, mt.roughness);
    return (arr.length / STRIDE) - 1;
  };
  MeshBuilder.prototype.tri = function (a, b, c) { this.i.push(a, b, c); return this; };
  MeshBuilder.prototype.quad = function (a, b, c, d) { this.i.push(a, b, c, a, c, d); return this; };

  MeshBuilder.prototype.build = function () {
    return { verts: new Float32Array(this.v), indices: new Uint32Array(this.i) };
  };
  MeshBuilder.prototype.toMesh = function (renderer, dynamic) {
    var d = this.build();
    return renderer.createMesh(d.verts, d.indices, dynamic);
  };

  /* --------------------------------------------------------- primitives */

  /** Axis-aligned box centred on the origin. */
  MeshBuilder.prototype.box = function (sx, sy, sz, o) {
    o = o || {};
    var hx = sx / 2, hy = sy / 2, hz = sz / 2;
    var self = this;
    // face: origin corner, two edge vectors, normal, uv extents
    function face(ox, oy, oz, ux, uy, uz, vx, vy, vz, nx, ny, nz, uw, vw) {
      var a = self.vert(ox, oy, oz, nx, ny, nz, 0, 0);
      var b = self.vert(ox + ux, oy + uy, oz + uz, nx, ny, nz, uw, 0);
      var c = self.vert(ox + ux + vx, oy + uy + vy, oz + uz + vz, nx, ny, nz, uw, vw);
      var d = self.vert(ox + vx, oy + vy, oz + vz, nx, ny, nz, 0, vw);
      self.quad(a, b, c, d);
    }
    var skip = o.skip || {};
    if (!skip.px) face(hx, -hy, hz, 0, 0, -sz, 0, sy, 0, 1, 0, 0, sz, sy);
    if (!skip.nx) face(-hx, -hy, -hz, 0, 0, sz, 0, sy, 0, -1, 0, 0, sz, sy);
    if (!skip.py) face(-hx, hy, hz, sx, 0, 0, 0, 0, -sz, 0, 1, 0, sx, sz);
    if (!skip.ny) face(-hx, -hy, -hz, sx, 0, 0, 0, 0, sz, 0, -1, 0, sx, sz);
    if (!skip.pz) face(-hx, -hy, hz, sx, 0, 0, 0, sy, 0, 0, 0, 1, sx, sy);
    if (!skip.nz) face(hx, -hy, -hz, -sx, 0, 0, 0, sy, 0, 0, 0, -1, sx, sy);
    return this;
  };

  /** Box whose base sits on y = 0. */
  MeshBuilder.prototype.boxUp = function (sx, sy, sz, o) {
    this.push().translate(0, sy / 2, 0).box(sx, sy, sz, o).pop();
    return this;
  };

  /** Horizontal plane facing +Y, centred, optionally subdivided. */
  MeshBuilder.prototype.plane = function (sx, sz, seg, o) {
    seg = seg || 1;
    var base = this.v.length / STRIDE;
    for (var j = 0; j <= seg; j++) {
      for (var i = 0; i <= seg; i++) {
        var u = i / seg, v = j / seg;
        var y = (o && o.heightFn) ? o.heightFn((u - 0.5) * sx, (v - 0.5) * sz) : 0;
        this.vert((u - 0.5) * sx, y, (v - 0.5) * sz, 0, 1, 0, u * sx, v * sz);
      }
    }
    for (var jj = 0; jj < seg; jj++) {
      for (var ii = 0; ii < seg; ii++) {
        var a = base + jj * (seg + 1) + ii;
        this.quad(a, a + seg + 1, a + seg + 2, a + 1);
      }
    }
    return this;
  };

  /** Cylinder/cone centred on the origin, axis +Y. */
  MeshBuilder.prototype.cylinder = function (rBottom, rTop, h, seg, o) {
    o = o || {};
    seg = seg || 12;
    var hy = h / 2, i;
    var ring0 = [], ring1 = [];
    var slope = (rBottom - rTop) / h;
    for (i = 0; i <= seg; i++) {
      var a = (i / seg) * TAU;
      var ca = Math.cos(a), sa = Math.sin(a);
      var ny = slope / Math.sqrt(1 + slope * slope);
      var nr = 1 / Math.sqrt(1 + slope * slope);
      var u = (i / seg) * Math.max(rBottom, rTop) * TAU;
      ring0.push(this.vert(ca * rBottom, -hy, sa * rBottom, ca * nr, ny, sa * nr, u, 0));
      ring1.push(this.vert(ca * rTop, hy, sa * rTop, ca * nr, ny, sa * nr, u, h));
    }
    for (i = 0; i < seg; i++) this.quad(ring0[i], ring0[i + 1], ring1[i + 1], ring1[i]);
    if (o.capTop !== false && rTop > 1e-5) {
      var ct = this.vert(0, hy, 0, 0, 1, 0, 0, 0);
      var top = [];
      for (i = 0; i <= seg; i++) {
        var at = (i / seg) * TAU;
        top.push(this.vert(Math.cos(at) * rTop, hy, Math.sin(at) * rTop, 0, 1, 0, Math.cos(at) * rTop, Math.sin(at) * rTop));
      }
      for (i = 0; i < seg; i++) this.tri(ct, top[i], top[i + 1]);
    }
    if (o.capBottom !== false && rBottom > 1e-5) {
      var cb = this.vert(0, -hy, 0, 0, -1, 0, 0, 0);
      var bot = [];
      for (i = 0; i <= seg; i++) {
        var ab = (i / seg) * TAU;
        bot.push(this.vert(Math.cos(ab) * rBottom, -hy, Math.sin(ab) * rBottom, 0, -1, 0, Math.cos(ab) * rBottom, Math.sin(ab) * rBottom));
      }
      for (i = 0; i < seg; i++) this.tri(cb, bot[i + 1], bot[i]);
    }
    return this;
  };

  /** UV sphere centred on the origin. yScale squashes it (octopus mantle). */
  MeshBuilder.prototype.sphere = function (r, seg, rings, o) {
    o = o || {};
    seg = seg || 16; rings = rings || 10;
    var ys = o.yScale === undefined ? 1 : o.yScale;
    var v0 = o.vStart === undefined ? 0 : o.vStart;
    var v1 = o.vEnd === undefined ? 1 : o.vEnd;
    var base = this.v.length / STRIDE, i, j;
    for (j = 0; j <= rings; j++) {
      var t = v0 + (v1 - v0) * (j / rings);
      var phi = t * Math.PI;
      var sp = Math.sin(phi), cp = Math.cos(phi);
      for (i = 0; i <= seg; i++) {
        var th = (i / seg) * TAU;
        var x = sp * Math.cos(th), y = cp, z = sp * Math.sin(th);
        this.vert(x * r, y * r * ys, z * r, x, y / (ys || 1), z, (i / seg) * r * 3, t * r * 3);
      }
    }
    for (j = 0; j < rings; j++) {
      for (i = 0; i < seg; i++) {
        var a = base + j * (seg + 1) + i;
        this.quad(a, a + 1, a + seg + 2, a + seg + 1);
      }
    }
    return this;
  };

  /**
   * Onion / bulbous dome — the silhouette that says "old quarter" instantly.
   * Profile is a superellipse-ish revolve with a slight point at the top.
   */
  MeshBuilder.prototype.dome = function (r, h, seg, rings, o) {
    o = o || {};
    seg = seg || 20; rings = rings || 12;
    var onion = o.onion === undefined ? 0.22 : o.onion;
    var base = this.v.length / STRIDE, i, j;
    // t 0..1 bottom->top; radius must reach 0 at the apex or the dome is open.
    function profile(t) {
      var a = t * Math.PI * 0.5;
      var rr = Math.cos(a) * (1 + onion * Math.sin(t * Math.PI) * 1.3);
      var hh = Math.pow(Math.sin(a), 0.82);
      return [rr, hh];
    }
    for (j = 0; j <= rings; j++) {
      var t = j / rings;
      var p = profile(t);
      // Central difference, clamped inside the domain: a one-sided difference
      // degenerates to a zero-length normal at the poles.
      var pa = profile(Math.max(0, t - 0.008)), pb = profile(Math.min(1, t + 0.008));
      var dr = (pb[0] - pa[0]) * r, dh = (pb[1] - pa[1]) * h;
      var nl = Math.sqrt(dr * dr + dh * dh) || 1;
      for (i = 0; i <= seg; i++) {
        var th = (i / seg) * TAU;
        var ca = Math.cos(th), sa = Math.sin(th);
        this.vert(ca * p[0] * r, p[1] * h, sa * p[0] * r,
          ca * (dh / nl), -(dr / nl), sa * (dh / nl),
          (i / seg) * r * 2.2, t * h * 2.2);
      }
    }
    for (j = 0; j < rings; j++) {
      for (i = 0; i < seg; i++) {
        var a2 = base + j * (seg + 1) + i;
        this.quad(a2, a2 + 1, a2 + seg + 2, a2 + seg + 1);
      }
    }
    if (o.finial !== false) {
      this.push().translate(0, h * 1.0, 0);
      this.cylinder(r * 0.05, r * 0.02, h * 0.22, 8);
      this.translate(0, h * 0.16, 0).sphere(r * 0.07, 8, 6);
      this.pop();
    }
    return this;
  };

  /**
   * A wall pierced by a two-centred pointed arch.
   * Emits front, back and the intrados (inner curved soffit).
   */
  MeshBuilder.prototype.archWall = function (wallW, wallH, depth, openW, openH, o) {
    o = o || {};
    var seg = o.seg || 14;
    var hw = wallW / 2, hd = depth / 2;
    var ow = openW / 2;
    // Two-centre arch: centres at ±c, radius R, springing at y = springY.
    var k = o.point === undefined ? 0.55 : o.point;
    var c = ow * k, R = ow + c;
    var springY = openH - Math.sqrt(R * R - c * c);
    if (springY < 0.15) springY = 0.15;
    var self = this;
    function curveY(x) {
      var ax = Math.abs(x);
      if (ax >= ow) return springY;
      var cc = (x >= 0) ? -c : c;
      var d = R * R - (x - cc) * (x - cc);
      return springY + (d > 0 ? Math.sqrt(d) : 0);
    }
    function facePlane(z, nz) {
      // side piers
      var pts = [];
      for (var i = 0; i <= seg; i++) {
        var x = -ow + (i / seg) * openW;
        pts.push({ x: x, y: Math.min(curveY(x), wallH) });
      }
      // left pier
      var a = self.vert(-hw, 0, z, 0, 0, nz, -hw, 0);
      var b = self.vert(-ow, 0, z, 0, 0, nz, -ow, 0);
      var cc2 = self.vert(-ow, wallH, z, 0, 0, nz, -ow, wallH);
      var d = self.vert(-hw, wallH, z, 0, 0, nz, -hw, wallH);
      if (nz > 0) self.quad(a, b, cc2, d); else self.quad(a, d, cc2, b);
      // right pier
      var e = self.vert(ow, 0, z, 0, 0, nz, ow, 0);
      var f = self.vert(hw, 0, z, 0, 0, nz, hw, 0);
      var g = self.vert(hw, wallH, z, 0, 0, nz, hw, wallH);
      var h2 = self.vert(ow, wallH, z, 0, 0, nz, ow, wallH);
      if (nz > 0) self.quad(e, f, g, h2); else self.quad(e, h2, g, f);
      // spandrel above the arch curve
      for (var j = 0; j < seg; j++) {
        var p0 = pts[j], p1 = pts[j + 1];
        var v0 = self.vert(p0.x, p0.y, z, 0, 0, nz, p0.x, p0.y);
        var v1 = self.vert(p1.x, p1.y, z, 0, 0, nz, p1.x, p1.y);
        var v2 = self.vert(p1.x, wallH, z, 0, 0, nz, p1.x, wallH);
        var v3 = self.vert(p0.x, wallH, z, 0, 0, nz, p0.x, wallH);
        if (nz > 0) self.quad(v0, v1, v2, v3); else self.quad(v0, v3, v2, v1);
      }
    }
    facePlane(hd, 1);
    facePlane(-hd, -1);
    // intrados: the inner surface of the opening
    var prev = null;
    for (var i2 = 0; i2 <= seg; i2++) {
      var x = -ow + (i2 / seg) * openW;
      var y = Math.min(curveY(x), wallH);
      var nx = 0, ny = -1;
      if (i2 > 0 && i2 < seg) {
        var xm = -ow + ((i2 - 1) / seg) * openW, xp = -ow + ((i2 + 1) / seg) * openW;
        var dy = curveY(xp) - curveY(xm), dx = xp - xm;
        var l = Math.sqrt(dx * dx + dy * dy) || 1;
        nx = dy / l; ny = -dx / l;
      } else { nx = (x < 0) ? 1 : -1; ny = 0; }
      var f0 = this.vert(x, y, hd, nx, ny, 0, x * 2, 0);
      var f1 = this.vert(x, y, -hd, nx, ny, 0, x * 2, depth);
      if (prev) this.quad(prev[0], f0, f1, prev[1]);
      prev = [f0, f1];
    }
    // jambs down the sides of the opening
    for (var s = -1; s <= 1; s += 2) {
      var xj = s * ow;
      var yj = springY;
      var j0 = this.vert(xj, 0, hd, -s, 0, 0, 0, 0);
      var j1 = this.vert(xj, 0, -hd, -s, 0, 0, depth, 0);
      var j2 = this.vert(xj, yj, -hd, -s, 0, 0, depth, yj);
      var j3 = this.vert(xj, yj, hd, -s, 0, 0, 0, yj);
      if (s > 0) this.quad(j0, j1, j2, j3); else this.quad(j0, j3, j2, j1);
    }
    // top cap
    var t0 = this.vert(-hw, wallH, hd, 0, 1, 0, -hw, 0);
    var t1 = this.vert(hw, wallH, hd, 0, 1, 0, hw, 0);
    var t2 = this.vert(hw, wallH, -hd, 0, 1, 0, hw, depth);
    var t3 = this.vert(-hw, wallH, -hd, 0, 1, 0, -hw, depth);
    this.quad(t0, t1, t2, t3);
    // outer side edges
    for (var s2 = -1; s2 <= 1; s2 += 2) {
      var xe = s2 * hw;
      var e0 = this.vert(xe, 0, hd, s2, 0, 0, 0, 0);
      var e1 = this.vert(xe, wallH, hd, s2, 0, 0, 0, wallH);
      var e2 = this.vert(xe, wallH, -hd, s2, 0, 0, depth, wallH);
      var e3 = this.vert(xe, 0, -hd, s2, 0, 0, depth, 0);
      if (s2 > 0) this.quad(e0, e1, e2, e3); else this.quad(e0, e3, e2, e1);
    }
    this.archSpringY = springY;
    return this;
  };

  /** Crenellated parapet — the stepped merlons of a desert rooftop. */
  MeshBuilder.prototype.parapet = function (w, d, h, merlonW, o) {
    o = o || {};
    var self = this;
    function run(len, axisX) {
      var n = Math.max(1, Math.floor(len / (merlonW * 2)));
      var step = len / n;
      for (var i = 0; i < n; i++) {
        var p = -len / 2 + step * (i + 0.5);
        self.push();
        if (axisX) self.translate(p, 0, 0); else self.translate(0, 0, p);
        self.boxUp(axisX ? step * 0.55 : 0.22, h, axisX ? 0.22 : step * 0.55);
        self.pop();
      }
    }
    this.push().translate(0, 0, d / 2); run(w, true); this.pop();
    this.push().translate(0, 0, -d / 2); run(w, true); this.pop();
    this.push().translate(w / 2, 0, 0); run(d, false); this.pop();
    this.push().translate(-w / 2, 0, 0); run(d, false); this.pop();
    return this;
  };

  /** Projecting mashrabiya oriel window with corbels. */
  MeshBuilder.prototype.mashrabiya = function (w, h, out, o) {
    o = o || {};
    var mCell = this.material.cell, mCol = this.material.color;
    this.mat({ cell: CELL.MASHRABIYA, color: [1, 1, 1], roughness: 0.9 });
    this.push().translate(0, h / 2, out / 2).box(w, h, out).pop();
    this.mat({ cell: CELL.WOOD, color: [0.75, 0.55, 0.35] });
    // frame
    this.push().translate(0, 0, out / 2).boxUp(w + 0.16, 0.16, out + 0.16).pop();
    this.push().translate(0, h, out / 2).boxUp(w + 0.16, 0.18, out + 0.16).pop();
    // corbels
    for (var s = -1; s <= 1; s += 2) {
      this.push().translate(s * w * 0.4, -0.1, out * 0.35).rotateX(0.5).boxUp(0.16, 0.7, 0.16).pop();
    }
    this.mat({ cell: mCell, color: mCol });
    return this;
  };

  /** Tube swept along a polyline of {x,y,z}. Used for ropes and tentacles. */
  MeshBuilder.prototype.tube = function (pts, radiusFn, sides, o) {
    o = o || {};
    sides = sides || 6;
    if (pts.length < 2) return this;
    var base = this.v.length / STRIDE;
    var up = { x: 0, y: 1, z: 0 };
    var n = pts.length, i, j;
    var prevN = null;
    for (i = 0; i < n; i++) {
      var p = pts[i];
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      var tx = b.x - a.x, ty = b.y - a.y, tz = b.z - a.z;
      var tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
      tx /= tl; ty /= tl; tz /= tl;
      // parallel transport keeps the tube from twisting along the sweep
      var nx, ny, nz;
      if (prevN) {
        var d = prevN.x * tx + prevN.y * ty + prevN.z * tz;
        nx = prevN.x - tx * d; ny = prevN.y - ty * d; nz = prevN.z - tz * d;
      } else {
        var ref = Math.abs(ty) > 0.9 ? { x: 1, y: 0, z: 0 } : up;
        nx = ref.y * tz - ref.z * ty; ny = ref.z * tx - ref.x * tz; nz = ref.x * ty - ref.y * tx;
      }
      var nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (nl < 1e-6) { nx = 1; ny = 0; nz = 0; nl = 1; }
      nx /= nl; ny /= nl; nz /= nl;
      prevN = { x: nx, y: ny, z: nz };
      var bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      var r = typeof radiusFn === 'function' ? radiusFn(i / (n - 1), i) : radiusFn;
      for (j = 0; j <= sides; j++) {
        var ang = (j / sides) * TAU;
        var ca = Math.cos(ang), sa = Math.sin(ang);
        var dx = nx * ca + bx * sa, dy = ny * ca + by * sa, dz = nz * ca + bz * sa;
        this.vert(p.x + dx * r, p.y + dy * r, p.z + dz * r, dx, dy, dz, (j / sides) * 2, (i / (n - 1)) * (o.vScale || 4));
      }
    }
    for (i = 0; i < n - 1; i++) {
      for (j = 0; j < sides; j++) {
        var q = base + i * (sides + 1) + j;
        this.quad(q, q + 1, q + sides + 2, q + sides + 1);
      }
    }
    return this;
  };

  /** Date palm: tapered trunk plus drooping fronds. */
  MeshBuilder.prototype.palm = function (height, rng, o) {
    o = o || {};
    var seg = 7;
    var pts = [];
    var lean = (rng.next() - 0.5) * 0.5;
    for (var i = 0; i <= seg; i++) {
      var t = i / seg;
      pts.push({ x: lean * t * t * height * 0.18, y: t * height, z: lean * 0.4 * t * t * height * 0.12 });
    }
    this.mat({ cell: CELL.BARK, color: [1, 1, 1], roughness: 0.95, uvScale: 0.5 });
    this.tube(pts, function (t) { return 0.34 - t * 0.16; }, 8, { vScale: height * 0.5 });
    var top = pts[seg];
    var nf = 9 + Math.floor(rng.next() * 4);
    this.mat({ cell: CELL.FROND, color: [1, 1, 1], roughness: 0.9, uvScale: 0.6 });
    for (var f = 0; f < nf; f++) {
      var a = (f / nf) * TAU + rng.next() * 0.3;
      var len = height * (0.42 + rng.next() * 0.22);
      var droop = 0.5 + rng.next() * 0.5;
      var fp = [];
      for (var k = 0; k <= 6; k++) {
        var t2 = k / 6;
        fp.push({
          x: top.x + Math.cos(a) * len * t2,
          y: top.y + len * 0.30 * Math.sin(t2 * 1.9) - droop * len * 0.42 * t2 * t2,
          z: top.z + Math.sin(a) * len * t2
        });
      }
      this.tube(fp, function (t) { return 0.30 * (1 - t * 0.85) + 0.03; }, 4, { vScale: 3 });
    }
    // date clusters
    if (rng.next() < 0.6) {
      this.mat({ cell: CELL.NONE, color: [0.55, 0.24, 0.12], roughness: 0.7 });
      for (var d = 0; d < 3; d++) {
        var ad = rng.next() * TAU;
        this.push().translate(top.x + Math.cos(ad) * 0.5, top.y - 0.5, top.z + Math.sin(ad) * 0.5)
          .sphere(0.34, 7, 5, { yScale: 1.5 }).pop();
      }
    }
    return this;
  };

  /** Traditional pierced-brass lantern (fanous). */
  MeshBuilder.prototype.lantern = function (size, o) {
    o = o || {};
    var s = size;
    this.mat({ cell: CELL.BRASS, color: [1, 1, 1], roughness: 0.35, uvScale: 2 });
    this.push().translate(0, -s * 0.5, 0).cylinder(s * 0.42, s * 0.34, s * 0.12, 8).pop();
    this.push().translate(0, s * 0.52, 0).cylinder(s * 0.30, s * 0.14, s * 0.30, 8).pop();
    this.push().translate(0, s * 0.78, 0).cylinder(s * 0.05, s * 0.05, s * 0.22, 6).pop();
    // glowing glass body
    this.mat({ cell: CELL.NONE, color: o.glow || [1.0, 0.72, 0.32], emissive: 1.0, roughness: 0.2 });
    this.push().translate(0, 0, 0).cylinder(s * 0.36, s * 0.30, s * 0.9, 8).pop();
    this.mat({ cell: CELL.BRASS, color: [1, 1, 1], emissive: 0, roughness: 0.35 });
    for (var i = 0; i < 4; i++) {
      var a = (i / 4) * TAU;
      this.push().translate(Math.cos(a) * s * 0.33, -s * 0.45, Math.sin(a) * s * 0.33).rotateY(a)
        .boxUp(0.03 * s, s * 0.9, 0.06 * s).pop();
    }
    return this;
  };

  OCTO.MeshBuilder = MeshBuilder;

})(typeof window !== 'undefined' ? window : globalThis);
