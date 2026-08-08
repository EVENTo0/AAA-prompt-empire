#!/usr/bin/env node
/* =====================================================================
 * Headless verification driver.
 *
 *   node tools/verify.js smoke   -> engine smoke page, day + night shots
 *   node tools/verify.js game    -> boot the real game, drive input, shoot
 *
 * Requires playwright (globally installed in this environment):
 *   NODE_PATH=$(npm root -g) node tools/verify.js game
 * Screenshots land in tools/shots/.
 * ===================================================================== */
'use strict';

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'shots');
const GL_ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--disable-lcd-text'
];

function ensureShots() {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
}

function fileUrl(rel) {
  return 'file://' + path.join(ROOT, rel);
}

async function newPage(browser, log) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') log.console.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => log.errors.push(String(e && e.stack || e)));
  return page;
}

async function runSmoke(browser) {
  const log = { console: [], errors: [] };
  const page = await newPage(browser, log);
  await page.goto(fileUrl('tools/smoke.html'));
  await page.waitForFunction(() => window.SMOKE && window.SMOKE.ready, null, { timeout: 60000 });
  const info = await page.evaluate(() => ({ info: window.SMOKE.info, errors: window.SMOKE.errors }));
  if (info.errors && info.errors.length) {
    console.log('SMOKE ERRORS:\n' + info.errors.join('\n'));
    await page.close();
    return { ok: false, log, info };
  }
  const day = await page.evaluate(() => window.SMOKE.render('day'));
  await page.screenshot({ path: path.join(SHOTS, 'smoke-day.png') });
  const night = await page.evaluate(() => window.SMOKE.render('night'));
  await page.screenshot({ path: path.join(SHOTS, 'smoke-night.png') });
  await page.close();
  return { ok: day.err === 0 && night.err === 0, log, info, day, night };
}

async function runGame(browser, opts = {}) {
  const log = { console: [], errors: [] };
  const page = await newPage(browser, log);
  const url = fileUrl('index.html') + (opts.query || '?test=1');
  await page.goto(url);
  await page.waitForFunction(() => window.GAME && window.GAME.booted, null, { timeout: 120000 });
  const boot = await page.evaluate(() => window.GAME.report());
  console.log('BOOT REPORT: ' + JSON.stringify(boot, null, 2));

  const shots = [];
  async function shot(name, fn) {
    if (fn) await fn();
    await page.evaluate((n) => window.GAME.stepFrames(n), opts.settle || 45);
    const p = path.join(SHOTS, name + '.png');
    await page.screenshot({ path: p });
    shots.push(name);
  }

  await shot('game-01-spawn');
  await shot('game-02-souq', () => page.evaluate(() => window.GAME.teleport('souq')));
  await shot('game-03-oasis', () => page.evaluate(() => window.GAME.teleport('oasis')));
  await shot('game-04-line', () => page.evaluate(() => window.GAME.teleport('line')));
  await shot('game-05-harbour', () => page.evaluate(() => window.GAME.teleport('harbour')));
  await shot('game-06-towers', () => page.evaluate(() => window.GAME.teleport('towers')));
  await shot('game-07-night', () => page.evaluate(() => window.GAME.setTime(21.5)));
  await shot('game-08-map', () => page.evaluate(() => window.GAME.openMap()));

  const final = await page.evaluate(() => window.GAME.report());
  const selfTest = await page.evaluate(() => window.GAME.selfTest());
  await page.close();
  return { ok: log.errors.length === 0 && selfTest.failed === 0, log, boot, final, selfTest, shots };
}

(async () => {
  ensureShots();
  const mode = process.argv[2] || 'smoke';
  const browser = await chromium.launch({ args: GL_ARGS });
  let result;
  try {
    if (mode === 'smoke') result = await runSmoke(browser);
    else result = await runGame(browser);
  } finally {
    await browser.close();
  }
  if (result.log.errors.length) console.log('PAGE ERRORS:\n' + result.log.errors.join('\n'));
  if (result.log.console.length) console.log('CONSOLE:\n' + result.log.console.slice(0, 40).join('\n'));
  if (result.info) console.log('INFO: ' + JSON.stringify(result.info));
  if (result.selfTest) console.log('SELF TEST: ' + JSON.stringify(result.selfTest, null, 2));
  if (result.final) console.log('FINAL: ' + JSON.stringify(result.final, null, 2));
  console.log(result.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
  process.exit(result.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
