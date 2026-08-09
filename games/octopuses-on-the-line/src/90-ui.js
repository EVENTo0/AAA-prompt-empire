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
      '<div class="octo-mission"></div>' +
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
      ? [['hero', this.t('hero')], ['jobs', this.t('jobs')], ['shop', this.t('shop')], ['map', this.t('map')], ['controls', this.t('controls')], ['settings', this.t('settings')]]
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
    if (tab === 'hero') this.renderHero(body);
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
    var self = this, g = this.game;
    var wrap = el('div', 'octo-map-wrap');
    var cv = el('canvas', 'octo-map-canvas');
    cv.width = 620; cv.height = 620;
    wrap.appendChild(cv);
    body.appendChild(wrap);
    this.drawMap(cv.getContext('2d'), cv.width, cv.height, true);

    var legend = el('div', 'octo-legend');
    var D = g.world.districts;
    Object.keys(D).forEach(function (k) {
      var d = D[k];
      var item = el('button', 'octo-legend-item');
      item.innerHTML = '<i style="background:' + d.color + '"></i>' + (self.lang === 'ar' ? d.ar : d.en);
      item.addEventListener('click', function () {
        g.teleportTo(k);
        self.game.audio && self.game.audio.play('ui');
        self.closePanel();
        g.toast((self.lang === 'ar' ? 'انتقلت إلى ' : 'Travelled to ') + (self.lang === 'ar' ? d.ar : d.en), 'info');
      });
      legend.appendChild(item);
    });
    body.appendChild(legend);
    body.appendChild(el('p', 'octo-note', this.t('fastTravel') + ' — ' + (this.lang === 'ar'
      ? 'انقر على اسم الحي للانتقال إليه مباشرة لاختبار الخريطة.'
      : 'Click a district to jump straight there and test the map.')));
  };

  /** Top-down map. Shared by the big map screen and the HUD minimap. */
  Ui.prototype.drawMap = function (ctx, w, h, full) {
    var g = this.game;
    var span = full ? 560 : 190;                 // world metres across the view
    var cxw = full ? 0 : g.player.pos.x;
    var czw = full ? -30 : g.player.pos.z;
    var scale = w / span;

    function px(x) { return (x - cxw) * scale + w / 2; }
    function pz(z) { return (z - czw) * scale + h / 2; }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = full ? 'rgba(24,18,12,0.96)' : 'rgba(20,16,12,0.62)';
    ctx.fillRect(0, 0, w, h);

    // sand tone
    ctx.fillStyle = 'rgba(120,96,62,0.35)';
    ctx.fillRect(px(-OCTO.MAP_EXTENT), pz(-OCTO.MAP_EXTENT), OCTO.MAP_EXTENT * 2 * scale, OCTO.MAP_EXTENT * 2 * scale);

    // districts
    var D = g.world.districts;
    Object.keys(D).forEach(function (k) {
      var d = D[k];
      var r = (k === 'souq' ? 92 : k === 'towers' ? 110 : k === 'oasis' ? 70 : 60) * scale;
      var grd = ctx.createRadialGradient(px(d.center.x), pz(d.center.z), 0, px(d.center.x), pz(d.center.z), r);
      grd.addColorStop(0, d.color + (full ? '55' : '44'));
      grd.addColorStop(1, d.color + '00');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(px(d.center.x), pz(d.center.z), r, 0, Math.PI * 2);
      ctx.fill();
    });

    // buildings as footprints
    ctx.fillStyle = 'rgba(226,206,170,0.55)';
    var boxes = g.world.physics.boxes;
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (b.tag !== 'building' && b.tag !== 'tower' && b.tag !== 'mosque' && b.tag !== 'minaret' && b.tag !== 'platform') continue;
      var bw = b.hx * 2 * scale, bd = b.hz * 2 * scale;
      if (bw < 1.2 && bd < 1.2) continue;
      ctx.fillStyle = b.tag === 'tower' ? 'rgba(180,150,235,0.6)'
        : b.tag === 'platform' ? 'rgba(120,210,230,0.55)'
        : 'rgba(226,206,170,0.5)';
      ctx.fillRect(px(b.x) - bw / 2, pz(b.z) - bd / 2, bw, bd);
    }

    // ropes
    ctx.strokeStyle = 'rgba(255,238,190,0.42)';
    ctx.lineWidth = full ? 1.1 : 0.9;
    ctx.beginPath();
    for (var r2 = 0; r2 < g.ropes.length; r2++) {
      var rope = g.ropes[r2];
      ctx.moveTo(px(rope.a.x), pz(rope.a.z));
      ctx.lineTo(px(rope.b.x), pz(rope.b.z));
    }
    ctx.stroke();

    // pearls
    ctx.fillStyle = 'rgba(190,235,255,0.9)';
    for (var p = 0; p < g.pearls.length; p++) {
      var pearl = g.pearls[p];
      if (pearl.taken) continue;
      ctx.beginPath();
      ctx.arc(px(pearl.x), pz(pearl.z), full ? 2.2 : 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // objective markers
    ctx.fillStyle = '#ffd24a';
    for (var m = 0; m < g.markers.length; m++) {
      var mk = g.markers[m];
      ctx.beginPath();
      ctx.arc(px(mk.x), pz(mk.z), full ? 5 : 3.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // player arrow
    var pxp = px(g.player.pos.x), pzp = pz(g.player.pos.z);
    ctx.save();
    ctx.translate(pxp, pzp);
    ctx.rotate(-g.player.visualYaw + Math.PI);
    ctx.fillStyle = '#ff6a8f';
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(5.5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5.5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (full) {
      // labels
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      var self = this;
      Object.keys(D).forEach(function (k) {
        var d = D[k];
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fillText(self.lang === 'ar' ? d.ar : d.en, px(d.center.x), pz(d.center.z) - 6);
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.20)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px(-OCTO.MAP_EXTENT), pz(-OCTO.MAP_EXTENT), OCTO.MAP_EXTENT * 2 * scale, OCTO.MAP_EXTENT * 2 * scale);
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

    // hero plate + experience
    this.syncHero();

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
