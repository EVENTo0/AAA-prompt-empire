/* =====================================================================
 * OCTOPUSES ON THE LINE — 69-chronicle.js
 *
 * The campaign. Five acts that bind everything else together.
 *
 * The problem this file solves: by v1.5 the game had progression, combat,
 * loot, an auction, bosses and a daily loop — and no spine. A player met
 * all of it as a pile of separate menus. Diablo and WoW do not have more
 * systems than this; they have a story that every system hangs off, and
 * a level band that says which part of the world is yours this week.
 *
 * So each Act owns a level band, a district, a boss and a handful of
 * objectives, and every objective is read from a counter some other
 * system was already keeping. Nothing here is a new task type. The Act
 * is the sentence; the systems are the words.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;

  /**
   * The five acts.
   *
   *   `band`      level range this act is written for
   *   `opens`     level at which its pages unseal
   *   `district`  where it happens
   *   `boss`      the MVP that closes it
   *   `beats`     the story, revealed one page at a time
   *   `goals`     objectives, each reading an existing counter
   */
  var ACTS = [
    {
      id: 'knot', band: [1, 9], opens: 1, district: 'souq', boss: 'weaver',
      en: 'I — The First Knot', ar: 'الأول — العقدة الأولى',
      beats: [
        { en: 'Nobody in the old souq will tell you why the city walks on rope instead of on the ground. Ask, and they change the subject to weather.',
          ar: 'لا أحد في السوق القديم سيخبرك لماذا تمشي المدينة على الحبال بدل الأرض. اسأل، فيحوّلون الحديث إلى الطقس.' },
        { en: 'The guild register goes back four hundred years and starts mid-sentence, as though the first page was cut out. The oldest entry is a knot, drawn, not named.',
          ar: 'سجل النقابة يعود أربعمئة سنة ويبدأ في منتصف جملة، كأن الصفحة الأولى قُطعت. أقدم مدخل فيه عقدة مرسومة، بلا اسم.' },
        { en: 'Umm Layla says the woman who tied that knot is still working. She says it the way you say a thing you have decided not to think about.',
          ar: 'تقول أم ليلى إن التي ربطت تلك العقدة ما زالت تعمل. تقولها كما يقول المرء شيئاً قرر ألا يفكر فيه.' }
      ],
      goals: [
        { id: 'cross',  need: 12, en: 'Cross twelve lines',        ar: 'اعبر اثني عشر خيطاً' },
        { id: 'job',    need: 2,  en: 'Finish two souq jobs',      ar: 'أنجز عملين في السوق' },
        { id: 'boss',   need: 1,  en: 'Face the Knot Weaver',      ar: 'واجه ناسجة العُقد' }
      ],
      xp: 400, coin: 250
    },
    {
      id: 'well', band: [10, 19], opens: 10, district: 'oasis', boss: 'thirst',
      en: 'II — What the Well Remembers', ar: 'الثاني — ما تذكره البئر',
      beats: [
        { en: 'The oasis is lower than it was. Not drier — lower. The palms have been walking downhill for a century and nobody noticed until the water went under them.',
          ar: 'الواحة أخفض مما كانت. لا أجفّ — أخفض. النخيل يهبط منذ قرن ولم ينتبه أحد حتى غار الماء تحته.' },
        { en: 'Under the sand there is rope. Not buried — anchored. It runs down, and it is taut, and something at the far end is pulling steadily and has been for a long time.',
          ar: 'تحت الرمل حبل. لا مدفون — مربوط. ينزل مشدوداً، وشيء في آخره يشدّ بثبات منذ زمن طويل.' },
        { en: 'The Long Thirst is not drinking the oasis. It is being drunk from. Something is using it as a straw.',
          ar: 'الظمأ الطويل لا يشرب الواحة. بل يُشرَب منه. شيء ما يستخدمه كقصبة.' }
      ],
      goals: [
        { id: 'anchor', need: 2, en: 'Open two Anchors',           ar: 'افتح مرساتين' },
        { id: 'pearl',  need: 12, en: 'Recover twelve pearls',     ar: 'استخرج اثنتي عشرة لؤلؤة' },
        { id: 'boss',   need: 1, en: 'Face the Long Thirst',       ar: 'واجه الظمأ الطويل' }
      ],
      xp: 900, coin: 600
    },
    {
      id: 'harbour', band: [20, 29], opens: 20, district: 'harbour', boss: 'harbourmaster',
      en: 'III — The Harbour That Flies', ar: 'الثالث — الميناء الطائر',
      beats: [
        { en: 'Sky Harbour did not rise. The sea fell, and the harbour stayed exactly where it was, forty metres above where the water used to be.',
          ar: 'ميناء السماء لم يرتفع. البحر هو الذي انحسر، وبقي الميناء حيث كان تماماً، على أربعين متراً فوق ما كان ماءً.' },
        { en: 'The dhows never learned to fly. They were always tied. Every single one of them, to the same network you have been walking on since you arrived.',
          ar: 'السفن لم تتعلم الطيران قط. كانت مربوطة دائماً. كل واحدة منها، إلى الشبكة نفسها التي تمشي عليها منذ وصلت.' },
        { en: 'The Harbourmaster signed for every rope in the harbour. He is not stealing them back. He is trying to return them, and he does not care what they are holding up.',
          ar: 'وقّع الربّان على كل حبل في الميناء. وهو لا يسرقها. بل يحاول إعادتها، ولا يعنيه ما الذي تحمله.' }
      ],
      goals: [
        { id: 'kill',   need: 40, en: 'Fell forty harbour things', ar: 'اصرع أربعين من كائنات الميناء' },
        { id: 'anchor', need: 4,  en: 'Open four Anchors',         ar: 'افتح أربع مراسٍ' },
        { id: 'boss',   need: 1,  en: 'Face the Harbourmaster',    ar: 'واجه ربّان الميناء' }
      ],
      xp: 2200, coin: 1400
    },
    {
      id: 'sentence', band: [30, 44], opens: 30, district: 'towers', boss: 'calligrapher',
      en: 'IV — The Sentence', ar: 'الرابع — الجملة',
      beats: [
        { en: 'The calligraphy on the Neo-Falak rings is not decoration and it is not scripture. Read across all four beacons, in order, it is an instruction.',
          ar: 'الخط على حلقات نيوفلك ليس زخرفاً ولا نصاً مقدساً. اقرأه على المنارات الأربع بالترتيب، تجده أمراً.' },
        { en: 'It says: hold. It has said hold for four hundred years, in letters two storeys tall, to something that can read.',
          ar: 'يقول: أمسِك. ظل يقول أمسِك أربعمئة سنة، بحروف بارتفاع طابقين، لشيء يستطيع القراءة.' },
        { en: 'The Calligrapher wrote it. Somewhere in the writing he stopped being the one giving the order and became part of the order being given.',
          ar: 'الخطّاط هو من كتبه. وفي مكان ما من الكتابة، كفّ عن كونه صاحب الأمر وصار جزءاً من الأمر نفسه.' }
      ],
      goals: [
        { id: 'cross',  need: 60, en: 'Cross sixty lines',         ar: 'اعبر ستين خيطاً' },
        { id: 'anchor', need: 6,  en: 'Open six Anchors',          ar: 'افتح ست مراسٍ' },
        { id: 'boss',   need: 1,  en: 'Face the Calligrapher',     ar: 'واجه الخطّاط' }
      ],
      xp: 6000, coin: 3600
    },
    {
      id: 'head', band: [45, 60], opens: 45, district: 'line', boss: 'khayt',
      en: 'V — The Head of the Thread', ar: 'الخامس — رأس الخيط',
      beats: [
        { en: 'Every rope in the city is one rope. Follow any washing line long enough and it becomes a cable, and the cable becomes a mooring, and the mooring goes out onto the sand.',
          ar: 'كل حبال المدينة حبل واحد. اتبع أي حبل غسيل طويلاً بما يكفي يصر كابلاً، والكابل يصير مرساة، والمرساة تخرج إلى الرمل.' },
        { en: 'It has eight arms and it has been on the horizon since before the souq. The city did not tie itself to the octopus to hold the octopus down.',
          ar: 'له ثمانية أذرع، وهو على الأفق من قبل أن يقوم السوق. لم تربط المدينة نفسها بالأخطبوط لتثبّته.' },
        { en: 'It tied itself to the octopus because the ground gave way four hundred years ago, and something had to hold the city up. It has been holding. That is what the beacons were asking it to do. Cut the thread and you do not free the city. You drop it.',
          ar: 'ربطت نفسها به لأن الأرض انهارت قبل أربعمئة سنة، وكان لا بد لشيء أن يحمل المدينة. وهو يحمل منذ ذلك الحين. هذا ما كانت المنارات تطلبه منه. اقطع الخيط فلن تحرر المدينة. بل تُسقطها.' }
      ],
      goals: [
        { id: 'anchor', need: 8, en: 'Open every Anchor',          ar: 'افتح كل المراسي' },
        { id: 'kill',   need: 120, en: 'Fell one hundred and twenty', ar: 'اصرع مئة وعشرين' },
        { id: 'boss',   need: 1, en: "Stand before Ra's al-Khayt", ar: 'قف أمام رأس الخيط' }
      ],
      xp: 20000, coin: 12000, final: true
    }
  ];

  function actById(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  /**
   * The chronicle reads existing counters rather than keeping its own,
   * so an act cannot drift out of step with the systems it describes.
   */
  function Chronicle(game) {
    this.game = game;
    var s = game.save.chronicle || {};
    this.done = s.done || {};          // actId -> true
    this.read = s.read || {};          // actId -> pages revealed
    this.claimed = s.claimed || {};
  }

  /** How far along a goal is, from whatever system owns that number. */
  Chronicle.prototype.progressOf = function (act, goal) {
    var g = this.game;
    switch (goal.id) {
      case 'cross':  return (g.player && g.player.stats.crossings) || 0;
      case 'pearl':  return g.pearlsTaken();
      case 'kill':   return this.kills();
      case 'anchor': return g.hero.visited.length;
      case 'job':    return g.missions.filter(function (m) { return m.state === 'complete'; }).length;
      case 'boss':   return (g.bosses && g.bosses.state[act.boss] && g.bosses.state[act.boss].kills) || 0;
      default:       return 0;
    }
  };

  Chronicle.prototype.kills = function () {
    return (this.game.save.totalKills || 0);
  };

  Chronicle.prototype.state = function (act) {
    var g = this.game;
    if (this.done[act.id]) return 'done';
    if (g.hero.level < act.opens) return 'sealed';
    return 'open';
  };

  Chronicle.prototype.goals = function (act) {
    var self = this;
    return act.goals.map(function (goal) {
      var have = self.progressOf(act, goal);
      return { goal: goal, have: Math.min(have, goal.need), done: have >= goal.need };
    });
  };

  Chronicle.prototype.canClose = function (act) {
    if (this.state(act) !== 'open') return false;
    return this.goals(act).every(function (g) { return g.done; });
  };

  /**
   * Pages reveal as the act progresses: one for opening it, one at the
   * halfway mark, one for closing it. The last page of Act V is the turn
   * the whole story is built on, so it is not readable early.
   */
  Chronicle.prototype.pagesRead = function (act) {
    if (this.done[act.id]) return act.beats.length;
    if (this.state(act) === 'sealed') return 0;
    var goals = this.goals(act);
    var completed = goals.filter(function (g) { return g.done; }).length;
    return Math.min(act.beats.length - 1, 1 + completed);
  };

  Chronicle.prototype.close = function (act) {
    // The already-closed check must come first: canClose() reports false
    // for a closed act (its state is 'done', not 'open'), so ordering it
    // second made the 'done' branch unreachable and a second close
    // reported 'incomplete' — which is both wrong and confusing.
    if (this.done[act.id]) return 'done';
    if (!this.canClose(act)) return 'incomplete';
    this.done[act.id] = true;
    var g = this.game, ar = g.lang === 'ar';
    g.awardXp(act.xp, 'act');
    g.addDirhams(act.coin);
    g.toast((ar ? 'انتهى الفصل: ' : 'Act complete: ') + (ar ? act.ar : act.en), 'success');
    g.persist();
    return 'ok';
  };

  /** The act the player should be reading right now. */
  Chronicle.prototype.current = function () {
    for (var i = 0; i < ACTS.length; i++) {
      if (!this.done[ACTS[i].id] && this.state(ACTS[i]) === 'open') return ACTS[i];
    }
    for (var j = 0; j < ACTS.length; j++) if (!this.done[ACTS[j].id]) return ACTS[j];
    return ACTS[ACTS.length - 1];
  };

  Chronicle.prototype.toJSON = function () {
    return { done: this.done, read: this.read, claimed: this.claimed };
  };

  OCTO.chronicle = { ACTS: ACTS, Chronicle: Chronicle, actById: actById };

})(typeof window !== 'undefined' ? window : globalThis);
