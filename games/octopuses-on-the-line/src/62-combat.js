/* =====================================================================
 * OCTOPUSES ON THE LINE — 62-combat.js
 *
 * Combat, and the skills the action wheel fires.
 *
 * The rule this file follows: combat must not become a second game
 * bolted onto the first. Everything here reads the rope simulation the
 * rest of the project is built around. A Tank's skill sags the line into
 * a bridge; an Archer's pins a hook and reels; a Mage's writes a rope
 * out of light where none exists. Fighting on a rope is harder than
 * fighting on the ground because the balance model is still running
 * underneath you, and being hit costs you your footing before it costs
 * you health.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var TAU = Math.PI * 2;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function dist2(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return dx * dx + dy * dy + dz * dz;
  }

  /* ------------------------------------------------------------ vitals */

  /**
   * Health and focus. Health scales with level and with the discipline's
   * `power` axis; focus (the resource skills spend) scales with `support`
   * so a Healer can actually keep casting.
   */
  function vitalsFor(cls, level) {
    var b = cls.bars || {};
    return {
      maxHp: Math.round(220 + level * 46 + (b.power || 3) * 55 + (b.balance || 3) * 18),
      maxSp: Math.round(80 + level * 11 + (b.support || 2) * 34),
      hpRegen: 2.2 + level * 0.16,
      spRegen: 3.4 + (b.support || 2) * 0.9,
      attack: Math.round(14 + level * 3.4 + (b.power || 3) * 6),
      defence: Math.round(4 + level * 1.3 + (b.balance || 3) * 2.6)
    };
  }

  /* ------------------------------------------------------------ skills */

  /**
   * Four skills per discipline. `kind` is what the skill physically does,
   * and every kind is implemented against systems that already existed:
   *
   *   strike  — damage in an arc in front of you
   *   burst   — damage in a radius around you
   *   bolt    — a travelling projectile
   *   hook    — pulls you along a line toward a target
   *   ward    — heals, or steadies balance, on you and nearby allies
   *   sag     — drags the nearest rope down into a bridge
   *   weave   — conjures a temporary rope between you and where you aim
   */
  var SKILLS = {
    sayyad: [
      { id: 'volley',  en: 'Arrow Volley',  ar: 'وابل السهام',  kind: 'bolt',   sp: 14, cd: 1.1, power: 1.35, range: 26 },
      { id: 'pin',     en: 'Pinning Shot',  ar: 'سهم التثبيت',  kind: 'bolt',   sp: 22, cd: 5.0, power: 1.10, range: 30, slow: 0.45 },
      { id: 'reel',    en: 'Line Hook',     ar: 'خطاف الخيط',   kind: 'hook',   sp: 18, cd: 6.5, power: 0,    range: 34 },
      { id: 'rain',    en: 'Falling Star',  ar: 'النجم الساقط', kind: 'burst',  sp: 34, cd: 12,  power: 2.10, range: 9 }
    ],
    muqatil: [
      { id: 'cleave',  en: 'Cleave',        ar: 'الشطر',        kind: 'strike', sp: 10, cd: 0.8, power: 1.45, range: 3.4, arc: 1.5 },
      { id: 'lunge',   en: 'Lunge',         ar: 'الاندفاع',     kind: 'strike', sp: 18, cd: 4.5, power: 1.85, range: 5.2, arc: 0.9, dash: 5 },
      { id: 'whirl',   en: 'Whirlwind',     ar: 'الزوبعة',      kind: 'burst',  sp: 26, cd: 8,   power: 1.70, range: 4.6 },
      { id: 'resolve', en: 'Second Wind',   ar: 'النفَس الثاني', kind: 'ward',   sp: 30, cd: 16,  heal: 0.28, steady: 1 }
    ],
    dir: [
      { id: 'bash',    en: 'Shield Bash',   ar: 'ضربة الدرع',   kind: 'strike', sp: 12, cd: 1.2, power: 1.30, range: 3.0, arc: 1.2, stagger: 1 },
      { id: 'anchor',  en: 'Hold Fast',     ar: 'الثبات',       kind: 'ward',   sp: 20, cd: 10,  shield: 0.35, steady: 2 },
      { id: 'sag',     en: 'Bridge the Line', ar: 'جسر الخيط',  kind: 'sag',    sp: 24, cd: 9,   range: 8 },
      { id: 'quake',   en: 'Ground Quake',  ar: 'الرجفة',       kind: 'burst',  sp: 32, cd: 14,  power: 1.55, range: 6.5, stagger: 1 }
    ],
    shafi: [
      { id: 'mend',    en: 'Mend',          ar: 'الرأب',        kind: 'ward',   sp: 16, cd: 1.6, heal: 0.16 },
      { id: 'steady',  en: 'Steady Hand',   ar: 'اليد الثابتة', kind: 'ward',   sp: 20, cd: 7,   steady: 3, radius: 12 },
      { id: 'smite',   en: 'Dawn Lance',    ar: 'رمح الفجر',    kind: 'bolt',   sp: 18, cd: 2.2, power: 1.15, range: 20 },
      { id: 'revive',  en: 'Catch a Fall',  ar: 'إنقاذ الساقط', kind: 'ward',   sp: 38, cd: 20,  heal: 0.42, radius: 14, steady: 4 }
    ],
    sahir: [
      { id: 'ember',   en: 'Ember',         ar: 'الجمرة',       kind: 'bolt',   sp: 12, cd: 0.9, power: 1.40, range: 24 },
      { id: 'weave',   en: 'Weave a Line',  ar: 'نسج الخيط',    kind: 'weave',  sp: 26, cd: 11,  range: 30 },
      { id: 'nova',    en: 'Falak Nova',    ar: 'انفجار فلك',   kind: 'burst',  sp: 34, cd: 10,  power: 2.00, range: 8 },
      { id: 'sever',   en: 'Sever',         ar: 'القطع',        kind: 'bolt',   sp: 28, cd: 6,   power: 1.75, range: 22, slow: 0.35 }
    ]
  };

  function skillsFor(classId) { return SKILLS[classId] || SKILLS.muqatil; }

  /** A skill unlocks at these levels, in order. */
  var SKILL_LEVELS = [1, 6, 14, 26];

  /* ----------------------------------------------------------- enemies */

  /**
   * Enemy archetypes. `line` marks the ones that live on the ropes —
   * they are the reason combat and traversal are the same game.
   */
  var FOES = {
    knot: {
      en: 'Knot Crawler', ar: 'زاحف العُقد',
      hp: 60, dmg: 8, speed: 2.6, aggro: 14, reach: 2.0, xp: 24, coin: 7,
      colour: [0.62, 0.44, 0.26], accent: [0.92, 0.74, 0.36], scale: 0.72, line: true
    },
    husk: {
      en: 'Sand Husk', ar: 'قشرة الرمل',
      hp: 110, dmg: 14, speed: 2.2, aggro: 16, reach: 2.3, xp: 40, coin: 12,
      colour: [0.74, 0.62, 0.42], accent: [0.52, 0.40, 0.24], scale: 0.95
    },
    lamp: {
      en: 'Lamp Wraith', ar: 'شبح القنديل',
      hp: 90, dmg: 18, speed: 3.4, aggro: 20, reach: 12, ranged: true, xp: 52, coin: 16,
      colour: [0.30, 0.34, 0.52], accent: [1.00, 0.82, 0.42], scale: 0.88
    },
    drifter: {
      en: 'Falak Drifter', ar: 'هائم فلك',
      hp: 170, dmg: 22, speed: 3.0, aggro: 22, reach: 14, ranged: true, xp: 78, coin: 24,
      colour: [0.34, 0.26, 0.52], accent: [0.52, 0.90, 1.00], scale: 1.05, line: true
    },
    warden: {
      en: 'Anchor Warden', ar: 'حارس المرساة',
      hp: 420, dmg: 34, speed: 2.4, aggro: 24, reach: 3.2, xp: 220, coin: 90,
      colour: [0.24, 0.20, 0.24], accent: [0.40, 0.94, 1.00], scale: 1.45, elite: true
    }
  };

  function Foe(type, x, y, z, level, id) {
    var t = FOES[type];
    this.type = type;
    this.def = t;
    this.id = id;
    this.pos = { x: x, y: y, z: z };
    this.home = { x: x, y: y, z: z };
    this.vel = { x: 0, y: 0, z: 0 };
    this.yaw = Math.random() * TAU;
    this.level = level;
    // A foe five levels above you hits about twice as hard as one at your
    // level; the curve is deliberately gentle so wandering into a high
    // district is a warning rather than an instant death.
    var s = 1 + (level - 1) * 0.16;
    this.maxHp = Math.round(t.hp * s);
    this.hp = this.maxHp;
    this.damage = Math.round(t.dmg * s);
    this.state = 'idle';
    this.attackCd = 0;
    this.hurt = 0;
    this.stagger = 0;
    this.slow = 0;
    this.dead = false;
    this.deadTimer = 0;
    this.respawn = 0;
    this.phase = Math.random() * TAU;
  }

  Foe.prototype.takeDamage = function (n, game) {
    if (this.dead) return 0;
    var dealt = Math.max(1, Math.round(n));
    this.hp -= dealt;
    this.hurt = 0.22;
    this.state = 'chase';
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.deadTimer = 1.1;
      this.respawn = 22 + Math.random() * 14;
      game.onFoeKilled(this);
    }
    return dealt;
  };

  Foe.prototype.update = function (dt, game) {
    this.phase += dt;
    this.hurt = Math.max(0, this.hurt - dt);
    this.stagger = Math.max(0, this.stagger - dt);
    this.slow = Math.max(0, this.slow - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);

    if (this.dead) {
      this.deadTimer = Math.max(0, this.deadTimer - dt);
      this.respawn -= dt;
      if (this.respawn <= 0) {
        this.dead = false;
        this.hp = this.maxHp;
        this.pos.x = this.home.x; this.pos.y = this.home.y; this.pos.z = this.home.z;
        this.state = 'idle';
      }
      return;
    }
    if (this.stagger > 0) return;

    var p = game.player.pos;
    var d2 = dist2(this.pos, p);
    var t = this.def;
    var aggro = t.aggro * t.aggro;

    if (d2 < aggro) this.state = 'chase';
    else if (d2 > aggro * 4) this.state = 'idle';

    if (this.state === 'chase') {
      var d = Math.sqrt(d2);
      var reach = t.reach;
      this.yaw = Math.atan2(p.x - this.pos.x, p.z - this.pos.z);
      if (d > reach) {
        var sp = t.speed * (this.slow > 0 ? 0.5 : 1) * dt;
        var inv = 1 / Math.max(d, 0.001);
        this.pos.x += (p.x - this.pos.x) * inv * sp;
        this.pos.z += (p.z - this.pos.z) * inv * sp;
        // ranged foes hover; grounded ones follow the terrain
        var gy = game.world.groundHeight(this.pos.x, this.pos.z);
        this.pos.y = t.ranged ? Math.max(gy + 1.6, this.pos.y + (p.y - this.pos.y) * dt * 1.2) : gy;
      } else if (this.attackCd <= 0) {
        this.attackCd = t.ranged ? 2.2 : 1.5;
        game.damagePlayer(this.damage, this);
      }
    } else {
      // drift around home so the world is not full of statues
      var hx = this.home.x + Math.sin(this.phase * 0.5) * 2.4;
      var hz = this.home.z + Math.cos(this.phase * 0.37) * 2.4;
      this.pos.x += (hx - this.pos.x) * dt * 0.8;
      this.pos.z += (hz - this.pos.z) * dt * 0.8;
      this.pos.y = t.ranged
        ? game.world.groundHeight(this.pos.x, this.pos.z) + 1.6 + Math.sin(this.phase) * 0.2
        : game.world.groundHeight(this.pos.x, this.pos.z);
      this.yaw += dt * 0.4;
    }
  };

  /* -------------------------------------------------------- projectiles */

  function Bolt(x, y, z, dx, dy, dz, speed, dmg, skill, owner) {
    this.pos = { x: x, y: y, z: z };
    this.vel = { x: dx * speed, y: dy * speed, z: dz * speed };
    this.life = 2.0;
    this.dmg = dmg;
    this.skill = skill;
    this.owner = owner;
    this.dead = false;
  }

  /* -------------------------------------------------------------- combat */

  /**
   * Owns the fight: the foe population, the player's vitals, the skill
   * bar and everything in flight. The Game delegates to it rather than
   * growing another thousand lines.
   */
  function Combat(game) {
    this.game = game;
    this.foes = [];
    this.bolts = [];
    this.floaters = [];        // damage numbers
    this.target = null;
    this.auto = false;
    this.cooldowns = {};
    this.globalCd = 0;
    this.shield = 0;
    this.steady = 0;
    this.deathTimer = 0;
    this.dead = false;
    this.applyClass();
  }

  /** Recompute vitals from the current discipline and level. */
  Combat.prototype.applyClass = function () {
    var g = this.game;
    var cls = OCTO.classById(g.save.classId || 'muqatil');
    var v = vitalsFor(cls, g.hero.level);
    var hpFrac = this.maxHp ? this.hp / this.maxHp : 1;
    var spFrac = this.maxSp ? this.sp / this.maxSp : 1;
    this.vitals = v;
    this.maxHp = v.maxHp; this.maxSp = v.maxSp;
    this.hp = Math.round(v.maxHp * hpFrac);
    this.sp = Math.round(v.maxSp * spFrac);
    this.skills = skillsFor(cls.id);
  };

  /** Skills the player has unlocked, in bar order. */
  Combat.prototype.bar = function () {
    var lvl = this.game.hero.level, out = [];
    for (var i = 0; i < this.skills.length; i++) {
      out.push({
        skill: this.skills[i],
        unlocked: lvl >= SKILL_LEVELS[i],
        needs: SKILL_LEVELS[i],
        cd: this.cooldowns[this.skills[i].id] || 0
      });
    }
    return out;
  };

  Combat.prototype.spawn = function (world, rng) {
    this.foes.length = 0;
    var D = world.districts, id = 0;
    // Each district gets a population and a level band, so walking
    // outward is the difficulty curve.
    var plan = [
      { d: 'souq',    types: ['knot', 'husk'],           n: 10, lo: 1,  hi: 5 },
      { d: 'oasis',   types: ['husk', 'knot'],           n: 10, lo: 4,  hi: 9 },
      { d: 'line',    types: ['knot', 'lamp'],           n: 9,  lo: 8,  hi: 14 },
      { d: 'harbour', types: ['lamp', 'drifter'],        n: 10, lo: 13, hi: 22 },
      { d: 'towers',  types: ['drifter', 'lamp'],        n: 12, lo: 20, hi: 34 }
    ];
    for (var i = 0; i < plan.length; i++) {
      var pl = plan[i], c = D[pl.d].center;
      for (var k = 0; k < pl.n; k++) {
        var ang = rng.next() * TAU, rad = 18 + rng.next() * 52;
        var x = c.x + Math.cos(ang) * rad, z = c.z + Math.sin(ang) * rad;
        var y = world.groundHeight(x, z);
        var type = pl.types[Math.floor(rng.next() * pl.types.length)];
        var lvl = Math.round(pl.lo + rng.next() * (pl.hi - pl.lo));
        this.foes.push(new Foe(type, x, y, z, lvl, ++id));
      }
    }
    // One elite standing at each Anchor from the third onward: the reason
    // a rank gate is worth passing.
    var A = OCTO.progress.ANCHORS;
    for (var a = 2; a < A.length; a++) {
      var an = A[a];
      if (!an.at) continue;
      this.foes.push(new Foe('warden', an.at[0] + 5, an.at[1], an.at[2] + 5, an.level + 2, ++id));
    }
    return this.foes.length;
  };

  /* --------------------------------------------------------- targeting */

  /** Nearest live foe inside `range` and roughly in front of the camera. */
  Combat.prototype.pickTarget = function (range) {
    var g = this.game, p = g.player.pos, best = null, bestD = range * range;
    for (var i = 0; i < this.foes.length; i++) {
      var f = this.foes[i];
      if (f.dead) continue;
      var d2 = dist2(f.pos, p);
      if (d2 < bestD) { bestD = d2; best = f; }
    }
    return best;
  };

  Combat.prototype.syncTarget = function () {
    if (this.target && (this.target.dead || dist2(this.target.pos, this.game.player.pos) > 36 * 36)) {
      this.target = null;
    }
    if (!this.target) this.target = this.pickTarget(24);
    return this.target;
  };

  /* ------------------------------------------------------------ casting */

  Combat.prototype.canCast = function (index) {
    var b = this.bar()[index];
    if (!b || !b.unlocked) return false;
    if (this.dead) return false;
    return b.cd <= 0 && this.globalCd <= 0 && this.sp >= b.skill.sp;
  };

  /**
   * Fire skill `index`. Returns a reason string when it cannot, so the UI
   * can say why rather than silently doing nothing.
   */
  Combat.prototype.cast = function (index) {
    var b = this.bar()[index];
    if (!b) return 'none';
    if (this.dead) return 'dead';
    if (!b.unlocked) return 'locked';
    if (b.cd > 0 || this.globalCd > 0) return 'cooldown';
    if (this.sp < b.skill.sp) return 'sp';

    var s = b.skill, g = this.game, p = g.player;
    this.sp -= s.sp;
    this.cooldowns[s.id] = s.cd;
    this.globalCd = 0.35;

    var atk = this.vitals.attack;
    var tgt = this.syncTarget();
    // Turn to face the target before swinging. Requiring the player to aim
    // with the camera while also steering with a thumb-stick is a desktop
    // assumption; every mobile action-RPG snaps the facing on the cast, and
    // without it a melee arc misses a foe standing right beside you.
    if (tgt) {
      p.yaw = Math.atan2(tgt.pos.x - p.pos.x, tgt.pos.z - p.pos.z);
      p.visualYaw = p.yaw;
    }
    var fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);

    if (s.kind === 'strike') {
      if (s.dash) {
        p.vel.x += fx * s.dash; p.vel.z += fz * s.dash;
      }
      this._arc(p.pos, fx, fz, s.range, s.arc || 1.2, atk * s.power, s);
    } else if (s.kind === 'burst') {
      this._arc(p.pos, fx, fz, s.range, Math.PI, atk * s.power, s);
      g.spawnSparkle({ x: p.pos.x, y: p.pos.y + 1, z: p.pos.z }, 20);
    } else if (s.kind === 'bolt') {
      var dx = fx, dy = 0.02, dz = fz;
      if (tgt) {
        dx = tgt.pos.x - p.pos.x; dy = (tgt.pos.y + 0.9) - (p.pos.y + 1.1); dz = tgt.pos.z - p.pos.z;
        var l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        dx /= l; dy /= l; dz /= l;
      }
      this.bolts.push(new Bolt(p.pos.x, p.pos.y + 1.1, p.pos.z, dx, dy, dz, 34, atk * s.power, s, 'player'));
    } else if (s.kind === 'hook') {
      if (tgt) {
        var hx = tgt.pos.x - p.pos.x, hz = tgt.pos.z - p.pos.z;
        var hl = Math.sqrt(hx * hx + hz * hz) || 1;
        p.vel.x = (hx / hl) * 18; p.vel.z = (hz / hl) * 18; p.vel.y = Math.max(p.vel.y, 5);
        g.toast(g.lang === 'ar' ? 'خطاف!' : 'Hooked!', 'ok');
      } else return 'target';
    } else if (s.kind === 'ward') {
      if (s.heal) {
        var healed = Math.round(this.maxHp * s.heal);
        this.hp = Math.min(this.maxHp, this.hp + healed);
        this.floaters.push({ x: p.pos.x, y: p.pos.y + 2, z: p.pos.z, n: healed, kind: 'heal', t: 0 });
      }
      if (s.shield) this.shield = Math.max(this.shield, s.shield);
      if (s.steady) this.steady = Math.max(this.steady, s.steady);
      g.spawnSparkle({ x: p.pos.x, y: p.pos.y + 1, z: p.pos.z }, 14);
    } else if (s.kind === 'sag') {
      // drag the nearest rope down into a bridge
      var rope = this._nearestRope(s.range);
      if (rope) {
        rope.extraLoad = (rope.extraLoad || 0) + 40;
        rope.loadTimer = 8;
        g.toast(g.lang === 'ar' ? 'انحنى الخيط' : 'The line bows', 'ok');
      } else return 'target';
    } else if (s.kind === 'weave') {
      if (!g.weaveLine(s.range)) return 'target';
    }

    g.audio && g.audio.play(s.kind === 'ward' ? 'success' : 'grab', 0.55);
    return 'ok';
  };

  /** Damage every live foe inside a cone. */
  Combat.prototype._arc = function (origin, fx, fz, range, arc, dmg, skill) {
    var hits = 0;
    for (var i = 0; i < this.foes.length; i++) {
      var f = this.foes[i];
      if (f.dead) continue;
      var dx = f.pos.x - origin.x, dz = f.pos.z - origin.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d > range) continue;
      if (arc < Math.PI) {
        var dot = (dx / (d || 1)) * fx + (dz / (d || 1)) * fz;
        if (dot < Math.cos(arc)) continue;
      }
      this._hit(f, dmg, skill);
      hits++;
    }
    return hits;
  };

  Combat.prototype._hit = function (foe, dmg, skill) {
    // a small spread so repeated hits do not read as a fixed number
    var roll = dmg * (0.88 + Math.random() * 0.24);
    var crit = Math.random() < 0.14;
    if (crit) roll *= 1.7;
    var dealt = foe.takeDamage(roll, this.game);
    this.floaters.push({
      x: foe.pos.x, y: foe.pos.y + 1.6, z: foe.pos.z,
      n: dealt, kind: crit ? 'crit' : 'hit', t: 0
    });
    if (skill && skill.slow) foe.slow = 3;
    if (skill && skill.stagger) foe.stagger = 0.8;
  };

  Combat.prototype._nearestRope = function (range) {
    var g = this.game, p = g.player.pos, best = null, bestD = range * range;
    for (var i = 0; i < g.ropes.length; i++) {
      var r = g.ropes[i];
      var mx = (r.a.x + r.b.x) * 0.5, my = (r.a.y + r.b.y) * 0.5, mz = (r.a.z + r.b.z) * 0.5;
      var d2 = (mx - p.x) * (mx - p.x) + (my - p.y) * (my - p.y) + (mz - p.z) * (mz - p.z);
      if (d2 < bestD) { bestD = d2; best = r; }
    }
    return best;
  };

  /* ------------------------------------------------------------- update */

  Combat.prototype.update = function (dt) {
    var g = this.game;

    for (var k in this.cooldowns) {
      if (this.cooldowns[k] > 0) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    }
    this.globalCd = Math.max(0, this.globalCd - dt);
    this.shield = Math.max(0, this.shield - dt * 0.1);
    this.steady = Math.max(0, this.steady - dt);

    if (this.dead) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) this.revive();
      return;
    }

    // regeneration, slower while something is actively hunting you
    var hunted = false;
    for (var i = 0; i < this.foes.length; i++) {
      this.foes[i].update(dt, g);
      if (!this.foes[i].dead && this.foes[i].state === 'chase') hunted = true;
    }
    var rate = hunted ? 0.35 : 1;
    this.hp = Math.min(this.maxHp, this.hp + this.vitals.hpRegen * rate * dt);
    this.sp = Math.min(this.maxSp, this.sp + this.vitals.spRegen * rate * dt);

    // projectiles
    for (var b = this.bolts.length - 1; b >= 0; b--) {
      var bolt = this.bolts[b];
      bolt.life -= dt;
      bolt.pos.x += bolt.vel.x * dt;
      bolt.pos.y += bolt.vel.y * dt;
      bolt.pos.z += bolt.vel.z * dt;
      if (bolt.life <= 0) { this.bolts.splice(b, 1); continue; }
      for (var f2 = 0; f2 < this.foes.length; f2++) {
        var foe = this.foes[f2];
        if (foe.dead) continue;
        if (dist2(foe.pos, bolt.pos) < 1.8 * 1.8) {
          this._hit(foe, bolt.dmg, bolt.skill);
          this.bolts.splice(b, 1);
          break;
        }
      }
    }

    // floating numbers rise and fade
    for (var fl = this.floaters.length - 1; fl >= 0; fl--) {
      this.floaters[fl].t += dt;
      if (this.floaters[fl].t > 1.1) this.floaters.splice(fl, 1);
    }

    this.syncTarget();

    // auto-attack: fires the first unlocked skill whenever it is ready
    if (this.auto && this.target && this.globalCd <= 0) {
      for (var s = 0; s < this.skills.length; s++) {
        if (this.canCast(s)) { this.cast(s); break; }
      }
    }
  };

  Combat.prototype.hurtPlayer = function (n, source) {
    if (this.dead) return 0;
    var reduced = n * (1 - Math.min(0.6, this.vitals.defence / (this.vitals.defence + 90)));
    if (this.shield > 0) reduced *= (1 - this.shield);
    var dealt = Math.max(1, Math.round(reduced));
    this.hp -= dealt;
    var p = this.game.player;
    this.floaters.push({ x: p.pos.x, y: p.pos.y + 2.1, z: p.pos.z, n: dealt, kind: 'take', t: 0 });
    this.game.camera && this.game.camera.addShake(0.35);
    // Being hit on a rope costs footing before it costs health — the
    // balance model is the thing combat is supposed to threaten.
    if (p.state === 'line' && this.steady <= 0) {
      p.tiltVel += (Math.random() < 0.5 ? -1 : 1) * 2.6;
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.deathTimer = 3.0;
      this.game.audio && this.game.audio.play('fail');
      this.game.toast(this.game.lang === 'ar' ? 'سقطت…' : 'You went down…', 'warn');
    }
    return dealt;
  };

  Combat.prototype.revive = function () {
    this.dead = false;
    this.hp = Math.round(this.maxHp * 0.55);
    this.sp = Math.round(this.maxSp * 0.4);
    var g = this.game;
    var cp = g.lastCheckpoint;
    if (cp) g.player.teleport(cp.x, cp.y + 0.6, cp.z, cp.yaw);
    g.camera.free = false;
    g.frameCamera();
    g.toast(g.lang === 'ar' ? 'نهضت من جديد' : 'Back on your feet', 'ok');
  };

  OCTO.combat = {
    Combat: Combat,
    Foe: Foe,
    FOES: FOES,
    SKILLS: SKILLS,
    SKILL_LEVELS: SKILL_LEVELS,
    skillsFor: skillsFor,
    vitalsFor: vitalsFor
  };

})(typeof window !== 'undefined' ? window : globalThis);
