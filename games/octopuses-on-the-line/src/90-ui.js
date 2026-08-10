/* =====================================================================
 * OCTOPUSES ON THE LINE — 90-ui.js
 *
 * DOM overlay: loading, title, HUD, balance meter, minimap, open-map
 * screen, jobs board, shop, settings and the beta test panel.
 * Fully bilingual (English / العربية) with RTL layout switching.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var U = OCTO.util, clamp = U.clamp;

  var STR = {
    title:        { en: 'Octopuses on the Line',  ar: 'أخطبوطات على الخيط' },
    subtitle:     { en: 'From the old souq to the sky towers', ar: 'من السوق القديم إلى أبراج السماء' },
    beta:         { en: 'OPEN MAP BETA',           ar: 'خريطة مفتوحة — تجريبي' },
    play:         { en: 'Play',                    ar: 'العب' },
    continueGame: { en: 'Continue',                ar: 'متابعة' },
    settings:     { en: 'Settings',                ar: 'الإعدادات' },
    controls:     { en: 'Controls',                ar: 'التحكم' },
    hero:         { en: 'Hero',                    ar: 'البطل' },
    skills:       { en: 'Skills',                  ar: 'المهارات' },
    story:        { en: 'Story',                   ar: 'القصة' },
    mvp:          { en: 'MVP',                     ar: 'الزعماء' },
    dailyTab:     { en: 'Daily',                   ar: 'اليومي' },
    bag:          { en: 'Bag',                     ar: 'الحقيبة' },
    auction:      { en: 'Auction',                 ar: 'المزاد' },
    jobs:         { en: 'Jobs',                    ar: 'الأعمال' },
    shop:         { en: 'Shop',                    ar: 'المتجر' },
    map:          { en: 'Map',                     ar: 'الخريطة' },
    resume:       { en: 'Resume',                  ar: 'استئناف' },
    quality:      { en: 'Quality',                 ar: 'الجودة' },
    language:     { en: 'Language',                ar: 'اللغة' },
    volume:       { en: 'Volume',                  ar: 'الصوت' },
    music:        { en: 'Music',                   ar: 'الموسيقى' },
    sfx:          { en: 'Effects',                 ar: 'المؤثرات' },
    invertY:      { en: 'Invert look',             ar: 'عكس النظر' },
    resetSave:    { en: 'Reset progress',          ar: 'مسح التقدم' },
    resetConfirm: { en: 'Tap again to erase everything', ar: 'اضغط مرة أخرى لمسح كل شيء' },
    balance:      { en: 'BALANCE',                 ar: 'التوازن' },
    dirhams:      { en: 'dh',                      ar: 'درهم' },
    pearls:       { en: 'Pearls',                  ar: 'اللآلئ' },
    owned:        { en: 'Owned',                   ar: 'مملوك' },
    equip:        { en: 'Equip',                   ar: 'ارتداء' },
    buy:          { en: 'Buy',                     ar: 'شراء' },
    complete:     { en: 'Complete',                ar: 'مكتمل' },
    active:       { en: 'Active',                  ar: 'جارٍ' },
    available:    { en: 'Available',               ar: 'متاح' },
    accept:       { en: 'Accept',                  ar: 'قبول' },
    loading:      { en: 'Building the quarter…',   ar: '...نبني الحي' },
    tapToStart:   { en: 'Click to begin',          ar: 'انقر للبدء' },
    fastTravel:   { en: 'Beta fast travel',        ar: 'تنقل سريع (تجريبي)' },
    timeOfDay:    { en: 'Time of day',             ar: 'وقت اليوم' },
    betaPanel:    { en: 'Beta test panel',         ar: 'لوحة الاختبار' },
    freeCam:      { en: 'Free camera',             ar: 'كاميرا حرة' },
    close:        { en: 'Close',                   ar: 'إغلاق' },
    version:      { en: 'Version',                 ar: 'الإصدار' }
  };

  var CONTROL_ROWS = [
    { keys: 'W A S D', en: 'Move',                 ar: 'الحركة' },
    { keys: 'Mouse',   en: 'Look',                 ar: 'النظر' },
    { keys: 'Space',   en: 'Jump / leap off line', ar: 'القفز / الوثب من الخيط' },
    { keys: 'Shift',   en: 'Sprint / zip along line', ar: 'الركض / الانزلاق على الخيط' },
    { keys: 'Q',       en: 'Grip (steady yourself)', ar: 'التشبث (لتثبيت التوازن)' },
    { keys: 'A / D',   en: 'Correct balance on a line', ar: 'تصحيح التوازن على الخيط' },
    { keys: 'C',       en: 'Suction climb walls',  ar: 'التسلق بالممصات' },
    { keys: 'E',       en: 'Grab / interact',      ar: 'الإمساك / التفاعل' },
    { keys: 'F',       en: 'Ink dash',             ar: 'اندفاع الحبر' },
    { keys: 'R',       en: 'Go wobbly',            ar: 'الارتخاء' },
    { keys: 'M',       en: 'Open map',             ar: 'الخريطة' },
    { keys: 'P',       en: 'Photo mode',           ar: 'وضع التصوير' },
    { keys: 'L',       en: 'Language',             ar: 'اللغة' },
    { keys: 'F1',      en: 'Beta test panel',      ar: 'لوحة الاختبار' },
    { keys: 'Esc',     en: 'Pause',                ar: 'إيقاف' }
  ];

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function Ui(game, input, container) {
    this.game = game;
    this.input = input;
    this.root = container;
    this.lang = game.lang || 'en';
    this.screen = 'loading';
    this.confirmReset = 0;
    this.mapOpen = false;
    this.betaOpen = false;
    this.build();
  }

  Ui.prototype.t = function (key) {
    var s = STR[key];
    return s ? (s[this.lang] || s.en) : key;
  };

  Ui.prototype.build = function () {
    var self = this;
    var r = this.root;

    // ---------- splash
    // The first thing a big mobile RPG shows is its logo on black while
    // the payload lands. It is not decoration: it gives the boot somewhere
    // to happen, and gives the player something to skip.
    this.splash = el('div', 'octo-screen octo-splash');
    this.splash.innerHTML =
      '<button class="octo-skip"></button>' +
      '<div class="octo-splash-mark">' +
      '  <div class="octo-splash-en"></div>' +
      '  <div class="octo-splash-ar"></div>' +
      '  <div class="octo-splash-rule"></div>' +
      '</div>' +
      '<div class="octo-splash-foot">' +
      '  <div class="octo-splash-status"></div>' +
      '  <div class="octo-bar"><div class="octo-bar-fill"></div></div>' +
      '</div>';
    r.appendChild(this.splash);
    this.splashFill = this.splash.querySelector('.octo-bar-fill');
    this.splashStatus = this.splash.querySelector('.octo-splash-status');
    this.splash.querySelector('.octo-splash-en').textContent = STR.title.en;
    this.splash.querySelector('.octo-splash-ar').textContent = STR.title.ar;
    this.splash.querySelector('.octo-skip')
      .addEventListener('click', function () { self.skipSplash(); });

    // ---------- loading, over generated key art
    this.loading = el('div', 'octo-screen octo-loading hidden');
    this.loading.innerHTML =
      '<canvas class="octo-keyart"></canvas>' +
      '<div class="octo-load-inner">' +
      '  <div class="octo-logo"><span class="octo-logo-en"></span><span class="octo-logo-ar"></span></div>' +
      '  <div class="octo-bar"><div class="octo-bar-fill"></div></div>' +
      '  <div class="octo-load-text"></div>' +
      '  <div class="octo-load-tip"></div>' +
      '</div>';
    r.appendChild(this.loading);
    this.keyart = this.loading.querySelector('.octo-keyart');
    this.loadFill = this.loading.querySelector('.octo-bar-fill');
    this.loadText = this.loading.querySelector('.octo-load-text');
    this.loadTip = this.loading.querySelector('.octo-load-tip');
    this.loading.querySelector('.octo-logo-en').textContent = STR.title.en;
    this.loading.querySelector('.octo-logo-ar').textContent = STR.title.ar;

    // ---------- title
    this.title = el('div', 'octo-screen octo-title hidden');
    this.title.innerHTML =
      '<div class="octo-title-inner">' +
      '  <div class="octo-badge"></div>' +
      '  <h1></h1><h2 class="octo-ar"></h2><p class="octo-sub"></p>' +
      '  <div class="octo-slotpill">' +
      '    <span class="octo-slot-dot"></span>' +
      '    <span class="octo-slot-name"></span>' +
      '    <span class="octo-slot-go"></span>' +
      '  </div>' +
      '  <div class="octo-menu"></div>' +
      '  <div class="octo-hint"></div>' +
      '</div>' +
      '<div class="octo-agree"><span class="octo-agree-tick">✓</span><span class="octo-agree-text"></span></div>';
    r.appendChild(this.title);
    this.title.querySelector('.octo-slotpill')
      .addEventListener('click', function () { self.beginNewGame(); });

    // ---------- service rail (Notice / Realm / Language / Support / Reset)
    // The vertical stack of round buttons down the right edge is the one
    // piece of mobile-RPG chrome that is pure navigation: everything the
    // player needs before they are in the world, reachable by thumb.
    this.rail = el('div', 'octo-rail hidden');
    r.appendChild(this.rail);

    // ---------- announcement
    this.notice = el('div', 'octo-screen octo-notice hidden');
    this.notice.innerHTML =
      '<div class="octo-notice-frame">' +
      '  <div class="octo-notice-cap"></div>' +
      '  <button class="octo-notice-x">✕</button>' +
      '  <div class="octo-notice-body">' +
      '    <div class="octo-notice-tabs"></div>' +
      '    <div class="octo-notice-page">' +
      '      <h3 class="octo-notice-h"></h3>' +
      '      <canvas class="octo-notice-art"></canvas>' +
      '      <div class="octo-notice-text"></div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    r.appendChild(this.notice);
    this.notice.querySelector('.octo-notice-x')
      .addEventListener('click', function () { self.closeNotice(); });

    // ---------- hud
    this.hud = el('div', 'octo-hud hidden');
    this.hud.innerHTML =
      '<div class="octo-topleft">' +
      '  <div class="octo-hero">' +
      '    <div class="octo-hero-portrait"><span class="octo-hero-glyph"></span>' +
      '      <span class="octo-hero-lv"><b class="octo-hero-lvn">1</b></span>' +
      '    </div>' +
      '    <div class="octo-hero-meta">' +
      '      <div class="octo-hero-name"></div>' +
      '      <div class="octo-hero-rank"></div>' +
      '      <div class="octo-xp"><div class="octo-xp-fill"></div><span class="octo-xp-text"></span></div>' +
      '    </div>' +
      '    <div class="octo-xp-flash"></div>' +
      '  </div>' +
      '  <div class="octo-vitals">' +
      '    <div class="octo-vital octo-vital-hp"><i></i><span></span></div>' +
      '    <div class="octo-vital octo-vital-sp"><i></i><span></span></div>' +
      '  </div>' +
      '  <div class="octo-money"><span class="octo-coin">◈</span><span class="octo-money-v">0</span></div>' +
      '  <div class="octo-district"></div>' +
      '  <div class="octo-clock"></div>' +
      '</div>' +
      '<div class="octo-levelup hidden">' +
      '  <div class="octo-levelup-burst"></div>' +
      '  <div class="octo-levelup-word"></div>' +
      '  <div class="octo-levelup-num"></div>' +
      '  <div class="octo-levelup-rank"></div>' +
      '  <div class="octo-levelup-unlock"></div>' +
      '</div>' +
      '<div class="octo-target hidden">' +
      '  <div class="octo-target-row"><b class="octo-target-lv"></b>' +
      '    <span class="octo-target-name"></span></div>' +
      '  <div class="octo-target-bar"><i></i></div>' +
      '</div>' +
      '<div class="octo-questlog">' +
      '  <div class="octo-qtabs"></div>' +
      '  <div class="octo-qbody"></div>' +
      '</div>' +
      '<div class="octo-mission"></div>' +
      '<div class="octo-wheel"></div>' +
      '<div class="octo-toasts"></div>' +
      '<div class="octo-balance hidden">' +
      '  <div class="octo-balance-label"></div>' +
      '  <div class="octo-balance-track"><div class="octo-balance-safe"></div><div class="octo-balance-pin"></div></div>' +
      '</div>' +
      '<div class="octo-prompt hidden"></div>' +
      '<div class="octo-abilities"></div>' +
      '<canvas class="octo-minimap" width="180" height="180"></canvas>' +
      '<div class="octo-crosshair"></div>';
    r.appendChild(this.hud);

    // The quick bar lives outside the HUD: the HUD's own stacking context sits
    // below the touch overlay, whose look area covers most of the screen and
    // would swallow every tap aimed at it. Menu and mute must be reachable on
    // a phone, where there is no Esc key to open settings with.
    this.quickbar = el('div', 'octo-quickbar');
    this.quickbar.innerHTML =
      '<div class="octo-quick-row">' +
      '  <button class="octo-quick octo-quick-menu" aria-label="Menu">☰</button>' +
      '  <button class="octo-quick octo-quick-sound" aria-label="Sound">♪</button>' +
      '  <button class="octo-quick octo-quick-diag" aria-label="Diagnostics">i</button>' +
      '</div>' +
      '<pre class="octo-diag hidden"></pre>';
    r.appendChild(this.quickbar);
    this.diagEl = this.quickbar.querySelector('.octo-diag');
    this.soundBtn = this.quickbar.querySelector('.octo-quick-sound');
    this.quickbar.querySelector('.octo-quick-diag')
      .addEventListener('click', function () { self.toggleDiag(); });
    this.quickbar.querySelector('.octo-quick-menu')
      .addEventListener('click', function () {
        if (self.screen === 'panel') self.closePanel(); else self.openPanel('settings');
      });
    this.soundBtn.addEventListener('click', function () { self.toggleMute(); });
    this.moneyEl = this.hud.querySelector('.octo-money-v');
    this.districtEl = this.hud.querySelector('.octo-district');
    this.clockEl = this.hud.querySelector('.octo-clock');
    this.missionEl = this.hud.querySelector('.octo-mission');
    this.toastEl = this.hud.querySelector('.octo-toasts');
    this.balanceEl = this.hud.querySelector('.octo-balance');
    this.balancePin = this.hud.querySelector('.octo-balance-pin');
    this.balanceLabel = this.hud.querySelector('.octo-balance-label');
    this.promptEl = this.hud.querySelector('.octo-prompt');
    this.abilityEl = this.hud.querySelector('.octo-abilities');
    this.vitalsEl = this.hud.querySelector('.octo-vitals');
    this.hpFill = this.hud.querySelector('.octo-vital-hp i');
    this.hpText = this.hud.querySelector('.octo-vital-hp span');
    this.spFill = this.hud.querySelector('.octo-vital-sp i');
    this.spText = this.hud.querySelector('.octo-vital-sp span');
    this.targetEl = this.hud.querySelector('.octo-target');
    this.wheelEl = this.hud.querySelector('.octo-wheel');
    this.qtabsEl = this.hud.querySelector('.octo-qtabs');
    this.qbodyEl = this.hud.querySelector('.octo-qbody');
    this.minimap = this.hud.querySelector('.octo-minimap');
    this.minimapCtx = this.minimap.getContext('2d');
    this.heroEl = this.hud.querySelector('.octo-hero');
    this.heroGlyph = this.hud.querySelector('.octo-hero-glyph');
    this.heroLv = this.hud.querySelector('.octo-hero-lvn');
    this.heroName = this.hud.querySelector('.octo-hero-name');
    this.heroRank = this.hud.querySelector('.octo-hero-rank');
    this.xpFill = this.hud.querySelector('.octo-xp-fill');
    this.xpText = this.hud.querySelector('.octo-xp-text');
    this.xpFlashEl = this.hud.querySelector('.octo-xp-flash');
    this.levelUpEl = this.hud.querySelector('.octo-levelup');
    // Tapping the hero plate opens the character sheet, the way every
    // mobile RPG puts progression one thumb-press from the portrait.
    this.heroEl.addEventListener('click', function () { self.openPanel('hero'); });

    // On touch there is no keyboard, so the HUD itself is the navigation:
    // tap the tracker for jobs, the minimap for the map, the purse for the shop.
    this.minimap.addEventListener('click', function () { self.openPanel('map'); });
    this.qbodyEl.addEventListener('click', function () { self.openPanel('jobs'); });
    this.missionEl.addEventListener('click', function () { self.openPanel('jobs'); });
    this.hud.querySelector('.octo-money').addEventListener('click', function () { self.openPanel('shop'); });

    // ---------- overlay panel (pause / jobs / shop / map / settings)
    this.panel = el('div', 'octo-screen octo-panel hidden');
    this.panel.innerHTML =
      '<div class="octo-panel-inner">' +
      '  <div class="octo-tabs"></div>' +
      '  <div class="octo-panel-body"></div>' +
      '  <button class="octo-close"></button>' +
      '</div>';
    r.appendChild(this.panel);
    this.tabsEl = this.panel.querySelector('.octo-tabs');
    this.bodyEl = this.panel.querySelector('.octo-panel-body');
    this.panel.querySelector('.octo-close').addEventListener('click', function () { self.closePanel(); });

    // ---------- character select
    // The reference layout: the avatar owns the middle of the screen, the
    // roster is a stack of cards down the right edge where a thumb reaches
    // it, the name sits above the character and the tagline below. Nothing
    // covers the character but the frame around them.
    this.select = el('div', 'octo-screen octo-select hidden');
    this.select.innerHTML =
      '<button class="octo-select-back">‹</button>' +
      '<div class="octo-select-head">' +
      '  <div class="octo-sel-name"></div>' +
      '  <div class="octo-sel-rule"></div>' +
      '  <div class="octo-select-eyebrow"></div>' +
      '</div>' +
      '<div class="octo-class-row"></div>' +
      '<div class="octo-select-detail">' +
      '  <div class="octo-sel-role"></div>' +
      '  <div class="octo-sel-line"></div>' +
      '  <div class="octo-sel-bars"></div>' +
      '  <div class="octo-sel-lore"></div>' +
      '</div>' +
      '<div class="octo-select-foot">' +
      '  <div class="octo-select-tagline"></div>' +
      '  <button class="octo-select-go"></button>' +
      '</div>';
    r.appendChild(this.select);
    this.classRow = this.select.querySelector('.octo-class-row');
    this.select.querySelector('.octo-select-back')
      .addEventListener('click', function () { self.showTitle(); });
    this.select.querySelector('.octo-select-go')
      .addEventListener('click', function () { self.confirmClass(); });

    // ---------- quest dialogue
    // Talking to a trader is a scene, not a toast. A speaker plate, the
    // job in their own words, what it pays, and two large choices — the
    // shape every mobile RPG uses for a quest hand-off, and the one the
    // player already knows how to read.
    this.dialog = el('div', 'octo-dialog hidden');
    this.dialog.innerHTML =
      '<div class="octo-dialog-box">' +
      '  <div class="octo-dialog-who">' +
      '    <div class="octo-dialog-face"></div>' +
      '    <div class="octo-dialog-name"></div>' +
      '  </div>' +
      '  <div class="octo-dialog-text"></div>' +
      '  <div class="octo-dialog-reward"></div>' +
      '  <div class="octo-dialog-acts">' +
      '    <button class="octo-dialog-yes"></button>' +
      '    <button class="octo-dialog-no"></button>' +
      '  </div>' +
      '</div>';
    r.appendChild(this.dialog);
    this.dialog.querySelector('.octo-dialog-yes')
      .addEventListener('click', function () { self.answerDialog(true); });
    this.dialog.querySelector('.octo-dialog-no')
      .addEventListener('click', function () { self.answerDialog(false); });

    // ---------- beta panel
    this.beta = el('div', 'octo-beta hidden');
    r.appendChild(this.beta);

    this.applyLang();
    this.syncMuteButton();
  };

  Ui.prototype.applyLang = function () {
    var ar = this.lang === 'ar';
    this.root.setAttribute('dir', ar ? 'rtl' : 'ltr');
    this.root.classList.toggle('octo-rtl', ar);
    this.loadText.textContent = this.t('loading');
    var t = this.title;
    t.querySelector('h1').textContent = STR.title.en;
    t.querySelector('h2').textContent = STR.title.ar;
    t.querySelector('.octo-sub').textContent = this.t('subtitle');
    t.querySelector('.octo-badge').textContent = this.t('beta') + ' · v' + OCTO.VERSION;
    t.querySelector('.octo-hint').textContent = this.t('tapToStart');
    this.buildTitleMenu();
    if (this.screen === 'panel') this.renderPanel(this.tab);
    if (this.betaOpen) this.renderBeta();
  };

  Ui.prototype.setLang = function (lang) {
    this.lang = lang;
    this.game.lang = lang;
    this.game.persist();
    this.applyLang();
  };

  Ui.prototype.toggleLang = function () {
    this.setLang(this.lang === 'en' ? 'ar' : 'en');
  };

  /* ------------------------------------------------------------- screens */

  Ui.prototype.setProgress = function (frac, text) {
    var pct = Math.round(clamp(frac, 0, 1) * 100);
    this.loadFill.style.width = pct + '%';
    this.splashFill.style.width = pct + '%';
    if (text) {
      this.loadText.textContent = text;
      this.splashStatus.textContent = text;
    }
  };

  /* ----------------------------------------------------------- splash */

  /**
   * Draw the key art at the panel's real pixel size. Done once, on the
   * way out of the splash, because it costs a few milliseconds and there
   * is no point paying that before the screen that shows it exists.
   */
  Ui.prototype.paintKeyArt = function () {
    if (this._keyartDone || !OCTO.frontend) return;
    this._keyartDone = true;
    // Drawn at the panel's own aspect ratio. A fixed ratio plus
    // object-fit: cover crops the cast off the sides on a portrait phone,
    // which is the one shape this has to look right in.
    var dpr = Math.min(root.devicePixelRatio || 1, 2);
    var cw = this.root.clientWidth || 720;
    var ch = (this.root.clientHeight || 900) * 0.62;
    var w = Math.max(640, Math.round(cw * dpr));
    var h = Math.max(300, Math.round(ch * dpr));
    try { OCTO.frontend.drawKeyArt(this.keyart, w, h); } catch (e) { /* art is optional */ }
  };

  var TIPS = [
    { en: 'Hold GRIP on a line and the wobble dies — so does your speed.', ar: 'اضغط "تشبث" على الخيط فيهدأ الاهتزاز — وتهدأ سرعتك معه.' },
    { en: 'A Tank sags the rope into a bridge. An Archer barely bends it.', ar: 'الدِّرع يُحني الخيط ليصير جسراً. الصيّاد لا يكاد يثنيه.' },
    { en: 'Every rank breaks the seal on another Anchor.', ar: 'كل رتبة تفكّ ختم مرساة جديدة.' },
    { en: 'Crossing a full span pays experience. Falling off halfway does not.', ar: 'عبور الخيط كاملاً يمنحك خبرة. السقوط في منتصفه لا يمنحك شيئاً.' },
    { en: 'Ra’s al-Khayt has been out on the sand since before the souq.', ar: 'رأس الخيط على الرمل من قبل أن يقوم السوق.' },
    { en: 'Tap the minimap for the full map, the tracker for your jobs.', ar: 'انقر الخريطة المصغّرة لفتح الخريطة، والمتتبّع لمهامك.' }
  ];

  Ui.prototype.showSplash = function () {
    this.screen = 'splash';
    this.splash.classList.remove('hidden');
    var tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    this.loadTip.textContent = this.lang === 'ar' ? tip.ar : tip.en;
    this.splash.querySelector('.octo-skip').textContent = this.lang === 'ar' ? 'تخطٍ ⏭' : 'Skip ⏭';
  };

  /** Splash → key-art loading screen. Idempotent; the skip button reuses it. */
  Ui.prototype.skipSplash = function () {
    if (this.screen !== 'splash') return;
    this.paintKeyArt();
    this.splash.classList.add('hidden');
    this.loading.classList.remove('hidden');
    this.screen = 'loading';
    this.game.audio && this.game.audio.play('ui');
  };

  Ui.prototype.showTitle = function () {
    this.screen = 'title';
    this.splash.classList.add('hidden');
    this.loading.classList.add('hidden');
    this.select.classList.add('hidden');
    this.title.classList.remove('hidden');
    this.rail.classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.buildRail();
    this.syncSlotPill();
  };

  /* ------------------------------------------------------------- rail */

  var RAIL_ICONS = {
    notice: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l6 4V5L8 9H4z"/><path d="M17 8a5 5 0 010 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    realm: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z"/></svg>',
    lang: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2c1.6 0 3.2 2.4 3.8 6H8.2C8.8 6.4 10.4 4 12 4zM4.3 10h3.4a24 24 0 000 4H4.3a8 8 0 010-4zm0 6h3.9c.6 2.6 1.6 4.5 2.6 5.4A8 8 0 014.3 16zm7.7 5.9c-1.6 0-3.2-2.3-3.8-5.9h7.6c-.6 3.6-2.2 5.9-3.8 5.9zM16.3 14a24 24 0 000-4h3.4a8 8 0 010 4h-3.4zm-1 7.4c1-.9 2-2.8 2.6-5.4h3.9a8 8 0 01-6.5 5.4zM18.5 8c-.6-2.6-1.6-4.5-2.6-5.4A8 8 0 0122.4 8h-3.9z"/></svg>',
    support: '<svg viewBox="0 0 24 24"><path d="M12 2a8 8 0 00-8 8v5a3 3 0 003 3h1v-8H6v-.2A6 6 0 0118 10v.2h-2V18h2a2 2 0 01-2 2h-3v2h3a4 4 0 004-4 3 3 0 003-3v-5a8 8 0 00-8-8z"/></svg>',
    reset: '<svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13a2 2 0 01-2 2H9a2 2 0 01-2-2L6 7zm3-4h6l1 2h3v2H5V5h3l1-2z"/></svg>'
  };

  Ui.prototype.buildRail = function () {
    var self = this, ar = this.lang === 'ar';
    var items = [
      { k: 'notice',  en: 'Notice',   arr: 'إعلان',    fn: function () { self.openNotice('fairplay'); } },
      { k: 'realm',   en: 'Realm',    arr: 'العالم',   fn: function () { self.openNotice('realm'); } },
      { k: 'lang',    en: this.lang === 'en' ? 'العربية' : 'English', arr: this.lang === 'en' ? 'العربية' : 'English',
        fn: function () { self.toggleLang(); } },
      { k: 'support', en: 'Support',  arr: 'الدعم',    fn: function () { self.openPanel('controls'); } },
      { k: 'reset',   en: 'Reset',    arr: 'مسح',      fn: function () { self.confirmReset(); } }
    ];
    this.rail.innerHTML = '';
    items.forEach(function (it) {
      var b = el('button', 'octo-rail-btn');
      b.innerHTML = '<span class="octo-rail-ico">' + RAIL_ICONS[it.k] + '</span>' +
        '<span class="octo-rail-lab">' + (ar && it.k !== 'lang' ? it.arr : it.en) + '</span>';
      b.addEventListener('click', function () {
        self.game.audio && self.game.audio.play('ui');
        it.fn();
      });
      self.rail.appendChild(b);
    });
    var v = el('div', 'octo-stamp');
    v.innerHTML = 'app.' + OCTO.VERSION + '<br>res.' + OCTO.VERSION + '.' + (this.game.save.build || 'beta');
    this.rail.appendChild(v);
  };

  /** The pill above the menu: which discipline and rank you are resuming. */
  Ui.prototype.syncSlotPill = function () {
    var g = this.game, ar = this.lang === 'ar', t = this.title;
    var pill = this.title.querySelector('.octo-slotpill');
    var has = !!g.save.classId;
    var cls = OCTO.classById(g.save.classId || 'muqatil');
    pill.querySelector('.octo-slot-name').textContent = has
      ? (ar ? cls.ar : cls.en) + '  ·  ' + (ar ? 'مستوى ' : 'Lv ') + g.hero.level
      : (ar ? 'ماشي خيط جديد' : 'New Line-Walker');
    pill.querySelector('.octo-slot-go').textContent = ar ? 'ادخل' : 'Enter';
    pill.classList.toggle('fresh', !has);
    t.querySelector('.octo-hint').textContent = this.isTouchDevice()
      ? (ar ? 'انقر للدخول إلى اللعبة' : 'Tap to enter game')
      : (ar ? 'انقر للبدء' : 'Click to begin');
    this.title.querySelector('.octo-agree-text').innerHTML = ar
      ? 'نسخة تجريبية — كل المحتوى مولَّد داخل المتصفح، ولا يُرسل أي شيء إلى أي خادم.'
      : 'Beta build — everything is generated in your browser, and nothing is sent to any server.';
  };

  Ui.prototype.confirmReset = function () {
    var ar = this.lang === 'ar';
    var ok = root.confirm(ar
      ? 'مسح التقدم كله والبدء من جديد؟'
      : 'Erase all progress and start over?');
    if (!ok) return;
    this.game.resetSave();
    root.location.reload();
  };

  /* ---------------------------------------------------- announcements */

  var NOTICES = {
    fairplay: {
      en: 'Fair Play Notice', ar: 'إشعار اللعب النظيف',
      bodyEn: [
        'This build runs entirely on your device. There is no account, no server, and no leaderboard — so there is nothing here to cheat against except yourself.',
        '1. What is stored',
        'Your discipline, rank, dirhams, pearls and settings are written to your browser’s local storage. Clearing site data erases them. Nothing leaves the machine.',
        '2. The console is not locked',
        'Every system is reachable from the developer console, and the automation API is documented in the README. If you want to skip to level 60 and stand under Ra’s al-Khayt, that is your save file to spend.',
        '3. What we ask',
        'If you share a screenshot or a time, say which build it came from. The generator is seeded, so a seed and a version make any run reproducible.'
      ],
      bodyAr: [
        'تعمل هذه النسخة كاملة على جهازك. لا حساب ولا خادم ولا لوحة صدارة — فليس هنا ما يُغَشّ فيه سوى نفسك.',
        '١. ما الذي يُحفظ',
        'انضباطك ورتبتك ودراهمك ولآلئك وإعداداتك تُكتب في التخزين المحلي للمتصفح. مسح بيانات الموقع يمحوها. لا شيء يغادر جهازك.',
        '٢. الطرفية ليست مقفلة',
        'كل نظام في اللعبة متاح من طرفية المطوّر، وواجهة الأتمتة موثّقة في الملف التعريفي. إن أردت القفز إلى المستوى ٦٠ والوقوف تحت رأس الخيط، فهذا ملف حفظك تتصرف فيه.',
        '٣. ما نرجوه',
        'إن شاركت لقطة أو زمناً، فاذكر النسخة. المولّد يعمل ببذرة، فالبذرة مع رقم النسخة يجعلان أي جولة قابلة للإعادة.'
      ]
    },
    realm: {
      en: 'The Realm', ar: 'العالم',
      bodyEn: [
        'One city, one seed, no loading between districts. Five quarters on a continuous 500 × 500 m map, strung together by 144 live ropes.',
        'Al-Suq al-Qadeem — the old souq. Adobe, pointed arches, mashrabiya oriels, and the first rope anyone ever tied.',
        'Al-Waha — the oasis. Date palms, open water, and a fire that is always lit.',
        'Khutut al-Hayy — the line quarter, strung over the rooftops and up the great minaret.',
        'Mina’ al-Sama — Sky Harbour, forty metres up, where the dhows fly.',
        'Abraj Neo-Falak — the sky towers, neon and holographic script, rings to a hundred and fifty metres.',
        'Add ?seed=12345 to the address to generate a different city. The seed is the whole world.'
      ],
      bodyAr: [
        'مدينة واحدة، بذرة واحدة، ولا تحميل بين الأحياء. خمسة أحياء على خريطة متصلة ٥٠٠ × ٥٠٠ متر، يربطها ١٤٤ حبلاً حيّاً.',
        'السوق القديم — الطين واﻷقواس المدببة والمشربيات، وأول حبل رُبط في المدينة.',
        'الواحة — النخيل والماء ونار لا تنطفئ.',
        'حي الخيوط — شبكة الحبال فوق السطوح وصعوداً إلى المئذنة الكبرى.',
        'ميناء السماء — على ارتفاع أربعين متراً، حيث تطير السفن.',
        'أبراج نيوفلك — النيون والخط المجسّم، وحلقات حتى مئة وخمسين متراً.',
        'أضف ‎?seed=12345‎ إلى العنوان لتوليد مدينة أخرى. البذرة هي العالم كله.'
      ]
    },
    build: {
      en: 'What’s New', ar: 'الجديد',
      bodyEn: [
        'v1.1.0 — Levels, ranks and the eight Anchors',
        'Levels 1–60 across nine ranks. Experience comes from pearls, jobs, discoveries and — above all — crossing ropes, scaled by how much of the span you actually walked.',
        'Eight Anchors stand across the map, each sealed behind a rank. A sealed Anchor is visible from across its district with its shard dull; earning the rank lights it cyan and opens it for travel.',
        'Traders now hand work over in a scene rather than a toast, with the job in their own words.',
        'v1.0.4 — Mobile controls',
        'The joystick floats: touch anywhere in the left half of the screen and it appears under your thumb. Action buttons are icons with captions. The minimap, tracker and purse are all tappable.'
      ],
      bodyAr: [
        'الإصدار ١٫١٫٠ — المستويات والرتب والمراسي الثماني',
        'مستويات من ١ إلى ٦٠ عبر تسع رتب. الخبرة تأتي من اللآلئ والمهام والاكتشاف، وقبل ذلك كله من عبور الخيوط، بمقدار ما قطعته منها فعلاً.',
        'ثماني مراسٍ في الخريطة، كل واحدة مختومة برتبة. المرساة المختومة تُرى من بعيد وشظيتها خامدة؛ وببلوغ الرتبة تتوهج سماوية وتُفتح للانتقال.',
        'التجار صاروا يسلّمون العمل في مشهد لا في إشعار عابر، وبكلامهم هم.',
        'الإصدار ١٫٠٫٤ — تحكم الهاتف',
        'الجويستيك يطفو: المس أي مكان في النصف الأيسر فيظهر تحت إبهامك. أزرار الفعل صارت أيقونات بأسماء. والخريطة والمتتبّع والمحفظة كلها قابلة للضغط.'
      ]
    }
  };

  Ui.prototype.openNotice = function (id) {
    var self = this, ar = this.lang === 'ar';
    this.noticeId = id || 'fairplay';
    this.notice.classList.remove('hidden');
    this.notice.querySelector('.octo-notice-cap').textContent = ar ? 'إعلان' : 'Announcement';

    var tabs = this.notice.querySelector('.octo-notice-tabs');
    tabs.innerHTML = '';
    Object.keys(NOTICES).forEach(function (k) {
      var b = el('button', 'octo-notice-tab' + (k === self.noticeId ? ' active' : ''),
        ar ? NOTICES[k].ar : NOTICES[k].en);
      b.addEventListener('click', function () {
        self.game.audio && self.game.audio.play('ui');
        self.openNotice(k);
      });
      tabs.appendChild(b);
    });

    var n = NOTICES[this.noticeId];
    this.notice.querySelector('.octo-notice-h').textContent = ar ? n.ar : n.en;
    var body = ar ? n.bodyAr : n.bodyEn;
    this.notice.querySelector('.octo-notice-text').innerHTML =
      body.map(function (p) { return '<p>' + p + '</p>'; }).join('');

    // the same generated art, at banner proportions
    var art = this.notice.querySelector('.octo-notice-art');
    if (!art._painted && OCTO.frontend) {
      art._painted = true;
      try { OCTO.frontend.drawKeyArt(art, 900, 300); } catch (e) { /* art is optional */ }
    }
  };

  Ui.prototype.closeNotice = function () {
    this.notice.classList.add('hidden');
    this.game.audio && this.game.audio.play('ui');
  };

  Ui.prototype.buildTitleMenu = function () {
    var self = this;
    var menu = this.title.querySelector('.octo-menu');
    menu.innerHTML = '';
    // The slot pill above is the one primary action, and language, notices
    // and support live on the rail. What is left is secondary, so it goes
    // in a compact wrapping row — six full-width buttons stacked down a
    // phone screen pushed the agreement line off the bottom.
    var items = [
      { label: this.lang === 'ar' ? '▶ المقدمة' : '▶ Intro', fn: function () { self.playIntro(); } },
      { label: this.lang === 'ar' ? 'الانضباط' : 'Discipline', fn: function () {
        self.title.classList.add('hidden');
        self.hud.classList.add('hidden');
        self.showSelect();
      } },
      { label: this.t('controls'), fn: function () { self.openPanel('controls'); } },
      { label: this.t('settings'), fn: function () { self.openPanel('settings'); } }
    ];
    items.forEach(function (it) {
      var b = el('button', 'octo-menu-btn', it.label);
      b.addEventListener('click', function () { self.game.audio && self.game.audio.play('ui'); it.fn(); });
      menu.appendChild(b);
    });
  };

  /* ---------------------------------------------------- character select */

  /**
   * Class picking happens in the world, not on a menu backdrop: the camera
   * frames the actual player avatar and the mesh rebuilds the moment the
   * discipline changes, so you are looking at the character you will play.
   */
  Ui.prototype.showSelect = function () {
    var self = this, g = this.game;
    this.screen = 'select';
    this.loading.classList.add('hidden');
    this.title.classList.add('hidden');
    this.rail.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.select.classList.remove('hidden');
    g.paused = false;
    g.prepareSelect();

    // The heading is now the chosen discipline's own name, set by
    // pickClass; the eyebrow underneath says what screen this is.
    this.select.querySelector('.octo-select-eyebrow').textContent =
      this.lang === 'ar' ? 'نقابة ماشي الخيط' : 'The Line-Walkers’ Guild';
    this.select.querySelector('.octo-select-go').textContent =
      this.lang === 'ar' ? 'ابدأ الرحلة' : 'Begin the journey';

    // Roster cards: portrait, discipline, role. Stacked down the right
    // edge so the avatar in the middle of the screen is never covered.
    this.classRow.innerHTML = '';
    OCTO.CLASSES.forEach(function (c) {
      var b = el('button', 'octo-class-card');
      b.innerHTML =
        '<canvas class="octo-class-face" width="96" height="96"></canvas>' +
        '<span class="octo-class-meta">' +
        '  <b>' + (self.lang === 'ar' ? c.ar : c.en) + '</b>' +
        '  <i>' + (self.lang === 'ar' ? c.roleAr : c.roleEn) + '</i>' +
        '</span>';
      if (OCTO.frontend) {
        try { OCTO.frontend.drawPortrait(b.querySelector('.octo-class-face'), c, 96); } catch (e) { /* art is optional */ }
      }
      b.addEventListener('click', function () { self.pickClass(c.id); });
      b.dataset.classId = c.id;
      self.classRow.appendChild(b);
    });

    this.pickClass(g.save.classId || 'muqatil');
  };

  Ui.prototype.pickClass = function (id) {
    var g = this.game, self = this;
    var c = OCTO.classById(id);
    this.selectedClass = c.id;
    g.player.applyClass(c.id);
    g.player.form = 'human';

    Array.prototype.forEach.call(this.classRow.children, function (b) {
      b.classList.toggle('active', b.dataset.classId === c.id);
    });

    this.select.querySelector('.octo-sel-name').textContent = this.lang === 'ar' ? c.ar : c.en;
    this.select.querySelector('.octo-select-tagline').textContent =
      this.lang === 'ar' ? c.lineAr : c.lineEn;
    this.select.querySelector('.octo-sel-role').textContent =
      (this.lang === 'ar' ? c.roleAr : c.roleEn) + ' · ' + (this.lang === 'ar' ? c.en : c.ar);
    this.select.querySelector('.octo-sel-line').textContent = this.lang === 'ar' ? c.lineAr : c.lineEn;
    this.select.querySelector('.octo-sel-lore').textContent = this.lang === 'ar' ? c.loreAr : c.loreEn;

    var labels = this.lang === 'ar'
      ? { speed: 'سرعة', balance: 'اتزان', power: 'قوة', support: 'إسناد' }
      : { speed: 'Speed', balance: 'Balance', power: 'Power', support: 'Support' };
    var bars = '';
    ['speed', 'balance', 'power', 'support'].forEach(function (k) {
      var n = c.bars[k];
      var pips = '';
      for (var i = 0; i < 5; i++) pips += '<b class="' + (i < n ? 'on' : '') + '"></b>';
      bars += '<div class="octo-bar-row"><span>' + labels[k] + '</span><div class="octo-pips">' + pips + '</div></div>';
    });
    this.select.querySelector('.octo-sel-bars').innerHTML = bars;

    g.audio && g.audio.play('ui');
  };

  Ui.prototype.confirmClass = function () {
    var g = this.game;
    g.save.classId = this.selectedClass;
    g.selecting = false;
    g.player.lineCooldown = 0;
    g.persist();
    this.select.classList.add('hidden');
    g.camera.free = false;
    g.frameCamera();
    this.startGame();
    var c = OCTO.classById(this.selectedClass);
    g.toast((this.lang === 'ar' ? 'أنت الآن ' : 'You are now a ') + (this.lang === 'ar' ? c.ar : c.en), 'mission');
  };

  /**
   * Route into play: first-time players get the opening and then choose a
   * discipline; returning players go straight back to the city.
   */
  Ui.prototype.beginNewGame = function () {
    var self = this, g = this.game;
    if (g.audio && !g.muted) { g.audio.init(); g.audio.resume(); }
    this.title.classList.add('hidden');
    this.loading.classList.add('hidden');
    this.rail.classList.add('hidden');
    if (!g.save.seenIntro && g.cine) {
      g.save.seenIntro = true;
      g.persist();
      this.screen = 'cine';
      g.cine.start(function () { self.showSelect(); });
    } else if (!g.save.classId) {
      this.showSelect();
    } else {
      this.startGame();
    }
  };

  Ui.prototype.playIntro = function () {
    var self = this, g = this.game;
    if (!g.cine) return;
    if (g.audio && !g.muted) { g.audio.init(); g.audio.resume(); }
    this.title.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.select.classList.add('hidden');
    this.panel.classList.add('hidden');
    this.screen = 'cine';
    g.paused = false;
    g.cine.start(function () {
      if (!g.save.classId) self.showSelect();
      else { g.camera.free = false; g.frameCamera(); self.startGame(); }
    });
  };

  Ui.prototype.startGame = function () {
    this.screen = 'game';
    this.title.classList.add('hidden');
    this.loading.classList.add('hidden');
    this.splash.classList.add('hidden');
    this.rail.classList.add('hidden');
    this.notice.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.panel.classList.add('hidden');
    this.game.paused = false;
    if (this.game.audio && !this.game.muted) { this.game.audio.init(); this.game.audio.resume(); }
    if (!this.wheelBuilt && this.game.combat) { this.wheelBuilt = true; this.buildWheel(); }
    if (!this.input.touch.active && !this.isTouchDevice()) this.input.requestLock();
    if (!this.shownIntro) {
      this.shownIntro = true;
      this.game.toast(this.lang === 'ar' ? 'اذهب إلى بائع السوق واقبل عملاً' : 'Find a souq trader and take a job', 'info');
    }
  };

  Ui.prototype.isTouchDevice = function () {
    return ('ontouchstart' in root) || (navigator.maxTouchPoints > 0);
  };

  Ui.prototype.openPanel = function (tab) {
    this.screen = 'panel';
    this.tab = tab || 'jobs';
    this.panel.classList.remove('hidden');
    this.game.paused = true;
    this.input.exitLock();
    this.renderPanel(this.tab);
  };

  Ui.prototype.closePanel = function () {
    this.panel.classList.add('hidden');
    if (this.hud.classList.contains('hidden')) { this.screen = 'title'; this.title.classList.remove('hidden'); }
    else {
      this.screen = 'game';
      this.game.paused = false;
      if (!this.isTouchDevice()) this.input.requestLock();
    }
  };

  Ui.prototype.renderPanel = function (tab) {
    var self = this;
    this.tab = tab;
    var inGame = !this.hud.classList.contains('hidden');
    var tabs = inGame
      ? [['story', this.t('story')], ['hero', this.t('hero')], ['skills', this.t('skills')], ['bag', this.t('bag')], ['jobs', this.t('jobs')],
         ['mvp', this.t('mvp')], ['dailyTab', this.t('dailyTab')],
         ['auction', this.t('auction')], ['shop', this.t('shop')], ['map', this.t('map')],
         ['controls', this.t('controls')], ['settings', this.t('settings')]]
      : [['controls', this.t('controls')], ['settings', this.t('settings')]];
    this.tabsEl.innerHTML = '';
    tabs.forEach(function (tt) {
      var b = el('button', 'octo-tab' + (tt[0] === tab ? ' active' : ''), tt[1]);
      b.addEventListener('click', function () { self.game.audio && self.game.audio.play('ui'); self.renderPanel(tt[0]); });
      self.tabsEl.appendChild(b);
    });
    this.panel.querySelector('.octo-close').textContent = inGame ? this.t('resume') : this.t('close');

    var body = this.bodyEl;
    body.innerHTML = '';
    if (tab === 'story') this.renderStory(body);
    else if (tab === 'hero') this.renderHero(body);
    else if (tab === 'skills') this.renderSkills(body);
    else if (tab === 'mvp') this.renderMvp(body);
    else if (tab === 'dailyTab') this.renderDaily(body);
    else if (tab === 'bag') this.renderBag(body);
    else if (tab === 'auction') this.renderAuction(body);
    else if (tab === 'jobs') this.renderJobs(body);
    else if (tab === 'shop') this.renderShop(body);
    else if (tab === 'map') this.renderMap(body);
    else if (tab === 'controls') this.renderControls(body);
    else this.renderSettings(body);
  };

  /**
   * The character sheet: who you are, how far you are, and the eight
   * Anchors — which is where the sheet earns its place. An Anchor you
   * have opened is a travel button; one you have not is a locked row
   * that names the level it wants and hints at what is behind it. The
   * list is deliberately not hidden, because a visible lock is a goal.
   */
  Ui.prototype.renderHero = function (body) {
    var self = this, g = this.game, h = g.hero, ar = this.lang === 'ar';
    var cls = OCTO.classById(g.save.classId || 'muqatil');
    var rank = h.rank();

    var head = el('div', 'octo-hero-sheet');
    head.innerHTML =
      '<div class="octo-sheet-portrait">' + (CLASS_GLYPH[cls.id] || '✦') +
      '<b>' + h.level + '</b></div>' +
      '<div class="octo-sheet-meta">' +
      '  <div class="octo-sheet-name">' + (ar ? cls.ar : cls.en) + '</div>' +
      '  <div class="octo-sheet-rank">' + (ar ? rank.ar : rank.en) + '</div>' +
      '  <div class="octo-xp big"><div class="octo-xp-fill" style="width:' +
           (h.fraction() * 100).toFixed(1) + '%"></div>' +
      '    <span class="octo-xp-text">' +
           (isFinite(h.need()) ? Math.floor(h.xp) + ' / ' + h.need() : (ar ? 'أقصى مستوى' : 'MAX')) +
      '    </span></div>' +
      '  <div class="octo-sheet-total">' + (ar ? 'إجمالي الخبرة' : 'Total XP') + ' ' + h.totalXp + '</div>' +
      '</div>';
    body.appendChild(head);

    // discipline bars, same four axes the select screen uses
    var bars = el('div', 'octo-sheet-bars');
    var axes = [
      ['speed', ar ? 'سرعة' : 'Speed'], ['balance', ar ? 'توازن' : 'Balance'],
      ['power', ar ? 'قوة' : 'Power'], ['support', ar ? 'إسناد' : 'Support']
    ];
    axes.forEach(function (a) {
      var v = cls.bars[a[0]] || 0;
      var pips = '';
      for (var i = 1; i <= 5; i++) pips += '<i' + (i <= v ? ' class="on"' : '') + '></i>';
      bars.innerHTML += '<div class="octo-bar-row"><span>' + a[1] + '</span><div class="octo-pips">' + pips + '</div></div>';
    });
    body.appendChild(bars);

    body.appendChild(el('h3', 'octo-sheet-h', ar ? 'المراسي' : 'Anchors'));
    var list = el('div', 'octo-anchor-list');
    OCTO.progress.ANCHORS.forEach(function (a) {
      var open = h.level >= a.level;
      var seen = h.visited.indexOf(a.id) >= 0;
      var row = el('div', 'octo-anchor' + (open ? ' open' : ' locked'));
      row.innerHTML =
        '<div class="octo-anchor-lv">' + a.level + '</div>' +
        '<div class="octo-anchor-body">' +
        '  <div class="octo-anchor-name">' + (ar ? a.ar : a.en) +
             (seen ? ' <em>' + (ar ? 'مفتوحة' : 'discovered') + '</em>' : '') + '</div>' +
        '  <div class="octo-anchor-desc">' + (ar ? a.descAr : a.descEn) + '</div>' +
        '</div>';
      if (open) {
        var b = el('button', 'octo-btn-small', ar ? 'انتقال' : 'Travel');
        b.addEventListener('click', function () {
          g.travelToAnchor(a.id);
          self.game.audio && self.game.audio.play('ui');
          self.closePanel();
        });
        row.appendChild(b);
      } else {
        row.appendChild(el('span', 'octo-anchor-seal', ar ? 'مختومة' : 'SEALED'));
      }
      list.appendChild(row);
    });
    body.appendChild(list);

    body.appendChild(el('p', 'octo-note', ar
      ? 'اجمع اللآلئ، أنجز المهام، واعبر الخيوط لترفع مستواك. كل رتبة تفكّ ختم مرساة.'
      : 'Pearls, jobs and crossings all pay experience. Every rank breaks the seal on another Anchor.'));
  };

  /* ------------------------------------------------------- the story */

  /**
   * Five acts, each a level band, a district, a boss and a few goals. The
   * pages reveal as the act progresses, so the turn at the end of Act V
   * cannot be read on the first day.
   */
  Ui.prototype.renderStory = function (body) {
    var self = this, g = this.game, ar = this.lang === 'ar';
    var c = g.chronicle;
    if (!c) return;
    var ACTS = OCTO.chronicle.ACTS;
    if (this._actPick === undefined) this._actPick = c.current().id;

    var strip = el('div', 'octo-acts');
    ACTS.forEach(function (act) {
      var st = c.state(act);
      var b = el('button', 'octo-act ' + st + (self._actPick === act.id ? ' sel' : ''));
      b.innerHTML =
        '<b>' + (ar ? act.ar : act.en).split('—')[0].trim() + '</b>' +
        '<span>' + act.band[0] + '–' + act.band[1] + '</span>' +
        (st === 'done' ? '<i>✓</i>' : st === 'sealed' ? '<i>🔒</i>' : '');
      b.addEventListener('click', function () {
        self._actPick = act.id;
        self.renderPanel('story');
      });
      strip.appendChild(b);
    });
    body.appendChild(strip);

    var act = OCTO.chronicle.actById(this._actPick);
    if (!act) return;
    var st = c.state(act);

    var card = el('div', 'octo-act-card');
    card.innerHTML =
      '<div class="octo-act-title">' + (ar ? act.ar : act.en) + '</div>' +
      '<div class="octo-act-sub">' + g.districtName(act.district) + ' · ' +
        (ar ? 'المستويات ' : 'Levels ') + act.band[0] + '–' + act.band[1] + '</div>';

    if (st === 'sealed') {
      card.innerHTML += '<div class="octo-act-sealed">' +
        (ar ? 'مختوم حتى المستوى ' : 'Sealed until level ') + act.opens + '</div>';
      body.appendChild(card);
      return;
    }

    // ---- the pages
    var pages = c.pagesRead(act);
    var text = el('div', 'octo-act-pages');
    act.beats.forEach(function (beat, i) {
      if (i < pages) {
        text.innerHTML += '<p>' + (ar ? beat.ar : beat.en) + '</p>';
      } else {
        text.innerHTML += '<p class="unread">' +
          (ar ? '— لم تصل إلى هذه الصفحة بعد —' : '— this page is not yours yet —') + '</p>';
      }
    });
    card.appendChild(text);

    // ---- the goals
    var goals = el('div', 'octo-act-goals');
    c.goals(act).forEach(function (gl) {
      var pct = Math.round(gl.have / gl.goal.need * 100);
      goals.innerHTML +=
        '<div class="octo-act-goal' + (gl.done ? ' done' : '') + '">' +
        '  <span>' + (gl.done ? '✓ ' : '') + (ar ? gl.goal.ar : gl.goal.en) + '</span>' +
        '  <b>' + gl.have + ' / ' + gl.goal.need + '</b>' +
        '  <div class="octo-mini-bar"><i style="width:' + pct + '%"></i></div>' +
        '</div>';
    });
    card.appendChild(goals);

    if (st === 'done') {
      card.appendChild(el('div', 'octo-act-done', ar ? '✓ انتهى هذا الفصل' : '✓ This act is closed'));
    } else {
      var can = c.canClose(act);
      var b2 = el('button', 'octo-select-go' + (can ? '' : ' ghost'),
        can ? (ar ? 'أغلق الفصل  +' : 'Close the act  +') + act.xp + ' XP'
            : (ar ? 'الأهداف غير مكتملة' : 'Objectives incomplete'));
      b2.addEventListener('click', function () {
        if (c.close(act) === 'ok') {
          g.audio && g.audio.play('success');
          self.renderPanel('story');
        } else { g.audio && g.audio.play('fail', 0.4); }
      });
      card.appendChild(b2);
    }
    body.appendChild(card);

    body.appendChild(el('p', 'octo-note', ar
      ? 'كل هدف هنا يقرأ عدّاداً تحتفظ به أنظمة اللعبة أصلاً — لا توجد مهمة جديدة، بل ترتيب لما تفعله.'
      : 'Every objective here reads a counter another system was already keeping. Nothing is a new task; the act is only the order they go in.'));
  };

  /* --------------------------------------------------------- the MVPs */

  function clockString(sec) {
    var m = Math.floor(sec / 60), s2 = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s2 < 10 ? '0' : '') + s2;
  }

  /**
   * The boss roster. Each entry says where it stands, what rule of the
   * world it breaks inside its district, when it is back, and what it
   * drops — the four things worth knowing before walking out there.
   */
  Ui.prototype.renderMvp = function (body) {
    var self = this, g = this.game, ar = this.lang === 'ar';
    if (!g.bosses) return;

    if (this._mvpPick === undefined) this._mvpPick = OCTO.bosses.BOSSES[0].id;

    var list = el('div', 'octo-mvp-list');
    OCTO.bosses.BOSSES.forEach(function (def) {
      var up = g.bosses.isUp(def.id);
      var left = g.bosses.timeLeft(def.id);
      var st = g.bosses.state[def.id] || {};
      var row = el('button', 'octo-mvp' + (self._mvpPick === def.id ? ' sel' : '') + (up ? ' up' : ''));
      row.innerHTML =
        '<span class="octo-mvp-badge">MVP</span>' +
        '<span class="octo-mvp-meta">' +
        '  <b>' + (ar ? def.ar : def.en) + '</b>' +
        '  <i>' + (ar ? 'مستوى ' : 'Lv ') + def.level + ' · ' + g.districtName(def.district) + '</i>' +
        '</span>' +
        '<span class="octo-mvp-time' + (up ? ' live' : '') + '">' +
          (up ? (ar ? 'ظاهر' : 'UP') : clockString(left)) + '</span>' +
        (st.kills ? '<span class="octo-mvp-kills">×' + st.kills + '</span>' : '');
      row.addEventListener('click', function () {
        self._mvpPick = def.id;
        self.renderPanel('mvp');
      });
      list.appendChild(row);
    });
    body.appendChild(list);

    var def = OCTO.bosses.bossById(this._mvpPick);
    if (!def) return;
    var up = g.bosses.isUp(def.id);
    var card = el('div', 'octo-mvp-card');
    card.innerHTML =
      '<div class="octo-mvp-title">' + (ar ? def.ar : def.en) +
        (def.final ? '<em>' + (ar ? 'النهاية' : 'Final') + '</em>' : '') + '</div>' +
      '<div class="octo-mvp-rule"><b>' + (ar ? 'يكسر القاعدة:' : 'Breaks the rule:') + '</b> ' +
        (ar ? def.ruleAr : def.ruleEn) + '</div>' +
      '<div class="octo-mvp-lore">' + (ar ? def.loreAr : def.loreEn) + '</div>' +
      '<div class="octo-node-rows">' +
      '  <div><span>' + (ar ? 'المستوى' : 'Level') + '</span><b>' + def.level + '</b></div>' +
      '  <div><span>' + (ar ? 'الصحة' : 'Health') + '</span><b>' + def.hp.toLocaleString() + '</b></div>' +
      '  <div><span>' + (ar ? 'الموقع' : 'Spawn') + '</span><b>' + g.districtName(def.district) + '</b></div>' +
      '  <div><span>' + (ar ? 'العودة بعد' : 'Respawn') + '</span><b>' +
           Math.round(def.respawn / 60) + (ar ? ' دقيقة' : ' min') + '</b></div>' +
      '</div>';

    var drops = el('div', 'octo-mvp-drops');
    drops.innerHTML = '<div class="octo-slot-name">' + (ar ? 'ما يسقط منه' : 'Item drop') +
      ' · <em>' + (ar ? 'الأول مضمون' : 'first is guaranteed') + '</em></div>';
    var strip = el('div', 'octo-drop-strip');
    def.drops.forEach(function (baseId, i) {
      var base = OCTO.items.baseById(baseId);
      var cell = el('div', 'octo-drop' + (i === 0 ? ' sure' : ''));
      cell.innerHTML = '<b>' + (ar ? base.ar : base.en) + '</b>';
      strip.appendChild(cell);
    });
    drops.appendChild(strip);
    card.appendChild(drops);

    var go = el('button', 'octo-select-go' + (up ? '' : ' ghost'),
      up ? (ar ? 'اذهب إليه' : 'Travel to it')
         : (ar ? 'يعود بعد ' : 'Back in ') + clockString(g.bosses.timeLeft(def.id)));
    go.addEventListener('click', function () {
      if (!up) { g.audio && g.audio.play('fail', 0.4); return; }
      var f = g.bosses.find(def.id);
      if (!f) return;
      g.player.teleport(f.pos.x + 9, f.pos.y + 1.2, f.pos.z + 9);
      g.player.detachLine && g.player.detachLine(null, 1.0);
      g.camera.free = false; g.frameCamera();
      g.combat.target = f;
      self.closePanel();
      g.toast((ar ? 'أمامك ' : 'Before you: ') + (ar ? def.ar : def.en), 'mission');
    });
    card.appendChild(go);
    body.appendChild(card);
  };

  /* -------------------------------------------------------- the daily */

  Ui.prototype.renderDaily = function (body) {
    var self = this, g = this.game, ar = this.lang === 'ar';
    if (!g.daily) return;
    var d = g.daily;
    d.roll();

    // ---- sign-in strip
    body.appendChild(el('h3', 'octo-sheet-h', ar ? 'حضور اليوم' : 'Daily sign-in'));
    var strip = el('div', 'octo-signin');
    d.rewards().forEach(function (r, i) {
      var day = i + 1;
      var cell = el('div', 'octo-day' +
        (day <= d.streak ? ' got' : '') + (day === d.streak + 1 && d.canSignIn() ? ' next' : ''));
      cell.innerHTML = '<b>' + day + '</b>' +
        '<span>' + r.coin + '</span>' +
        (r.item ? '<i>' + (ar ? 'غرض' : 'item') + '</i>' : '');
      strip.appendChild(cell);
    });
    body.appendChild(strip);

    var sign = el('button', 'octo-select-go' + (d.canSignIn() ? '' : ' ghost'),
      d.canSignIn() ? (ar ? 'سجّل الحضور' : 'Sign in')
                    : (ar ? 'سجّلت اليوم' : 'Signed in today'));
    sign.addEventListener('click', function () {
      if (d.signIn() !== 'ok') { g.audio && g.audio.play('fail', 0.4); return; }
      g.audio && g.audio.play('success');
      self.renderPanel('dailyTab');
    });
    body.appendChild(sign);

    // ---- today's list
    body.appendChild(el('h3', 'octo-sheet-h', ar ? 'مهام اليوم' : "Today's list"));
    var list = el('div', 'octo-itemlist');
    d.tasks().forEach(function (t) {
      var row = el('div', 'octo-item' + (t.claimed ? ' sold' : ''));
      var pct = Math.round(t.have / t.task.need * 100);
      row.innerHTML =
        '<div class="octo-item-head" style="color:var(--sand)">' +
          (ar ? t.task.ar : t.task.en) + '</div>' +
        '<div class="octo-item-sub">' + t.have + ' / ' + t.task.need +
          '  ·  +' + t.task.xp + ' XP  ·  +' + t.task.coin + ' ' + self.t('dirhams') + '</div>' +
        '<div class="octo-mini-bar"><i style="width:' + pct + '%"></i></div>';
      if (t.claimed) {
        row.appendChild(el('span', 'octo-anchor-seal', ar ? 'استُلمت' : 'Claimed'));
      } else {
        var b = el('button', 'octo-btn-small' + (t.done ? '' : ' ghost'),
          t.done ? (ar ? 'استلم' : 'Claim') : (ar ? 'اذهب' : 'Go'));
        b.addEventListener('click', function () {
          if (!t.done) { self.closePanel(); return; }
          if (d.claim(t.task.id) === 'ok') {
            g.audio && g.audio.play('coin');
            self.renderPanel('dailyTab');
          }
        });
        row.appendChild(b);
      }
      list.appendChild(row);
    });
    body.appendChild(list);
    body.appendChild(el('p', 'octo-note', ar
      ? 'تُعاد المهام عند منتصف الليل بتوقيت جهازك. كلها أشياء تفعلها أصلاً — اليوم فقط تدفع أكثر.'
      : 'The list resets at your own midnight. Every task is something you were going to do anyway; today it just pays more.'));
  };

  /* ------------------------------------------------------ skill tree */

  /**
   * The tree, as three rows of nodes with a detail card beside the
   * selection. Rows gate on points already spent above them, so a build
   * is a sequence of decisions rather than a shopping list. Respec is
   * free and always available — a dead-end build in a game with no trade
   * and no second character would just be a punishment.
   */
  Ui.prototype.renderSkills = function (body) {
    var self = this, g = this.game, ar = this.lang === 'ar';
    var c = g.combat;
    if (!c) return;
    var C = OCTO.combat;
    var tree = C.treeFor(g.save.classId || 'muqatil');

    var head = el('div', 'octo-tree-head');
    head.innerHTML =
      '<div><b>' + c.pointsFree() + '</b> ' + (ar ? 'نقاط متاحة' : 'points free') + '</div>' +
      '<div class="dim">' + c.pointsSpent() + ' / ' + c.pointsEarned() + ' ' +
        (ar ? 'مُنفقة' : 'spent') + ' · ' + (ar ? 'نقطة لكل مستوى' : '1 per level') + '</div>';
    var reset = el('button', 'octo-btn-small ghost', ar ? 'إعادة التوزيع' : 'Respec');
    reset.addEventListener('click', function () {
      c.respec(); g.audio && g.audio.play('ui'); self.renderPanel('skills');
    });
    head.appendChild(reset);
    body.appendChild(head);

    if (this._treePick === undefined) this._treePick = '0:0';

    var wrap = el('div', 'octo-tree');
    tree.forEach(function (row, ri) {
      var open = c.spentAbove(ri) >= row.needs;
      var rowEl = el('div', 'octo-tree-row' + (open ? '' : ' shut'));
      if (row.needs) {
        rowEl.appendChild(el('div', 'octo-tree-gate',
          (ar ? 'تحتاج ' : 'Needs ') + row.needs + (ar ? ' نقاط أعلاه' : ' points above')));
      }
      var nodes = el('div', 'octo-tree-nodes');
      row.nodes.forEach(function (node, ni) {
        var id = c.nodeId(node);
        var rank = c.rankOf(id);
        var key = ri + ':' + ni;
        var n = el('button', 'octo-node' +
          (rank ? ' taken' : '') + (self._treePick === key ? ' sel' : '') +
          (node.kind === 'passive' ? ' passive' : ''));
        var label = node.kind === 'passive'
          ? (ar ? node.passive.ar : node.passive.en)
          : (ar ? node.skill.ar : node.skill.en);
        n.innerHTML =
          '<span class="octo-node-ico">' +
            (node.kind === 'passive' ? '◈' : (SKILL_GLYPH[node.skill.kind] ? '' : '✦')) + '</span>' +
          '<span class="octo-node-name">' + label + '</span>' +
          '<span class="octo-node-rank">' + rank + ' / ' + C.MAX_RANK + '</span>';
        if (node.kind === 'active') {
          n.querySelector('.octo-node-ico').innerHTML = SKILL_GLYPH[node.skill.kind] || '';
        }
        n.addEventListener('click', function () {
          self._treePick = key;
          self.renderPanel('skills');
        });
        nodes.appendChild(n);
      });
      rowEl.appendChild(nodes);
      wrap.appendChild(rowEl);
    });
    body.appendChild(wrap);

    // ---- detail card for the selected node
    var pick = String(this._treePick).split(':');
    var row = tree[+pick[0]], node = row && row.nodes[+pick[1]];
    if (!node) return;
    var id = c.nodeId(node);
    var rank = c.rankOf(id);
    var card = el('div', 'octo-node-card');

    if (node.kind === 'active') {
      var t0 = c.tuned(node.skill);
      var next = Object.assign({}, node.skill);
      var t1 = { power: +(node.skill.power * (1 + 0.09 * rank)).toFixed(2),
                 sp: Math.max(1, Math.round(node.skill.sp * (1 - 0.03 * rank))),
                 cd: +(node.skill.cd * (1 - 0.04 * rank)).toFixed(2) };
      // At rank 0 the first point buys the base values, so an arrow from a
      // number to itself is noise — show the plain figures instead.
      var arrow = rank > 0 && rank < C.MAX_RANK;
      card.innerHTML =
        '<div class="octo-node-title">' + (ar ? node.skill.ar : node.skill.en) +
          '<em>' + (ar ? 'مهارة فعّالة' : 'Active') + '</em></div>' +
        '<div class="octo-node-rows">' +
        (node.skill.power ? '<div><span>' + (ar ? 'القوة' : 'Power') + '</span><b>' +
          (rank ? t0.power : node.skill.power) + (arrow ? ' → ' + t1.power : '') + '</b></div>' : '') +
        '<div><span>' + (ar ? 'الطاقة' : 'Focus cost') + '</span><b>' +
          (rank ? t0.sp : node.skill.sp) + (arrow ? ' → ' + t1.sp : '') + '</b></div>' +
        '<div><span>' + (ar ? 'الانتظار' : 'Cooldown') + '</span><b>' +
          (rank ? t0.cd : node.skill.cd) + 's' + (arrow ? ' → ' + t1.cd + 's' : '') + '</b></div>' +
        '<div><span>' + (ar ? 'يُفتح عند' : 'Unlocks at') + '</span><b>' +
          (ar ? 'مستوى ' : 'Lv ') + C.SKILL_LEVELS[node.index] + '</b></div>' +
        '</div>';
    } else {
      var names = { attack: ar ? 'الهجوم' : 'Attack', defence: ar ? 'الدفاع' : 'Defence',
                    maxHp: ar ? 'الصحة' : 'Health', maxSp: ar ? 'الطاقة' : 'Focus',
                    grip: ar ? 'التوازن على الخيط' : 'Balance on the line' };
      card.innerHTML =
        '<div class="octo-node-title">' + (ar ? node.passive.ar : node.passive.en) +
          '<em>' + (ar ? 'صفة دائمة' : 'Passive') + '</em></div>' +
        '<div class="octo-node-rows">' +
        '<div><span>' + names[node.passive.stat] + '</span><b>+' +
          Math.round(node.passive.per * 100) + '% ' + (ar ? 'لكل رتبة' : 'per rank') + '</b></div>' +
        '<div><span>' + (ar ? 'الآن' : 'Currently') + '</span><b>+' +
          Math.round(node.passive.per * rank * 100) + '%</b></div>' +
        '</div>';
    }

    var why = c.rankBlocker(+pick[0], node);
    var up = el('button', 'octo-select-go' + (why ? ' ghost' : ''),
      why === 'max' ? (ar ? 'أقصى رتبة' : 'Max rank')
      : why === 'points' ? (ar ? 'لا نقاط' : 'No points')
      : why === 'locked' ? (ar ? 'الصف مغلق' : 'Row locked')
      : why === 'level' ? (ar ? 'المستوى منخفض' : 'Level too low')
      : (ar ? 'ارفع الرتبة' : 'Rank up'));
    up.addEventListener('click', function () {
      if (c.rankUp(+pick[0], node) === 'ok') {
        g.audio && g.audio.play('coin');
        self.renderPanel('skills');
      } else {
        g.audio && g.audio.play('fail', 0.4);
      }
    });
    card.appendChild(up);
    body.appendChild(card);

    body.appendChild(el('p', 'octo-note', ar
      ? 'كل رتبة ترفع قوة المهارة ٩٪ وتخفض كلفتها ٣٪ وانتظارها ٤٪. إعادة التوزيع مجانية دائماً.'
      : 'Each rank adds 9% power, and takes 3% off the focus cost and 4% off the cooldown. Respec is always free.'));
  };

  /* --------------------------------------------------------- the bag */

  function itemLine(it, ar) {
    var out = [];
    var names = {
      atk: ar ? 'هجوم' : 'ATK', def: ar ? 'دفاع' : 'DEF',
      hp: ar ? 'صحة' : 'HP', sp: ar ? 'طاقة' : 'SP',
      grip: ar ? 'توازن' : 'Balance', weight: ar ? 'وزن' : 'Weight'
    };
    for (var k in it.stats) {
      var v = it.stats[k];
      out.push('<span class="' + (k === 'weight' && v > 0 ? 'neg' : 'pos') + '">' +
        (v > 0 ? '+' : '') + v + ' ' + (names[k] || k) + '</span>');
    }
    return out.join(' ');
  }

  Ui.prototype.itemCard = function (it, extra) {
    var ar = this.lang === 'ar';
    var R = OCTO.items.RARITY[it.rarity];
    return '<div class="octo-item-head" style="color:' + R.colour + '">' +
      (ar ? it.ar : it.en) + ' <em>' + (ar ? R.ar : R.en) + '</em></div>' +
      '<div class="octo-item-sub">' + (ar ? 'مستوى ' : 'Lv ') + it.level +
      ' · ' + (ar ? 'قيمة ' : 'worth ') + it.value + '</div>' +
      '<div class="octo-item-stats">' + itemLine(it, ar) + '</div>' + (extra || '');
  };

  /**
   * The pack. Worn gear on the left, loose items on the right, and the
   * summed bonuses underneath so the effect on the rope is visible rather
   * than implied.
   */
  Ui.prototype.renderBag = function (body) {
    var self = this, g = this.game, ar = this.lang === 'ar';
    var inv = g.inventory;

    var worn = el('div', 'octo-worn');
    OCTO.items.SLOTS.forEach(function (slot) {
      var it = inv.equipped[slot.id];
      var cell = el('div', 'octo-slot' + (it ? ' filled' : ''));
      cell.innerHTML = '<div class="octo-slot-name">' + (ar ? slot.ar : slot.en) + '</div>' +
        (it ? self.itemCard(it) : '<div class="octo-slot-empty">—</div>');
      if (it) {
        var off = el('button', 'octo-btn-small', ar ? 'انزع' : 'Remove');
        off.addEventListener('click', function () {
          if (!inv.unequip(slot.id)) { g.toast(ar ? 'الحقيبة ممتلئة' : 'Pack is full', 'warn'); return; }
          g.player.applyClass(); g.persist(); self.renderPanel('bag');
        });
        cell.appendChild(off);
      }
      worn.appendChild(cell);
    });
    body.appendChild(worn);

    var b = inv.bonuses();
    body.appendChild(el('p', 'octo-note',
      (ar ? 'من العتاد: ' : 'From gear: ') +
      '+' + b.atk + ' ' + (ar ? 'هجوم' : 'ATK') + ' · +' + b.def + ' ' + (ar ? 'دفاع' : 'DEF') +
      ' · +' + b.hp + ' HP · ' + (b.grip >= 0 ? '+' : '') + b.grip.toFixed(2) + ' ' + (ar ? 'توازن' : 'Balance') +
      ' · ' + (b.weight >= 0 ? '+' : '') + b.weight.toFixed(1) + ' ' + (ar ? 'وزن على الخيط' : 'line weight')));

    body.appendChild(el('h3', 'octo-sheet-h',
      (ar ? 'الحقيبة ' : 'Pack ') + inv.items.length + ' / ' + inv.capacity));

    if (!inv.items.length) {
      body.appendChild(el('p', 'octo-note', ar
        ? 'فارغة. الغنائم تسقط من الأعداء في الأحياء الخمسة.'
        : 'Empty. Loot drops from the things that hunt you, in all five districts.'));
      return;
    }

    var list = el('div', 'octo-itemlist');
    inv.items.slice().sort(function (x, y) { return y.value - x.value; }).forEach(function (it) {
      var row = el('div', 'octo-item');
      row.innerHTML = self.itemCard(it);
      var acts = el('div', 'octo-item-acts');
      var eq = el('button', 'octo-btn-small', ar ? 'ارتدِ' : 'Equip');
      eq.addEventListener('click', function () {
        inv.equip(it.uid); g.player.applyClass(); g.audio && g.audio.play('coin');
        g.persist(); self.renderPanel('bag');
      });
      var sell = el('button', 'octo-btn-small ghost', ar ? 'اعرض للمزاد' : 'List');
      sell.addEventListener('click', function () {
        var price = Math.round(it.value * 1.2);
        g.inventory.remove(it.uid);
        g.auction.list(it, price, g.time);
        g.persist();
        g.toast((ar ? 'عُرض بسعر ' : 'Listed at ') + price, 'ok');
        self.renderPanel('auction');
      });
      acts.appendChild(eq); acts.appendChild(sell);
      row.appendChild(acts);
      list.appendChild(row);
    });
    body.appendChild(list);
  };

  /* ------------------------------------------------------- the auction */

  Ui.prototype.renderAuction = function (body) {
    var self = this, g = this.game, ar = this.lang === 'ar';
    var a = g.auction;
    if (!a.listings.length) a.refresh(g.hero.level, g.time);

    body.appendChild(el('h3', 'octo-sheet-h', ar ? 'معروضاتك' : 'Your listings'));
    if (!a.mine.length) {
      body.appendChild(el('p', 'octo-note', ar
        ? 'لا شيء معروض. اعرض من الحقيبة.'
        : 'Nothing listed. List something from your Bag.'));
    } else {
      var mine = el('div', 'octo-itemlist');
      a.mine.forEach(function (l, i) {
        var row = el('div', 'octo-item' + (l.sold ? ' sold' : ''));
        row.innerHTML = self.itemCard(l.item,
          '<div class="octo-item-sub">' + (ar ? 'السعر ' : 'Price ') + l.price +
          ' · ' + (ar ? 'العمولة ' : 'fee ') + l.fee + '</div>');
        if (l.sold) {
          var take = el('button', 'octo-btn-small', ar ? 'اقبض' : 'Collect');
          take.addEventListener('click', function () {
            var got = a.collect(i);
            g.addDirhams(got);
            g.audio && g.audio.play('coin');
            g.toast('+' + got + ' ' + self.t('dirhams'), 'success');
            self.renderPanel('auction');
          });
          row.appendChild(take);
        } else {
          var left = Math.max(0, Math.ceil(l.clearsAt - g.time));
          row.appendChild(el('span', 'octo-anchor-seal',
            (ar ? 'قيد البيع · ' : 'On the floor · ') + left + 's'));
        }
        mine.appendChild(row);
      });
      body.appendChild(mine);
    }

    body.appendChild(el('h3', 'octo-sheet-h', ar ? 'أرض المزاد' : 'The floor'));
    var list = el('div', 'octo-itemlist');
    a.listings.forEach(function (l, i) {
      var row = el('div', 'octo-item');
      row.innerHTML = self.itemCard(l.item,
        '<div class="octo-item-sub">' + (ar ? 'البائع ' : 'Seller ') +
        (ar ? l.sellerAr : l.sellerEn) + '</div>');
      var buy = el('button', 'octo-btn-small' + (g.dirhams < l.price ? ' ghost' : ''),
        (ar ? 'اشترِ ' : 'Buy ') + l.price);
      buy.addEventListener('click', function () {
        if (g.dirhams < l.price) {
          g.audio && g.audio.play('fail');
          g.toast(ar ? 'لا تكفي الدراهم' : 'Not enough dirhams', 'warn');
          return;
        }
        if (g.inventory.full()) {
          g.toast(ar ? 'الحقيبة ممتلئة' : 'Pack is full', 'warn');
          return;
        }
        g.addDirhams(-l.price);
        g.inventory.add(l.item);
        a.listings.splice(i, 1);
        g.audio && g.audio.play('coin');
        g.persist();
        g.toast((ar ? 'اشتريت ' : 'Bought ') + (ar ? l.item.ar : l.item.en), 'success');
        self.renderPanel('auction');
      });
      row.appendChild(buy);
      list.appendChild(row);
    });
    body.appendChild(list);
    body.appendChild(el('p', 'octo-note', ar
      ? 'الأرض تتجدد كل ثلاث دقائق. سعّر قريباً من القيمة يُبَع أسرع؛ العمولة ٥٪.'
      : 'The floor turns over every three minutes. Price near an item’s worth and it clears faster; the floor takes 5%.'));
  };

  Ui.prototype.renderJobs = function (body) {
    var self = this, g = this.game;
    var list = el('div', 'octo-list');
    g.missions.slice().sort(function (a, b) { return a.order - b.order; }).forEach(function (m) {
      var row = el('div', 'octo-card octo-card-' + m.state);
      var status = m.state === 'complete' ? self.t('complete') : (m.state === 'active' ? self.t('active') : self.t('available'));
      row.innerHTML =
        '<div class="octo-card-head"><span class="octo-card-title">' + (self.lang === 'ar' ? m.ar : m.en) + '</span>' +
        '<span class="octo-card-status">' + status + '</span></div>' +
        '<div class="octo-card-desc">' + (self.lang === 'ar' ? m.descAr : m.descEn) + '</div>' +
        '<div class="octo-card-foot">' +
        '<span class="octo-progress-txt">' + (m.count || 0) + ' / ' + m.target + '</span>' +
        '<span class="octo-reward">+' + m.reward + ' ' + self.t('dirhams') + '</span></div>' +
        '<div class="octo-mini-bar"><i style="width:' + Math.round(clamp((m.count || 0) / m.target, 0, 1) * 100) + '%"></i></div>';
      if (m.state === 'available' && !m.passive) {
        var b = el('button', 'octo-btn-small', self.t('accept'));
        b.addEventListener('click', function () { g.startMission(m); self.renderPanel('jobs'); });
        row.appendChild(b);
      }
      list.appendChild(row);
    });
    body.appendChild(list);
  };

  Ui.prototype.renderShop = function (body) {
    var self = this, g = this.game;
    var head = el('div', 'octo-shop-head');
    head.innerHTML = '<span class="octo-coin">◈</span> ' + g.dirhams + ' ' + this.t('dirhams');
    body.appendChild(head);
    var grid = el('div', 'octo-grid');
    OCTO.SHOP.forEach(function (item) {
      var owned = !!g.owned[item.id];
      var card = el('div', 'octo-shop-card' + (owned ? ' owned' : ''));
      var swatch = '';
      if (item.kind === 'skin') {
        var c = item.value;
        swatch = '<span class="octo-swatch" style="background:rgb(' +
          Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ')"></span>';
      }
      card.innerHTML =
        '<div class="octo-shop-name">' + swatch + (self.lang === 'ar' ? item.ar : item.en) + '</div>' +
        '<div class="octo-shop-price">' + (owned ? self.t('owned') : ('◈ ' + item.price)) + '</div>';
      var b = el('button', 'octo-btn-small', owned ? self.t('equip') : self.t('buy'));
      if (!owned && g.dirhams < item.price) b.classList.add('disabled');
      b.addEventListener('click', function () {
        var res = g.buy(item.id);
        if (!res.ok && res.reason === 'funds') self.game.toast(self.lang === 'ar' ? 'دراهم غير كافية' : 'Not enough dirhams', 'warn');
        self.renderPanel('shop');
      });
      card.appendChild(b);
      grid.appendChild(card);
    });
    body.appendChild(grid);
  };

  Ui.prototype.renderControls = function (body) {
    var self = this;
    var list = el('div', 'octo-controls');
    CONTROL_ROWS.forEach(function (r) {
      var row = el('div', 'octo-ctrl-row');
      row.innerHTML = '<kbd>' + r.keys + '</kbd><span>' + (self.lang === 'ar' ? r.ar : r.en) + '</span>';
      list.appendChild(row);
    });
    body.appendChild(list);
    var note = el('p', 'octo-note', this.lang === 'ar'
      ? 'يدعم اللعبة لوحة المفاتيح والفأرة، ووحدة التحكم، واللمس على الهاتف.'
      : 'Keyboard + mouse, gamepad, and touch controls on phones are all supported.');
    body.appendChild(note);
  };

  Ui.prototype.renderSettings = function (body) {
    var self = this, g = this.game;

    function row(label, node) {
      var r = el('div', 'octo-set-row');
      r.appendChild(el('span', 'octo-set-label', label));
      r.appendChild(node);
      body.appendChild(r);
    }

    var qsel = el('div', 'octo-seg');
    ['low', 'medium', 'high', 'ultra'].forEach(function (q) {
      var b = el('button', 'octo-seg-btn' + (g.qualityName === q ? ' active' : ''), OCTO.QUALITY[q].name);
      b.addEventListener('click', function () { g.setQuality(q); self.renderPanel('settings'); });
      qsel.appendChild(b);
    });
    row(this.t('quality'), qsel);

    var lsel = el('div', 'octo-seg');
    [['en', 'English'], ['ar', 'العربية']].forEach(function (l) {
      var b = el('button', 'octo-seg-btn' + (self.lang === l[0] ? ' active' : ''), l[1]);
      b.addEventListener('click', function () { self.setLang(l[0]); self.renderPanel('settings'); });
      lsel.appendChild(b);
    });
    row(this.t('language'), lsel);

    function slider(value, onInput) {
      var s = el('input', 'octo-slider');
      s.type = 'range'; s.min = 0; s.max = 100; s.value = Math.round(value * 100);
      s.addEventListener('input', function () { onInput(s.value / 100); });
      return s;
    }
    var a = g.audio;
    row(this.t('volume'), slider(a ? a.masterVol : 0.7, function (v) { a && a.setVolumes(v, a.musicVol, a.sfxVol); }));
    row(this.t('music'), slider(a ? a.musicVol : 0.55, function (v) { a && a.setVolumes(a.masterVol, v, a.sfxVol); }));
    row(this.t('sfx'), slider(a ? a.sfxVol : 0.85, function (v) { a && a.setVolumes(a.masterVol, a.musicVol, v); }));

    var mute = el('button', 'octo-btn-small', g.muted ? (this.lang === 'ar' ? 'مكتوم' : 'MUTED') : (this.lang === 'ar' ? 'يعمل' : 'ON'));
    mute.addEventListener('click', function () {
      self.toggleMute();
      mute.textContent = g.muted ? (self.lang === 'ar' ? 'مكتوم' : 'MUTED') : (self.lang === 'ar' ? 'يعمل' : 'ON');
    });
    row(this.lang === 'ar' ? 'كتم الصوت' : 'Sound', mute);

    var inv = el('button', 'octo-btn-small', this.input.invertY ? 'ON' : 'OFF');
    inv.addEventListener('click', function () {
      self.input.invertY = !self.input.invertY;
      inv.textContent = self.input.invertY ? 'ON' : 'OFF';
    });
    row(this.t('invertY'), inv);

    var reset = el('button', 'octo-btn-small octo-danger', this.t('resetSave'));
    reset.addEventListener('click', function () {
      self.confirmReset++;
      if (self.confirmReset >= 2) { g.resetSave(); root.location.reload(); }
      else reset.textContent = self.t('resetConfirm');
    });
    row('', reset);

    body.appendChild(el('p', 'octo-note', this.t('version') + ' ' + OCTO.VERSION + ' — ' + this.t('beta')));
  };

  /* ------------------------------------------------------------ open map */

  Ui.prototype.renderMap = function (body) {
    var self = this, g = this.game, ar = this.lang === 'ar';
    var wrap = el('div', 'octo-map-wrap');
    var cv = el('canvas', 'octo-map-canvas');
    cv.width = 760; cv.height = 760;
    wrap.appendChild(cv);
    body.appendChild(wrap);
    this.drawMap(cv.getContext('2d'), cv.width, cv.height, true);

    // Tapping an Anchor on the map travels to it, the way a mobile RPG
    // world map is also the travel screen. Hit tests use the canvas's own
    // pixel space, so they stay correct however the element is scaled.
    cv.addEventListener('click', function (ev) {
      var r = cv.getBoundingClientRect();
      var cx = (ev.clientX - r.left) * (cv.width / r.width);
      var cy = (ev.clientY - r.top) * (cv.height / r.height);
      var hits = self.mapHits || [];
      for (var i = 0; i < hits.length; i++) {
        var hit = hits[i];
        if (Math.hypot(cx - hit.x, cy - hit.y) > hit.r) continue;
        if (hit.open) {
          g.travelToAnchor(hit.id);
          self.closePanel();
        } else {
          var an = OCTO.progress.anchorById(hit.id);
          g.audio && g.audio.play('fail');
          g.toast((ar ? 'مختومة — تحتاج المستوى ' : 'Sealed — needs level ') + an.level, 'info');
        }
        return;
      }
    });

    var legend = el('div', 'octo-legend');
    var D = g.world.districts;
    Object.keys(D).forEach(function (k) {
      var d = D[k];
      var item = el('button', 'octo-legend-item');
      item.innerHTML = '<i style="background:' + d.color + '"></i>' + (ar ? d.ar : d.en);
      item.addEventListener('click', function () {
        g.teleportTo(k);
        g.audio && g.audio.play('ui');
        self.closePanel();
        g.toast((ar ? 'انتقلت إلى ' : 'Travelled to ') + (ar ? d.ar : d.en), 'info');
      });
      legend.appendChild(item);
    });
    body.appendChild(legend);

    // What the markers mean. Without this the map is a field of dots.
    var key = el('div', 'octo-mapkey');
    var open = OCTO.progress.unlockedAnchors(g.hero.level).length;
    key.innerHTML =
      '<span><b class="k-anchor-open">✓</b>' + (ar ? 'مرساة مفتوحة' : 'Anchor open') +
        ' (' + open + '/' + OCTO.progress.ANCHORS.length + ')</span>' +
      '<span><b class="k-anchor-lock">5</b>' + (ar ? 'مختومة — الرقم هو المستوى' : 'Sealed — number is the level') + '</span>' +
      '<span><b class="k-quest"></b>' + (ar ? 'الهدف الحالي' : 'Current objective') + '</span>' +
      '<span><b class="k-pearl"></b>' + (ar ? 'لؤلؤة' : 'Pearl') + '</span>' +
      '<span><b class="k-you"></b>' + (ar ? 'أنت' : 'You') + '</span>';
    body.appendChild(key);

    body.appendChild(el('p', 'octo-note', ar
      ? 'انقر مرساة مفتوحة للانتقال إليها، أو اسم حي للقفز إلى مركزه.'
      : 'Tap an open Anchor to travel to it, or a district name to jump to its centre.'));
  };

  /** Top-down map. Shared by the big map screen and the HUD minimap. */
  /**
   * Region layout for the map. The world generator places districts by
   * gameplay need, which puts the souq and the line quarter forty metres
   * apart — close enough that their labels sat on top of each other and
   * the whole map read as one blur. Each region therefore carries an
   * explicit radius and a label direction so the names never collide.
   */
  var REGIONS = {
    souq:    { r: 86,  lx: 0,    lz: 1,  glyph: '⌂' },
    oasis:   { r: 68,  lx: -1,   lz: 0,  glyph: '🌴' },
    line:    { r: 52,  lx: -0.9, lz: -1, glyph: '⌇' },
    harbour: { r: 66,  lx: 1,    lz: 0,  glyph: '⚓' },
    towers:  { r: 104, lx: 0,    lz: -1, glyph: '🗼' }
  };

  /** Rounded pill behind a label so names stay readable over terrain. */
  function labelPill(ctx, text, x, y, accent) {
    ctx.font = '700 12px system-ui, sans-serif';
    var tw = ctx.measureText(text).width;
    var pw = tw + 16, ph = 20;
    ctx.fillStyle = 'rgba(12,9,7,0.86)';
    ctx.strokeStyle = accent || 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(x - pw / 2, y - ph / 2, pw, ph, 9);
      ctx.fill(); ctx.stroke();
    } else {
      ctx.fillRect(x - pw / 2, y - ph / 2, pw, ph);
      ctx.strokeRect(x - pw / 2, y - ph / 2, pw, ph);
    }
    ctx.fillStyle = 'rgba(255,248,236,0.96)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 0.5);
  }

  /**
   * Top-down map, shared by the big map screen and the HUD minimap.
   *
   * `full` draws the organised world map: bounded regions, named labels on
   * leader lines, every Anchor with its rank gate, the gates, the titan and
   * the live objective. The minimap draws the same world without the
   * furniture, centred on the player.
   */
  Ui.prototype.drawMap = function (ctx, w, h, full) {
    var g = this.game, ar = this.lang === 'ar';
    var span = full ? 620 : 190;                 // world metres across the view
    var cxw = full ? 0 : g.player.pos.x;
    var czw = full ? -30 : g.player.pos.z;
    var scale = w / span;

    function px(x) { return (x - cxw) * scale + w / 2; }
    function pz(z) { return (z - czw) * scale + h / 2; }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = full ? '#191309' : 'rgba(20,16,12,0.62)';
    ctx.fillRect(0, 0, w, h);

    // the sand plate the whole city stands on
    var E = OCTO.MAP_EXTENT;
    ctx.fillStyle = full ? '#3a2c1a' : 'rgba(120,96,62,0.35)';
    ctx.fillRect(px(-E), pz(-E), E * 2 * scale, E * 2 * scale);

    if (full) {
      // survey grid, so distances are readable instead of guessed
      ctx.strokeStyle = 'rgba(255,232,180,0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var gx = -E; gx <= E; gx += 50) {
        ctx.moveTo(px(gx), pz(-E)); ctx.lineTo(px(gx), pz(E));
        ctx.moveTo(px(-E), pz(gx)); ctx.lineTo(px(E), pz(gx));
      }
      ctx.stroke();
    }

    // ---- regions: bounded areas rather than overlapping glows
    var D = g.world.districts;
    Object.keys(D).forEach(function (k) {
      var d = D[k], reg = REGIONS[k] || { r: 60 };
      var cx = px(d.center.x), cz = pz(d.center.z), r = reg.r * scale;
      var grd = ctx.createRadialGradient(cx, cz, r * 0.25, cx, cz, r);
      grd.addColorStop(0, d.color + (full ? '3a' : '38'));
      grd.addColorStop(1, d.color + '00');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(cx, cz, r, 0, Math.PI * 2); ctx.fill();
      if (full) {
        ctx.strokeStyle = d.color + '66';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.arc(cx, cz, r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // ---- building footprints
    var boxes = g.world.physics.boxes;
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (b.tag !== 'building' && b.tag !== 'tower' && b.tag !== 'mosque' &&
          b.tag !== 'minaret' && b.tag !== 'platform') continue;
      var bw = b.hx * 2 * scale, bd = b.hz * 2 * scale;
      if (bw < 1.2 && bd < 1.2) continue;
      ctx.fillStyle = b.tag === 'tower' ? 'rgba(180,150,235,0.55)'
        : b.tag === 'platform' ? 'rgba(120,210,230,0.50)'
        : 'rgba(226,206,170,0.42)';
      ctx.fillRect(px(b.x) - bw / 2, pz(b.z) - bd / 2, bw, bd);
    }

    // ---- ropes
    ctx.strokeStyle = 'rgba(255,238,190,0.28)';
    ctx.lineWidth = full ? 0.8 : 0.9;
    ctx.beginPath();
    for (var r2 = 0; r2 < g.ropes.length; r2++) {
      var rope = g.ropes[r2];
      ctx.moveTo(px(rope.a.x), pz(rope.a.z));
      ctx.lineTo(px(rope.b.x), pz(rope.b.z));
    }
    ctx.stroke();

    // ---- pearls
    ctx.fillStyle = 'rgba(190,235,255,0.75)';
    for (var p = 0; p < g.pearls.length; p++) {
      if (g.pearls[p].taken) continue;
      ctx.beginPath();
      ctx.arc(px(g.pearls[p].x), pz(g.pearls[p].z), full ? 1.6 : 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- Anchors: the rank gates, drawn on both maps because knowing where
    // the next one is matters more than any other marker on the map.
    this.mapHits = [];
    var A = (OCTO.progress && OCTO.progress.ANCHORS) || [];
    for (var a = 0; a < A.length; a++) {
      var an = A[a];
      if (!an.at) continue;
      var ax = px(an.at[0]), az = pz(an.at[2]);
      var open = g.hero.level >= an.level;
      var rad = full ? 9 : 5;
      ctx.beginPath();
      ctx.arc(ax, az, rad, 0, Math.PI * 2);
      ctx.fillStyle = open ? 'rgba(79,198,216,0.92)' : 'rgba(90,74,58,0.92)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = open ? 'rgba(214,252,255,0.95)' : 'rgba(180,160,130,0.55)';
      ctx.stroke();
      if (full) {
        ctx.font = '800 10px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = open ? '#06242c' : '#e6dcc8';
        ctx.fillText(open ? '✓' : String(an.level), ax, az + 0.5);
        this.mapHits.push({ kind: 'anchor', id: an.id, x: ax, y: az, r: 16, open: open });
      }
    }

    // ---- gates
    if (g.world.gates) {
      for (var gi = 0; gi < g.world.gates.length; gi++) {
        var gt = g.world.gates[gi];
        var gx2 = px(gt.x), gz2 = pz(gt.z);
        ctx.strokeStyle = 'rgba(120,226,244,0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gx2, gz2, full ? 6 : 3.5, Math.PI * 0.15, Math.PI * 0.85, true);
        ctx.stroke();
      }
    }

    // ---- live objective
    ctx.fillStyle = '#ffd24a';
    for (var m = 0; m < g.markers.length; m++) {
      var mk = g.markers[m];
      ctx.beginPath();
      ctx.arc(px(mk.x), pz(mk.z), full ? 5 : 3.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- region labels, on leader lines so they never sit on each other
    if (full) {
      Object.keys(D).forEach(function (k) {
        var d = D[k], reg = REGIONS[k] || { r: 60, lx: 0, lz: -1 };
        var cx = px(d.center.x), cz = pz(d.center.z);
        var lx = cx + reg.lx * (reg.r * scale + 22);
        var lz = cz + reg.lz * (reg.r * scale + 22);
        ctx.strokeStyle = d.color + '99';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cz); ctx.lineTo(lx, lz); ctx.stroke();
        ctx.fillStyle = d.color;
        ctx.beginPath(); ctx.arc(cx, cz, 3, 0, Math.PI * 2); ctx.fill();
        labelPill(ctx, ar ? d.ar : d.en, lx, lz, d.color + 'cc');
      });

      // the titan, named where it actually stands
      if (g.world.titan && g.world.titan.centre) {
        var t = g.world.titan.centre;
        labelPill(ctx, ar ? 'رأس الخيط' : "Ra's al-Khayt",
          px(t.x), pz(t.z), 'rgba(79,198,216,0.9)');
      }
    }

    // ---- player pin
    var pxp = px(g.player.pos.x), pzp = pz(g.player.pos.z);
    ctx.save();
    ctx.translate(pxp, pzp);
    if (full) {
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,106,143,0.20)'; ctx.fill();
    }
    ctx.rotate(-g.player.visualYaw + Math.PI);
    ctx.fillStyle = '#ff6a8f';
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 3.5); ctx.lineTo(-6, 7);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();

    if (full) {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px(-E), pz(-E), E * 2 * scale, E * 2 * scale);
    }
  };

  /* ------------------------------------------------------------ beta panel */

  Ui.prototype.toggleBeta = function () {
    this.betaOpen = !this.betaOpen;
    this.beta.classList.toggle('hidden', !this.betaOpen);
    if (this.betaOpen) this.renderBeta();
  };

  Ui.prototype.renderBeta = function () {
    var self = this, g = this.game;
    this.beta.innerHTML = '<div class="octo-beta-title">' + this.t('betaPanel') + ' · v' + OCTO.VERSION + '</div>' +
      '<div class="octo-beta-stats"></div>';
    this.betaStats = this.beta.querySelector('.octo-beta-stats');

    var tp = el('div', 'octo-beta-row');
    tp.appendChild(el('span', 'octo-beta-label', this.t('fastTravel')));
    Object.keys(g.world.districts).forEach(function (k) {
      var b = el('button', 'octo-beta-btn', self.lang === 'ar' ? g.world.districts[k].ar : g.world.districts[k].en);
      b.addEventListener('click', function () { g.teleportTo(k); });
      tp.appendChild(b);
    });
    this.beta.appendChild(tp);

    var tRow = el('div', 'octo-beta-row');
    tRow.appendChild(el('span', 'octo-beta-label', this.t('timeOfDay')));
    var slider = el('input', 'octo-slider');
    slider.type = 'range'; slider.min = 0; slider.max = 240; slider.value = Math.round(g.hour * 10);
    slider.addEventListener('input', function () { g.hour = slider.value / 10; g.timeFrozen = true; });
    tRow.appendChild(slider);
    var freeze = el('button', 'octo-beta-btn', g.timeFrozen ? '▶' : '⏸');
    freeze.addEventListener('click', function () { g.timeFrozen = !g.timeFrozen; freeze.textContent = g.timeFrozen ? '▶' : '⏸'; });
    tRow.appendChild(freeze);
    this.beta.appendChild(tRow);

    var camRow = el('div', 'octo-beta-row');
    camRow.appendChild(el('span', 'octo-beta-label', this.t('freeCam')));
    var fc = el('button', 'octo-beta-btn', 'P');
    fc.addEventListener('click', function () { self.togglePhoto(); });
    camRow.appendChild(fc);
    var give = el('button', 'octo-beta-btn', '+1000 ◈');
    give.addEventListener('click', function () { g.addDirhams(1000); });
    camRow.appendChild(give);
    var wob = el('button', 'octo-beta-btn', 'ragdoll');
    wob.addEventListener('click', function () { g.player.enterRagdoll(1.5); });
    camRow.appendChild(wob);
    this.beta.appendChild(camRow);
  };

  /** One-tap mute, remembered between sessions. */
  Ui.prototype.toggleMute = function (force) {
    var g = this.game;
    g.muted = force === undefined ? !g.muted : !!force;
    if (g.audio) g.audio.setEnabled(!g.muted);
    g.save.muted = g.muted;
    g.persist();
    this.syncMuteButton();
    if (!g.muted && g.audio) { g.audio.init(); g.audio.resume(); }
  };

  Ui.prototype.syncMuteButton = function () {
    if (!this.soundBtn) return;
    var muted = !!this.game.muted;
    this.soundBtn.classList.toggle('muted', muted);
    this.soundBtn.textContent = muted ? '♪' : '♪';
    this.soundBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    this.soundBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
  };

  /**
   * A readable dump of the environment, reachable by tap. This is what a
   * player on an unfamiliar device can screenshot and send back.
   */
  Ui.prototype.toggleDiag = function () {
    this.diagOpen = !this.diagOpen;
    this.diagEl.classList.toggle('hidden', !this.diagOpen);
    if (this.diagOpen) this.updateDiag();
  };

  Ui.prototype.updateDiag = function () {
    if (!this.diagOpen || !root.GAME || !root.GAME.diagnostics) return;
    var d = root.GAME.diagnostics();
    var lines = [];
    for (var k in d) lines.push(k.replace(/([A-Z])/g, ' $1').toLowerCase() + '  ' + d[k]);
    this.diagEl.textContent = lines.join('\n');
  };

  Ui.prototype.togglePhoto = function () {
    var c = this.game.camera;
    c.free = !c.free;
    if (c.free) {
      c.freePos.x = c.pos.x; c.freePos.y = c.pos.y; c.freePos.z = c.pos.z;
      this.hud.classList.add('photo');
    } else this.hud.classList.remove('photo');
  };

  /* ---------------------------------------------------------------- tick */

  Ui.prototype.update = function (dt) {
    var g = this.game, input = this.input;

    if (this.screen === 'cine' || this.screen === 'select') {
      // the opening and the guild hall own the screen; only skipping applies
      if (this.screen === 'cine' && (input.hit('jump') || input.hit('pause'))) this.game.cine.finish();
      return;
    }

    // A quest hand-off owns the input while it is up: accept with the
    // jump key, dismiss with pause, and nothing else gets through.
    if (this.dialogOpen()) {
      if (input.hit('jump') || input.hit('interact')) this.answerDialog(true);
      else if (input.hit('pause')) this.answerDialog(false);
      return;
    }

    // global hotkeys
    if (input.hit('lang')) this.toggleLang();
    if (input.hit('beta')) this.toggleBeta();
    if (input.hit('photo')) this.togglePhoto();
    if (input.hit('map')) {
      if (this.screen === 'panel' && this.tab === 'map') this.closePanel();
      else this.openPanel('map');
    }
    if (input.hit('pause')) {
      if (this.screen === 'panel') this.closePanel();
      else if (this.screen === 'game') this.openPanel('jobs');
    }

    if (this.screen !== 'game') {
      if (this.betaOpen) this.updateBetaStats();
      return;
    }

    // hero plate + experience + the fight
    this.syncHero();
    this.syncCombat();
    if ((g.frame % 6) === 0) this.syncQuestLog();

    // money + district + clock
    this.moneyEl.textContent = g.dirhams;
    var d = g.world.districts[g.currentDistrict()];
    this.districtEl.textContent = this.lang === 'ar' ? d.ar : d.en;
    var hh = Math.floor(g.hour), mm = Math.floor((g.hour - hh) * 60);
    this.clockEl.textContent = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;

    // mission tracker
    var am = g.activeMission || g.missionById('pearls');
    if (am) {
      var pct = Math.round(clamp((am.count || 0) / am.target, 0, 1) * 100);
      this.missionEl.innerHTML =
        '<div class="octo-mission-title">' + (this.lang === 'ar' ? am.ar : am.en) + '</div>' +
        '<div class="octo-mission-sub">' + (am.count || 0) + ' / ' + am.target + '</div>' +
        '<div class="octo-mini-bar"><i style="width:' + pct + '%"></i></div>';
    }

    // balance meter — the mechanic that needs the clearest feedback
    var p = g.player;
    if (p.state === 'line') {
      this.balanceEl.classList.remove('hidden');
      var tilt = clamp(p.tilt / 1.15, -1, 1);
      this.balancePin.style.left = (50 + tilt * 50) + '%';
      var danger = Math.abs(tilt);
      this.balanceEl.classList.toggle('danger', danger > 0.62);
      this.balanceLabel.textContent = this.t('balance') + (p.gripping ? ' · ' + (this.lang === 'ar' ? 'تشبث' : 'GRIP') : '');
    } else {
      this.balanceEl.classList.add('hidden');
    }

    // interaction prompt
    if (g.interactable) {
      this.promptEl.classList.remove('hidden');
      var label = this.lang === 'ar' ? g.interactable.ar : g.interactable.en;
      this.promptEl.innerHTML = '<kbd>E</kbd> ' + label;
    } else if (p.carry) {
      this.promptEl.classList.remove('hidden');
      this.promptEl.innerHTML = '<kbd>E</kbd> ' + (this.lang === 'ar' ? 'أفلت' : 'Drop') +
        ' · <kbd>Shift+E</kbd> ' + (this.lang === 'ar' ? 'ارمِ' : 'Throw');
    } else {
      this.promptEl.classList.add('hidden');
    }

    // ability readouts
    var dashPct = Math.round((1 - clamp(p.dashCooldown / p.tune.dashCooldown, 0, 1)) * 100);
    this.abilityEl.innerHTML =
      '<div class="octo-ability' + (dashPct >= 100 ? ' ready' : '') + '"><kbd>F</kbd>' +
      '<div class="octo-ability-bar"><i style="width:' + dashPct + '%"></i></div></div>' +
      '<div class="octo-ability' + (p.state === 'line' ? ' ready' : '') + '"><kbd>Q</kbd></div>' +
      '<div class="octo-ability"><kbd>R</kbd></div>';

    // toasts
    this.syncToasts();

    // minimap
    if ((g.frame % 3) === 0) this.drawMap(this.minimapCtx, this.minimap.width, this.minimap.height, false);

    if (this.betaOpen) this.updateBetaStats();
    if (this.diagOpen && (g.frame % 20) === 0) this.updateDiag();
  };

  /* ------------------------------------------------------ skill wheel */

  var SKILL_GLYPH = {
    strike: '<svg viewBox="0 0 24 24"><path d="M3 20l7-7 1.5 1.5L4.5 21.5 3 20zm5.5-8.5L18 2l4 4-9.5 9.5-4-4z"/></svg>',
    burst:  '<svg viewBox="0 0 24 24"><path d="M12 2l2.2 6.2L21 9l-5 4.2L17.6 21 12 17.4 6.4 21 8 13.2 3 9l6.8-.8L12 2z"/></svg>',
    bolt:   '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
    hook:   '<svg viewBox="0 0 24 24"><path d="M17 3v9a5 5 0 01-10 0V9h3v3a2 2 0 004 0V3h3zM4 20h16v2H4z"/></svg>',
    ward:   '<svg viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3zm-1 5v3H8v2h3v3h2v-3h3v-2h-3V7h-2z"/></svg>',
    sag:    '<svg viewBox="0 0 24 24"><path d="M2 7h2c0 5 3.6 9 8 9s8-4 8-9h2c0 6.6-4.9 11-10 11S2 13.6 2 7z"/></svg>',
    weave:  '<svg viewBox="0 0 24 24"><path d="M3 17c4-8 14-8 18 0l-1.7 1c-3.2-6.4-11.4-6.4-14.6 0L3 17zm2-11h14v2H5V6z"/></svg>'
  };

  /**
   * The action wheel: one big primary and four skills around it, each
   * showing its unlock level and sweeping a cooldown. Built once and then
   * only updated, because rebuilding it every frame under a thumb makes
   * buttons miss their own taps.
   */
  Ui.prototype.buildWheel = function () {
    var self = this, g = this.game;
    if (!g.combat) return;
    this.wheelEl.innerHTML = '';

    var auto = el('button', 'octo-auto');
    auto.innerHTML = '<b>AUTO</b>';
    auto.addEventListener('click', function () {
      g.combat.auto = !g.combat.auto;
      auto.classList.toggle('on', g.combat.auto);
      g.audio && g.audio.play('ui');
      g.toast(g.combat.auto
        ? (self.lang === 'ar' ? 'قتال تلقائي: يعمل' : 'Auto-attack on')
        : (self.lang === 'ar' ? 'قتال تلقائي: متوقف' : 'Auto-attack off'), 'info');
    });
    this.wheelEl.appendChild(auto);
    this.autoBtn = auto;

    this.skillBtns = [];
    var bar = g.combat.bar();
    for (var i = 0; i < bar.length; i++) {
      (function (idx) {
        var b = el('button', 'octo-skill octo-skill-' + idx);
        b.innerHTML =
          '<span class="octo-skill-ico">' + (SKILL_GLYPH[bar[idx].skill.kind] || SKILL_GLYPH.strike) + '</span>' +
          '<span class="octo-skill-sweep"></span>' +
          '<span class="octo-skill-lv"></span>' +
          '<span class="octo-skill-cd"></span>';
        b.addEventListener('click', function () { self.fireSkill(idx); });
        self.wheelEl.appendChild(b);
        self.skillBtns.push(b);
      })(i);
    }
    this.syncWheel(true);
  };

  Ui.prototype.fireSkill = function (index) {
    var g = this.game, ar = this.lang === 'ar';
    var res = g.combat.cast(index);
    if (res === 'ok') return;
    var why = {
      locked: ar ? 'لم تتعلمها بعد' : 'Not learned yet',
      sp: ar ? 'لا تكفي الطاقة' : 'Not enough focus',
      cooldown: ar ? 'لم تجهز بعد' : 'Not ready',
      target: ar ? 'لا هدف' : 'No target',
      dead: ar ? 'أنت ساقط' : 'You are down'
    }[res];
    if (why) g.toast(why, 'info');
    g.audio && g.audio.play('fail', 0.4);
  };

  Ui.prototype.syncWheel = function (force) {
    var g = this.game;
    if (!g.combat || !this.skillBtns) return;
    var bar = g.combat.bar();
    for (var i = 0; i < this.skillBtns.length; i++) {
      var b = this.skillBtns[i], d = bar[i];
      if (!d) continue;
      var lv = b.querySelector('.octo-skill-lv');
      var cdEl = b.querySelector('.octo-skill-cd');
      var sweep = b.querySelector('.octo-skill-sweep');
      b.classList.toggle('locked', !d.unlocked);
      b.classList.toggle('cooling', d.cd > 0);
      lv.textContent = d.unlocked ? 'Lv' + g.hero.level : 'Lv' + d.needs;
      if (d.cd > 0) {
        cdEl.textContent = d.cd > 1 ? Math.ceil(d.cd) : d.cd.toFixed(1);
        sweep.style.opacity = String(Math.min(1, d.cd / Math.max(0.4, d.skill.cd)));
      } else {
        cdEl.textContent = '';
        sweep.style.opacity = '0';
      }
      if (force) b.title = (this.lang === 'ar' ? d.skill.ar : d.skill.en);
    }
    if (this.autoBtn) this.autoBtn.classList.toggle('on', !!g.combat.auto);
  };

  /** HP / focus bars and the target plate. */
  Ui.prototype.syncCombat = function () {
    var g = this.game, c = g.combat, ar = this.lang === 'ar';
    if (!c) return;
    var hp = Math.max(0, Math.round(c.hp)), sp = Math.max(0, Math.round(c.sp));
    this.hpFill.style.width = (hp / c.maxHp * 100).toFixed(1) + '%';
    this.spFill.style.width = (sp / c.maxSp * 100).toFixed(1) + '%';
    this.hpText.textContent = hp + ' / ' + c.maxHp;
    this.spText.textContent = sp + ' / ' + c.maxSp;
    this.vitalsEl.classList.toggle('low', hp / c.maxHp < 0.3);

    var t = c.target;
    if (t && !t.dead) {
      this.targetEl.classList.remove('hidden');
      this.targetEl.querySelector('.octo-target-lv').textContent = t.level;
      this.targetEl.querySelector('.octo-target-name').textContent = ar ? t.def.ar : t.def.en;
      this.targetEl.querySelector('.octo-target-bar i').style.width =
        (t.hp / t.maxHp * 100).toFixed(1) + '%';
      this.targetEl.classList.toggle('elite', !!t.def.elite);
    } else {
      this.targetEl.classList.add('hidden');
    }
    this.syncWheel(false);
  };

  /* ------------------------------------------------------- quest log */

  /**
   * The tracker on the left edge, with tabs. Mirrors the reference: each
   * entry names its source and its target location, so a player who put
   * the game down yesterday can pick the thread back up.
   */
  Ui.prototype.syncQuestLog = function () {
    var self = this, g = this.game, ar = this.lang === 'ar';
    if (this._qtab === undefined) this._qtab = 'quest';

    if (!this.qtabsEl.childElementCount) {
      [['quest', ar ? 'المهام' : 'Quest'], ['party', ar ? 'الرفاق' : 'Party']].forEach(function (t) {
        var b = el('button', 'octo-qtab', t[1]);
        b.dataset.tab = t[0];
        b.addEventListener('click', function () {
          self._qtab = t[0];
          self._qlogKey = null;
          g.audio && g.audio.play('ui');
        });
        self.qtabsEl.appendChild(b);
      });
    }
    Array.prototype.forEach.call(this.qtabsEl.children, function (b) {
      b.classList.toggle('active', b.dataset.tab === self._qtab);
    });

    // rebuild only when something actually changed
    var key = this._qtab + '|' + this.lang + '|' + g.missions.map(function (m) {
      return m.id + m.state + (m.count || 0);
    }).join(',') + '|' + g.hero.level;
    if (key === this._qlogKey) return;
    this._qlogKey = key;

    var html = '';
    if (this._qtab === 'quest') {
      var live = g.missions.filter(function (m) { return m.state !== 'complete'; })
        .sort(function (a, b) { return (b.state === 'active') - (a.state === 'active') || a.order - b.order; })
        .slice(0, 2);
      live.forEach(function (m) {
        var d = g.world.districts[m.district] || null;
        html +=
          '<div class="octo-q' + (m.state === 'active' ? ' on' : '') + '">' +
          '  <div class="octo-q-head">' +
          '    <b>' + (m.state === 'active' ? (ar ? '[جارٍ]' : '[Active]') : (ar ? '[متاح]' : '[Open]')) + '</b> ' +
               (ar ? m.ar : m.en) + '</div>' +
          '  <div class="octo-q-line">' + (ar ? 'التقدّم: ' : 'Progress: ') +
               (m.count || 0) + ' / ' + m.target + '</div>' +
          (d ? '  <div class="octo-q-line dim">' + (ar ? 'الموقع: ' : 'Location: ') +
               (ar ? d.ar : d.en) + '</div>' : '') +
          '</div>';
      });
      // the next rank gate reads like a quest, because it is one
      var next = null, A = OCTO.progress.ANCHORS;
      for (var i = 0; i < A.length; i++) if (g.hero.level < A[i].level) { next = A[i]; break; }
      if (next) {
        html +=
          '<div class="octo-q seal">' +
          '  <div class="octo-q-head"><b>' + (ar ? '[ختم]' : '[Seal]') + '</b> ' +
               (ar ? next.ar : next.en) + '</div>' +
          '  <div class="octo-q-line">' + (ar ? 'تحتاج المستوى ' : 'Reach level ') + next.level +
               ' (' + (ar ? 'الآن ' : 'now ') + g.hero.level + ')</div>' +
          '</div>';
      }
      if (!html) html = '<div class="octo-q dim">' + (ar ? 'لا مهام' : 'Nothing tracked') + '</div>';
    } else {
      var cls = OCTO.classById(g.save.classId || 'muqatil');
      html =
        '<div class="octo-q">' +
        '  <div class="octo-q-head"><b>' + (ar ? '[أنت]' : '[You]') + '</b> ' +
             (ar ? cls.ar : cls.en) + ' · ' + (ar ? 'مستوى ' : 'Lv ') + g.hero.level + '</div>' +
        '  <div class="octo-q-line dim">' + (ar
             ? 'اللعب الجماعي لم يُفتح في هذه النسخة.'
             : 'Co-op is not open in this build.') + '</div>' +
        '</div>';
    }
    this.qbodyEl.innerHTML = html;
  };

  /* ---------------------------------------------------- quest dialogue */

  /**
   * Speaker lines. Each trader talks about the job the way someone who
   * lives here would — the mission card states the objective, this
   * states the reason. Both matter; only one of them is characterisation.
   */
  var SPEAKERS = {
    lanterns: {
      nameEn: 'Umm Layla, lampwright', nameAr: 'أم ليلى، صانعة القناديل', face: '🏮',
      en: 'The quarter goes dark in an hour and my knees will not take the roofs any more. Eight lanterns. Light them and the souq sleeps easy.',
      ar: 'يظلم الحي بعد ساعة، ولم تعد ركبتاي تحتملان السطوح. ثمانية فوانيس. أشعلها ينم السوق مطمئناً.'
    },
    spice: {
      nameEn: 'Faris, spice broker', nameAr: 'فارس، تاجر البهارات', face: '🧺',
      en: 'Saffron for the oasis camp, and it does not travel by cart. Carry it across yourself — and if you drop it, do not come back to tell me.',
      ar: 'زعفران لمخيّم الواحة، ولا يُنقل بعربة. احمله بنفسك — وإن أسقطته فلا تعد لتخبرني.'
    },
    longline: {
      nameEn: 'Hadi, rope master', nameAr: 'هادي، معلّم الحبال', face: '🪢',
      en: 'The long line has held since before your grandfather. Climb the minaret and walk it to the harbour. If it holds you, it holds anyone.',
      ar: 'الخيط الطويل صامد من قبل جدّك. اصعد المئذنة وامشِ عليه إلى الميناء. إن حملك حمل أي أحد.'
    },
    drones: {
      nameEn: 'Nura, harbour keeper', nameAr: 'نورة، حارسة الميناء', face: '🛸',
      en: 'Five of my birds slipped their moorings in the night wind. Touch each one and it will remember its way home.',
      ar: 'خمس من طيوري انفلتت من مرابطها في ريح الليل. المس كل واحدة تتذكر طريق العودة.'
    },
    beacons: {
      nameEn: 'Zayd, keeper of letters', nameAr: 'زيد، حافظ الحروف', face: '✒',
      en: 'Four beacons on the Falak rings, and the script on them has gone cold. Wake them. The city reads by that light.',
      ar: 'أربع منارات على حلقات فلك، وقد برد الخط عليها. أيقظها. المدينة تقرأ بذلك النور.'
    },
    pearls: {
      nameEn: 'The old diver', nameAr: 'الغوّاص العجوز', face: '🦪',
      en: 'Forty pearls went up onto the lines when the sea went away. Bring me what you find. No hurry — the lines are patient.',
      ar: 'أربعون لؤلؤة صعدت إلى الخيوط حين انحسر البحر. أحضر لي ما تجده. لا عجلة — الخيوط صبورة.'
    }
  };

  /** Open the hand-off scene for a mission. Pauses nothing; just overlays. */
  Ui.prototype.openDialog = function (mission) {
    var ar = this.lang === 'ar';
    var s = SPEAKERS[mission.id] || {
      nameEn: 'A trader', nameAr: 'تاجر', face: '◈',
      en: mission.descEn, ar: mission.descAr
    };
    // a menu and a conversation are two different places to be
    if (this.screen === 'panel') this.closePanel();
    this.dialogMission = mission;
    this.dialog.querySelector('.octo-dialog-face').textContent = s.face;
    this.dialog.querySelector('.octo-dialog-name').textContent = ar ? s.nameAr : s.nameEn;
    this.dialog.querySelector('.octo-dialog-text').textContent = ar ? s.ar : s.en;

    var xp = OCTO.progress.XP.missionBase * (mission.order || 1);
    this.dialog.querySelector('.octo-dialog-reward').innerHTML =
      '<span class="octo-dialog-title">' + (ar ? mission.ar : mission.en) + '</span>' +
      '<span class="octo-dialog-pay">+' + mission.reward + ' ' + this.t('dirhams') +
      '  ·  +' + xp + ' XP</span>';

    var active = mission.state === 'active';
    this.dialog.querySelector('.octo-dialog-yes').textContent =
      active ? (ar ? 'تابع' : 'Continue') : (ar ? 'أقبل' : 'Accept');
    this.dialog.querySelector('.octo-dialog-no').textContent = ar ? 'لاحقاً' : 'Later';
    this.dialog.classList.remove('hidden');
    this.game.audio && this.game.audio.play('ui');
  };

  Ui.prototype.answerDialog = function (accepted) {
    var m = this.dialogMission;
    this.dialog.classList.add('hidden');
    this.dialogMission = null;
    if (!m) return;
    this.game.audio && this.game.audio.play('ui');
    if (accepted && m.state === 'available') this.game.startMission(m);
  };

  Ui.prototype.dialogOpen = function () { return !this.dialog.classList.contains('hidden'); };

  /* --------------------------------------------------------- hero plate */

  var CLASS_GLYPH = { sayyad: '➶', muqatil: '⚔', dir: '🛡', shafi: '✚', sahir: '✦' };

  /**
   * Portrait, level badge, rank title and the experience bar — the block
   * every mobile RPG parks in the top corner. The bar is animated toward
   * its target rather than snapped, so a big award reads as a sweep.
   */
  Ui.prototype.syncHero = function () {
    var g = this.game, h = g.hero;
    if (!h) return;
    var cls = OCTO.classById(g.save.classId || 'muqatil');

    this.heroGlyph.textContent = CLASS_GLYPH[cls.id] || '✦';
    this.heroLv.textContent = h.level;
    this.heroName.textContent = this.lang === 'ar' ? cls.ar : cls.en;
    var rank = h.rank();
    this.heroRank.textContent = this.lang === 'ar' ? rank.ar : rank.en;

    var target = h.fraction();
    if (this._xpShown === undefined) this._xpShown = target;
    // ease toward the true value; snap on a level-up so the bar resets clean
    if (target < this._xpShown - 0.2) this._xpShown = target;
    else this._xpShown += (target - this._xpShown) * 0.14;
    this.xpFill.style.width = (this._xpShown * 100).toFixed(1) + '%';
    this.xpText.textContent = isFinite(h.need())
      ? Math.floor(h.xp) + ' / ' + h.need()
      : (this.lang === 'ar' ? 'أقصى مستوى' : 'MAX');

    // floating "+n XP"
    if (g.xpFlash) {
      var f = 1 - clamp(g.xpFlash.t / 1.6, 0, 1);
      this.xpFlashEl.textContent = '+' + g.xpFlash.amount + ' XP';
      this.xpFlashEl.style.opacity = f.toFixed(2);
      this.xpFlashEl.style.transform = 'translateY(' + (-14 * (1 - f)).toFixed(1) + 'px)';
    } else {
      this.xpFlashEl.style.opacity = '0';
    }

    if (g.levelUpEvent) { this.showLevelUp(g.levelUpEvent); g.levelUpEvent = null; }
    if (this._levelUpUntil && g.time > this._levelUpUntil) {
      this._levelUpUntil = 0;
      this.levelUpEl.classList.add('hidden');
    }
  };

  /** The full-screen level-up beat: word, number, new rank, what opened. */
  Ui.prototype.showLevelUp = function (ev) {
    var ar = this.lang === 'ar';
    this.levelUpEl.querySelector('.octo-levelup-word').textContent = ar ? 'ارتقاء' : 'LEVEL UP';
    this.levelUpEl.querySelector('.octo-levelup-num').textContent = ev.to;
    this.levelUpEl.querySelector('.octo-levelup-rank').textContent = ar ? ev.rank.ar : ev.rank.en;
    var un = this.levelUpEl.querySelector('.octo-levelup-unlock');
    if (ev.unlocked && ev.unlocked.length) {
      un.innerHTML = ev.unlocked.map(function (a) {
        return '<span>' + (ar ? '؟ فُتحت: ' : 'Unlocked: ') + (ar ? a.ar : a.en) + '</span>';
      }).join('');
      un.classList.remove('hidden');
    } else {
      un.innerHTML = '';
      un.classList.add('hidden');
    }
    this.levelUpEl.classList.remove('hidden');
    // restart the CSS animation
    this.levelUpEl.classList.remove('play');
    void this.levelUpEl.offsetWidth;
    this.levelUpEl.classList.add('play');
    this._levelUpUntil = this.game.time + 3.4;
  };

  Ui.prototype.syncToasts = function () {
    var g = this.game;
    var html = '';
    for (var i = 0; i < g.toasts.length; i++) {
      var t = g.toasts[i];
      var op = clamp(t.life / 0.6, 0, 1) * clamp(t.t / 0.2, 0, 1);
      html += '<div class="octo-toast octo-toast-' + t.kind + '" style="opacity:' + op.toFixed(2) + '">' + t.text + '</div>';
    }
    this.toastEl.innerHTML = html;
  };

  Ui.prototype.updateBetaStats = function () {
    var g = this.game;
    if (!this.betaStats) return;
    var p = g.player;
    var r = g.renderer.stats;
    this.betaStats.innerHTML =
      '<span>FPS <b>' + Math.round(g.fps) + '</b></span>' +
      '<span>draws <b>' + r.draws + '</b></span>' +
      '<span>tris <b>' + (r.tris / 1000).toFixed(1) + 'k</b></span>' +
      '<span>culled <b>' + r.culled + '</b></span>' +
      '<span>state <b>' + p.state + '</b></span>' +
      '<span>pos <b>' + p.pos.x.toFixed(1) + ', ' + p.pos.y.toFixed(1) + ', ' + p.pos.z.toFixed(1) + '</b></span>' +
      '<span>tilt <b>' + p.tilt.toFixed(2) + '</b></span>' +
      '<span>ropes <b>' + g.ropes.length + '</b></span>' +
      '<span>lights <b>' + g.renderer.numLights + '</b></span>' +
      '<span>parts <b>' + g.particles.length + '</b></span>' +
      '<span>hour <b>' + g.hour.toFixed(1) + '</b></span>';
  };

  OCTO.Ui = Ui;
  OCTO.STRINGS = STR;

})(typeof window !== 'undefined' ? window : globalThis);
