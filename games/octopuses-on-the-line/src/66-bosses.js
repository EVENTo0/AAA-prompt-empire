/* =====================================================================
 * OCTOPUSES ON THE LINE — 66-bosses.js
 *
 * The MVPs, and the daily loop.
 *
 * A boss here is not a big foe with more health. Each one owns a
 * district and breaks one rule of the game inside it: the Weaver cuts
 * ropes out from under you, the Harbourmaster drags the lines down until
 * they sag into the sea, the Calligrapher rewrites which way is up. The
 * fight is still the balance model — that is the point. Beating a boss
 * teaches you something about the rope, not about a damage rotation.
 *
 * Each has a real respawn clock, a drop table with a guaranteed piece,
 * and a place on the map you have to walk to.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;

  /**
   * The roster. `rule` is the rule of the world this boss breaks, and it
   * is the whole design of the fight. `site` is a tie-off point the world
   * generator computed, resolved the same way the Anchors are.
   */
  var BOSSES = [
    {
      id: 'weaver', site: 'plaza', off: [18, 0, -20], district: 'souq',
      en: 'The Knot Weaver', ar: 'ناسجة العُقد',
      level: 12, hp: 2600, damage: 26, respawn: 300, rule: 'cut',
      loreEn: 'She tied the first line over the souq, and she has never forgiven the city for walking on it.',
      loreAr: 'هي من ربطت أول خيط فوق السوق، ولم تسامح المدينة قط على المشي عليه.',
      ruleEn: 'Cuts the rope beneath you every few seconds. Do not be standing on one.',
      ruleAr: 'تقطع الخيط تحتك كل بضع ثوانٍ. لا تكن واقفاً عليه.',
      drops: ['stave', 'wrap', 'charm'], colour: [0.52, 0.26, 0.34], accent: [1.0, 0.72, 0.36], scale: 2.0
    },
    {
      id: 'thirst', site: 'oasis', off: [10, 0, -14], district: 'oasis',
      en: 'The Long Thirst', ar: 'الظمأ الطويل',
      level: 20, hp: 4200, damage: 34, respawn: 420, rule: 'drain',
      loreEn: 'It was a well once. It remembers being full, and it wants that back.',
      loreAr: 'كانت بئراً ذات يوم. تذكر أنها كانت ملأى، وتريد ذلك مجدداً.',
      ruleEn: 'Drains your focus while you are near it. Land your skills early.',
      ruleAr: 'يستنزف طاقتك ما دمت قريباً. استخدم مهاراتك مبكراً.',
      drops: ['silks', 'slippers', 'sigil'], colour: [0.34, 0.44, 0.40], accent: [0.60, 1.0, 0.86], scale: 2.2
    },
    {
      id: 'harbourmaster', site: 'harbour', off: [16, 0, 14], district: 'harbour',
      en: 'The Harbourmaster', ar: 'ربّان الميناء',
      level: 30, hp: 7400, damage: 46, respawn: 600, rule: 'sag',
      loreEn: 'He signed for every rope in the harbour. He intends to collect them all back.',
      loreAr: 'وقّع على كل حبل في الميناء، وينوي استرجاعها جميعاً.',
      ruleEn: 'Drags every nearby line down. The crossings you know stop being level.',
      ruleAr: 'يشد كل خيط قريب إلى الأسفل. المعابر التي تعرفها لن تبقى مستوية.',
      drops: ['hauberk', 'buckler', 'boots'], colour: [0.22, 0.30, 0.44], accent: [0.50, 0.88, 1.0], scale: 2.4
    },
    {
      id: 'calligrapher', site: 'towers', off: [-18, 0, 12], district: 'towers',
      en: 'The Calligrapher', ar: 'الخطّاط',
      level: 42, hp: 12000, damage: 58, respawn: 900, rule: 'wind',
      loreEn: 'He wrote the beacons. Somewhere in the writing he stopped being a man and became the sentence.',
      loreAr: 'هو من كتب المنارات. وفي مكان ما من الكتابة، كفّ عن كونه رجلاً وصار الجملة نفسها.',
      ruleEn: 'Turns the wind against you, hard. Grip, or be written off the line.',
      ruleAr: 'يقلب الريح عليك بعنف. تشبّث، أو تُمحَ عن الخيط.',
      drops: ['silks', 'stave', 'sigil'], colour: [0.30, 0.22, 0.46], accent: [0.86, 0.62, 1.0], scale: 2.6
    },
    {
      id: 'khayt', site: 'farGate', off: [-6, 0, -8], district: 'line',
      en: "Ra's al-Khayt", ar: 'رأس الخيط',
      level: 55, hp: 26000, damage: 76, respawn: 1800, rule: 'all', final: true,
      loreEn: 'Every rope in the city is one rope. This is the end of it, and it has been watching the whole time.',
      loreAr: 'كل حبال المدينة حبل واحد. وهذه نهايته، وقد كان يراقب طوال الوقت.',
      ruleEn: 'Cuts, drags and turns the wind — everything the others do, at once.',
      ruleAr: 'يقطع ويشدّ ويقلب الريح — كل ما يفعله الآخرون، دفعة واحدة.',
      drops: ['blade', 'bow', 'hauberk', 'sigil'], colour: [0.80, 0.50, 0.20], accent: [0.30, 0.92, 1.0], scale: 3.4
    }
  ];

  function bossById(id) {
    for (var i = 0; i < BOSSES.length; i++) if (BOSSES[i].id === id) return BOSSES[i];
    return null;
  }

  /**
   * A live boss. It reuses the Foe contract so the combat loop, the
   * target plate and the damage numbers all work on it unchanged — a
   * boss is a foe with a clock, a name and a rule.
   */
  function makeBoss(def, world, state) {
    var site = world.anchors[def.site];
    if (!site) {
      var d = world.districts[def.district];
      site = d ? d.center : { x: 0, y: 0, z: 0 };
    }
    var x = site.x + def.off[0], z = site.z + def.off[2];
    var y = world.groundHeight(x, z);
    var foe = new OCTO.combat.Foe('warden', x, y, z, def.level, 9000 + BOSSES.indexOf(def));
    foe.boss = def;
    foe.def = {
      en: def.en, ar: def.ar, hp: def.hp, dmg: def.damage, speed: 2.6,
      aggro: 26, reach: 3.4, xp: def.level * 26, coin: def.level * 9,
      colour: def.colour, accent: def.accent, scale: def.scale, elite: true
    };
    foe.maxHp = def.hp;
    foe.hp = def.hp;
    foe.damage = def.damage;
    foe.ruleTimer = 0;
    // A boss killed recently stays down until its clock runs out.
    var s = state && state[def.id];
    if (s && s.downUntil > Date.now()) {
      foe.dead = true;
      foe.deadTimer = 0;
      foe.respawn = (s.downUntil - Date.now()) / 1000;
    } else {
      foe.respawn = 0;
    }
    return foe;
  }

  /**
   * Bosses register themselves with the combat system and then run their
   * rule every few seconds while they are chasing.
   */
  function Bosses(game) {
    this.game = game;
    this.list = [];
    this.state = (game.save.bosses && JSON.parse(JSON.stringify(game.save.bosses))) || {};
  }

  Bosses.prototype.spawn = function (world) {
    var self = this;
    this.list = [];
    BOSSES.forEach(function (def) {
      var foe = makeBoss(def, world, self.state);
      self.list.push(foe);
      self.game.combat.foes.push(foe);
    });
    return this.list.length;
  };

  /** How long until this boss is back, in seconds. 0 means it is up. */
  Bosses.prototype.timeLeft = function (id) {
    var s = this.state[id];
    if (!s || !s.downUntil) return 0;
    return Math.max(0, Math.round((s.downUntil - Date.now()) / 1000));
  };

  Bosses.prototype.isUp = function (id) {
    var f = this.find(id);
    return !!f && !f.dead;
  };

  Bosses.prototype.find = function (id) {
    for (var i = 0; i < this.list.length; i++) {
      if (this.list[i].boss && this.list[i].boss.id === id) return this.list[i];
    }
    return null;
  };

  /** Called by the game when any foe dies; ignores anything not a boss. */
  Bosses.prototype.onKilled = function (foe) {
    if (!foe.boss) return false;
    var def = foe.boss, g = this.game, ar = g.lang === 'ar';
    this.state[def.id] = {
      downUntil: Date.now() + def.respawn * 1000,
      kills: ((this.state[def.id] && this.state[def.id].kills) || 0) + 1,
      best: Math.min((this.state[def.id] && this.state[def.id].best) || 1e9, Math.round(g.time - (foe.engagedAt || g.time)))
    };
    foe.respawn = def.respawn;

    // guaranteed drop, plus a roll on the rest of the table
    var made = [];
    var first = OCTO.items.makeItem(def.drops[0], def.level, def.final ? 'thread' : 'relic');
    if (g.inventory.add(first)) made.push(first);
    for (var i = 1; i < def.drops.length; i++) {
      if (Math.random() > 0.5) continue;
      var it = OCTO.items.makeItem(def.drops[i], def.level,
        OCTO.items.rollRarity(def.level, 1.2));
      if (g.inventory.add(it)) made.push(it);
    }
    g.toast((ar ? 'سقط ' : 'Felled ') + (ar ? def.ar : def.en) +
      (made.length ? '  ·  ' + made.length + (ar ? ' غنيمة' : ' drops') : ''), 'success');
    g.persist();
    return true;
  };

  /**
   * Run each live boss's rule. This is where a boss becomes a boss: it
   * reaches into the same rope and wind systems the player lives in.
   */
  Bosses.prototype.update = function (dt) {
    var g = this.game, p = g.player;
    for (var i = 0; i < this.list.length; i++) {
      var f = this.list[i];
      if (f.dead || f.state !== 'chase') continue;
      if (!f.engagedAt) f.engagedAt = g.time;
      f.ruleTimer -= dt;
      if (f.ruleTimer > 0) continue;
      f.ruleTimer = 4.5;
      var rule = f.boss.rule;

      if (rule === 'cut' || rule === 'all') {
        // cut the line out from under the player
        if (p.line) {
          p.detachLine({ x: 0, y: 1.2, z: 0 }, 0.9);
          g.toast(g.lang === 'ar' ? 'قُطع الخيط!' : 'The line is cut!', 'warn');
          g.camera && g.camera.addShake(0.6);
        }
      }
      if (rule === 'drain' || rule === 'all') {
        g.combat.sp = Math.max(0, g.combat.sp - g.combat.maxSp * 0.18);
      }
      if (rule === 'sag' || rule === 'all') {
        for (var r = 0; r < g.ropes.length; r++) {
          var rope = g.ropes[r];
          var dx = (rope.a.x + rope.b.x) * 0.5 - f.pos.x;
          var dz = (rope.a.z + rope.b.z) * 0.5 - f.pos.z;
          if (dx * dx + dz * dz > 40 * 40) continue;
          rope.extraLoad = (rope.extraLoad || 0) + 30;
          rope.loadTimer = 6;
        }
      }
      if (rule === 'wind' || rule === 'all') {
        g.windStrength = Math.min(1, g.windStrength + 0.35);
        g.windRestore = 8;
        if (p.state === 'line') p.tiltVel += (Math.random() < 0.5 ? -1 : 1) * 3.2;
      }
    }
    // wind settles back once the Calligrapher stops pushing
    if (g.windRestore > 0) {
      g.windRestore -= dt;
      if (g.windRestore <= 0) g.windStrength = 0.35;
    }
  };

  Bosses.prototype.toJSON = function () { return this.state; };

  OCTO.bosses = { BOSSES: BOSSES, Bosses: Bosses, bossById: bossById };

})(typeof window !== 'undefined' ? window : globalThis);
