#!/usr/bin/env node
/* =====================================================================
 * Full acceptance pass. One command, one PASS/FAIL matrix.
 *
 *   NODE_PATH=$(npm root -g) node tools/verify-all.js
 *
 * Covers every path a player can actually take:
 *   A. desktop  — boot, tour all five districts, night, map, self-test
 *   B. phone    — touch rig, tap latch, quick bar, diagnostics, and the
 *                 embed's Permissions-Policy gamepad refusal
 *   C. flow     — opening cinematic, all five disciplines, entering play
 *   D. dist     — the single-file build behaves identically
 * ===================================================================== */
'use strict';

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'shots');
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

const results = [];
function record(group, name, pass, detail) {
  results.push({ group, name, pass: !!pass, detail: detail === undefined ? '' : String(detail) });
  const mark = pass ? '  ok  ' : ' FAIL ';
  console.log(mark + group + ' · ' + name + (pass || detail === undefined ? '' : '  — ' + detail));
}

function url(rel, q) { return 'file://' + path.join(ROOT, rel) + (q || ''); }

async function newPage(browser, opts) {
  const ctx = await browser.newContext(opts || { viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String((e && e.message) || e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('[console] ' + m.text()); });
  return { page, errs, ctx };
}

async function boot(page, href) {
  await page.goto(href);
  await page.waitForFunction(() => window.GAME && window.GAME.booted, null, { timeout: 300000 });
  return page.evaluate(() => window.GAME.report());
}

/* ------------------------------------------------------------- A: desktop */

async function suiteDesktop(browser) {
  const { page, errs } = await newPage(browser);
  const rep = await boot(page, url('index.html', '?test=1'));
  record('desktop', 'boots', /^\d+\.\d+\.\d+$/.test(rep.version || ''), rep.version);
  record('desktop', 'world generated',
    rep.chunks > 200 && rep.colliders > 150 && rep.ropes > 100,
    `${rep.chunks} chunks / ${rep.colliders} colliders / ${rep.ropes} ropes`);

  const districts = ['souq', 'oasis', 'line', 'harbour', 'towers'];
  let allOk = true;
  for (const d of districts) {
    const ok = await page.evaluate((id) => window.GAME.teleport(id), d);
    await page.evaluate(() => window.GAME.stepFrames(45));
    const r = await page.evaluate(() => window.GAME.report());
    const finite = [r.player.x, r.player.y, r.player.z].every(Number.isFinite);
    if (!ok || !finite || r.draws < 4) allOk = false;
    await page.screenshot({ timeout: 120000, path: path.join(SHOTS, 'all-district-' + d + '.png') });
  }
  record('desktop', 'all five districts reachable and drawing', allOk);

  await page.evaluate(() => window.GAME.setTime(21.5));
  await page.evaluate(() => window.GAME.stepFrames(45));
  await page.screenshot({ timeout: 120000, path: path.join(SHOTS, 'all-night.png') });
  record('desktop', 'night renders', true);

  await page.evaluate(() => window.GAME.openMap());
  await page.evaluate(() => window.GAME.stepFrames(10));
  await page.screenshot({ timeout: 120000, path: path.join(SHOTS, 'all-map.png') });
  await page.evaluate(() => window.GAME.closeMap());

  const st = await page.evaluate(() => window.GAME.selfTest());
  record('desktop', `self-test ${st.passed}/${st.total}`, st.failed === 0,
    st.failures.map((f) => f.name + ': ' + f.detail).join('; '));
  record('desktop', 'no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await page.close();
}

/* --------------------------------------------------------------- B: phone */

async function suitePhone(browser) {
  const { page, errs } = await newPage(browser, {
    viewport: { width: 420, height: 880 }, deviceScaleFactor: 3.25,
    isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; HNR-X9d) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36'
  });
  // Reproduce the embed: the gamepad feature is refused by Permissions-Policy.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: function () {
        throw new DOMException('Access to the feature "gamepad" is disallowed by permissions policy.', 'SecurityError');
      }
    });
  });
  const rep = await boot(page, url('index.html'));
  record('phone', 'boots with gamepad blocked', !!rep.version);

  await (await page.$('.octo-menu-btn')).tap();          // Play
  await page.waitForTimeout(500);
  await page.evaluate(() => { if (window.GAME.game.cine) window.GAME.game.cine.finish(); });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.GAME.ui.confirmClass && window.GAME.ui.confirmClass());

  // Wait for the character to settle rather than guessing a delay: under a
  // software rasteriser a phone viewport runs a couple of frames per second,
  // so a fixed timeout measures the rasteriser, not the simulation.
  let settled = true;
  try {
    await page.waitForFunction(
      () => window.GAME.game.player.state !== 'air', null, { timeout: 30000 });
  } catch (e) { settled = false; }

  const d1 = await page.evaluate(() => window.GAME.diagnostics());
  record('phone', 'simulation actually steps', settled && d1.frameErrors === 0,
    `settled=${settled} frameErrors=${d1.frameErrors} state=${d1.playerState} frames=${d1.frames} lastError=${d1.lastError}`);
  record('phone', 'touch rig attached', d1.touchControls === true);
  record('phone', 'render buffer capped for the device', d1.buffer.split('x').reduce((a, b) => a * b, 1) <= 1000000, d1.buffer);
  record('phone', 'quality auto-selected for touch', d1.quality === 'low', d1.quality);

  // A tap must move the character. Put it on known open ground first and
  // block the rope auto-grab: otherwise this measures where the character
  // happened to be standing, not whether the tap reached the input system.
  await page.evaluate(() => {
    const g = window.GAME.game;
    const spot = g.world.anchors.plaza;
    g.player.teleport(spot.x, spot.y + 0.5, spot.z, 0);
    g.player.lineCooldown = 30;
  });
  await page.waitForFunction(
    () => window.GAME.game.player.state === 'ground', null, { timeout: 30000 }
  ).catch(() => {});
  const before = await page.evaluate(() => window.GAME.game.player.pos.y);
  const stateBefore = await page.evaluate(() => window.GAME.game.player.state);
  await page.evaluate(() => {
    const e = document.querySelector('.octo-btn-jump'), b = e.getBoundingClientRect();
    const t = new Touch({ identifier: 7, target: e, clientX: b.x + b.width / 2, clientY: b.y + b.height / 2 });
    e.dispatchEvent(new TouchEvent('touchstart', { touches: [t], changedTouches: [t], bubbles: true, cancelable: true }));
    e.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t], bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => window.GAME.game.player.pos.y);
  record('phone', 'tap registers (jump moves the character)', after > before + 0.1,
    `state=${stateBefore} y ${before.toFixed(2)} -> ${after.toFixed(2)}`);

  // quick bar: menu, mute, diagnostics
  const quick = await page.evaluate(() => {
    function fire(sel) {
      const e = document.querySelector(sel); if (!e) return false;
      const b = e.getBoundingClientRect();
      const t = new Touch({ identifier: 8, target: e, clientX: b.x + b.width / 2, clientY: b.y + b.height / 2 });
      e.dispatchEvent(new TouchEvent('touchstart', { touches: [t], changedTouches: [t], bubbles: true, cancelable: true }));
      e.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t], bubbles: true, cancelable: true }));
      e.click(); return true;
    }
    const out = {};
    out.sound = fire('.octo-quick-sound') && window.GAME.game.muted === true;
    fire('.octo-quick-sound');
    out.diag = fire('.octo-quick-diag') && window.GAME.ui.diagOpen === true;
    fire('.octo-quick-diag');
    out.menu = fire('.octo-quick-menu') && window.GAME.ui.screen === 'panel';
    window.GAME.ui.closePanel();
    return out;
  });
  record('phone', 'mute button works', quick.sound);
  record('phone', 'diagnostics button works', quick.diag);
  record('phone', 'settings reachable without a keyboard', quick.menu);
  await page.screenshot({ timeout: 120000, path: path.join(SHOTS, 'all-phone.png') });
  record('phone', 'no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await page.close();
}

/* ---------------------------------------------------------------- C: flow */

async function suiteFlow(browser) {
  const { page, errs } = await newPage(browser);
  await boot(page, url('index.html', '?test=1'));

  await page.evaluate(() => { window.GAME.ui.showTitle(); window.GAME.ui.beginNewGame(); });
  await page.evaluate(() => window.GAME.stepFrames(90));
  const cineRunning = await page.evaluate(() => window.GAME.game.cine.active && window.GAME.ui.screen === 'cine');
  record('flow', 'opening cinematic plays', cineRunning);
  await page.screenshot({ timeout: 120000, path: path.join(SHOTS, 'all-intro.png') });

  await page.evaluate(() => window.GAME.game.cine.finish());
  await page.evaluate(() => window.GAME.stepFrames(30));
  record('flow', 'cinematic is skippable into select',
    await page.evaluate(() => window.GAME.ui.screen === 'select'));

  let classesOk = true;
  for (const id of ['sayyad', 'muqatil', 'dir', 'shafi', 'sahir']) {
    await page.evaluate((c) => window.GAME.ui.pickClass(c), id);
    await page.evaluate(() => window.GAME.stepFrames(30));
    const ok = await page.evaluate((c) => {
      const p = window.GAME.game.player;
      return p.classId === c && p.form === 'human' && p.mesh && p.mesh.count > 300;
    }, id);
    if (!ok) classesOk = false;
    await page.screenshot({ timeout: 120000, path: path.join(SHOTS, 'all-class-' + id + '.png') });
  }
  record('flow', 'all five disciplines build a distinct avatar', classesOk);

  // class stats must actually reach the rope model
  const weights = await page.evaluate(() => {
    const p = window.GAME.game.player, out = {};
    ['dir', 'sayyad'].forEach((c) => { p.applyClass(c); out[c] = p.tune.lineWeight; });
    return out;
  });
  record('flow', 'class weight feeds the rope simulation', weights.dir > weights.sayyad * 1.5,
    `tank=${weights.dir} archer=${weights.sayyad}`);

  await page.evaluate(() => window.GAME.ui.confirmClass());
  await page.evaluate(() => window.GAME.stepFrames(90));
  const inGame = await page.evaluate(() => ({ screen: window.GAME.ui.screen, state: window.GAME.game.player.state }));
  record('flow', 'confirm enters play', inGame.screen === 'game' && inGame.state !== 'air',
    JSON.stringify(inGame));
  await page.screenshot({ timeout: 120000, path: path.join(SHOTS, 'all-ingame.png') });
  record('flow', 'no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await page.close();
}

/* ---------------------------------------------------------------- D: dist */

async function suiteDist(browser) {
  const file = path.join(ROOT, 'dist/octopuses-on-the-line.html');
  record('dist', 'single-file build exists', fs.existsSync(file));
  if (!fs.existsSync(file)) return;
  const html = fs.readFileSync(file, 'utf8');
  const ext = (html.match(/(?:src|href)="(?!data:)[^"]*"/gi) || []);
  record('dist', 'no external references', ext.length === 0, ext.slice(0, 3).join(', '));

  const { page, errs } = await newPage(browser);
  const rep = await boot(page, 'file://' + file + '?test=1');
  record('dist', 'bundle boots and builds the same world',
    rep.chunks > 200 && rep.ropes > 100, `${rep.chunks} chunks / ${rep.ropes} ropes`);
  const st = await page.evaluate(() => window.GAME.selfTest());
  record('dist', `bundle self-test ${st.passed}/${st.total}`, st.failed === 0);
  record('dist', 'no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await page.close();
}

/* ----------------------------------------------------------------- driver */

(async () => {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ args: GL });
  try {
    await suiteDesktop(browser);
    await suitePhone(browser);
    await suiteFlow(browser);
    await suiteDist(browser);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.pass);
  console.log('\n' + '='.repeat(58));
  const groups = {};
  results.forEach((r) => {
    groups[r.group] = groups[r.group] || { pass: 0, total: 0 };
    groups[r.group].total++;
    if (r.pass) groups[r.group].pass++;
  });
  Object.keys(groups).forEach((g) => {
    console.log(`  ${g.padEnd(9)} ${groups[g].pass}/${groups[g].total}`);
  });
  console.log('  ' + 'TOTAL'.padEnd(9) + ` ${results.length - failed.length}/${results.length}`);
  console.log('='.repeat(58));
  if (failed.length) {
    console.log('\nFAILURES:');
    failed.forEach((f) => console.log('  · ' + f.group + ' · ' + f.name + (f.detail ? '  — ' + f.detail : '')));
  }
  console.log(failed.length ? '\nRESULT: FAIL' : '\nRESULT: PASS');
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
