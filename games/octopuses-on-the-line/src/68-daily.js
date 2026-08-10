/* =====================================================================
 * OCTOPUSES ON THE LINE — 68-daily.js
 *
 * The daily loop: sign-in, and a short list of things worth doing today.
 *
 * The tasks are deliberately drawn from what the game already measures —
 * ropes crossed, pearls found, foes felled, an Anchor visited. Nothing
 * here asks the player to do something they would not otherwise do; it
 * only tells them that today, doing it pays extra. That is the whole
 * honest version of a daily system.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;

  /** Local calendar day, so a reset happens at the player's midnight. */
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  var TASKS = [
    { id: 'cross',  en: 'Cross five lines',        ar: 'اعبر خمسة خيوط',      need: 5,  xp: 140, coin: 60 },
    { id: 'pearl',  en: 'Find three pearls',       ar: 'اعثر على ثلاث لآلئ',  need: 3,  xp: 120, coin: 45 },
    { id: 'kill',   en: 'Fell twelve foes',        ar: 'اصرع اثني عشر عدواً', need: 12, xp: 260, coin: 90 },
    { id: 'boss',   en: 'Fell one MVP',            ar: 'اصرع زعيماً واحداً',  need: 1,  xp: 600, coin: 300 },
    { id: 'anchor', en: 'Visit an Anchor',         ar: 'زر مرساة',            need: 1,  xp: 100, coin: 40 },
    { id: 'job',    en: 'Finish a job',            ar: 'أنجز عملاً',          need: 1,  xp: 220, coin: 120 }
  ];

  /** Seven days of sign-in, then it loops. Day seven is the good one. */
  var SIGNIN = [
    { coin: 80,  xp: 60 },
    { coin: 120, xp: 90 },
    { coin: 160, xp: 130, item: 'charm' },
    { coin: 220, xp: 180 },
    { coin: 300, xp: 240, item: 'slippers' },
    { coin: 400, xp: 320 },
    { coin: 700, xp: 640, item: 'blade', rare: true }
  ];

  function Daily(game) {
    this.game = game;
    var s = (game.save.daily) || {};
    this.day = s.day || '';
    this.counts = s.counts || {};
    this.claimed = s.claimed || {};
    this.streak = s.streak || 0;
    this.signedOn = s.signedOn || '';
    this.roll();
  }

  /** Reset the sheet when the calendar day changes. */
  Daily.prototype.roll = function () {
    var t = today();
    if (this.day === t) return false;
    this.day = t;
    this.counts = {};
    this.claimed = {};
    return true;
  };

  Daily.prototype.tasks = function () {
    var self = this;
    return TASKS.map(function (t) {
      var have = self.counts[t.id] || 0;
      return {
        task: t, have: Math.min(have, t.need),
        done: have >= t.need,
        claimed: !!self.claimed[t.id]
      };
    });
  };

  /** Record progress. Called from the systems that already track these. */
  Daily.prototype.note = function (id, n) {
    this.roll();
    this.counts[id] = (this.counts[id] || 0) + (n || 1);
    return this.counts[id];
  };

  Daily.prototype.claim = function (id) {
    this.roll();
    var t = null;
    for (var i = 0; i < TASKS.length; i++) if (TASKS[i].id === id) t = TASKS[i];
    if (!t) return 'unknown';
    if (this.claimed[id]) return 'claimed';
    if ((this.counts[id] || 0) < t.need) return 'incomplete';
    this.claimed[id] = true;
    this.game.awardXp(t.xp, 'daily');
    this.game.addDirhams(t.coin);
    this.game.persist();
    return 'ok';
  };

  Daily.prototype.canSignIn = function () { return this.signedOn !== today(); };

  Daily.prototype.signIn = function () {
    if (!this.canSignIn()) return 'done';
    this.signedOn = today();
    this.streak = (this.streak % SIGNIN.length) + 1;
    var r = SIGNIN[this.streak - 1];
    this.game.addDirhams(r.coin);
    this.game.awardXp(r.xp, 'signin');
    if (r.item) {
      var it = OCTO.items.makeItem(r.item, Math.max(1, this.game.hero.level),
        r.rare ? 'relic' : 'fine');
      this.game.inventory.add(it);
    }
    this.game.persist();
    return 'ok';
  };

  Daily.prototype.rewards = function () { return SIGNIN; };

  Daily.prototype.pending = function () {
    var n = this.canSignIn() ? 1 : 0;
    this.tasks().forEach(function (t) { if (t.done && !t.claimed) n++; });
    return n;
  };

  Daily.prototype.toJSON = function () {
    return {
      day: this.day, counts: this.counts, claimed: this.claimed,
      streak: this.streak, signedOn: this.signedOn
    };
  };

  OCTO.daily = { Daily: Daily, TASKS: TASKS, SIGNIN: SIGNIN, today: today };

})(typeof window !== 'undefined' ? window : globalThis);
