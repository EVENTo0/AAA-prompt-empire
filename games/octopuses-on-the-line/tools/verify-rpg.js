/* =====================================================================
 * verify-rpg.js — the progression layer, exercised in a real browser.
 *
 * The arithmetic in 58-progress.js is easy to unit test and would tell
 * us almost nothing. What matters is whether experience actually flows
 * from the things the player does, whether crossing a rank changes what
 * the world lets them reach, and whether the UI shows any of it. So this
 * runs the real game and pokes the real systems.
 *
 *   node tools/verify-rpg.js            headless, writes shots
 *   node tools/verify-rpg.js --shots    same, and keeps the screenshots
 * ===================================================================== */
'use strict';

const path = require('path');
const fs = require('fs');
const { chromium, devices } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PAGE = 'file://' + path.join(ROOT, 'index.html');
const SHOTS = path.join(ROOT, 'tools', 'shots');

const results = [];
function record(suite, name, ok, detail) {
  results.push({ suite, name, ok: !!ok, detail: detail === undefined ? '' : String(detail) });
  console.log((ok ? '  ok  ' : ' FAIL ') + suite + ' · ' + name + (ok ? '' : '  — ' + detail));
}

/** Boot into play with a clean save and a known discipline. */
async function enterPlay(page, classId) {
  await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(PAGE + '?test=1');
  await page.waitForFunction(() => window.GAME && window.GAME.booted, null, { timeout: 300000 });
  await page.evaluate((cid) => {
    const g = window.GAME.game, ui = window.GAME.ui;
    g.save.seenIntro = true;
    g.save.classId = cid;
    ui.selectedClass = cid;
    ui.select.classList.add('hidden');
    g.player.applyClass(cid);
    ui.startGame();
    g.paused = false;
  }, classId || 'muqatil');
  await page.evaluate(() => window.GAME.stepFrames(10));
}

async function run() {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

  /* ------------------------------------------------------ curve + gates */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await enterPlay(page);

    const curve = await page.evaluate(() => {
      const P = window.OCTO.progress;
      return {
        max: P.MAX_LEVEL,
        l1: P.xpForLevel(1),
        l10: P.xpForLevel(10),
        l30: P.xpForLevel(30),
        monotonic: (() => {
          for (let i = 1; i < P.MAX_LEVEL - 1; i++) if (P.xpForLevel(i + 1) <= P.xpForLevel(i)) return false;
          return true;
        })(),
        capped: P.xpForLevel(P.MAX_LEVEL) === Infinity,
        anchors: P.ANCHORS.length,
        ranks: P.RANKS.length
      };
    });
    record('curve', 'level cap is 60', curve.max === 60, curve.max);
    record('curve', 'cost rises every level', curve.monotonic, 'l1=' + curve.l1 + ' l10=' + curve.l10 + ' l30=' + curve.l30);
    record('curve', 'max level ends the curve', curve.capped, curve.capped);
    record('curve', 'eight anchors defined', curve.anchors === 8, curve.anchors);
    record('curve', 'nine ranks defined', curve.ranks === 9, curve.ranks);

    // awarding: does the bar move, and does a level actually land?
    const award = await page.evaluate(() => {
      const g = window.GAME.game;
      // the opening frames already pay a district discovery, so zero the
      // hero first — this probe is about the award path, not the boot
      g.hero.level = 1; g.hero.xp = 0; g.hero.totalXp = 0;
      const before = { lv: g.hero.level, xp: g.hero.xp };
      g.awardXp(80, 'probe');
      const mid = { lv: g.hero.level, xp: g.hero.xp, flash: !!g.xpFlash };
      g.awardXp(5000, 'probe');
      return { before, mid, after: { lv: g.hero.level, rank: g.hero.rank().en }, event: !!g.levelUpEvent };
    });
    record('award', 'small award banks xp without a level', award.mid.lv === 1 && award.mid.xp === 80, JSON.stringify(award.mid));
    record('award', 'award raises a flash for the bar', award.mid.flash, award.mid.flash);
    record('award', 'large award crosses several levels', award.after.lv > 5, award.after.lv);
    record('award', 'crossing a rank renames the hero', award.after.rank !== 'Rope Novice', award.after.rank);
    record('award', 'level-up raises an event for the UI', award.event, award.event);

    // the gate: a sealed anchor refuses travel, an open one moves the player
    const gate = await page.evaluate(() => {
      const g = window.GAME.game;
      g.hero.level = 1;
      const sealed = g.travelToAnchor('titan');           // needs 52
      const posA = { x: g.player.pos.x, z: g.player.pos.z };
      const open = g.travelToAnchor('souq');              // needs 1
      const posB = { x: g.player.pos.x, z: g.player.pos.z };
      g.hero.level = 60;
      const nowOpen = g.travelToAnchor('titan');
      const posC = { x: g.player.pos.x, z: g.player.pos.z };
      const moved = Math.hypot(posC.x - posB.x, posC.z - posB.z);
      return { sealed, open, nowOpen, moved, sameAfterSealed: Math.hypot(posA.x - posB.x, posA.z - posB.z) };
    });
    record('gate', 'sealed anchor refuses travel', gate.sealed === false, gate.sealed);
    record('gate', 'open anchor accepts travel', gate.open === true, gate.open);
    record('gate', 'rank 60 opens the titan anchor', gate.nowOpen === true, gate.nowOpen);
    record('gate', 'travelling actually moves the player', gate.moved > 50, gate.moved.toFixed(1));

    // anchors exist in the world as real geometry with real colliders
    const world = await page.evaluate(() => {
      const g = window.GAME.game;
      const posts = g.world.anchorPosts || [];
      return {
        count: posts.length,
        haveMesh: posts.every((p) => !!p.mesh && !!p.shard),
        lights: g.world.lights.filter((l) => l.kind === 'anchor').length
      };
    });
    record('world', 'an anchor post is built for every anchor', world.count === 8, world.count);

    // A post standing in open sand is invisible content. Each Anchor must
    // resolve to a real tie-off site inside the district it claims — this
    // is the check that catches a coordinate guessed against a procedural
    // layout, which is exactly how the first pass went wrong.
    const placed = await page.evaluate(() => {
      const g = window.GAME.game;
      return window.OCTO.progress.ANCHORS.map((a) => {
        const d = g.world.districts[a.district];
        const dist = Math.hypot(a.at[0] - d.center.x, a.at[2] - d.center.z);
        return {
          id: a.id, district: a.district, dist: Math.round(dist),
          site: !!g.world.anchors[a.site],
          onGround: Math.abs(a.at[1] - g.world.groundHeight(a.at[0], a.at[2])) < 0.5,
          // A post buried inside a market stall is content nobody can see.
          // The post's own collider is in this box by definition, so only
          // anything else counts as an obstruction.
          clear: g.world.physics.query(
            a.at[0] - 2.0, a.at[1] + 0.5, a.at[2] - 2.0,
            a.at[0] + 2.0, a.at[1] + 6.5, a.at[2] + 2.0
          ).filter((b) => b.tag !== 'anchor').length === 0
        };
      });
    });
    const noSite = placed.filter((p) => !p.site);
    record('world', 'every anchor names a real tie-off site', noSite.length === 0,
      noSite.map((p) => p.id).join(', '));
    // the far gate sits outside the mapped districts by design, so it is
    // measured against its own landmark rather than a district centre
    const strays = placed.filter((p) => p.id !== 'titan' && p.dist > 130);
    record('world', 'no anchor is stranded in open sand', strays.length === 0,
      strays.map((p) => p.id + ' ' + p.dist + 'm').join(', '));
    const buried = placed.filter((p) => !p.clear);
    record('world', 'no anchor is buried inside geometry', buried.length === 0,
      buried.map((p) => p.id).join(', '));
    const grounded = placed.filter((p) => p.onGround).length;
    record('world', 'elevated anchors are not sunk to the terrain', grounded < 8,
      grounded + '/8 on the ground');
    record('world', 'each post has stone and a shard mesh', world.haveMesh, world.haveMesh);
    record('world', 'each post carries a light', world.lights === 8, world.lights);

    // pickups pay experience
    const pickup = await page.evaluate(() => {
      const g = window.GAME.game;
      g.hero.level = 1; g.hero.xp = 0; g.hero.totalXp = 0;
      // stand on the nearest untaken pearl
      const pearl = g.pearls.find((p) => !p.taken);
      g.player.teleport(pearl.x, pearl.y, pearl.z);
      g._updatePearls(0.016);
      return { xp: g.hero.totalXp, taken: pearl.taken };
    });
    record('pickup', 'a pearl pays experience', pickup.taken && pickup.xp >= 22, JSON.stringify(pickup));

    // crossing a rope is the repeatable reward, and it has to be earned
    const crossing = await page.evaluate(() => {
      const g = window.GAME.game, p = g.player;
      const rope = g.ropes.find((r) => r.kind === 'rope') || g.ropes[0];
      function walk(from, to) {
        g.hero.level = 1; g.hero.xp = 0; g.hero.totalXp = 0;
        p.attachLine(rope, { t: from, tangent: { x: 1, y: 0, z: 0 } });
        p.lineT = to;
        p.detachLine();
        return g.hero.totalXp;
      }
      return { full: walk(0.02, 0.96), partial: walk(0.40, 0.60) };
    });
    record('crossing', 'walking a full span pays', crossing.full > 0, crossing.full);
    record('crossing', 'falling off mid-span pays nothing', crossing.partial === 0, crossing.partial);

    // districts are discoveries
    const discover = await page.evaluate(() => {
      const g = window.GAME.game;
      g.hero.discovered.length = 0;
      g._lastDistrict = null;
      const before = g.hero.totalXp;
      g.noteDistrict('harbour');
      const first = g.hero.totalXp - before;
      g._lastDistrict = null;
      g.noteDistrict('harbour');
      const second = g.hero.totalXp - before - first;
      return { first, second };
    });
    record('discover', 'first entry into a district pays', discover.first === 60, discover.first);
    record('discover', 'a second entry pays nothing', discover.second === 0, discover.second);

    // the save round-trips
    const save = await page.evaluate(() => {
      const g = window.GAME.game;
      g.hero.level = 12; g.hero.xp = 44; g.hero.totalXp = 9000;
      g.hero.visited = ['souq', 'oasis'];
      // persist() is a deliberate no-op under deterministic test mode
      const det = g.deterministic;
      g.deterministic = false;
      g.persist();
      g.deterministic = det;
      const raw = JSON.parse(localStorage.getItem('octopuses-on-the-line:v1') || '{}');
      const back = new window.OCTO.progress.Progress(raw.hero);
      return { level: back.level, xp: back.xp, visited: back.visited.length };
    });
    record('save', 'progression survives a save/load round trip',
      save.level === 12 && save.xp === 44 && save.visited === 2, JSON.stringify(save));

    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.waitForTimeout(500);
    record('curve', 'no page errors', errors.length === 0, errors[0] || '');
    await page.close();
  }

  /* ---------------------------------------------------------- the UI */
  {
    const page = await browser.newPage({ ...devices['Pixel 5'] });
    await enterPlay(page);

    const hud = await page.evaluate(() => {
      const ui = window.GAME.ui;
      const g = window.GAME.game;
      g.hero.level = 1; g.hero.xp = 0; g.hero.totalXp = 0;
      g.awardXp(60, 'probe');
      ui.syncHero();
      return {
        level: document.querySelector('.octo-hero-lvn').textContent,
        rank: document.querySelector('.octo-hero-rank').textContent,
        barWidth: document.querySelector('.octo-xp-fill').style.width,
        text: document.querySelector('.octo-xp-text').textContent.trim(),
        flash: document.querySelector('.octo-xp-flash').textContent
      };
    });
    record('hud', 'hero plate shows the level', hud.level === '1', hud.level);
    record('hud', 'hero plate shows the rank title', hud.rank.length > 0, hud.rank);
    record('hud', 'xp bar reads the current level', /\d+ \/ \d+/.test(hud.text), hud.text);
    record('hud', 'xp flash shows the award', hud.flash.indexOf('+60') === 0, hud.flash);

    // level-up banner
    await page.evaluate(() => {
      const g = window.GAME.game;
      const ui = window.GAME.ui;
      g.hero.level = 4; g.hero.xp = 0;
      g.awardXp(4000, 'probe');
      ui.syncHero();
    });
    const banner = await page.evaluate(() => {
      const b = document.querySelector('.octo-levelup');
      return {
        visible: !b.classList.contains('hidden'),
        num: b.querySelector('.octo-levelup-num').textContent,
        rank: b.querySelector('.octo-levelup-rank').textContent,
        unlocks: b.querySelectorAll('.octo-levelup-unlock span').length
      };
    });
    record('hud', 'level-up banner appears', banner.visible, banner.visible);
    record('hud', 'banner names the new level', Number(banner.num) > 4, banner.num);
    record('hud', 'banner names unlocked anchors', banner.unlocks > 0, banner.unlocks);
    await page.screenshot({ path: path.join(SHOTS, 'rpg-levelup.png') });

    // character sheet
    await page.evaluate(() => window.GAME.ui.openPanel('hero'));
    await page.waitForTimeout(200);
    const sheet = await page.evaluate(() => ({
      rows: document.querySelectorAll('.octo-anchor').length,
      open: document.querySelectorAll('.octo-anchor.open').length,
      locked: document.querySelectorAll('.octo-anchor.locked').length,
      travel: document.querySelectorAll('.octo-anchor button').length,
      pips: document.querySelectorAll('.octo-pips i.on').length
    }));
    record('sheet', 'sheet lists every anchor', sheet.rows === 8, sheet.rows);
    record('sheet', 'open and sealed anchors are both shown', sheet.open > 0 && sheet.locked > 0,
      sheet.open + ' open / ' + sheet.locked + ' locked');
    record('sheet', 'open anchors offer travel', sheet.travel === sheet.open, sheet.travel);
    record('sheet', 'discipline pips render', sheet.pips > 0, sheet.pips);
    await page.screenshot({ path: path.join(SHOTS, 'rpg-sheet.png') });

    // and the sheet is reachable by thumb from the HUD
    const tappable = await page.evaluate(() => {
      const ui = window.GAME.ui;
      ui.closePanel();
      const el = document.querySelector('.octo-hero');
      const r = el.getBoundingClientRect();
      el.click();
      return { tab: ui.tab, w: Math.round(r.width), h: Math.round(r.height) };
    });
    record('sheet', 'tapping the hero plate opens the sheet', tappable.tab === 'hero', tappable.tab);
    record('sheet', 'hero plate is a thumb-sized target', tappable.h >= 44, tappable.h + 'px tall');

    /* ------------------------------------------------ quest hand-off */
    const dialog = await page.evaluate(() => {
      const g = window.GAME.game, ui = window.GAME.ui;
      const m = g.missionById('lanterns');
      m.state = 'available';
      g.interact({ kind: 'merchant', mission: m, obj: { talk: 0 } });
      const box = document.querySelector('.octo-dialog');
      // "not hidden" is not the same as "on screen" — a class check would
      // have missed the scene rendering underneath the pause panel, so ask
      // the document what is actually painted at the box's centre.
      const r = box.querySelector('.octo-dialog-box').getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return {
        open: !box.classList.contains('hidden'),
        onTop: !!(hit && box.contains(hit)),
        panelClosed: document.querySelector('.octo-panel').classList.contains('hidden'),
        name: box.querySelector('.octo-dialog-name').textContent,
        text: box.querySelector('.octo-dialog-text').textContent.length,
        pay: box.querySelector('.octo-dialog-pay').textContent,
        yes: box.querySelector('.octo-dialog-yes').textContent,
        started: m.state
      };
    });
    record('dialog', 'talking to a trader opens a scene, not a toast', dialog.open, dialog.open);
    record('dialog', 'the scene is the topmost thing on screen', dialog.onTop, dialog.onTop);
    record('dialog', 'opening a scene closes any open menu', dialog.panelClosed, dialog.panelClosed);
    record('dialog', 'the speaker is named', dialog.name.length > 3, dialog.name);
    record('dialog', 'the trader says why the job exists', dialog.text > 60, dialog.text + ' chars');
    record('dialog', 'the reward shows coin and experience',
      /\d+/.test(dialog.pay) && dialog.pay.indexOf('XP') > 0, dialog.pay);
    record('dialog', 'accepting is a choice, not automatic', dialog.started === 'available', dialog.started);
    await page.screenshot({ path: path.join(SHOTS, 'rpg-dialog.png') });

    const accepted = await page.evaluate(() => {
      const g = window.GAME.game, ui = window.GAME.ui;
      ui.answerDialog(true);
      return { state: g.missionById('lanterns').state, closed: ui.dialog.classList.contains('hidden') };
    });
    record('dialog', 'accepting starts the mission', accepted.state === 'active', accepted.state);
    record('dialog', 'the scene closes on an answer', accepted.closed, accepted.closed);

    const declined = await page.evaluate(() => {
      const g = window.GAME.game, ui = window.GAME.ui;
      const m = g.missionById('drones');
      m.state = 'available';
      ui.openDialog(m);
      ui.answerDialog(false);
      return m.state;
    });
    record('dialog', 'declining leaves the job on the board', declined === 'available', declined);

    /* ------------------------------------------- front of the game */
    const fe = await page.evaluate(() => {
      const ui = window.GAME.ui;
      ui.showSplash();
      const sp = document.querySelector('.octo-splash');
      const splashOn = !sp.classList.contains('hidden');
      ui.setProgress(0.4, 'probe');
      const barMid = document.querySelector('.octo-splash-foot .octo-bar-fill').style.width;
      ui.skipSplash();
      return {
        splashOn,
        barMid,
        splashOff: sp.classList.contains('hidden'),
        loadingOn: !document.querySelector('.octo-loading').classList.contains('hidden'),
        screen: ui.screen,
        keyartPx: document.querySelector('.octo-keyart').width,
        tip: document.querySelector('.octo-load-tip').textContent.length
      };
    });
    record('front', 'boot opens on the splash', fe.splashOn, fe.splashOn);
    record('front', 'the splash carries the build progress', fe.barMid === '40%', fe.barMid);
    record('front', 'skip crosses to the key-art loader',
      fe.splashOff && fe.loadingOn && fe.screen === 'loading', fe.screen);
    record('front', 'key art is generated, not blank', fe.keyartPx >= 640, fe.keyartPx + 'px wide');
    record('front', 'the loader shows a tip', fe.tip > 20, fe.tip + ' chars');

    const title = await page.evaluate(() => {
      const ui = window.GAME.ui;
      ui.showTitle();
      const rail = document.querySelector('.octo-rail');
      const pill = document.querySelector('.octo-slotpill');
      const pr = pill.getBoundingClientRect();
      const rr = rail.getBoundingClientRect();
      return {
        railOn: !rail.classList.contains('hidden'),
        buttons: rail.querySelectorAll('.octo-rail-btn').length,
        stamp: rail.querySelector('.octo-stamp').textContent.indexOf('app.') === 0,
        // the pill must not run underneath the service rail
        clearOfRail: pr.right <= rr.left + 1,
        pillH: Math.round(pr.height),
        agree: document.querySelector('.octo-agree-text').textContent.length
      };
    });
    record('front', 'the title shows the service rail', title.railOn && title.buttons === 5, title.buttons);
    record('front', 'the rail carries a version stamp', title.stamp, title.stamp);
    record('front', 'the enter pill clears the rail', title.clearOfRail, title.clearOfRail);
    record('front', 'the enter pill is a thumb target', title.pillH >= 44, title.pillH + 'px');
    record('front', 'the agreement line is present', title.agree > 20, title.agree + ' chars');

    const notice = await page.evaluate(() => {
      const ui = window.GAME.ui;
      ui.openNotice('fairplay');
      const f = document.querySelector('.octo-notice-frame');
      const r = f.getBoundingClientRect();
      const tabs = document.querySelectorAll('.octo-notice-tab').length;
      ui.openNotice('build');
      const switched = document.querySelector('.octo-notice-h').textContent;
      ui.closeNotice();
      return {
        tabs, switched,
        // max-height must actually bind, or the panel runs off the screen
        fits: r.height <= window.innerHeight + 1,
        closed: document.querySelector('.octo-notice').classList.contains('hidden')
      };
    });
    record('front', 'the announcement has tabbed notices', notice.tabs === 3, notice.tabs);
    record('front', 'switching tab changes the page', notice.switched.length > 3, notice.switched);
    record('front', 'the announcement fits on screen', notice.fits, notice.fits);
    record('front', 'the announcement closes', notice.closed, notice.closed);

    const sel = await page.evaluate(() => {
      const ui = window.GAME.ui;
      ui.showSelect();
      window.GAME.stepFrames(30);
      const cards = document.querySelectorAll('.octo-class-card');
      const faces = document.querySelectorAll('.octo-class-face');
      let painted = 0;
      faces.forEach((c) => {
        const d = c.getContext('2d').getImageData(48, 48, 1, 1).data;
        if (d[3] > 0 && (d[0] + d[1] + d[2]) > 30) painted++;
      });
      const row = document.querySelector('.octo-class-row').getBoundingClientRect();
      return {
        cards: cards.length,
        painted,
        active: document.querySelectorAll('.octo-class-card.active').length,
        name: document.querySelector('.octo-sel-name').textContent,
        tagline: document.querySelector('.octo-sel-tagline, .octo-select-tagline').textContent.length,
        onRight: row.left > window.innerWidth * 0.45,
        cardH: Math.round(cards[0].getBoundingClientRect().height)
      };
    });
    record('select', 'five discipline cards', sel.cards === 5, sel.cards);
    record('select', 'every card has a drawn portrait', sel.painted === 5, sel.painted + '/5');
    record('select', 'exactly one card is active', sel.active === 1, sel.active);
    record('select', 'the heading names the discipline', sel.name.length > 2, sel.name);
    record('select', 'the tagline describes the discipline', sel.tagline > 10, sel.tagline + ' chars');
    record('select', 'the roster sits on the right edge', sel.onRight, sel.onRight);
    record('select', 'cards are thumb-sized', sel.cardH >= 44, sel.cardH + 'px');

    // the avatar must not end up behind the roster
    const framing = await page.evaluate(() => {
      const g = window.GAME.game;
      const c = g.camera, p = g.player.pos;
      // project the avatar's chest into screen space the way the renderer does
      const dx = p.x - c.pos.x, dy = (p.y + 1.0) - c.pos.y, dz = p.z - c.pos.z;
      const yaw = Math.atan2(c.target.x - c.pos.x, c.target.z - c.pos.z);
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      const fwd = dx * fx + dz * fz;
      const right = dx * fz - dz * fx;
      return { fwd: +fwd.toFixed(2), lateral: +(right / Math.max(fwd, 0.001)).toFixed(3) };
    });
    record('select', 'the avatar is in front of the camera', framing.fwd > 1, framing.fwd);
    record('select', 'the avatar is offset clear of the roster',
      Math.abs(framing.lateral) > 0.05, framing.lateral);

    /* ------------------------------------------------ control + map */

    // Left/right was inverted against the camera basis: the stick said
    // right and the character went left, while forward/back behaved. The
    // check dots real movement against row 0 of the live view matrix.
    const dirs = await page.evaluate(() => {
      const g = window.GAME.game, inp = window.GAME.input, r = window.GAME.renderer;
      // the front-of-game probes above left the page on the select screen,
      // where the camera orbits and the player is parked
      const ui = window.GAME.ui;
      ui.select.classList.add('hidden');
      g.selecting = false;
      g.camera.free = false;
      ui.startGame();
      g.paused = false;
      const a = g.world.anchors.plaza;
      function trial(mx, my) {
        g.player.teleport(a.x, a.y + 1.0, a.z);
        g.player.lineCooldown = 999;
        g.player.vel.x = g.player.vel.y = g.player.vel.z = 0;
        g.camera.yaw = 0.9;
        for (let k = 0; k < 8; k++) { g.camera.yaw = 0.9; window.GAME.stepFrames(1); }
        const cam = { x: g.camera.pos.x, y: g.camera.pos.y, z: g.camera.pos.z };
        const tgt = { x: g.camera.target.x, y: g.camera.target.y, z: g.camera.target.z };
        const p0 = { x: g.player.pos.x, z: g.player.pos.z };
        inp.touch.active = true; inp.touch.move.x = mx; inp.touch.move.y = my;
        for (let i = 0; i < 40; i++) {
          // yaw must be pinned every frame: the player reads camera.yaw
          // directly, and a yaw still damping toward its target rotates
          // the movement basis under the measurement
          g.camera.yaw = 0.9;
          g.camera.pos.x = cam.x; g.camera.pos.y = cam.y; g.camera.pos.z = cam.z;
          g.camera.target.x = tgt.x; g.camera.target.y = tgt.y; g.camera.target.z = tgt.z;
          window.GAME.stepFrames(1);
        }
        inp.touch.move.x = 0; inp.touch.move.y = 0;
        const d = { x: g.player.pos.x - p0.x, z: g.player.pos.z - p0.z };
        const m = r.view;
        return {
          right: +(d.x * m[0] + d.z * m[8]).toFixed(2),
          fwd: +(d.x * -m[2] + d.z * -m[10]).toFixed(2)
        };
      }
      return { R: trial(1, 0), L: trial(-1, 0), U: trial(0, 1), D: trial(0, -1) };
    });
    record('control', 'stick right moves the character right', dirs.R.right > 1, dirs.R.right);
    record('control', 'stick left moves the character left', dirs.L.right < -1, dirs.L.right);
    record('control', 'stick up moves the character forward', dirs.U.fwd > 1, dirs.U.fwd);
    record('control', 'stick down moves the character back', dirs.D.fwd < -1, dirs.D.fwd);

    // The touch look-overlay used to sit on top of the HUD and swallow
    // every tap aimed at the minimap, so none of the tappable HUD widgets
    // had ever worked on a phone. Ask the document what is actually on top.
    const tapTop = await page.evaluate(() => {
      const ui = window.GAME.ui;
      ui.closePanel();
      window.GAME.forceTouchControls();
      function topAt(sel) {
        const r = document.querySelector(sel).getBoundingClientRect();
        const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return el ? el.className : null;
      }
      return {
        touchMode: document.getElementById('octo-root').classList.contains('octo-touch-mode'),
        minimap: topAt('.octo-minimap'),
        hero: topAt('.octo-hero'),
        mission: topAt('.octo-mission')
      };
    });
    record('control', 'touch mode is on', tapTop.touchMode, tapTop.touchMode);
    record('control', 'the minimap is tappable, not covered',
      String(tapTop.minimap).indexOf('octo-minimap') >= 0, tapTop.minimap);
    record('control', 'the hero plate is tappable', String(tapTop.hero).indexOf('octo-hero') >= 0, tapTop.hero);
    record('control', 'the quest tracker is tappable',
      String(tapTop.mission).indexOf('octo-mission') >= 0, tapTop.mission);

    const opened = await page.evaluate(() => {
      const m = document.querySelector('.octo-minimap');
      const r = m.getBoundingClientRect();
      document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2).click();
      return { screen: window.GAME.ui.screen, tab: window.GAME.ui.tab };
    });
    record('control', 'tapping the minimap opens the map',
      opened.screen === 'panel' && opened.tab === 'map', opened.screen + '/' + opened.tab);

    // Region labels used to be drawn at each district centre, which put the
    // souq and the line quarter on top of each other. They now sit on
    // leader lines; assert no two label anchors collide.
    const labels = await page.evaluate(() => {
      const g = window.GAME.game;
      window.GAME.ui.openPanel('map');            // the canvas only exists here
      const cv = document.querySelector('.octo-map-canvas');
      const pts = [];
      const D = g.world.districts;
      const scale = cv.width / 620;
      const R = { souq: [86, 0, 1], oasis: [68, -1, 0], line: [52, -0.9, -1], harbour: [66, 1, 0], towers: [104, 0, -1] };
      Object.keys(D).forEach((k) => {
        const d = D[k], reg = R[k];
        const cx = d.center.x * scale + cv.width / 2;
        const cz = (d.center.z + 30) * scale + cv.height / 2;
        pts.push({ k, x: cx + reg[1] * (reg[0] * scale + 22), y: cz + reg[2] * (reg[0] * scale + 22) });
      });
      let worst = 1e9, pair = '';
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dd = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (dd < worst) { worst = dd; pair = pts[i].k + '/' + pts[j].k; }
        }
      }
      return { worst: Math.round(worst), pair, hits: (window.GAME.ui.mapHits || []).length };
    });
    record('map', 'no two region labels collide', labels.worst > 70, labels.worst + 'px apart (' + labels.pair + ')');
    record('map', 'anchors are hit-testable on the map', labels.hits === 8, labels.hits);

    const travel = await page.evaluate(() => {
      const g = window.GAME.game;
      g.hero.level = 1;
      const before = { x: g.player.pos.x, z: g.player.pos.z };
      const hits = window.GAME.ui.mapHits;
      const sealed = hits.find((h) => !h.open);
      const open = hits.find((h) => h.open);
      return { sealedExists: !!sealed, openExists: !!open, before };
    });
    record('map', 'the map shows both open and sealed anchors',
      travel.sealedExists && travel.openExists, JSON.stringify(travel));

    await page.close();
  }

  await browser.close();

  /* --------------------------------------------------------- summary */
  const suites = {};
  results.forEach((r) => {
    suites[r.suite] = suites[r.suite] || { pass: 0, total: 0 };
    suites[r.suite].total++;
    if (r.ok) suites[r.suite].pass++;
  });
  console.log('\n==========================================================');
  Object.keys(suites).forEach((s) => {
    console.log('  ' + s.padEnd(10) + suites[s].pass + '/' + suites[s].total);
  });
  const pass = results.filter((r) => r.ok).length;
  console.log('  ' + 'TOTAL'.padEnd(10) + pass + '/' + results.length);
  console.log('==========================================================\n');
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log('FAILURES:');
    failed.forEach((r) => console.log('  · ' + r.suite + ' · ' + r.name + '  — ' + r.detail));
  }
  console.log(failed.length ? 'RESULT: FAIL' : 'RESULT: PASS');
  process.exit(failed.length ? 1 : 0);
}

if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
run().catch((e) => { console.error(e); process.exit(1); });
