/* =====================================================================
 * OCTOPUSES ON THE LINE — 85-audio.js
 *
 * All sound is synthesised at runtime — no audio files ship with the
 * game. The score is generative: a plucked-string voice (Karplus-Strong)
 * playing maqam Hijaz over a darbuka pattern in the old town, drifting
 * into detuned synth pads up in the towers.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var clamp = OCTO.util.clamp;

  // Maqam Hijaz on D — the interval that reads instantly as "the old town".
  var HIJAZ = [0, 1, 4, 5, 7, 8, 11];
  // Maqam Nahawand — softer, used for the oasis.
  var NAHAWAND = [0, 2, 3, 5, 7, 8, 10];
  // A wide, airy scale for the sky districts.
  var SKY = [0, 2, 4, 7, 9, 11, 14];

  var DISTRICT_MOOD = {
    souq: { scale: HIJAZ, rootHz: 146.83, drums: 1.0, pad: 0.10, pluck: 1.0, tempo: 96 },
    oasis: { scale: NAHAWAND, rootHz: 130.81, drums: 0.35, pad: 0.22, pluck: 0.8, tempo: 74 },
    line: { scale: HIJAZ, rootHz: 164.81, drums: 0.55, pad: 0.30, pluck: 0.9, tempo: 88 },
    harbour: { scale: SKY, rootHz: 174.61, drums: 0.40, pad: 0.55, pluck: 0.7, tempo: 84 },
    towers: { scale: SKY, rootHz: 196.00, drums: 0.30, pad: 0.85, pluck: 0.5, tempo: 78 }
  };

  function Audio() {
    this.ctx = null;
    this.ready = false;
    this.enabled = true;
    this.masterVol = 0.7;
    this.musicVol = 0.55;
    this.sfxVol = 0.85;
    this.district = 'souq';
    this.mood = DISTRICT_MOOD.souq;
    this.targetMood = this.mood;
    this.nextNoteTime = 0;
    this.step = 0;
    this.timer = null;
    this.nightAmount = 0;
    this.windLevel = 0.25;
    this.failed = false;
  }

  /** Must be called from a user gesture; browsers block audio otherwise. */
  Audio.prototype.init = function () {
    if (this.ready || this.failed) return this.ready;
    try {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) { this.failed = true; return false; }
      var ctx = this.ctx = new AC();

      this.master = ctx.createGain();
      this.master.gain.value = this.masterVol;
      this.master.connect(ctx.destination);

      // a shared plate-ish reverb keeps the souq sounding like a stone alley
      this.reverb = ctx.createConvolver();
      this.reverb.buffer = this._makeImpulse(2.4, 2.6);
      this.reverbGain = ctx.createGain();
      this.reverbGain.gain.value = 0.30;
      this.reverb.connect(this.reverbGain);
      this.reverbGain.connect(this.master);

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.musicVol;
      this.musicBus.connect(this.master);
      this.musicBus.connect(this.reverb);

      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = this.sfxVol;
      this.sfxBus.connect(this.master);
      var sfxSend = ctx.createGain();
      sfxSend.gain.value = 0.22;
      this.sfxBus.connect(sfxSend);
      sfxSend.connect(this.reverb);

      this._startWind();
      this.ready = true;
      this.nextNoteTime = ctx.currentTime + 0.2;
      this._schedule();
      return true;
    } catch (e) {
      this.failed = true;
      return false;
    }
  };

  Audio.prototype._makeImpulse = function (seconds, decay) {
    var ctx = this.ctx;
    var rate = ctx.sampleRate;
    var len = Math.floor(rate * seconds);
    var buf = ctx.createBuffer(2, len, rate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        var t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }
    return buf;
  };

  Audio.prototype._noiseBuffer = function (seconds) {
    if (this._noise && this._noiseLen >= seconds) return this._noise;
    var ctx = this.ctx;
    var len = Math.floor(ctx.sampleRate * Math.max(seconds, 1));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._noise = buf;
    this._noiseLen = len / ctx.sampleRate;
    return buf;
  };

  /* ------------------------------------------------------------- ambience */

  Audio.prototype._startWind = function () {
    var ctx = this.ctx;
    var src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(4);
    src.loop = true;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    lp.Q.value = 0.6;
    var g = ctx.createGain();
    g.gain.value = 0.05;
    src.connect(lp); lp.connect(g); g.connect(this.master);
    src.start();
    this.windGain = g;
    this.windFilter = lp;

    // slow LFO so the desert wind breathes
    var lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.035;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    lfo.start();
  };

  Audio.prototype.setWind = function (level) {
    this.windLevel = level;
    if (!this.ready) return;
    this.windGain.gain.setTargetAtTime(0.028 + level * 0.10, this.ctx.currentTime, 1.2);
    this.windFilter.frequency.setTargetAtTime(320 + level * 900, this.ctx.currentTime, 1.5);
  };

  /* ---------------------------------------------------------------- voices */

  /** Karplus-Strong pluck — the oud/qanun voice. */
  Audio.prototype._pluck = function (freq, when, gain, decayMul) {
    var ctx = this.ctx;
    var burst = ctx.createBufferSource();
    burst.buffer = this._noiseBuffer(1);
    var period = 1 / Math.max(freq, 30);
    var burstGain = ctx.createGain();
    burstGain.gain.setValueAtTime(0, when);
    burstGain.gain.linearRampToValueAtTime(gain, when + 0.002);
    burstGain.gain.linearRampToValueAtTime(0, when + period * 2.2);

    var delay = ctx.createDelay(0.05);
    delay.delayTime.value = period;
    var fb = ctx.createGain();
    fb.gain.value = 0.86 * (decayMul || 1);
    var damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = clamp(freq * 7, 900, 7000);

    var out = ctx.createGain();
    out.gain.setValueAtTime(1, when);
    out.gain.setTargetAtTime(0.0001, when + 0.9, 0.5);

    burst.connect(burstGain);
    burstGain.connect(delay);
    delay.connect(damp);
    damp.connect(fb);
    fb.connect(delay);
    delay.connect(out);
    out.connect(this.musicBus);

    burst.start(when);
    burst.stop(when + 0.1);
    // let the loop ring out, then tear it down
    setTimeout(function () {
      try { out.disconnect(); delay.disconnect(); damp.disconnect(); fb.disconnect(); } catch (e) { /* already gone */ }
    }, (when - ctx.currentTime + 3.2) * 1000);
  };

  /** Darbuka: "dum" is a pitch-swept sine, "tak" is a filtered click. */
  Audio.prototype._drum = function (kind, when, gain) {
    var ctx = this.ctx;
    var g = ctx.createGain();
    g.connect(this.musicBus);
    if (kind === 'dum') {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, when);
      osc.frequency.exponentialRampToValueAtTime(52, when + 0.13);
      g.gain.setValueAtTime(gain, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.30);
      osc.connect(g);
      osc.start(when); osc.stop(when + 0.32);
    } else {
      var n = ctx.createBufferSource();
      n.buffer = this._noiseBuffer(1);
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = kind === 'tak' ? 2100 : 3600;
      bp.Q.value = 2.2;
      g.gain.setValueAtTime(gain * 0.7, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.09);
      n.connect(bp); bp.connect(g);
      n.start(when); n.stop(when + 0.1);
    }
  };

  /** Slow evolving pad for the sky districts. */
  Audio.prototype._pad = function (freq, when, dur, gain) {
    var ctx = this.ctx;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + dur * 0.4);
    g.gain.linearRampToValueAtTime(0, when + dur);
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(700, when);
    lp.frequency.linearRampToValueAtTime(2200, when + dur * 0.5);
    g.connect(this.musicBus);
    lp.connect(g);
    for (var d = 0; d < 3; d++) {
      var o = ctx.createOscillator();
      o.type = d === 2 ? 'triangle' : 'sawtooth';
      o.frequency.value = freq * (d === 2 ? 2 : 1) * (1 + (d - 1) * 0.004);
      o.connect(lp);
      o.start(when); o.stop(when + dur + 0.05);
    }
  };

  /* ------------------------------------------------------------ scheduler */

  Audio.prototype._schedule = function () {
    var self = this;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(function () { self._tick(); }, 60);
  };

  Audio.prototype._tick = function () {
    if (!this.ready || !this.enabled) return;
    var ctx = this.ctx;
    if (ctx.state === 'suspended') return;
    var mood = this.mood;
    var beat = 60 / mood.tempo / 2;           // eighth notes
    var lookahead = ctx.currentTime + 0.25;
    var guard = 0;
    while (this.nextNoteTime < lookahead && guard++ < 24) {
      this._playStep(this.step, this.nextNoteTime, beat);
      this.step++;
      this.nextNoteTime += beat;
    }
  };

  // maqsoum, the backbone rhythm of the region: D - t - D D - t -
  var PATTERN = ['dum', null, 'tak', null, 'dum', 'dum', null, 'tak'];

  Audio.prototype._playStep = function (step, when, beat) {
    var mood = this.mood;
    var s = step % 8;
    var bar = Math.floor(step / 8);

    var d = PATTERN[s];
    if (d && mood.drums > 0.01) {
      this._drum(d, when, 0.16 * mood.drums * (d === 'dum' ? 1 : 0.8));
    }

    if (mood.pluck > 0.01) {
      // sparse, breathing phrase — never a wall of notes
      var play = (s === 0) || (s === 3 && (bar % 2 === 0)) || (s === 6 && (bar % 3 === 0)) ||
                 (s === 5 && (bar % 4 === 1));
      if (play) {
        var scale = mood.scale;
        var deg = (bar * 3 + s) % scale.length;
        var oct = (bar % 4 === 3 && s === 0) ? 2 : 1;
        var semi = scale[deg];
        var f = mood.rootHz * Math.pow(2, semi / 12) * oct;
        this._pluck(f, when, 0.30 * mood.pluck, 1);
        // an occasional grace note above, the way an oud ornaments a phrase
        if (s === 0 && bar % 4 === 2) {
          this._pluck(f * Math.pow(2, scale[(deg + 2) % scale.length] / 12), when + beat * 0.42, 0.16 * mood.pluck, 0.9);
        }
      }
    }

    if (mood.pad > 0.01 && s === 0 && bar % 2 === 0) {
      var pf = mood.rootHz * 0.5 * Math.pow(2, mood.scale[(bar / 2) % mood.scale.length] / 12);
      this._pad(pf, when, beat * 16, 0.055 * mood.pad);
    }
  };

  /* ---------------------------------------------------------------- sfx */

  var SFX = {
    jump: function (a, ctx, t, v) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(320, t);
      o.frequency.exponentialRampToValueAtTime(760, t + 0.1);
      g.gain.setValueAtTime(0.18 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(a.sfxBus); o.start(t); o.stop(t + 0.18);
    },
    land: function (a, ctx, t, v) {
      var n = ctx.createBufferSource(); n.buffer = a._noiseBuffer(1);
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.26 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      n.connect(lp); lp.connect(g); g.connect(a.sfxBus);
      n.start(t); n.stop(t + 0.18);
    },
    splat: function (a, ctx, t, v) {
      var n = ctx.createBufferSource(); n.buffer = a._noiseBuffer(1);
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(900, t);
      bp.frequency.exponentialRampToValueAtTime(180, t + 0.22);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.30 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      n.connect(bp); bp.connect(g); g.connect(a.sfxBus);
      n.start(t); n.stop(t + 0.28);
    },
    dash: function (a, ctx, t, v) {
      var n = ctx.createBufferSource(); n.buffer = a._noiseBuffer(1);
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.setValueAtTime(240, t);
      bp.frequency.exponentialRampToValueAtTime(2600, t + 0.26);
      bp.Q.value = 1.4;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.22 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      n.connect(bp); bp.connect(g); g.connect(a.sfxBus);
      n.start(t); n.stop(t + 0.34);
    },
    grab: function (a, ctx, t, v) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(680, t);
      o.frequency.exponentialRampToValueAtTime(420, t + 0.05);
      g.gain.setValueAtTime(0.08 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g); g.connect(a.sfxBus); o.start(t); o.stop(t + 0.09);
    },
    stick: function (a, ctx, t, v) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(90, t + 0.12);
      g.gain.setValueAtTime(0.14 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(g); g.connect(a.sfxBus); o.start(t); o.stop(t + 0.16);
    },
    pearl: function (a, ctx, t, v) {
      [1, 1.5, 2.02].forEach(function (m, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 880 * m;
        g.gain.setValueAtTime(0, t + i * 0.02);
        g.gain.linearRampToValueAtTime(0.11 * v / (i + 1), t + i * 0.02 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o.connect(g); g.connect(a.sfxBus); o.start(t + i * 0.02); o.stop(t + 1.0);
      });
    },
    coin: function (a, ctx, t, v) {
      [1, 1.26].forEach(function (m, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(660 * m, t + i * 0.06);
        g.gain.setValueAtTime(0.12 * v, t + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.18);
        o.connect(g); g.connect(a.sfxBus); o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.2);
      });
    },
    success: function (a, ctx, t, v) {
      var scale = [0, 4, 7, 12];
      scale.forEach(function (s, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = 440 * Math.pow(2, s / 12);
        var tt = t + i * 0.09;
        g.gain.setValueAtTime(0, tt);
        g.gain.linearRampToValueAtTime(0.14 * v, tt + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.45);
        o.connect(g); g.connect(a.sfxBus); o.start(tt); o.stop(tt + 0.5);
      });
    },
    fail: function (a, ctx, t, v) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(80, t + 0.4);
      g.gain.setValueAtTime(0.12 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g); g.connect(a.sfxBus); o.start(t); o.stop(t + 0.46);
    },
    ui: function (a, ctx, t, v) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = 900;
      g.gain.setValueAtTime(0.05 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g); g.connect(a.sfxBus); o.start(t); o.stop(t + 0.07);
    },
    step: function (a, ctx, t, v) {
      var n = ctx.createBufferSource(); n.buffer = a._noiseBuffer(1);
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 1.1;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.05 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      n.connect(bp); bp.connect(g); g.connect(a.sfxBus);
      n.start(t); n.stop(t + 0.08);
    }
  };

  Audio.prototype.play = function (name, vol) {
    if (!this.ready || !this.enabled) return;
    var fn = SFX[name];
    if (!fn) return;
    try { fn(this, this.ctx, this.ctx.currentTime + 0.001, vol === undefined ? 1 : clamp(vol, 0, 2)); }
    catch (e) { /* an SFX must never take the frame down */ }
  };

  /* -------------------------------------------------------------- mixing */

  Audio.prototype.setDistrict = function (id) {
    if (!DISTRICT_MOOD[id] || this.district === id) return;
    this.district = id;
    this.mood = DISTRICT_MOOD[id];
  };

  Audio.prototype.setVolumes = function (master, music, sfx) {
    this.masterVol = master; this.musicVol = music; this.sfxVol = sfx;
    if (!this.ready) return;
    this.master.gain.setTargetAtTime(master, this.ctx.currentTime, 0.1);
    this.musicBus.gain.setTargetAtTime(music, this.ctx.currentTime, 0.1);
    this.sfxBus.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.1);
  };

  Audio.prototype.setEnabled = function (on) {
    this.enabled = on;
    if (!this.ready) return;
    this.master.gain.setTargetAtTime(on ? this.masterVol : 0, this.ctx.currentTime, 0.15);
    if (on && this.ctx.state === 'suspended') this.ctx.resume();
  };

  Audio.prototype.resume = function () {
    if (this.ready && this.ctx.state === 'suspended') this.ctx.resume();
  };

  Audio.prototype.dispose = function () {
    if (this.timer) clearInterval(this.timer);
    if (this.ctx) { try { this.ctx.close(); } catch (e) { /* nothing to close */ } }
    this.ready = false;
  };

  OCTO.Audio = Audio;

})(typeof window !== 'undefined' ? window : globalThis);
