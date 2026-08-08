/* =====================================================================
 * OCTOPUSES ON THE LINE — 95-cinematic.js
 *
 * The opening. Rendered in-engine through the real world — no video
 * file, consistent with the project's no-assets rule — as a sequence of
 * camera moves with title cards, driving the time of day as it goes.
 *
 * Skippable at any moment, and never shown twice unless asked for.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var U = OCTO.util, clamp = U.clamp, smoothstep = U.smootherstep;

  /**
   * Shots are authored against world anchors so they stay valid for any
   * seed. `hour` drives the sky, which is what carries the mood shift from
   * the dark cistern to the dawn souq.
   */
  function makeShots(world) {
    var plaza = world.anchors.plaza;
    var minaret = world.anchors.minaret;
    var harbour = world.anchors.harbour;
    var towers = world.districts.towers.center;
    var oasis = world.anchors.oasis;

    return [
      {
        dur: 5.0, hour: 3.4, fov: 52,
        // low under the ropes, looking up: the city hangs over you
        from: { p: { x: plaza.x + 6, y: 0.7, z: plaza.z + 16 }, t: { x: plaza.x, y: 16, z: plaza.z - 6 } },
        to:   { p: { x: plaza.x + 2, y: 1.6, z: plaza.z + 11 }, t: { x: plaza.x, y: 22, z: plaza.z - 10 } },
        en: 'Something under the city is pulling.',
        ar: 'شيء تحت المدينة يشدّ.'
      },
      {
        dur: 5.5, hour: 4.2, fov: 46,
        // climb the cables toward the minaret
        from: { p: { x: minaret.x + 26, y: 6, z: minaret.z + 26 }, t: { x: minaret.x, y: 10, z: minaret.z } },
        to:   { p: { x: minaret.x + 13, y: 27, z: minaret.z + 15 }, t: { x: minaret.x, y: 27, z: minaret.z } },
        en: 'Eight arms. Eight cables. One city.',
        ar: 'ثمانية أذرع. ثمانية كوابل. مدينة واحدة.'
      },
      {
        dur: 5.5, hour: 5.4, fov: 58,
        // out along the long line to Sky Harbour
        from: { p: { x: minaret.x + 8, y: 30, z: minaret.z - 8 }, t: { x: harbour.x, y: harbour.y, z: harbour.z } },
        to:   { p: { x: (minaret.x + harbour.x) / 2, y: 44, z: (minaret.z + harbour.z) / 2 }, t: { x: harbour.x, y: harbour.y + 4, z: harbour.z } },
        en: 'Whoever holds the Lines holds Samarā’.',
        ar: 'من يملك الخيوط يملك سَمَراء.'
      },
      {
        dur: 5.5, hour: 6.4, fov: 50,
        // the towers, leaning
        from: { p: { x: towers.x + 150, y: 40, z: towers.z + 150 }, t: { x: towers.x, y: 70, z: towers.z } },
        to:   { p: { x: towers.x + 95, y: 78, z: towers.z + 95 }, t: { x: towers.x, y: 95, z: towers.z } },
        en: 'And the towers are already leaning.',
        ar: 'والأبراج مائلة منذ الآن.'
      },
      {
        dur: 5.0, hour: 7.2, fov: 55,
        // dawn over the oasis: ordinary life, unaware
        from: { p: { x: oasis.x + 40, y: 12, z: oasis.z + 40 }, t: { x: oasis.x, y: 3, z: oasis.z } },
        to:   { p: { x: oasis.x + 22, y: 6, z: oasis.z + 24 }, t: { x: oasis.x, y: 2, z: oasis.z } },
        en: 'The quarter wakes, and does not look up.',
        ar: 'يستيقظ الحيّ، ولا ينظر إلى أعلى.'
      },
      {
        dur: 6.5, hour: 8.0, fov: 44, title: true,
        // settle on the plaza for the title card
        from: { p: { x: plaza.x + 26, y: 12, z: plaza.z + 26 }, t: { x: plaza.x, y: 5, z: plaza.z } },
        to:   { p: { x: plaza.x + 15, y: 7, z: plaza.z + 15 }, t: { x: plaza.x, y: 3, z: plaza.z } },
        en: 'Octopuses on the Line',
        ar: 'أخطبوطات على الخيط',
        subEn: 'Head of the Line', subAr: 'رأس الخيط'
      }
    ];
  }

  function Cinematic(game, ui) {
    this.game = game;
    this.ui = ui;
    this.active = false;
    this.shots = [];
    this.index = 0;
    this.t = 0;
    this.total = 0;
    this.el = null;
    this._built = false;
  }

  Cinematic.prototype._build = function () {
    if (this._built) return;
    this._built = true;
    var self = this;
    var el = document.createElement('div');
    el.className = 'octo-cine hidden';
    el.innerHTML =
      '<div class="octo-cine-bar octo-cine-top"></div>' +
      '<div class="octo-cine-bar octo-cine-bottom"></div>' +
      '<div class="octo-cine-fade"></div>' +
      '<div class="octo-cine-caption"><div class="octo-cine-en"></div><div class="octo-cine-ar"></div></div>' +
      '<div class="octo-cine-title">' +
      '  <div class="octo-cine-title-ar"></div>' +
      '  <div class="octo-cine-title-en"></div>' +
      '  <div class="octo-cine-title-sub"></div>' +
      '</div>' +
      '<button class="octo-cine-skip"></button>' +
      '<div class="octo-cine-progress"><i></i></div>';
    this.ui.root.appendChild(el);
    this.el = el;
    this.fadeEl = el.querySelector('.octo-cine-fade');
    this.capEl = el.querySelector('.octo-cine-caption');
    this.capEn = el.querySelector('.octo-cine-en');
    this.capAr = el.querySelector('.octo-cine-ar');
    this.titleEl = el.querySelector('.octo-cine-title');
    this.progEl = el.querySelector('.octo-cine-progress i');
    this.skipEl = el.querySelector('.octo-cine-skip');
    this.skipEl.addEventListener('click', function (e) { e.stopPropagation(); self.finish(); });
    // Any tap anywhere skips — nobody should be trapped in a cutscene.
    el.addEventListener('click', function () { self.finish(); });
  };

  Cinematic.prototype.start = function (onDone) {
    this._build();
    this.shots = makeShots(this.game.world);
    this.total = 0;
    for (var i = 0; i < this.shots.length; i++) this.total += this.shots[i].dur;
    this.index = 0;
    this.t = 0;
    this.elapsed = 0;
    this.active = true;
    this.onDone = onDone;
    this.el.classList.remove('hidden');
    this.skipEl.textContent = this.ui.lang === 'ar' ? 'تخطٍ ⏭' : 'Skip ⏭';
    this.game.timeFrozen = true;
    this._applyShot(0);
    return this;
  };

  Cinematic.prototype.finish = function () {
    if (!this.active) return;
    this.active = false;
    this.el.classList.add('hidden');
    this.game.timeFrozen = false;
    if (this.onDone) { var d = this.onDone; this.onDone = null; d(); }
  };

  Cinematic.prototype._applyShot = function (i) {
    var s = this.shots[i];
    if (!s) return;
    this.capEn.textContent = s.title ? '' : s.en;
    this.capAr.textContent = s.title ? '' : s.ar;
    this.capEl.classList.toggle('hidden', !!s.title);
    this.titleEl.classList.toggle('hidden', !s.title);
    if (s.title) {
      this.titleEl.querySelector('.octo-cine-title-ar').textContent = s.ar;
      this.titleEl.querySelector('.octo-cine-title-en').textContent = s.en;
      this.titleEl.querySelector('.octo-cine-title-sub').textContent =
        (this.ui.lang === 'ar' ? s.subAr : s.subEn) + ' · ' + (this.ui.lang === 'ar' ? 'نسخة تجريبية' : 'BETA') + ' v' + OCTO.VERSION;
    }
  };

  /** Called from Game.update while active; owns the camera outright. */
  Cinematic.prototype.update = function (dt, camera) {
    if (!this.active) return;
    var s = this.shots[this.index];
    if (!s) { this.finish(); return; }

    this.t += dt;
    this.elapsed += dt;
    var k = clamp(this.t / s.dur, 0, 1);
    var e = smoothstep(0, 1, k);          // ease both ends of every move

    camera.free = true;                    // stop the follow logic fighting us
    camera.pos.x = U.lerp(s.from.p.x, s.to.p.x, e);
    camera.pos.y = U.lerp(s.from.p.y, s.to.p.y, e);
    camera.pos.z = U.lerp(s.from.p.z, s.to.p.z, e);
    camera.target.x = U.lerp(s.from.t.x, s.to.t.x, e);
    camera.target.y = U.lerp(s.from.t.y, s.to.t.y, e);
    camera.target.z = U.lerp(s.from.t.z, s.to.t.z, e);
    camera.fov = (s.fov || 52) * OCTO.DEG;

    // time of day eases with the cut, so the sky tells the story too
    var next = this.shots[this.index + 1];
    this.game.hour = next ? U.lerp(s.hour, next.hour, e) : s.hour;
    this.game._updateEnvironment();

    // fade at both ends of each shot
    var fade = 1 - Math.min(smoothstep(0, 0.6, this.t), smoothstep(0, 0.6, s.dur - this.t));
    this.fadeEl.style.opacity = (this.index === 0 ? Math.max(fade, 1 - smoothstep(0, 1.4, this.t)) : fade).toFixed(3);
    this.progEl.style.width = ((this.elapsed / this.total) * 100).toFixed(1) + '%';

    var caption = clamp((this.t - 0.5) / 0.7, 0, 1) * clamp((s.dur - this.t) / 0.6, 0, 1);
    this.capEl.style.opacity = caption.toFixed(3);
    this.titleEl.style.opacity = clamp((this.t - 0.8) / 1.2, 0, 1).toFixed(3);

    if (this.t >= s.dur) {
      this.index++;
      this.t = 0;
      if (this.index >= this.shots.length) { this.finish(); return; }
      this._applyShot(this.index);
    }
  };

  OCTO.Cinematic = Cinematic;

})(typeof window !== 'undefined' ? window : globalThis);
