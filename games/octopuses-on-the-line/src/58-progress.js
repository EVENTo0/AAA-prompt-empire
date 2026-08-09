/* =====================================================================
 * OCTOPUSES ON THE LINE — 58-progress.js
 *
 * Level, experience and the ranks that gate the map.
 *
 * The curve is deliberately front-loaded the way mobile action-RPGs do
 * it: the first four levels arrive inside the opening ten minutes so the
 * player feels the system before they have to think about it, then the
 * cost climbs geometrically. Levels are not a damage number here — they
 * are a KEY. Each rank unlocks an Anchor (a gated route across the city),
 * and every Anchor is a piece of the story about what is holding the
 * lines up.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;

  var MAX_LEVEL = 60;

  /**
   * Experience needed to go from `level` to `level + 1`.
   * 1→2 costs 120; the cost grows 21% per level and is rounded to a
   * readable multiple of ten so the bar always reads cleanly.
   */
  function xpForLevel(level) {
    if (level < 1) level = 1;
    if (level >= MAX_LEVEL) return Infinity;
    return Math.round(120 * Math.pow(1.21, level - 1) / 10) * 10;
  }

  /** Total experience banked to reach the start of `level`. */
  function xpToReach(level) {
    var total = 0;
    for (var i = 1; i < level; i++) total += xpForLevel(i);
    return total;
  }

  /* ------------------------------------------------------------- ranks */

  /**
   * Rank titles. Each one is the name the city gives a Line-Walker who
   * has earned the right to use a particular height of rope.
   */
  var RANKS = [
    { level: 1,  en: 'Rope Novice',    ar: 'مبتدئ الحبل' },
    { level: 5,  en: 'Souq Runner',    ar: 'عدّاء السوق' },
    { level: 10, en: 'Line-Walker',    ar: 'ماشي الخيط' },
    { level: 16, en: 'Dune Crosser',   ar: 'عابر الكثبان' },
    { level: 24, en: 'Minaret Climber',ar: 'متسلّق المئذنة' },
    { level: 32, en: 'Harbour Pilot',  ar: 'ربّان الميناء' },
    { level: 42, en: 'Falak Adept',    ar: 'ماهر فلك' },
    { level: 52, en: 'Sky Anchor',     ar: 'مرساة السماء' },
    { level: 60, en: 'Thread Sovereign', ar: 'سيّد الخيط' }
  ];

  function rankFor(level) {
    var r = RANKS[0];
    for (var i = 0; i < RANKS.length; i++) if (level >= RANKS[i].level) r = RANKS[i];
    return r;
  }

  /* ----------------------------------------------------------- anchors */

  /**
   * The eight Anchors — level-gated destinations. These are the "dungeon
   * doors": the route exists on the map from the first minute, visible
   * and lit, but the gate reads your rank before it opens. Seeing a
   * locked Anchor is the point.
   *
   * Positions are NOT written here. Each Anchor names a `site` — one of
   * the tie-off points the world generator computes while it builds the
   * districts — plus a local offset. The world resolves them into `at`
   * at build time. Hardcoding coordinates here would mean guessing at a
   * procedural layout, and a guess lands a stone post in open sand.
   * `ground: true` means "drop to the terrain" rather than inherit the
   * site's height, which matters for the sites up on the harbour decks.
   */
  var ANCHORS = [
    {
      id: 'souq', level: 1, district: 'souq', site: 'plaza', off: [-7, 0, -7],
      en: 'Souq Anchor', ar: 'مرساة السوق',
      descEn: 'Where the first rope was tied. Every line in the city traces back to this post.',
      descAr: 'حيث رُبط أول حبل. كل خيط في المدينة يعود إلى هذا الوتد.'
    },
    {
      id: 'oasis', level: 5, district: 'oasis', site: 'oasis', off: [5, 0, 7],
      en: 'Oasis Anchor', ar: 'مرساة الواحة',
      descEn: 'Sunk into wet sand under the palms. It hums when the wind turns.',
      descAr: 'مغروزة في الرمل الرطب تحت النخيل. تطنّ حين يتحول الريح.'
    },
    {
      id: 'minaret', level: 10, district: 'line', site: 'minaret', off: [0, 0, -5],
      en: 'Minaret Anchor', ar: 'مرساة المئذنة',
      descEn: 'The high tie-off. From here the long line runs all the way to the harbour.',
      descAr: 'الربطة العالية. من هنا يمتد الخيط الطويل حتى الميناء.'
    },
    {
      id: 'harbour', level: 16, district: 'harbour', site: 'harbour', off: [8, 0, 8],
      en: 'Harbour Anchor', ar: 'مرساة الميناء',
      descEn: 'Bolted to a mooring mast. The drones use it to find their way home.',
      descAr: 'مثبتة في صاري الرسو. تستدل بها الطائرات على طريق العودة.'
    },
    {
      id: 'rings', level: 24, district: 'towers', site: 'towers', off: [-14, 0, 0],
      en: 'Ring Anchor', ar: 'مرساة الحلقات',
      descEn: 'Sunk into the lowest Neo-Falak ring, where the calligraphy still burns.',
      descAr: 'مغروزة في أدنى حلقات نيوفلك، حيث ما زال الخط يتوهج.'
    },
    {
      id: 'spire', level: 32, district: 'towers', site: 'towers', off: [22, 0, -34],
      en: 'Spire Anchor', ar: 'مرساة البرج',
      descEn: 'Nobody remembers tying this one. It was already here when the towers went up.',
      descAr: 'لا أحد يذكر من ربطها. كانت هنا قبل أن تُبنى الأبراج.'
    },
    {
      id: 'deep', level: 42, district: 'harbour', site: 'harbour', off: [34, 0, 30], ground: true,
      en: 'Deep Anchor', ar: 'المرساة العميقة',
      descEn: 'The line goes down here, not across. Something below is pulling.',
      descAr: 'الخيط ينزل هنا لا يعبر. شيء في الأسفل يشدّ.'
    },
    {
      id: 'titan', level: 52, district: 'line', site: 'farGate', off: [-16, 0, -14], ground: true,
      en: "Ra's al-Khayt", ar: 'رأس الخيط',
      descEn: 'Every rope in the city is one rope, and this is the end of it. It has eyes.',
      descAr: 'كل حبال المدينة حبل واحد، وهذه نهايته. وله عينان.'
    }
  ];

  function anchorById(id) {
    for (var i = 0; i < ANCHORS.length; i++) if (ANCHORS[i].id === id) return ANCHORS[i];
    return null;
  }

  function unlockedAnchors(level) {
    var out = [];
    for (var i = 0; i < ANCHORS.length; i++) if (level >= ANCHORS[i].level) out.push(ANCHORS[i]);
    return out;
  }

  /* ---------------------------------------------------------- awarding */

  /**
   * Experience values. Traversal pays, because traversal is the game:
   * a player who never takes a job still levels by crossing lines and
   * finding pearls, just more slowly.
   */
  var XP = {
    pearl: 22,
    lantern: 18,
    drone: 40,
    beacon: 55,
    lineCross: 12,      // per full rope crossing, once per rope per life
    missionBase: 90,    // multiplied by the mission's `order`
    anchorFirstVisit: 150,
    discover: 60        // first time entering a district
  };

  /**
   * Progress is a plain state bag so it serialises straight into the
   * save file. `Progress` owns the arithmetic and nothing else — the
   * game decides when to call `award`, the UI decides how to show it.
   */
  function Progress(state) {
    state = state || {};
    this.level = Math.max(1, Math.min(MAX_LEVEL, state.level || 1));
    this.xp = Math.max(0, state.xp || 0);          // xp inside the current level
    this.totalXp = Math.max(0, state.totalXp || 0);
    this.visited = state.visited ? state.visited.slice() : [];
    this.discovered = state.discovered ? state.discovered.slice() : [];
    this.pending = [];                             // level-ups the UI has not shown yet
  }

  Progress.prototype.need = function () { return xpForLevel(this.level); };

  Progress.prototype.fraction = function () {
    var need = this.need();
    if (!isFinite(need)) return 1;
    return Math.max(0, Math.min(1, this.xp / need));
  };

  Progress.prototype.rank = function () { return rankFor(this.level); };

  /**
   * Bank experience. Returns the number of levels gained so the caller
   * can decide whether the moment deserves a banner.
   */
  Progress.prototype.award = function (amount) {
    if (!(amount > 0) || this.level >= MAX_LEVEL) return 0;
    this.xp += amount;
    this.totalXp += amount;
    var gained = 0;
    while (this.level < MAX_LEVEL && this.xp >= xpForLevel(this.level)) {
      this.xp -= xpForLevel(this.level);
      this.level++;
      gained++;
      this.pending.push(this.level);
    }
    if (this.level >= MAX_LEVEL) this.xp = 0;
    return gained;
  };

  /** True the first time this anchor is reached, false ever after. */
  Progress.prototype.visit = function (id) {
    if (this.visited.indexOf(id) >= 0) return false;
    this.visited.push(id);
    return true;
  };

  /** True the first time this district is entered. */
  Progress.prototype.discover = function (id) {
    if (this.discovered.indexOf(id) >= 0) return false;
    this.discovered.push(id);
    return true;
  };

  Progress.prototype.canEnter = function (anchor) {
    return !!anchor && this.level >= anchor.level;
  };

  Progress.prototype.toJSON = function () {
    return {
      level: this.level, xp: this.xp, totalXp: this.totalXp,
      visited: this.visited.slice(), discovered: this.discovered.slice()
    };
  };

  OCTO.progress = {
    MAX_LEVEL: MAX_LEVEL,
    RANKS: RANKS,
    ANCHORS: ANCHORS,
    XP: XP,
    Progress: Progress,
    xpForLevel: xpForLevel,
    xpToReach: xpToReach,
    rankFor: rankFor,
    anchorById: anchorById,
    unlockedAnchors: unlockedAnchors
  };

})(typeof window !== 'undefined' ? window : globalThis);
