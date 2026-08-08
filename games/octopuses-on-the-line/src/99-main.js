/* =====================================================================
 * OCTOPUSES ON THE LINE — 99-main.js
 * Boot, main loop, resize handling, and the automation hooks that
 * tools/verify.js drives in headless Chromium.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var clamp = OCTO.util.clamp;

  var STEP = 1 / 60;
  var MAX_STEP = 1 / 15;

  function query() {
    var q = {};
    var s = (root.location && root.location.search || '').replace(/^\?/, '');
    s.split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      q[decodeURIComponent(p[0])] = p.length > 1 ? decodeURIComponent(p[1]) : '1';
    });
    return q;
  }

  /**
   * CSS pixel dimensions are not a reliable phone signal: an embed without a
   * mobile viewport tag reports Android's 980px desktop fallback, which read
   * as "desktop" and picked a preset the device could not sustain. Touch is
   * the signal. Phones start at Low and can be raised in Settings — an
   * unplayable frame rate is worse than a plainer picture.
   */
  function detectQuality() {
    var mem = root.navigator && root.navigator.deviceMemory;
    var touch = ('ontouchstart' in root) || (root.navigator && root.navigator.maxTouchPoints > 0);
    if (touch) return 'low';
    if (mem && mem <= 4) return 'medium';
    return 'high';
  }

  function fatal(container, message, detail) {
    var box = document.createElement('div');
    box.className = 'octo-fatal';
    box.innerHTML =
      '<h2>Octopuses on the Line</h2>' +
      '<p>' + message + '</p>' +
      (detail ? '<pre>' + String(detail).replace(/[<>&]/g, function (c) {
        return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c];
      }) + '</pre>' : '');
    container.appendChild(box);
  }

  function boot() {
    var q = query();
    var container = document.getElementById('octo-root');
    var canvas = document.getElementById('octo-canvas');
    var testMode = !!q.test;

    var api = root.GAME = {
      booted: false,
      error: null,
      lastError: null,
      frameCount: 0,
      frameErrors: 0,
      version: OCTO.VERSION
    };

    // Anything thrown outside the frame still gets recorded for diagnostics.
    root.addEventListener('error', function (e) {
      api.lastError = String((e && (e.message || e.error)) || 'unknown error');
    });
    root.addEventListener('unhandledrejection', function (e) {
      api.lastError = 'promise: ' + String((e && e.reason) || 'unknown');
    });

    var renderer;
    try {
      renderer = new OCTO.gl.Renderer(canvas, { preserveDrawingBuffer: testMode });
    } catch (e) {
      api.error = String(e && e.message || e);
      fatal(container, 'This browser could not start WebGL 2, which the game needs.', e && e.stack);
      api.booted = true;
      return;
    }

    var game = new OCTO.Game(renderer, canvas, {
      quality: q.quality || (testMode ? 'high' : detectQuality()),
      // Mid-morning: the souq reads clearly, and normal play drifts into the
      // golden hour and then the neon night on its own.
      hour: q.hour ? parseFloat(q.hour) : 10.0,
      deterministic: testMode
    });
    if (game.save.quality && !q.quality && !testMode) {
      game.qualityName = game.save.quality;
      game.quality = OCTO.QUALITY[game.qualityName] || game.quality;
    }

    var input = new OCTO.Input(canvas, {});
    var ui = new OCTO.Ui(game, input, container);
    if (game.save.lang) ui.setLang(game.save.lang);
    game.ui = ui;

    var audio = new OCTO.Audio();
    game.audio = audio;

    // A dense phone screen gains nothing visible from a 2x buffer but pays the
    // full fill-rate cost, so cap harder where the pixels are smallest.
    var rawDpr = root.devicePixelRatio || 1;
    var touchDevice = ('ontouchstart' in root) || (root.navigator && root.navigator.maxTouchPoints > 0);
    var pixelRatio = clamp(rawDpr, 1, touchDevice ? 1.5 : 2);
    game.pixelRatio = pixelRatio;

    function resize() {
      var w = container.clientWidth || root.innerWidth || 1280;
      var h = container.clientHeight || root.innerHeight || 720;
      renderer.resize(w, h, pixelRatio);
    }
    root.addEventListener('resize', resize);
    resize();

    // --- staged build so the loading bar actually animates
    var stages = [
      ['Weaving textures…', 'ننسج المواد…', function () {
        renderer.setAtlas(OCTO.buildAtlas(q.atlas ? parseInt(q.atlas, 10) : 512, 1337));
      }],
      ['Raising the old town…', 'نبني البلدة القديمة…', function () {
        game.build({ seed: q.seed ? parseInt(q.seed, 10) : 20260807 });
      }],
      ['Stringing the lines…', 'نمد الخيوط…', function () {
        // first rope settle so nothing snaps into place on frame one
        for (var i = 0; i < 24; i++) {
          for (var r = 0; r < game.ropes.length; r++) game.ropes[r].update(STEP, 0, i * STEP);
        }
      }],
      ['Calling the guild…', 'ننادي النقابة…', function () {
        game.cine = new OCTO.Cinematic(game, ui);
      }],
      ['Waking the octopuses…', 'نوقظ الأخطبوطات…', function () {
        if (ui.isTouchDevice()) ensureTouchControls();
      }]
    ];

    /**
     * Build the on-screen touch rig. Idempotent, and callable at any time:
     * boot-time touch detection is not reliable on every device or inside
     * every embed, so the first real touch also triggers it.
     */
    var touchAttached = false;
    function ensureTouchControls() {
      if (touchAttached) return false;
      touchAttached = true;
      input.attachTouch(container, [
        { action: 'jump', label: '⤒', aria: 'Jump' },
        { action: 'grab', label: 'E', aria: 'Grab' },
        { action: 'grip', label: 'Q', aria: 'Grip' },
        { action: 'dash', label: 'F', aria: 'Dash' },
        { action: 'sprint', label: '»', aria: 'Sprint' },
        { action: 'wobble', label: 'R', aria: 'Wobble' }
      ]);
      container.classList.add('octo-touch-mode');
      return true;
    }
    game.ensureTouchControls = ensureTouchControls;
    game.hasTouchControls = function () { return touchAttached; };
    root.addEventListener('touchstart', function () {
      if (ensureTouchControls()) game.toast(ui.lang === 'ar' ? 'تم تفعيل أزرار اللمس' : 'Touch controls enabled', 'info');
    }, { passive: true });

    var stage = 0;
    function nextStage() {
      if (stage >= stages.length) return finish();
      var s = stages[stage];
      ui.setProgress(stage / stages.length, ui.lang === 'ar' ? s[1] : s[0]);
      stage++;
      // let the browser paint the progress bar before the heavy call
      root.setTimeout(function () {
        try {
          s[2]();
        } catch (e) {
          api.error = String(e && e.stack || e);
          fatal(container, 'The world failed to build.', e && e.stack);
          api.booted = true;
          return;
        }
        nextStage();
      }, testMode ? 0 : 16);
    }

    function finish() {
      ui.setProgress(1, '');
      resize();
      if (testMode) {
        ui.startGame();
        game.timeFrozen = true;
      } else {
        ui.showTitle();
      }
      installApi();
      api.booted = true;
      last = now();
      if (!testMode) requestAnimationFrame(loop);
      else render(0);
    }

    /* -------------------------------------------------------------- loop */

    function now() { return (root.performance || Date).now(); }
    var last = now();
    var acc = 0;

    /**
     * Drop a quality step when the frame rate stays unplayable. A phone that
     * boots into a preset it cannot sustain otherwise looks like a game that
     * simply does not respond.
     */
    var LADDER = ['ultra', 'high', 'medium', 'low'];
    var slowFor = 0, autoScaled = false;
    function autoScaleQuality() {
      if (q.quality || ui.screen !== 'game') return;      // explicit choice wins
      if (game.fps < 20) slowFor += 0.35; else slowFor = 0;
      if (slowFor < 3) return;
      slowFor = 0;
      var i = LADDER.indexOf(game.qualityName);
      if (i >= 0 && i < LADDER.length - 1) {
        var next = LADDER[i + 1];
        game.setQuality(next);
        resize();
        autoScaled = true;
        game.toast(
          (ui.lang === 'ar' ? 'خُفضت الجودة إلى ' : 'Quality lowered to ') + OCTO.QUALITY[next].name,
          'info');
        return;
      }
      // Already at the lowest preset: keep shrinking the render buffer, which
      // is the one thing that still buys frames on a weak GPU.
      var scale = renderer.quality.renderScale;
      if (scale <= 0.42) return;
      renderer.quality.renderScale = Math.max(0.42, scale - 0.12);
      renderer.quality.maxPixels = Math.max(360000, (renderer.quality.maxPixels || 800000) * 0.7);
      resize();
      autoScaled = true;
      game.toast(ui.lang === 'ar' ? 'خُفضت الدقة لتحسين الأداء' : 'Resolution lowered for performance', 'info');
    }

    function step(dt) {
      input.poll();
      game.update(dt, input);
      ui.update(dt);
    }

    function render(dt) {
      game.render(dt);
    }

    /**
     * The frame. Wrapped so a single bad frame cannot kill the game: an
     * exception here used to stop the requestAnimationFrame chain outright,
     * leaving a rendered still image, fps pinned at 0 and no input response —
     * indistinguishable, to a player, from a frozen game.
     */
    function loop() {
      try {
        frame();
      } catch (e) {
        api.frameErrors++;
        api.lastError = String(e && e.stack || e);
        if (api.frameErrors === 1) {
          game.toast(ui.lang === 'ar' ? 'حدث خطأ — اضغط i للتفاصيل' : 'A frame error occurred — tap i for details', 'warn');
        }
      }
      requestAnimationFrame(loop);
    }

    function frame() {
      api.frameCount++;
      var t = now();
      var dt = (t - last) / 1000;
      last = t;
      // Measure the frame rate from real elapsed time. Using the clamped
      // simulation dt makes a 3fps device report 15fps, which hides exactly
      // the problem the readout exists to reveal.
      var realDt = dt;
      if (dt > MAX_STEP) dt = MAX_STEP;

      game._fpsAcc += realDt; game._fpsCount++;
      if (game._fpsAcc >= 0.35) {
        game.fps = game._fpsCount / game._fpsAcc;
        game._fpsAcc = 0; game._fpsCount = 0;
        autoScaleQuality(dt);
      }

      // fixed-step simulation keeps the verlet solvers stable
      acc += dt;
      var steps = 0;
      while (acc >= STEP && steps < 5) { step(STEP); acc -= STEP; steps++; }
      // No endFrame when no step ran: clearing input a simulation step never
      // read is how taps and look deltas get silently dropped.
      render(dt);
    }

    canvas.addEventListener('click', function () {
      if (ui.screen === 'game' && !ui.isTouchDevice() && !input.mouse.locked) input.requestLock();
      if (!game.muted) { audio.init(); audio.resume(); }
    });

    /* ------------------------------------------------------- test hooks */

    function installApi() {
      api.game = game;
      api.ui = ui;
      api.renderer = renderer;
      api.input = input;

      api.report = function () { return game.report(); };

      /** Advance the simulation deterministically, then draw. */
      api.stepFrames = function (n) {
        n = n || 1;
        for (var i = 0; i < n; i++) step(STEP);
        render(STEP);
        return game.report();
      };

      api.teleport = function (d) {
        var ok = game.teleportTo(d);
        api.stepFrames(2);
        return ok;
      };

      api.setTime = function (hour) {
        game.hour = hour;
        game.timeFrozen = true;
        game._updateEnvironment();
        return game.hour;
      };

      api.openMap = function () { ui.openPanel('map'); return true; };
      api.closeMap = function () { ui.closePanel(); return true; };
      api.setQuality = function (name) { game.setQuality(name); resize(); return game.qualityName; };
      api.press = function (code, frames) {
        input.down[code] = true; input.pressed[code] = true;
        api.stepFrames(frames || 1);
        input.down[code] = false;
      };
      api.hold = function (codes, frames) {
        codes.forEach(function (c) { input.down[c] = true; input.pressed[c] = true; });
        api.stepFrames(frames || 1);
        codes.forEach(function (c) { input.down[c] = false; });
      };

      /**
       * Everything needed to diagnose "it loaded but I cannot play it"
       * without physical access to the device.
       */
      api.diagnostics = function () {
        var gl = renderer.gl;
        var dbg = gl.getExtension('WEBGL_debug_renderer_info');
        return {
          version: OCTO.VERSION,
          fps: Math.round(game.fps),
          frameMs: game.fps > 0 ? Math.round(1000 / game.fps) : -1,
          frames: api.frameCount,
          frameErrors: api.frameErrors,
          lastError: api.lastError ? String(api.lastError).slice(0, 220) : 'none',
          quality: game.qualityName,
          autoScaled: autoScaled,
          draws: renderer.stats.draws,
          tris: Math.round(renderer.stats.tris),
          screen: ui.screen,
          paused: game.paused,
          playerState: game.player.state,
          touchDetected: ui.isTouchDevice(),
          touchControls: touchAttached,
          touchPoints: root.navigator ? root.navigator.maxTouchPoints : -1,
          pointerLocked: input.mouse.locked,
          inIframe: (function () { try { return root.self !== root.top; } catch (e) { return true; } })(),
          viewport: (root.innerWidth || 0) + 'x' + (root.innerHeight || 0),
          buffer: renderer.width + 'x' + renderer.height,
          renderScale: +renderer.quality.renderScale.toFixed(2),
          dpr: root.devicePixelRatio || 1,
          gpu: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          floatColor: renderer.floatColor,
          storage: (function () {
            try { root.localStorage.setItem('__o', '1'); root.localStorage.removeItem('__o'); return true; }
            catch (e) { return false; }
          })(),
          audio: game.audio ? (game.audio.ready ? 'ready' : (game.audio.failed ? 'failed' : 'idle')) : 'none'
        };
      };
      api.forceTouchControls = function () { return ensureTouchControls(); };

      api.selfTest = function () {
        // The suite drives the simulation directly, so make sure no open
        // panel has it paused.
        ui.closePanel();
        ui.betaOpen = false;
        game.paused = false;
        return selfTest(game, api);
      };
    }

    nextStage();
  }

  /* ---------------------------------------------------------- self test */

  function selfTest(game, api) {
    var results = [];
    function check(name, fn) {
      try {
        var r = fn();
        results.push({ name: name, pass: r === true, detail: r === true ? '' : String(r) });
      } catch (e) {
        results.push({ name: name, pass: false, detail: String(e && e.message || e) });
      }
    }
    function finite(v) { return typeof v === 'number' && isFinite(v); }

    check('world has geometry chunks', function () {
      return game.world.items.length > 8 || 'only ' + game.world.items.length;
    });
    check('world has colliders', function () {
      return game.world.physics.boxes.length > 80 || 'only ' + game.world.physics.boxes.length;
    });
    check('rope network built', function () {
      return game.ropes.length >= 20 || 'only ' + game.ropes.length;
    });
    check('every rope has finite points', function () {
      for (var i = 0; i < game.ropes.length; i++) {
        var p = game.ropes[i].points();
        for (var j = 0; j < p.length; j++) {
          if (!finite(p[j].x) || !finite(p[j].y) || !finite(p[j].z)) return 'rope ' + i + ' point ' + j + ' is not finite';
        }
      }
      return true;
    });
    check('40 pearls placed', function () {
      return game.pearls.length === 40 || 'got ' + game.pearls.length;
    });
    check('npcs populated', function () {
      return game.npcs.length >= 15 || 'only ' + game.npcs.length;
    });

    check('octopus falls and lands on solid ground', function () {
      // Drop over the middle of the tower plate: open deck, no rope overhead.
      // (Dropping over the souq plaza lands on a washing line — correct
      // behaviour, but it tests the auto-grab rather than ground collision.)
      var tc = game.world.districts.towers.center;
      var p = game.player;
      p.teleport(tc.x, 30, tc.z, 0);
      api.stepFrames(240);
      if (!finite(p.pos.y)) return 'position went non-finite';
      if (p.pos.y < -5) return 'fell through the world to y=' + p.pos.y.toFixed(2);
      if (p.state !== 'ground' && p.state !== 'ragdoll') return 'ended in state ' + p.state;
      return true;
    });

    check('falling onto a line catches it', function () {
      var rope = null;
      for (var i = 0; i < game.ropes.length; i++) {
        if (game.ropes[i].district === 'souq') { rope = game.ropes[i]; break; }
      }
      if (!rope) return 'no souq rope found';
      var mid = rope.sample(0.5, {});
      var p = game.player;
      p.teleport(mid.x, mid.y + 5, mid.z, 0);
      p.lineCooldown = 0;
      for (var k = 0; k < 90 && p.state !== 'line'; k++) api.stepFrames(1);
      return p.state === 'line' || 'dropped past the line, ended in ' + p.state;
    });

    check('octopus can stand on a line and it sags', function () {
      var rope = null;
      for (var i = 0; i < game.ropes.length; i++) {
        if (game.ropes[i].district === 'souq') { rope = game.ropes[i]; break; }
      }
      if (!rope) return 'no souq rope found';
      var mid = rope.sample(0.5, {});
      var beforeY = mid.y;
      var p = game.player;
      p.teleport(mid.x, mid.y + 0.4, mid.z, 0);
      p.attachLine(rope, rope.nearest({ x: mid.x, y: mid.y, z: mid.z }, {}));
      if (p.state !== 'line') return 'did not enter line state';
      for (var k = 0; k < 40; k++) api.stepFrames(1);
      var after = rope.sample(0.5, {}).y;
      if (!finite(p.pos.y)) return 'player position went non-finite on the line';
      if (after >= beforeY - 0.005) return 'rope did not sag (' + beforeY.toFixed(3) + ' -> ' + after.toFixed(3) + ')';
      return true;
    });

    check('balance tips the octopus off an unattended line', function () {
      var rope = game.ropes[0];
      var mid = rope.sample(0.5, {});
      var p = game.player;
      p.teleport(mid.x, mid.y + 0.4, mid.z, 0);
      p.attachLine(rope, rope.nearest({ x: mid.x, y: mid.y, z: mid.z }, {}));
      p.tilt = 1.0; p.tiltVel = 2.5;
      for (var i = 0; i < 60 && p.state === 'line'; i++) api.stepFrames(1);
      return p.state !== 'line' || 'still balanced after a hard push';
    });

    check('missions start and complete', function () {
      var m = game.missionById('lanterns');
      game.startMission(m);
      if (m.state !== 'active') return 'did not activate';
      for (var i = 0; i < game.lanternTargets.length; i++) {
        game.interact({ kind: 'lantern', obj: game.lanternTargets[i], index: i });
      }
      return m.state === 'complete' || 'state is ' + m.state;
    });

    check('economy and shop transact', function () {
      var before = game.dirhams;
      game.addDirhams(1000);
      var res = game.buy('hat_tarbush');
      if (!res.ok) return 'purchase failed: ' + res.reason;
      if (game.player.skin.hat !== 'tarbush') return 'cosmetic not equipped';
      if (game.dirhams !== before + 1000 - 120) return 'balance wrong: ' + game.dirhams;
      return true;
    });

    check('teleport reaches every district', function () {
      var ids = Object.keys(game.world.districts);
      for (var i = 0; i < ids.length; i++) {
        if (!game.teleportTo(ids[i])) return 'no anchor for ' + ids[i];
        api.stepFrames(2);
        var p = game.player.pos;
        if (!finite(p.x) || !finite(p.y) || !finite(p.z)) return 'non-finite position after ' + ids[i];
      }
      return true;
    });

    check('day/night keyframes stay finite', function () {
      for (var h = 0; h < 24; h += 0.25) {
        var e = OCTO.sampleTime(h);
        if (!finite(e.exposure) || !finite(e.stars)) return 'bad env at hour ' + h;
        for (var i = 0; i < 3; i++) {
          if (!finite(e.sunCol[i]) || !finite(e.zenith[i])) return 'bad colour at hour ' + h;
        }
      }
      return true;
    });

    check('renderer reports no GL error', function () {
      var err = game.renderer.gl.getError();
      return err === 0 || 'gl error 0x' + err.toString(16);
    });

    check('frames draw geometry', function () {
      api.stepFrames(2);
      return game.renderer.stats.draws > 3 || 'only ' + game.renderer.stats.draws + ' draws';
    });

    var failed = results.filter(function (r) { return !r.pass; });
    return {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
      failures: failed,
      results: results
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(typeof window !== 'undefined' ? window : globalThis);
