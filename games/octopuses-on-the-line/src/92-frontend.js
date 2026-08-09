/* =====================================================================
 * OCTOPUSES ON THE LINE — 92-frontend.js
 *
 * The art for the front of the game, drawn rather than loaded.
 *
 * Big mobile RPGs open on painted key art. This project has no painted
 * assets and is not going to grow any, so the key art is generated with
 * Canvas2D at boot — the same rule the textures, meshes and score already
 * follow.
 *
 * The composition is chosen to suit that constraint rather than fight it.
 * Rendered figures in a chibi style would look like a bad imitation; a
 * dusk sky with silhouetted Line-Walkers strung across it looks like a
 * poster, is honest about what the game actually is, and is exactly what
 * a 2D canvas is good at. Each of the five disciplines gets a rim light
 * in its own colour, so the cast reads without a single face being drawn.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var TAU = Math.PI * 2;

  function rgb(c, a) {
    return 'rgba(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' +
      Math.round(c[2] * 255) + ',' + (a === undefined ? 1 : a) + ')';
  }

  /* ------------------------------------------------------------- sky */

  function paintSky(ctx, w, h) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0.00, '#241a3d');     // deep violet overhead
    g.addColorStop(0.34, '#5b3760');
    g.addColorStop(0.58, '#b85f56');
    g.addColorStop(0.76, '#e59a54');
    g.addColorStop(1.00, '#f6c976');     // amber at the horizon
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // sun, low and hazy
    var sx = w * 0.62, sy = h * 0.66;
    var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.42);
    sg.addColorStop(0, 'rgba(255,236,190,0.95)');
    sg.addColorStop(0.14, 'rgba(255,206,132,0.55)');
    sg.addColorStop(1, 'rgba(255,180,110,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, w, h);

    // stars, only in the upper third where the sky is still dark
    ctx.fillStyle = 'rgba(255,244,220,0.85)';
    for (var i = 0; i < 90; i++) {
      var a = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      var b = (Math.sin(i * 78.233) * 12345.6789) % 1;
      var x = Math.abs(a) * w, y = Math.abs(b) * h * 0.34;
      var r = 0.5 + Math.abs(a) * 1.1;
      ctx.globalAlpha = 0.25 + Math.abs(b) * 0.6 * (1 - y / (h * 0.34));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // a few long cloud bands catching the last light
    for (var c = 0; c < 5; c++) {
      var cy = h * (0.40 + c * 0.075);
      var cw = w * (0.5 + (c % 3) * 0.22);
      var cx = ((c * 0.37) % 1) * w;
      ctx.fillStyle = 'rgba(255,208,160,' + (0.05 + (c % 2) * 0.045) + ')';
      ctx.beginPath();
      ctx.ellipse(cx, cy, cw * 0.5, h * 0.020, 0, 0, TAU);
      ctx.fill();
    }
  }

  /* -------------------------------------------------------- skyline */

  /** Neo-Falak towers: tall slabs with tapered crowns and neon bands. */
  function paintTowers(ctx, w, h, base) {
    var slabs = [
      [0.06, 0.34, 0.055], [0.13, 0.46, 0.042], [0.19, 0.28, 0.048],
      [0.80, 0.52, 0.050], [0.87, 0.38, 0.058], [0.94, 0.44, 0.040]
    ];
    for (var i = 0; i < slabs.length; i++) {
      var cx = slabs[i][0] * w, hh = slabs[i][1] * h, bw = slabs[i][2] * w;
      var top = base - hh;
      ctx.fillStyle = 'rgba(28,20,34,0.92)';
      ctx.beginPath();
      ctx.moveTo(cx - bw / 2, base);
      ctx.lineTo(cx - bw * 0.34, top + hh * 0.10);
      ctx.lineTo(cx, top);
      ctx.lineTo(cx + bw * 0.34, top + hh * 0.10);
      ctx.lineTo(cx + bw / 2, base);
      ctx.closePath();
      ctx.fill();
      // neon bands
      ctx.fillStyle = 'rgba(120,226,244,0.55)';
      for (var b = 1; b < 6; b++) {
        var by = top + hh * (0.14 + b * 0.14);
        var bw2 = bw * (0.50 - b * 0.028);
        ctx.fillRect(cx - bw2, by, bw2 * 2, Math.max(1, h * 0.0032));
      }
    }
  }

  /** The old town: domes, arches and the great minaret. */
  function paintOldTown(ctx, w, h, base) {
    ctx.fillStyle = 'rgba(38,25,28,0.95)';

    // A run of flat roofs. The heights are driven by a hash rather than a
    // constant band, otherwise the crenellations line up into a row of
    // teeth across the whole frame.
    var x = w * 0.20, n = 0;
    while (x < w * 0.82) {
      var seed = Math.abs(Math.sin(n * 51.17) * 43758.5453) % 1;
      var seed2 = Math.abs(Math.sin(n * 17.93) * 12345.678) % 1;
      var bw = w * (0.026 + seed * 0.030);
      var bh = h * (0.075 + seed2 * seed2 * 0.155);
      ctx.fillRect(x, base - bh, bw, bh);
      var merlons = 3 + Math.floor(seed2 * 3);
      for (var c = 0; c < merlons; c++) {
        ctx.fillRect(x + (bw / merlons) * c + bw * 0.02, base - bh - h * 0.012,
          bw * (0.62 / merlons), h * 0.012);
      }
      // an arched doorway punched out of the taller blocks
      if (bh > h * 0.14) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(x + bw * 0.36, base);
        ctx.lineTo(x + bw * 0.36, base - bh * 0.30);
        ctx.quadraticCurveTo(x + bw * 0.50, base - bh * 0.46, x + bw * 0.64, base - bh * 0.30);
        ctx.lineTo(x + bw * 0.64, base);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(38,25,28,0.95)';
      }
      x += bw * 1.12;
      n++;
    }

    // two onion domes, raised clear of the roofline so they read
    [[0.32, 0.115], [0.72, 0.092]].forEach(function (d) {
      var dx = d[0] * w, dr = d[1] * h;
      ctx.beginPath();
      ctx.moveTo(dx - dr * 0.62, base - h * 0.12);
      ctx.bezierCurveTo(dx - dr * 0.98, base - h * 0.12 - dr * 0.9,
        dx - dr * 0.26, base - h * 0.12 - dr * 1.35,
        dx, base - h * 0.12 - dr * 1.55);
      ctx.bezierCurveTo(dx + dr * 0.26, base - h * 0.12 - dr * 1.35,
        dx + dr * 0.98, base - h * 0.12 - dr * 0.9,
        dx + dr * 0.62, base - h * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(dx - dr * 0.05, base - h * 0.12 - dr * 1.9, dr * 0.10, dr * 0.36);
    });

    // the great minaret, the tallest thing in the old quarter
    var mx = w * 0.50, mb = base, mh = h * 0.50, mw = w * 0.016;
    ctx.fillRect(mx - mw / 2, mb - mh, mw, mh);
    ctx.fillRect(mx - mw * 0.92, mb - mh * 0.72, mw * 1.84, h * 0.014);   // gallery
    ctx.fillRect(mx - mw * 0.78, mb - mh * 0.94, mw * 1.56, h * 0.012);
    ctx.beginPath();                                                       // finial
    ctx.moveTo(mx - mw * 0.62, mb - mh);
    ctx.lineTo(mx, mb - mh - h * 0.052);
    ctx.lineTo(mx + mw * 0.62, mb - mh);
    ctx.closePath();
    ctx.fill();

    // date palms on the left
    for (var p = 0; p < 3; p++) {
      var px = w * (0.03 + p * 0.045), ph = h * (0.20 + p * 0.035);
      ctx.save();
      ctx.strokeStyle = 'rgba(38,25,28,0.95)';
      ctx.lineWidth = Math.max(1.5, w * 0.0035);
      ctx.beginPath();
      ctx.moveTo(px, base);
      ctx.quadraticCurveTo(px + w * 0.006, base - ph * 0.6, px + w * 0.012, base - ph);
      ctx.stroke();
      for (var f = 0; f < 7; f++) {
        var fa = -Math.PI * 0.86 + (f / 6) * Math.PI * 0.72;
        ctx.beginPath();
        ctx.moveTo(px + w * 0.012, base - ph);
        ctx.quadraticCurveTo(
          px + w * 0.012 + Math.cos(fa) * w * 0.020, base - ph + Math.sin(fa) * h * 0.030,
          px + w * 0.012 + Math.cos(fa) * w * 0.036, base - ph + Math.sin(fa) * h * 0.028 + h * 0.026);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* ---------------------------------------------------------- titan */

  /**
   * Ra's al-Khayt on the horizon — the thing every rope is tied to. Kept
   * as a soft mass with two burning eyes: legible, and it stays a rumour
   * rather than a monster design.
   */
  function paintTitan(ctx, w, h, base) {
    // Narrow and tall. Widened past about 0.16 it stops being a creature
    // standing behind the city and becomes a hill the city sits on, and
    // the whole skyline disappears into it.
    var cx = w * 0.50, top = h * 0.05, halfW = w * 0.150;
    var mantleBottom = base - h * 0.02;

    // A halo first, so the mass is separated from the sky before a single
    // edge is drawn — this is what stops it reading as a flat dome.
    var halo = ctx.createRadialGradient(cx, top + h * 0.24, 0, cx, top + h * 0.24, w * 0.42);
    halo.addColorStop(0, 'rgba(88,196,236,0.20)');
    halo.addColorStop(0.5, 'rgba(70,150,210,0.08)');
    halo.addColorStop(1, 'rgba(60,140,200,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, base);

    // Tentacles are drawn behind the mantle and kept short, so they read as
    // limbs hanging out of it rather than as lines ruled across the sky.
    ctx.lineCap = 'round';
    for (var t = -3; t <= 3; t++) {
      if (!t) continue;
      var sign = t < 0 ? -1 : 1, k = Math.abs(t);
      var rootX = cx + t * halfW * 0.22;
      var rootY = top + h * 0.30;
      var tipX = cx + sign * halfW * (0.78 + k * 0.26);
      var tipY = mantleBottom + h * 0.02 - k * h * 0.03;
      ctx.strokeStyle = 'rgba(22,15,26,' + (0.50 - k * 0.09) + ')';
      ctx.lineWidth = w * (0.017 - k * 0.0035);
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.bezierCurveTo(
        rootX + sign * halfW * 0.30, rootY + h * 0.16,
        tipX - sign * halfW * 0.10, tipY - h * 0.16,
        tipX, tipY);
      ctx.stroke();
    }

    // the mantle itself — solid enough to be a body, not a smudge
    var g = ctx.createLinearGradient(0, top, 0, mantleBottom);
    g.addColorStop(0, 'rgba(34,24,44,0.80)');
    g.addColorStop(0.55, 'rgba(26,17,30,0.90)');
    g.addColorStop(1, 'rgba(20,13,22,0.96)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - halfW, mantleBottom);
    // an octopus mantle: shoulders low and wide, drawn to a point at the top
    ctx.bezierCurveTo(cx - halfW * 1.06, top + h * 0.34, cx - halfW * 0.86, top + h * 0.08, cx, top);
    ctx.bezierCurveTo(cx + halfW * 0.86, top + h * 0.08, cx + halfW * 1.06, top + h * 0.34, cx + halfW, mantleBottom);
    ctx.closePath();
    ctx.fill();

    // The eyes sit well inside the mantle. Placed any higher they float off
    // the silhouette and read as two lamps hanging in the sky.
    [[-0.34], [0.34]].forEach(function (e) {
      var ex = cx + e[0] * halfW, ey = top + h * 0.30;
      var eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, w * 0.038);
      eg.addColorStop(0, 'rgba(214,252,255,1)');
      eg.addColorStop(0.16, 'rgba(120,232,250,0.85)');
      eg.addColorStop(0.42, 'rgba(70,200,240,0.30)');
      eg.addColorStop(1, 'rgba(60,190,235,0)');
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(ex, ey, w * 0.038, 0, TAU);
      ctx.fill();
      // a hard pupil so the eye has a centre at small sizes
      ctx.fillStyle = 'rgba(236,254,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(ex, ey, w * 0.0065, h * 0.016, 0, 0, TAU);
      ctx.fill();
    });
  }

  /* --------------------------------------------------------- figures */

  /**
   * One silhouetted Line-Walker, rim-lit in their discipline's colour.
   * `pose` picks the attitude: 0 balancing, 1 mid-stride, 2 crouched,
   * 3 arms wide, 4 leaning into a run.
   */
  function paintWalker(ctx, x, y, s, colour, pose, facing) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing || 1, 1);

    var body = 'rgba(18,12,16,0.96)';
    var lean = [0, 0.10, 0.22, -0.06, 0.26][pose] || 0;
    ctx.rotate(lean);

    // legs
    ctx.strokeStyle = body;
    ctx.lineCap = 'round';
    ctx.lineWidth = s * 0.13;
    var legs = [
      [[-0.10, 1.00], [0.12, 1.00]],
      [[-0.26, 0.98], [0.30, 0.92]],
      [[-0.30, 0.86], [0.34, 0.90]],
      [[-0.20, 1.00], [0.22, 1.00]],
      [[-0.36, 0.92], [0.40, 0.84]]
    ][pose] || [[-0.10, 1.0], [0.12, 1.0]];
    legs.forEach(function (l) {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.42);
      ctx.quadraticCurveTo(l[0] * s * 0.6, s * 0.72, l[0] * s, l[1] * s);
      ctx.stroke();
    });

    // torso
    ctx.lineWidth = s * 0.20;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.42);
    ctx.lineTo(0, s * -0.06);
    ctx.stroke();

    // arms — wide for balance, which is the whole game
    ctx.lineWidth = s * 0.10;
    var arms = [
      [[-0.62, -0.18], [0.62, -0.22]],
      [[-0.50, 0.06], [0.46, -0.30]],
      [[-0.40, 0.22], [0.44, 0.10]],
      [[-0.74, -0.34], [0.74, -0.30]],
      [[-0.44, 0.14], [0.52, -0.20]]
    ][pose] || [[-0.6, -0.2], [0.6, -0.2]];
    arms.forEach(function (a) {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.02);
      ctx.quadraticCurveTo(a[0] * s * 0.55, s * (0.02 + a[1] * 0.4), a[0] * s, a[1] * s);
      ctx.stroke();
    });

    // head
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, s * -0.20, s * 0.16, 0, TAU);
    ctx.fill();

    // rim light down the leading edge, in the discipline's colour
    // Rim light down the leading edge. Kept thin and hugging the form —
    // any thicker and it detaches into a bright hook floating beside the
    // figure instead of reading as light catching an edge.
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgb(colour, 0.62);
    ctx.lineWidth = s * 0.030;
    ctx.beginPath();
    ctx.moveTo(-s * 0.085, s * -0.02);
    ctx.lineTo(-s * 0.085, s * 0.40);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, s * -0.20, s * 0.155, Math.PI * 0.80, Math.PI * 1.30);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    ctx.restore();
  }

  /* --------------------------------------------------------- key art */

  /**
   * The loading-screen illustration. Draws at whatever size it is given,
   * so the same routine serves a phone banner and a desktop splash.
   */
  function drawKeyArt(canvas, w, h) {
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    var base = h * 0.86;

    paintSky(ctx, w, h);
    paintTitan(ctx, w, h, base);
    paintTowers(ctx, w, h, base);
    paintOldTown(ctx, w, h, base);

    // ground haze so the skyline sits in air rather than on a hard edge
    var hz = ctx.createLinearGradient(0, base - h * 0.16, 0, base + h * 0.04);
    hz.addColorStop(0, 'rgba(246,201,118,0)');
    hz.addColorStop(1, 'rgba(246,201,118,0.42)');
    ctx.fillStyle = hz;
    ctx.fillRect(0, base - h * 0.16, w, h * 0.20);

    // the lines, and the cast standing on them
    // Depth is carried by size: two small figures far back, then the cast
    // stepping forward. A row of same-sized silhouettes reads as clip art.
    var classes = OCTO.CLASSES;
    var lines = [
      { x0: 0.52, y0: 0.36, x1: 1.06, y1: 0.44, at: 0.40, s: 0.055, sag: 0.026, pose: 1, face: -1, cls: 2, dim: 0.55 },
      { x0: -0.06, y0: 0.40, x1: 0.40, y1: 0.47, at: 0.52, s: 0.068, sag: 0.030, pose: 3, face: 1, cls: 4, dim: 0.68 },
      { x0: 0.26, y0: 0.58, x1: 0.88, y1: 0.53, at: 0.36, s: 0.105, sag: 0.048, pose: 0, face: 1, cls: 0, dim: 0.85 },
      { x0: 0.58, y0: 0.76, x1: 1.08, y1: 0.70, at: 0.28, s: 0.135, sag: 0.052, pose: 2, face: -1, cls: 3, dim: 1.0 },
      { x0: -0.08, y0: 0.80, x1: 0.52, y1: 0.86, at: 0.56, s: 0.175, sag: 0.060, pose: 4, face: 1, cls: 1, dim: 1.0 }
    ];

    lines.forEach(function (L) {
      var ax = L.x0 * w, ay = L.y0 * h, bx = L.x1 * w, by = L.y1 * h;
      var sag = h * L.sag;
      // rope: a quadratic through a sagging midpoint
      ctx.strokeStyle = 'rgba(30,20,22,' + (0.40 + L.dim * 0.45).toFixed(2) + ')';
      ctx.lineWidth = Math.max(1.2, h * 0.0030 * (0.5 + L.dim));
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag, bx, by);
      ctx.stroke();

      // stand the walker on the curve at parameter t
      var t = L.at, mt = 1 - t;
      var px = mt * mt * ax + 2 * mt * t * ((ax + bx) / 2) + t * t * bx;
      var py = mt * mt * ay + 2 * mt * t * ((ay + by) / 2 + sag) + t * t * by;
      var cls = classes[L.cls % classes.length];
      ctx.globalAlpha = 0.55 + L.dim * 0.45;    // aerial perspective
      paintWalker(ctx, px, py - h * L.s, h * L.s, cls.skin.trim, L.pose, L.face);
      ctx.globalAlpha = 1;
    });

    // vignette
    var vg = ctx.createRadialGradient(w * 0.5, h * 0.46, h * 0.2, w * 0.5, h * 0.5, h * 0.92);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(8,5,10,0.62)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    // grain, so the flat gradients do not band on a phone panel
    var img = ctx.getImageData(0, 0, w, h);
    var d = img.data;
    for (var i2 = 0; i2 < d.length; i2 += 4) {
      var n = (Math.random() - 0.5) * 9;
      d[i2] += n; d[i2 + 1] += n; d[i2 + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  /* -------------------------------------------------------- portrait */

  /**
   * A circular bust for a discipline — used on character slots and the
   * class cards. Built from the same palette the 3D avatar uses, so the
   * portrait and the character in the world agree with each other.
   */
  function drawPortrait(canvas, cls, size) {
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    var c = size / 2;

    // backdrop: the discipline's cloth colour, lit from upper left
    var g = ctx.createRadialGradient(c * 0.72, c * 0.62, 0, c, c, c);
    g.addColorStop(0, rgb(cls.skin.cloth, 0.95));
    g.addColorStop(0.62, rgb(cls.skin.cloth, 0.55));
    g.addColorStop(1, 'rgba(14,10,8,0.95)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c, c, c, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, c * 0.98, 0, TAU);
    ctx.clip();

    // Shoulders, brought up close under the chin. Set lower, the gap
    // between head and collar turns the two into a face with a mouth.
    ctx.fillStyle = rgb(cls.skin.cloth, 1);
    ctx.beginPath();
    ctx.moveTo(c * 0.02, size);
    ctx.quadraticCurveTo(c * 0.30, c * 1.10, c, c * 1.06);
    ctx.quadraticCurveTo(c * 1.70, c * 1.10, c * 1.98, size);
    ctx.closePath();
    ctx.fill();

    // A V-neck of two straight strokes. Any curve here reads as a mouth.
    ctx.strokeStyle = rgb(cls.skin.trim, 0.95);
    ctx.lineWidth = size * 0.032;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c * 0.56, c * 1.12);
    ctx.lineTo(c, c * 1.52);
    ctx.lineTo(c * 1.44, c * 1.12);
    ctx.stroke();

    // head, then the hood over it
    ctx.fillStyle = rgb(cls.skin.skinTone, 1);
    ctx.beginPath();
    ctx.arc(c, c * 0.82, c * 0.31, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgb(cls.skin.metal, 0.94);
    ctx.beginPath();
    ctx.arc(c, c * 0.78, c * 0.35, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
    // the hood's front edge, cutting across the brow
    ctx.beginPath();
    ctx.ellipse(c, c * 0.70, c * 0.35, c * 0.13, 0, 0, TAU);
    ctx.fill();

    // rim light down the right side, in the trim colour
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgb(cls.skin.trim, 0.60);
    ctx.lineWidth = size * 0.024;
    ctx.beginPath();
    ctx.arc(c, c * 0.82, c * 0.33, -Math.PI * 0.40, Math.PI * 0.34);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    ctx.restore();

    // ring
    ctx.strokeStyle = rgb(cls.skin.trim, 0.85);
    ctx.lineWidth = size * 0.035;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.965, 0, TAU);
    ctx.stroke();
    return canvas;
  }

  OCTO.frontend = {
    drawKeyArt: drawKeyArt,
    drawPortrait: drawPortrait,
    paintWalker: paintWalker
  };

})(typeof window !== 'undefined' ? window : globalThis);
