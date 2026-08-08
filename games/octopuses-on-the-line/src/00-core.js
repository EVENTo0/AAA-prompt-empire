/* =====================================================================
 * OCTOPUSES ON THE LINE — 00-core.js
 * Core math, RNG, noise and small utilities.
 * Zero dependencies. Loaded as a classic script so the game runs from
 * file:// without a build step or a server.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO = root.OCTO || {};

  var TAU = Math.PI * 2;
  var DEG = Math.PI / 180;

  /* ---------------------------------------------------------------- utils */

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function invLerp(a, b, v) { return b === a ? 0 : (v - a) / (b - a); }
  function smoothstep(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0 || 1e-9), 0, 1); return t * t * (3 - 2 * t); }
  function smootherstep(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0 || 1e-9), 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }
  /** Frame-rate independent exponential approach. */
  function damp(a, b, lambda, dt) { return lerp(a, b, 1 - Math.exp(-lambda * dt)); }
  function sign(v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); }
  function wrapAngle(a) { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; }
  function lerpAngle(a, b, t) { return a + wrapAngle(b - a) * t; }
  function dampAngle(a, b, lambda, dt) { return a + wrapAngle(b - a) * (1 - Math.exp(-lambda * dt)); }
  function moveToward(a, b, maxDelta) { var d = b - a; return Math.abs(d) <= maxDelta ? b : a + sign(d) * maxDelta; }

  /* ------------------------------------------------------------------ rng */

  /** Deterministic 32-bit PRNG (mulberry32). Same seed => same world. */
  function Rng(seed) {
    this.s = (seed >>> 0) || 1;
  }
  Rng.prototype.next = function () {
    this.s = (this.s + 0x6D2B79F5) >>> 0;
    var t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Rng.prototype.range = function (a, b) { return a + (b - a) * this.next(); };
  Rng.prototype.int = function (a, b) { return Math.floor(this.range(a, b + 1 - 1e-9)); };
  Rng.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length) % arr.length]; };
  Rng.prototype.chance = function (p) { return this.next() < p; };
  Rng.prototype.sign = function () { return this.next() < 0.5 ? -1 : 1; };
  Rng.prototype.fork = function () { return new Rng((this.s ^ Math.floor(this.next() * 0xFFFFFFFF)) >>> 0); };

  /* ---------------------------------------------------------------- noise */

  /** Seeded 2D value noise + fbm. Used for dunes, textures and wind. */
  function Noise(seed) {
    var rng = new Rng(seed);
    var p = new Uint8Array(512);
    var i;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) {
      var j = Math.floor(rng.next() * (i + 1));
      var t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (i = 0; i < 256; i++) p[256 + i] = p[i];
    this.p = p;
  }
  Noise.prototype.hash = function (x, y) {
    var p = this.p;
    return p[(p[x & 255] + (y & 255)) & 511] / 255;
  };
  Noise.prototype.value2 = function (x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = this.hash(xi, yi), b = this.hash(xi + 1, yi);
    var c = this.hash(xi, yi + 1), d = this.hash(xi + 1, yi + 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  };
  Noise.prototype.fbm = function (x, y, octaves, gain, lacunarity) {
    octaves = octaves || 4; gain = gain === undefined ? 0.5 : gain; lacunarity = lacunarity || 2;
    var amp = 0.5, sum = 0, norm = 0;
    for (var i = 0; i < octaves; i++) {
      sum += this.value2(x, y) * amp;
      norm += amp;
      amp *= gain;
      x *= lacunarity; y *= lacunarity;
    }
    return sum / (norm || 1);
  };
  /** Ridged fbm — good for dune crests. */
  Noise.prototype.ridged = function (x, y, octaves) {
    octaves = octaves || 4;
    var amp = 0.5, sum = 0, norm = 0;
    for (var i = 0; i < octaves; i++) {
      var n = 1 - Math.abs(this.value2(x, y) * 2 - 1);
      sum += n * n * amp; norm += amp; amp *= 0.5; x *= 2; y *= 2;
    }
    return sum / (norm || 1);
  };

  /* ------------------------------------------------------------------- v3 */

  function v3(x, y, z) { return { x: x || 0, y: y || 0, z: z || 0 }; }

  var V3 = {
    create: v3,
    set: function (o, x, y, z) { o.x = x; o.y = y; o.z = z; return o; },
    copy: function (o, a) { o.x = a.x; o.y = a.y; o.z = a.z; return o; },
    clone: function (a) { return { x: a.x, y: a.y, z: a.z }; },
    add: function (o, a, b) { o.x = a.x + b.x; o.y = a.y + b.y; o.z = a.z + b.z; return o; },
    sub: function (o, a, b) { o.x = a.x - b.x; o.y = a.y - b.y; o.z = a.z - b.z; return o; },
    mul: function (o, a, b) { o.x = a.x * b.x; o.y = a.y * b.y; o.z = a.z * b.z; return o; },
    scale: function (o, a, s) { o.x = a.x * s; o.y = a.y * s; o.z = a.z * s; return o; },
    addScaled: function (o, a, b, s) { o.x = a.x + b.x * s; o.y = a.y + b.y * s; o.z = a.z + b.z * s; return o; },
    dot: function (a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; },
    cross: function (o, a, b) {
      var x = a.y * b.z - a.z * b.y, y = a.z * b.x - a.x * b.z, z = a.x * b.y - a.y * b.x;
      o.x = x; o.y = y; o.z = z; return o;
    },
    len: function (a) { return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z); },
    len2: function (a) { return a.x * a.x + a.y * a.y + a.z * a.z; },
    dist: function (a, b) { var x = a.x - b.x, y = a.y - b.y, z = a.z - b.z; return Math.sqrt(x * x + y * y + z * z); },
    dist2: function (a, b) { var x = a.x - b.x, y = a.y - b.y, z = a.z - b.z; return x * x + y * y + z * z; },
    distXZ: function (a, b) { var x = a.x - b.x, z = a.z - b.z; return Math.sqrt(x * x + z * z); },
    norm: function (o, a) {
      var l = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      if (l < 1e-9) { o.x = 0; o.y = 0; o.z = 0; return o; }
      o.x = a.x / l; o.y = a.y / l; o.z = a.z / l; return o;
    },
    lerp: function (o, a, b, t) { o.x = lerp(a.x, b.x, t); o.y = lerp(a.y, b.y, t); o.z = lerp(a.z, b.z, t); return o; },
    zero: function (o) { o.x = 0; o.y = 0; o.z = 0; return o; },
    /** Clamp horizontal magnitude, leaving y untouched. */
    clampXZ: function (o, maxLen) {
      var l = Math.sqrt(o.x * o.x + o.z * o.z);
      if (l > maxLen && l > 1e-9) { var s = maxLen / l; o.x *= s; o.z *= s; }
      return o;
    }
  };

  /* ------------------------------------------------------------------- m4 */
  /* Column-major, matching GLSL mat4 layout: m[col * 4 + row]. */

  var M4 = {
    create: function () {
      var m = new Float32Array(16);
      m[0] = m[5] = m[10] = m[15] = 1;
      return m;
    },
    identity: function (o) {
      o[0] = 1; o[1] = 0; o[2] = 0; o[3] = 0;
      o[4] = 0; o[5] = 1; o[6] = 0; o[7] = 0;
      o[8] = 0; o[9] = 0; o[10] = 1; o[11] = 0;
      o[12] = 0; o[13] = 0; o[14] = 0; o[15] = 1;
      return o;
    },
    copy: function (o, a) { for (var i = 0; i < 16; i++) o[i] = a[i]; return o; },

    /** o = a * b (apply b first, then a). */
    mul: function (o, a, b) {
      var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
          a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
          a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
          a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
      for (var i = 0; i < 4; i++) {
        var b0 = b[i * 4], b1 = b[i * 4 + 1], b2 = b[i * 4 + 2], b3 = b[i * 4 + 3];
        o[i * 4] = a00 * b0 + a10 * b1 + a20 * b2 + a30 * b3;
        o[i * 4 + 1] = a01 * b0 + a11 * b1 + a21 * b2 + a31 * b3;
        o[i * 4 + 2] = a02 * b0 + a12 * b1 + a22 * b2 + a32 * b3;
        o[i * 4 + 3] = a03 * b0 + a13 * b1 + a23 * b2 + a33 * b3;
      }
      return o;
    },

    perspective: function (o, fovy, aspect, near, far) {
      var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
      o[0] = f / aspect; o[1] = 0; o[2] = 0; o[3] = 0;
      o[4] = 0; o[5] = f; o[6] = 0; o[7] = 0;
      o[8] = 0; o[9] = 0; o[10] = (far + near) * nf; o[11] = -1;
      o[12] = 0; o[13] = 0; o[14] = 2 * far * near * nf; o[15] = 0;
      return o;
    },

    ortho: function (o, l, r, b, t, n, f) {
      o[0] = 2 / (r - l); o[1] = 0; o[2] = 0; o[3] = 0;
      o[4] = 0; o[5] = 2 / (t - b); o[6] = 0; o[7] = 0;
      o[8] = 0; o[9] = 0; o[10] = -2 / (f - n); o[11] = 0;
      o[12] = -(r + l) / (r - l); o[13] = -(t + b) / (t - b); o[14] = -(f + n) / (f - n); o[15] = 1;
      return o;
    },

    lookAt: function (o, eye, center, up) {
      var zx = eye.x - center.x, zy = eye.y - center.y, zz = eye.z - center.z;
      var l = Math.sqrt(zx * zx + zy * zy + zz * zz);
      if (l < 1e-9) { return M4.identity(o); }
      zx /= l; zy /= l; zz /= l;
      var xx = up.y * zz - up.z * zy, xy = up.z * zx - up.x * zz, xz = up.x * zy - up.y * zx;
      l = Math.sqrt(xx * xx + xy * xy + xz * xz);
      if (l < 1e-9) { xx = 1; xy = 0; xz = 0; } else { xx /= l; xy /= l; xz /= l; }
      var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0;
      o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0;
      o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
      o[12] = -(xx * eye.x + xy * eye.y + xz * eye.z);
      o[13] = -(yx * eye.x + yy * eye.y + yz * eye.z);
      o[14] = -(zx * eye.x + zy * eye.y + zz * eye.z);
      o[15] = 1;
      return o;
    },

    /**
     * Compose translate * rotate(Y,X,Z) * scale.
     * rot is {x: pitch, y: yaw, z: roll} in radians; scale may be a number.
     */
    compose: function (o, pos, rot, scale) {
      var sx, sy, sz;
      if (typeof scale === 'number') { sx = sy = sz = scale; }
      else if (scale) { sx = scale.x; sy = scale.y; sz = scale.z; }
      else { sx = sy = sz = 1; }
      var cy = Math.cos(rot.y), syn = Math.sin(rot.y);
      var cx = Math.cos(rot.x), sxn = Math.sin(rot.x);
      var cz = Math.cos(rot.z), szn = Math.sin(rot.z);
      // R = Ry * Rx * Rz, expanded.
      var r00 = cy * cz + syn * sxn * szn, r01 = -cy * szn + syn * sxn * cz, r02 = syn * cx;
      var r10 = cx * szn,                  r11 = cx * cz,                    r12 = -sxn;
      var r20 = -syn * cz + cy * sxn * szn, r21 = syn * szn + cy * sxn * cz, r22 = cy * cx;
      o[0] = r00 * sx; o[1] = r10 * sx; o[2] = r20 * sx; o[3] = 0;
      o[4] = r01 * sy; o[5] = r11 * sy; o[6] = r21 * sy; o[7] = 0;
      o[8] = r02 * sz; o[9] = r12 * sz; o[10] = r22 * sz; o[11] = 0;
      o[12] = pos.x; o[13] = pos.y; o[14] = pos.z; o[15] = 1;
      return o;
    },

    /** Build a basis matrix from an explicit forward/up pair, at pos. */
    fromBasis: function (o, pos, right, up, fwd, scale) {
      var s = scale === undefined ? 1 : scale;
      o[0] = right.x * s; o[1] = right.y * s; o[2] = right.z * s; o[3] = 0;
      o[4] = up.x * s; o[5] = up.y * s; o[6] = up.z * s; o[7] = 0;
      o[8] = fwd.x * s; o[9] = fwd.y * s; o[10] = fwd.z * s; o[11] = 0;
      o[12] = pos.x; o[13] = pos.y; o[14] = pos.z; o[15] = 1;
      return o;
    },

    invert: function (o, m) {
      var a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3],
          a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7],
          a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11],
          a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
      var b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10,
          b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11,
          b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12,
          b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30,
          b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31,
          b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
      var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      if (!det) return M4.identity(o);
      det = 1 / det;
      o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
      o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
      o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
      o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
      o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
      o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
      o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
      o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
      o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
      o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
      o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
      o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
      o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
      return o;
    },

    /** Upper-left 3x3 inverse-transpose, written into a mat3 (9 floats). */
    normalMatrix: function (o3, m) {
      var a00 = m[0], a01 = m[1], a02 = m[2],
          a10 = m[4], a11 = m[5], a12 = m[6],
          a20 = m[8], a21 = m[9], a22 = m[10];
      var b01 = a22 * a11 - a12 * a21, b11 = -a22 * a10 + a12 * a20, b21 = a21 * a10 - a11 * a20;
      var det = a00 * b01 + a01 * b11 + a02 * b21;
      if (!det) { o3[0] = 1; o3[1] = 0; o3[2] = 0; o3[3] = 0; o3[4] = 1; o3[5] = 0; o3[6] = 0; o3[7] = 0; o3[8] = 1; return o3; }
      det = 1 / det;
      o3[0] = b01 * det;
      o3[1] = (-a22 * a01 + a02 * a21) * det;
      o3[2] = (a12 * a01 - a02 * a11) * det;
      o3[3] = b11 * det;
      o3[4] = (a22 * a00 - a02 * a20) * det;
      o3[5] = (-a12 * a00 + a02 * a10) * det;
      o3[6] = b21 * det;
      o3[7] = (-a21 * a00 + a01 * a20) * det;
      o3[8] = (a11 * a00 - a01 * a10) * det;
      return o3;
    },

    transformPoint: function (o, m, p) {
      var x = p.x, y = p.y, z = p.z;
      o.x = m[0] * x + m[4] * y + m[8] * z + m[12];
      o.y = m[1] * x + m[5] * y + m[9] * z + m[13];
      o.z = m[2] * x + m[6] * y + m[10] * z + m[14];
      return o;
    },
    transformDir: function (o, m, p) {
      var x = p.x, y = p.y, z = p.z;
      o.x = m[0] * x + m[4] * y + m[8] * z;
      o.y = m[1] * x + m[5] * y + m[9] * z;
      o.z = m[2] * x + m[6] * y + m[10] * z;
      return o;
    },
    getTranslation: function (o, m) { o.x = m[12]; o.y = m[13]; o.z = m[14]; return o; }
  };

  /* -------------------------------------------------------------- frustum */

  /** Six-plane frustum extracted from a view-projection matrix. */
  function Frustum() {
    this.p = new Float32Array(24); // 6 planes * (nx, ny, nz, d)
  }
  Frustum.prototype.fromViewProj = function (m) {
    var p = this.p;
    var rows = [
      [m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]],   // left
      [m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]],   // right
      [m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]],   // bottom
      [m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]],   // top
      [m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]],  // near
      [m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]]   // far
    ];
    for (var i = 0; i < 6; i++) {
      var r = rows[i];
      var l = Math.sqrt(r[0] * r[0] + r[1] * r[1] + r[2] * r[2]) || 1;
      p[i * 4] = r[0] / l; p[i * 4 + 1] = r[1] / l; p[i * 4 + 2] = r[2] / l; p[i * 4 + 3] = r[3] / l;
    }
    return this;
  };
  /** Conservative AABB test. min/max are {x,y,z}. */
  Frustum.prototype.intersectsAABB = function (min, max) {
    var p = this.p;
    for (var i = 0; i < 6; i++) {
      var nx = p[i * 4], ny = p[i * 4 + 1], nz = p[i * 4 + 2], d = p[i * 4 + 3];
      // Pick the AABB corner furthest along the plane normal.
      var px = nx >= 0 ? max.x : min.x;
      var py = ny >= 0 ? max.y : min.y;
      var pz = nz >= 0 ? max.z : min.z;
      if (nx * px + ny * py + nz * pz + d < 0) return false;
    }
    return true;
  };
  Frustum.prototype.intersectsSphere = function (c, r) {
    var p = this.p;
    for (var i = 0; i < 6; i++) {
      if (p[i * 4] * c.x + p[i * 4 + 1] * c.y + p[i * 4 + 2] * c.z + p[i * 4 + 3] < -r) return false;
    }
    return true;
  };

  /* ----------------------------------------------------------------- misc */

  /** #rrggbb or {r,g,b} 0..1 -> [r,g,b] 0..1 */
  function color(hex) {
    if (typeof hex !== 'string') return [hex.r, hex.g, hex.b];
    var h = hex.charAt(0) === '#' ? hex.slice(1) : hex;
    var n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  /** Perceptual-ish tint of an [r,g,b] triple. */
  function tint(rgb, amount, rng) {
    var d = (rng ? rng.next() : Math.random()) * 2 - 1;
    d *= amount;
    return [clamp(rgb[0] + d, 0, 1), clamp(rgb[1] + d, 0, 1), clamp(rgb[2] + d, 0, 1)];
  }

  function hsl(h, s, l) {
    h = ((h % 1) + 1) % 1;
    function f(n) {
      var k = (n + h * 12) % 12;
      var a = s * Math.min(l, 1 - l);
      return l - a * Math.max(-1, Math.min(Math.min(k - 3, 9 - k), 1));
    }
    return [f(0), f(8), f(4)];
  }

  /** Distance from point p to segment ab; writes closest point into out. */
  function closestPointOnSegment(out, p, a, b) {
    var abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
    var apx = p.x - a.x, apy = p.y - a.y, apz = p.z - a.z;
    var d = abx * abx + aby * aby + abz * abz;
    var t = d < 1e-9 ? 0 : clamp((apx * abx + apy * aby + apz * abz) / d, 0, 1);
    out.x = a.x + abx * t; out.y = a.y + aby * t; out.z = a.z + abz * t;
    return t;
  }

  OCTO.TAU = TAU;
  OCTO.DEG = DEG;
  OCTO.util = {
    clamp: clamp, lerp: lerp, invLerp: invLerp, smoothstep: smoothstep, smootherstep: smootherstep,
    damp: damp, sign: sign, wrapAngle: wrapAngle, lerpAngle: lerpAngle, dampAngle: dampAngle,
    moveToward: moveToward, color: color, tint: tint, hsl: hsl,
    closestPointOnSegment: closestPointOnSegment
  };
  OCTO.Rng = Rng;
  OCTO.Noise = Noise;
  OCTO.v3 = v3;
  OCTO.V3 = V3;
  OCTO.M4 = M4;
  OCTO.Frustum = Frustum;

})(typeof window !== 'undefined' ? window : globalThis);
