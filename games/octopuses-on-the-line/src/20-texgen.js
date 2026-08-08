/* =====================================================================
 * OCTOPUSES ON THE LINE — 20-texgen.js
 * Procedural texture atlas. Every surface in the game is generated here
 * at load time with Canvas2D, so the project ships with no binary assets
 * and no licence obligations.
 *
 * 4x4 grid of 512px cells -> one 2048px atlas, one texture bind.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var Rng = OCTO.Rng;
  var clamp = OCTO.util.clamp;

  /** Atlas cell indices, referenced by every mesh builder. */
  var CELL = {
    ADOBE: 0,      // mudbrick plaster — the old town
    TILE: 1,       // glazed geometric zellij
    SAND: 2,       // desert floor
    STONE: 3,      // souq paving
    WOOD: 4,       // beams, doors, crates
    CARPET: 5,     // textiles, awnings, rugs
    BARK: 6,       // palm trunk
    FROND: 7,      // palm leaves
    MOSAIC: 8,     // dome mosaic
    NEON: 9,       // future signage
    METAL: 10,     // sky-tower panels
    HOLO: 11,      // holographic calligraphy grid
    GLASS: 12,     // lit tower windows
    BRASS: 13,     // lanterns, ornament
    ROPE: 14,      // the line itself
    MASHRABIYA: 15,// carved wooden screen
    NONE: -1       // untextured, vertex colour only
  };

  /* ------------------------------------------------------- noise helpers */

  /** Periodic value noise so every cell tiles seamlessly. */
  function makeNoise(seed) {
    var rng = new Rng(seed);
    var perm = new Uint8Array(256);
    var i;
    for (i = 0; i < 256; i++) perm[i] = i;
    for (i = 255; i > 0; i--) {
      var j = Math.floor(rng.next() * (i + 1));
      var t = perm[i]; perm[i] = perm[j]; perm[j] = t;
    }
    function h(x, y, per) {
      x = ((x % per) + per) % per;
      y = ((y % per) + per) % per;
      return perm[(perm[x & 255] + (y & 255)) & 255] / 255;
    }
    function val(x, y, per) {
      var xi = Math.floor(x), yi = Math.floor(y);
      var xf = x - xi, yf = y - yi;
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a = h(xi, yi, per), b = h(xi + 1, yi, per);
      var c = h(xi, yi + 1, per), d = h(xi + 1, yi + 1, per);
      return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
    }
    return {
      val: val,
      fbm: function (x, y, per, oct, gain) {
        oct = oct || 4; gain = gain === undefined ? 0.5 : gain;
        var amp = 1, sum = 0, norm = 0, p = per;
        for (var k = 0; k < oct; k++) {
          sum += val(x, y, p) * amp; norm += amp;
          amp *= gain; x *= 2; y *= 2; p *= 2;
        }
        return sum / norm;
      }
    };
  }

  /** Per-pixel fill of one cell. fn(u, v, nx, ny) returns [r,g,b] in 0..255. */
  function fillCell(ctx, x0, y0, S, fn) {
    var img = ctx.createImageData(S, S);
    var d = img.data;
    for (var y = 0; y < S; y++) {
      for (var x = 0; x < S; x++) {
        var c = fn(x / S, y / S, x, y);
        var i = (y * S + x) * 4;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c.length > 3 ? c[3] : 255;
      }
    }
    ctx.putImageData(img, x0, y0);
  }

  /** Draw a path-based pattern 3x3 times so it wraps at the cell border. */
  function tiled(ctx, x0, y0, S, draw) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, S, S);
    ctx.clip();
    for (var oy = -1; oy <= 1; oy++) {
      for (var ox = -1; ox <= 1; ox++) {
        ctx.save();
        ctx.translate(x0 + ox * S, y0 + oy * S);
        draw(ctx, S);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function rgb(r, g, b) { return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  /* ------------------------------------------------------------ patterns */

  /**
   * Eight-point girih star — the backbone of traditional Islamic tiling.
   * Drawn as an outline so it reads at every distance.
   */
  function starPath(ctx, cx, cy, rOuter, rInner, points, rot) {
    ctx.beginPath();
    var n = points * 2;
    for (var i = 0; i < n; i++) {
      var a = rot + (i / n) * Math.PI * 2;
      var r = (i % 2 === 0) ? rOuter : rInner;
      var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function polyPath(ctx, cx, cy, r, sides, rot) {
    ctx.beginPath();
    for (var i = 0; i < sides; i++) {
      var a = rot + (i / sides) * Math.PI * 2;
      var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  /* ---------------------------------------------------------- generators */

  var gen = {};

  gen[CELL.ADOBE] = function (ctx, x0, y0, S, n, rng) {
    var base = [188, 154, 112], dark = [124, 94, 62];
    fillCell(ctx, x0, y0, S, function (u, v) {
      var f = n.fbm(u * 6, v * 6, 6, 5);
      var grit = n.val(u * 90, v * 90, 90);
      var c = mix(dark, base, 0.35 + f * 0.75);
      var g = (grit - 0.5) * 16;
      return [clamp(c[0] + g, 0, 255), clamp(c[1] + g, 0, 255), clamp(c[2] + g, 0, 255)];
    });
    // faint mudbrick courses and hand-plaster streaks
    tiled(ctx, x0, y0, S, function (c, s) {
      c.globalAlpha = 0.10;
      c.strokeStyle = rgb(120, 92, 62);
      c.lineWidth = 2;
      for (var r = 0; r < 5; r++) {
        var yy = (r / 5) * s;
        c.beginPath(); c.moveTo(0, yy); c.lineTo(s, yy); c.stroke();
        var off = (r % 2) * (s / 8);
        for (var q = 0; q < 4; q++) {
          var xx = off + (q / 4) * s;
          c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy + s / 5); c.stroke();
        }
      }
      c.globalAlpha = 1;
    });
  };

  gen[CELL.TILE] = function (ctx, x0, y0, S, n, rng) {
    var deep = [26, 74, 104], mid = [40, 122, 148];
    fillCell(ctx, x0, y0, S, function (u, v) {
      var f = n.fbm(u * 8, v * 8, 8, 4);
      var c = mix(deep, mid, 0.4 + f * 0.6);
      return c;
    });
    tiled(ctx, x0, y0, S, function (c, s) {
      var half = s / 2;
      for (var gy = 0; gy < 2; gy++) {
        for (var gx = 0; gx < 2; gx++) {
          var cx = gx * half + half / 2, cy = gy * half + half / 2;
          // turquoise field
          c.fillStyle = rgb(28, 132, 150);
          polyPath(c, cx, cy, half * 0.46, 8, Math.PI / 8);
          c.fill();
          // gold eight-point star
          c.fillStyle = rgb(214, 176, 92);
          starPath(c, cx, cy, half * 0.40, half * 0.17, 8, 0);
          c.fill();
          // white inner star
          c.fillStyle = rgb(236, 233, 222);
          starPath(c, cx, cy, half * 0.21, half * 0.09, 8, Math.PI / 8);
          c.fill();
          // outline
          c.strokeStyle = rgb(18, 52, 74);
          c.lineWidth = 3;
          polyPath(c, cx, cy, half * 0.46, 8, Math.PI / 8);
          c.stroke();
        }
      }
      // grout lines
      c.strokeStyle = 'rgba(14,38,54,0.75)';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(s, 0); c.moveTo(0, half); c.lineTo(s, half);
      c.moveTo(0, 0); c.lineTo(0, s); c.moveTo(half, 0); c.lineTo(half, s);
      c.stroke();
    });
  };

  gen[CELL.SAND] = function (ctx, x0, y0, S, n) {
    var lo = [152, 118, 76], hi = [212, 182, 132];
    fillCell(ctx, x0, y0, S, function (u, v) {
      var dune = Math.sin((u * 4 + n.fbm(u * 3, v * 3, 3, 3) * 2.2) * Math.PI * 2);
      var f = n.fbm(u * 10, v * 10, 10, 5);
      var grain = n.val(u * 160, v * 160, 160);
      var t = 0.45 + f * 0.4 + dune * 0.12 + (grain - 0.5) * 0.16;
      return mix(lo, hi, clamp(t, 0, 1));
    });
  };

  gen[CELL.STONE] = function (ctx, x0, y0, S, n, rng) {
    fillCell(ctx, x0, y0, S, function (u, v) {
      var f = n.fbm(u * 12, v * 12, 12, 4);
      return mix([88, 80, 72], [142, 132, 118], 0.3 + f * 0.7);
    });
    // irregular flagstones on a jittered grid
    tiled(ctx, x0, y0, S, function (c, s) {
      var N = 4, cell = s / N;
      var r = new Rng(9134);
      c.strokeStyle = 'rgba(52,46,40,0.85)';
      c.lineWidth = 5;
      c.lineJoin = 'round';
      for (var gy = 0; gy < N; gy++) {
        for (var gx = 0; gx < N; gx++) {
          var jx = (r.next() - 0.5) * cell * 0.16, jy = (r.next() - 0.5) * cell * 0.16;
          var pad = cell * 0.07;
          c.fillStyle = 'rgba(255,246,230,' + (0.04 + r.next() * 0.10).toFixed(3) + ')';
          c.beginPath();
          c.rect(gx * cell + pad + jx, gy * cell + pad + jy, cell - pad * 2, cell - pad * 2);
          c.fill(); c.stroke();
        }
      }
    });
  };

  gen[CELL.WOOD] = function (ctx, x0, y0, S, n) {
    var dark = [72, 46, 28], light = [140, 96, 56];
    fillCell(ctx, x0, y0, S, function (u, v) {
      var warp = n.fbm(u * 3, v * 10, 6, 3) * 0.9;
      var rings = Math.sin((u * 9 + warp * 3.4) * Math.PI * 2) * 0.5 + 0.5;
      var grain = n.val(u * 200, v * 24, 200);
      var t = rings * 0.55 + n.fbm(u * 5, v * 22, 8, 4) * 0.35 + (grain - 0.5) * 0.2;
      return mix(dark, light, clamp(t, 0, 1));
    });
  };

  gen[CELL.CARPET] = function (ctx, x0, y0, S, n, rng) {
    fillCell(ctx, x0, y0, S, function (u, v) {
      var f = n.fbm(u * 26, v * 26, 26, 3);
      return mix([104, 22, 26], [148, 38, 40], f);
    });
    tiled(ctx, x0, y0, S, function (c, s) {
      var half = s / 2;
      // bands
      c.fillStyle = rgb(28, 46, 84);
      c.fillRect(0, 0, s, s * 0.06);
      c.fillRect(0, s * 0.47, s, s * 0.06);
      c.fillStyle = rgb(212, 170, 84);
      c.fillRect(0, s * 0.06, s, s * 0.012);
      c.fillRect(0, s * 0.53, s, s * 0.012);
      // diamond medallions
      for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
          var cx = i * half + half / 2, cy = j * half + half / 2 + s * 0.03;
          c.fillStyle = rgb(224, 196, 120);
          starPath(c, cx, cy, half * 0.26, half * 0.10, 4, Math.PI / 4);
          c.fill();
          c.fillStyle = rgb(30, 62, 96);
          starPath(c, cx, cy, half * 0.14, half * 0.05, 4, Math.PI / 4);
          c.fill();
          c.strokeStyle = rgb(236, 226, 200);
          c.lineWidth = 3;
          starPath(c, cx, cy, half * 0.34, half * 0.14, 8, 0);
          c.stroke();
        }
      }
    });
  };

  gen[CELL.BARK] = function (ctx, x0, y0, S, n) {
    fillCell(ctx, x0, y0, S, function (u, v) {
      var f = n.fbm(u * 8, v * 8, 8, 4);
      return mix([64, 46, 30], [126, 98, 62], 0.3 + f * 0.6);
    });
    // the diamond scale pattern of a date palm trunk
    tiled(ctx, x0, y0, S, function (c, s) {
      var N = 6, cell = s / N;
      c.strokeStyle = 'rgba(40,28,16,0.8)';
      c.lineWidth = 4;
      for (var gy = 0; gy < N; gy++) {
        for (var gx = 0; gx < N; gx++) {
          var ox = (gy % 2) * cell * 0.5;
          var cx = gx * cell + ox + cell / 2, cy = gy * cell + cell / 2;
          c.fillStyle = 'rgba(150,118,74,0.30)';
          starPath(c, cx, cy, cell * 0.46, cell * 0.44, 2, 0);
          c.beginPath();
          c.moveTo(cx, cy - cell * 0.42); c.lineTo(cx + cell * 0.44, cy);
          c.lineTo(cx, cy + cell * 0.42); c.lineTo(cx - cell * 0.44, cy);
          c.closePath();
          c.fill(); c.stroke();
        }
      }
    });
  };

  gen[CELL.FROND] = function (ctx, x0, y0, S, n) {
    fillCell(ctx, x0, y0, S, function (u, v) {
      var f = n.fbm(u * 14, v * 14, 14, 4);
      return mix([28, 58, 26], [86, 132, 48], 0.25 + f * 0.7);
    });
    // leaflet ribs running out from the midrib
    tiled(ctx, x0, y0, S, function (c, s) {
      c.strokeStyle = 'rgba(18,42,18,0.55)';
      c.lineWidth = 3;
      for (var i = 0; i < 26; i++) {
        var y = (i / 26) * s;
        c.beginPath();
        c.moveTo(0, y); c.lineTo(s, y + s * 0.06);
        c.stroke();
      }
      c.strokeStyle = 'rgba(150,190,90,0.35)';
      c.lineWidth = 2;
      for (var j = 0; j < 26; j++) {
        var yy = (j / 26) * s + s * 0.018;
        c.beginPath(); c.moveTo(0, yy); c.lineTo(s, yy + s * 0.06); c.stroke();
      }
    });
  };

  gen[CELL.MOSAIC] = function (ctx, x0, y0, S, n, rng) {
    fillCell(ctx, x0, y0, S, function (u, v) {
      var f = n.fbm(u * 20, v * 20, 20, 3);
      return mix([16, 88, 106], [30, 140, 156], f);
    });
    tiled(ctx, x0, y0, S, function (c, s) {
      var N = 10, cell = s / N;
      var r = new Rng(4471);
      for (var gy = 0; gy < N; gy++) {
        for (var gx = 0; gx < N; gx++) {
          var pick = r.next();
          var col = pick < 0.14 ? [214, 176, 92] : (pick < 0.30 ? [232, 228, 214] : (pick < 0.62 ? [30, 150, 164] : [22, 104, 128]));
          var sh = (r.next() - 0.5) * 26;
          c.fillStyle = rgb(col[0] + sh, col[1] + sh, col[2] + sh);
          c.fillRect(gx * cell + 1.5, gy * cell + 1.5, cell - 3, cell - 3);
        }
      }
    });
  };

  gen[CELL.NEON] = function (ctx, x0, y0, S, n) {
    fillCell(ctx, x0, y0, S, function (u, v) {
      var f = n.fbm(u * 16, v * 16, 16, 3);
      return mix([8, 10, 20], [22, 26, 44], f);
    });
    tiled(ctx, x0, y0, S, function (c, s) {
      // glowing rule lines plus a stylised calligraphic sweep
      var cols = ['rgb(90,240,255)', 'rgb(255,120,190)', 'rgb(255,206,90)'];
      for (var i = 0; i < 6; i++) {
        c.strokeStyle = cols[i % 3];
        c.lineWidth = i % 2 ? 5 : 9;
        c.globalAlpha = 0.85;
        var y = (i / 6) * s + s * 0.06;
        c.beginPath(); c.moveTo(0, y); c.lineTo(s, y); c.stroke();
      }
      c.globalAlpha = 1;
      c.strokeStyle = 'rgb(120,255,235)';
      c.lineWidth = 12;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(s * 0.08, s * 0.72);
      c.bezierCurveTo(s * 0.30, s * 0.42, s * 0.55, s * 0.98, s * 0.92, s * 0.66);
      c.stroke();
    });
  };

  gen[CELL.METAL] = function (ctx, x0, y0, S, n) {
    fillCell(ctx, x0, y0, S, function (u, v) {
      var brush = n.val(u * 260, v * 12, 260);
      var f = n.fbm(u * 7, v * 7, 7, 4);
      var t = 0.45 + f * 0.35 + (brush - 0.5) * 0.22;
      return mix([58, 62, 72], [148, 156, 170], clamp(t, 0, 1));
    });
    tiled(ctx, x0, y0, S, function (c, s) {
      c.strokeStyle = 'rgba(22,26,34,0.8)';
      c.lineWidth = 5;
      c.strokeRect(0, 0, s, s);
      c.strokeRect(s * 0.5, 0, s * 0.5, s);
      c.fillStyle = 'rgba(200,210,225,0.35)';
      for (var i = 0; i < 8; i++) {
        var a = (i / 8) * Math.PI * 2;
        c.beginPath();
        c.arc(s * 0.25 + Math.cos(a) * s * 0.18, s * 0.5 + Math.sin(a) * s * 0.34, 4, 0, Math.PI * 2);
        c.fill();
      }
    });
  };

  gen[CELL.HOLO] = function (ctx, x0, y0, S, n) {
    fillCell(ctx, x0, y0, S, function (u, v) {
      var scan = 0.5 + 0.5 * Math.sin(v * Math.PI * 2 * 34);
      var f = n.fbm(u * 9, v * 9, 9, 3);
      var t = 0.12 + f * 0.25 + scan * 0.18;
      return mix([4, 18, 26], [40, 190, 220], clamp(t, 0, 1));
    });
    tiled(ctx, x0, y0, S, function (c, s) {
      c.strokeStyle = 'rgba(150,255,255,0.55)';
      c.lineWidth = 2;
      for (var i = 0; i <= 8; i++) {
        var p = (i / 8) * s;
        c.beginPath(); c.moveTo(p, 0); c.lineTo(p, s); c.stroke();
        c.beginPath(); c.moveTo(0, p); c.lineTo(s, p); c.stroke();
      }
      // abstract calligraphic flourish, in the spirit of a thuluth baseline
      c.strokeStyle = 'rgba(210,255,255,0.95)';
      c.lineWidth = 10; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(s * 0.10, s * 0.60);
      c.bezierCurveTo(s * 0.26, s * 0.24, s * 0.42, s * 0.86, s * 0.58, s * 0.52);
      c.bezierCurveTo(s * 0.70, s * 0.28, s * 0.82, s * 0.70, s * 0.94, s * 0.44);
      c.stroke();
      c.lineWidth = 6;
      c.beginPath(); c.moveTo(s * 0.14, s * 0.72); c.lineTo(s * 0.86, s * 0.72); c.stroke();
    });
  };

  gen[CELL.GLASS] = function (ctx, x0, y0, S, n) {
    fillCell(ctx, x0, y0, S, function (u, v) {
      var f = n.fbm(u * 10, v * 10, 10, 3);
      return mix([10, 14, 24], [26, 34, 52], f);
    });
    tiled(ctx, x0, y0, S, function (c, s) {
      var N = 8, cell = s / N;
      var r = new Rng(20261);
      for (var gy = 0; gy < N; gy++) {
        for (var gx = 0; gx < N; gx++) {
          var lit = r.next();
          if (lit < 0.42) {
            var warm = r.next() < 0.55;
            var a = 0.35 + r.next() * 0.6;
            c.fillStyle = warm
              ? 'rgba(255,200,120,' + a.toFixed(2) + ')'
              : 'rgba(120,220,255,' + a.toFixed(2) + ')';
            c.fillRect(gx * cell + cell * 0.14, gy * cell + cell * 0.16, cell * 0.72, cell * 0.62);
          }
        }
      }
      c.strokeStyle = 'rgba(6,10,18,0.9)';
      c.lineWidth = 4;
      for (var i = 0; i <= N; i++) {
        var p = (i / N) * s;
        c.beginPath(); c.moveTo(p, 0); c.lineTo(p, s); c.stroke();
        c.beginPath(); c.moveTo(0, p); c.lineTo(s, p); c.stroke();
      }
    });
  };

  gen[CELL.BRASS] = function (ctx, x0, y0, S, n) {
    fillCell(ctx, x0, y0, S, function (u, v) {
      var f = n.fbm(u * 9, v * 9, 9, 4);
      var streak = n.val(u * 3, v * 120, 120);
      var t = 0.35 + f * 0.5 + (streak - 0.5) * 0.2;
      return mix([116, 78, 24], [232, 194, 108], clamp(t, 0, 1));
    });
    tiled(ctx, x0, y0, S, function (c, s) {
      c.strokeStyle = 'rgba(70,44,10,0.7)';
      c.lineWidth = 3;
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
          var cx = (i + 0.5) * s / 3, cy = (j + 0.5) * s / 3;
          starPath(c, cx, cy, s / 8, s / 20, 6, 0);
          c.stroke();
          c.beginPath(); c.arc(cx, cy, s / 26, 0, Math.PI * 2); c.stroke();
        }
      }
    });
  };

  gen[CELL.ROPE] = function (ctx, x0, y0, S, n) {
    fillCell(ctx, x0, y0, S, function (u, v) {
      var twist = 0.5 + 0.5 * Math.sin((u * 6 + v * 1.0) * Math.PI * 2);
      var fib = n.val(u * 120, v * 120, 120);
      var t = 0.3 + twist * 0.55 + (fib - 0.5) * 0.25;
      return mix([96, 76, 46], [206, 180, 128], clamp(t, 0, 1));
    });
  };

  gen[CELL.MASHRABIYA] = function (ctx, x0, y0, S, n) {
    // dark interior behind the screen
    fillCell(ctx, x0, y0, S, function (u, v) {
      var f = n.fbm(u * 12, v * 12, 12, 3);
      return mix([16, 12, 10], [46, 34, 24], f);
    });
    tiled(ctx, x0, y0, S, function (c, s) {
      var N = 3, cell = s / N;
      c.strokeStyle = rgb(118, 78, 42);
      c.fillStyle = rgb(96, 62, 34);
      c.lineWidth = cell * 0.10;
      c.lineJoin = 'round';
      for (var gy = 0; gy < N; gy++) {
        for (var gx = 0; gx < N; gx++) {
          var cx = (gx + 0.5) * cell, cy = (gy + 0.5) * cell;
          starPath(c, cx, cy, cell * 0.46, cell * 0.20, 8, 0);
          c.stroke();
          polyPath(c, cx, cy, cell * 0.15, 8, Math.PI / 8);
          c.fill();
          // connecting lattice bars
          c.beginPath();
          c.moveTo(cx - cell * 0.5, cy); c.lineTo(cx + cell * 0.5, cy);
          c.moveTo(cx, cy - cell * 0.5); c.lineTo(cx, cy + cell * 0.5);
          c.lineWidth = cell * 0.06;
          c.stroke();
          c.lineWidth = cell * 0.10;
        }
      }
    });
  };

  /* ------------------------------------------------------------- builder */

  /**
   * Build the whole atlas. Returns a canvas ready for Renderer.setAtlas().
   * cellSize 512 -> 2048px atlas (safe on every WebGL2 device: min is 2048).
   */
  function buildAtlas(cellSize, seed) {
    var S = cellSize || 512;
    var cells = OCTO.gl.ATLAS_CELLS;
    var canvas = document.createElement('canvas');
    canvas.width = S * cells;
    canvas.height = S * cells;
    var ctx = canvas.getContext('2d');
    var n = makeNoise(seed || 1337);
    var rng = new Rng((seed || 1337) ^ 0x5bf03635);

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < cells * cells; i++) {
      var cx = (i % cells) * S, cy = Math.floor(i / cells) * S;
      var g = gen[i];
      if (g) g(ctx, cx, cy, S, n, rng);
    }
    return canvas;
  }

  OCTO.CELL = CELL;
  OCTO.buildAtlas = buildAtlas;

})(typeof window !== 'undefined' ? window : globalThis);
