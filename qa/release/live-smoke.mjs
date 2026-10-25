#!/usr/bin/env node
/**
 * SteadyCap post-deploy live smoke (WebKit · iPhone 15 Pro only — no engine fallback).
 *
 *   node qa/release/live-smoke.mjs https://shamikhahmed.github.io/SteadyCap/
 *
 * Asserts: load + __APP_READY__, no console/pageerrors, no same-origin HTTP ≥400,
 * VERSION.json + in-app version === 2.7.0, core ios-check steps (tab bar, document
 * scroll, sheet lock/restore, swipe-at-top does not reload).
 */
import { webkit, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const EXPECT_VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'VERSION.json'), 'utf8')).version;

const rawUrl = process.argv[2];
if (!rawUrl) {
  console.error('Usage: node qa/release/live-smoke.mjs <url>');
  process.exit(2);
}

function cacheBust(href) {
  const u = new URL(href);
  u.searchParams.set('smoke', String(Date.now()));
  return u.href;
}

function versionJsonUrl(liveUrl) {
  const u = new URL(liveUrl);
  const base = u.pathname.endsWith('/') ? u.pathname : `${u.pathname.replace(/\/?$/, '/')}`;
  u.pathname = `${base}VERSION.json`;
  u.search = '';
  u.hash = '';
  return u.href;
}

const rows = [];
const check = (name, ok, detail = '') => {
  rows.push({ name, ok: Boolean(ok), detail: detail || '' });
};

function printTable() {
  for (const r of rows) {
    const d = r.detail ? `  (${r.detail})` : '';
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${d}`);
  }
}

const liveUrl = new URL(rawUrl).href;
const smokeUrl = cacheBust(liveUrl);
const pageOrigin = new URL(liveUrl).origin;
const consoleErrors = [];
const pageErrors = [];
const httpSame = [];

let browser;
try {
  browser = await webkit.launch();
} catch (e) {
  console.error('FAIL: WebKit required (no fallback):', String(e.message || e).split('\n')[0]);
  process.exit(2);
}

const iphone = devices['iPhone 15 Pro'];
const { defaultBrowserType: _omit, ...device } = iphone;
const ctx = await browser.newContext({ ...device, serviceWorkers: 'allow' });
const page = await ctx.newPage();
page.setDefaultTimeout(30000);

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => {
  pageErrors.push(String(err.message || err));
});
page.on('response', (res) => {
  try {
    if (res.status() < 400) return;
    const u = res.url();
    if (new URL(u).origin === pageOrigin) httpSame.push({ status: res.status(), url: u });
  } catch {
    /* ignore */
  }
});

try {
  await page.goto(smokeUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () =>
      window.__APP_READY__ === true ||
      document.documentElement.dataset.appReady === 'true',
    null,
    { timeout: 60000 },
  );
  check('load + app-ready', true, '__APP_READY__');
} catch (e) {
  check('load + app-ready', false, String(e.message || e).split('\n')[0]);
}

check(
  'console errors',
  consoleErrors.length === 0,
  consoleErrors.length ? `${consoleErrors.length}: ${consoleErrors[0].slice(0, 100)}` : '0',
);
check(
  'pageerrors',
  pageErrors.length === 0,
  pageErrors.length ? `${pageErrors.length}: ${pageErrors[0].slice(0, 100)}` : '0',
);
check(
  'HTTP ≥400 same-origin',
  httpSame.length === 0,
  httpSame.length ? `${httpSame.length}: ${httpSame[0].status} ${httpSame[0].url}` : '0',
);

// Version: served VERSION.json + in-app
let jsonVer = null;
let jsonErr = null;
try {
  const res = await page.request.get(versionJsonUrl(liveUrl), { timeout: 15000 });
  if (res.ok()) {
    const body = await res.json();
    jsonVer = body?.version != null ? String(body.version) : null;
  } else jsonErr = `HTTP ${res.status()}`;
} catch (e) {
  jsonErr = String(e.message || e).split('\n')[0];
}
const pageVer = await page
  .evaluate(() => {
    const out = [];
    if (window.APP_VERSION) out.push(String(window.APP_VERSION));
    for (const el of document.querySelectorAll('[data-version]')) {
      const v = el.getAttribute('data-version');
      if (v) out.push(v);
    }
    return [...new Set(out)];
  })
  .catch(() => []);

const versionOk = jsonVer === EXPECT_VERSION && pageVer.includes(EXPECT_VERSION);
check(
  `VERSION === ${EXPECT_VERSION}`,
  versionOk,
  `json=${jsonVer ?? jsonErr ?? 'n/a'} page=[${pageVer.join(', ')}]`,
);

// Demo mode for interactive checks (tabs / sheets)
try {
  const demoUrl = new URL(liveUrl);
  demoUrl.searchParams.set('demo', '1');
  demoUrl.searchParams.set('smoke', String(Date.now()));
  await page.goto(demoUrl.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () =>
      typeof window.Navigation !== 'undefined' &&
      typeof window.Profile !== 'undefined' &&
      (window.__APP_READY__ === true || document.documentElement.dataset.appReady === 'true'),
    null,
    { timeout: 60000 },
  );
  await page.evaluate(() => document.getElementById('splash')?.remove());
  await page.waitForTimeout(800);
  check('demo boot', true);
} catch (e) {
  check('demo boot', false, String(e.message || e).split('\n')[0]);
}

await page.evaluate(() => {
  window.__smokeNoReload = 1;
});

// Tab bar tappable
try {
  const covered = await page.evaluate(() =>
    [...document.querySelectorAll('#nav .nav-tab')]
      .filter((t) => t.offsetParent !== null)
      .filter((t) => {
        const r = t.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !t.contains(hit);
      })
      .map((t) => t.getAttribute('aria-label') || t.textContent.trim()),
  );
  check('tab bar tappable', covered.length === 0, covered.join(',') || 'ok');
} catch (e) {
  check('tab bar tappable', false, String(e.message || e).split('\n')[0]);
}

// Document scrolls
try {
  await page.evaluate(() => Navigation.go('dashboard'));
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const se = document.scrollingElement || document.documentElement;
    return {
      sw: document.documentElement.scrollWidth,
      iw: innerWidth,
      docScroll: se.scrollHeight > innerHeight,
      inner: getComputedStyle(document.querySelector('.screen.active')).overflowY,
    };
  });
  check('no sideways overflow', m.sw <= m.iw + 1, `${m.sw} vs ${m.iw}`);
  check(
    'document scrolls',
    m.docScroll && m.inner === 'visible',
    JSON.stringify(m),
  );
} catch (e) {
  check('document scrolls', false, String(e.message || e).split('\n')[0]);
}

// Sheet lock / restore
try {
  await page.evaluate(() => Navigation.go('profile'));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(200);
  const before = await page.evaluate(() => scrollY);
  await page.evaluate(() => Profile._addHabit());
  await page.locator('#profile-modal .sheet-bar__cancel').waitFor({ timeout: 8000 });
  await page.waitForTimeout(300);
  const locked = await page.evaluate(() => document.body.style.position);
  await page.locator('#profile-modal .sheet-bar__cancel').tap();
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => scrollY);
  check('sheet locks page', locked === 'fixed', `position=${locked}`);
  check('sheet restores scroll', Math.abs(after - before) < 4, `before ${before} after ${after}`);
} catch (e) {
  check('sheet lock/restore', false, String(e.message || e).split('\n')[0]);
}

// Swipe at top does not reload
try {
  await page.evaluate(() => {
    window.__smokeNoReload = 1;
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(200);
  const touched = await page.evaluate(async () => {
    let makeTouch;
    try {
      makeTouch = (y) =>
        new Touch({ identifier: 1, target: document.body, clientX: 200, clientY: y });
      makeTouch(0);
    } catch {
      return false;
    }
    const fire = (type, y) => {
      document.body.dispatchEvent(
        new TouchEvent(type, {
          bubbles: true,
          cancelable: true,
          touches: type === 'touchend' ? [] : [makeTouch(y)],
          changedTouches: [makeTouch(y)],
        }),
      );
    };
    fire('touchstart', 80);
    for (let y = 100; y <= 380; y += 20) fire('touchmove', y);
    fire('touchend', 380);
    await new Promise((r) => setTimeout(r, 600));
    return true;
  });
  if (!touched) {
    await page.mouse.move(200, 80);
    await page.mouse.down();
    await page.mouse.move(200, 380, { steps: 16 });
    await page.mouse.up();
    await page.waitForTimeout(600);
  }
  const marker = await page.evaluate(() => window.__smokeNoReload);
  check(
    'swipe top: no reload',
    marker === 1,
    marker === 1 ? (touched ? 'touch' : 'mouse-drag') : `marker=${marker}`,
  );
} catch (e) {
  check('swipe top: no reload', false, String(e.message || e).split('\n')[0]);
}

await browser.close().catch(() => {});

printTable();
const passed = rows.every((r) => r.ok);
const outPath = path.join(ROOT, 'qa/release/logs', 'live-smoke.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      url: liveUrl,
      smokeUrl,
      expectVersion: EXPECT_VERSION,
      jsonVer,
      pageVer,
      consoleErrors,
      pageErrors,
      httpSame,
      checks: rows,
      passed,
      at: new Date().toISOString(),
    },
    null,
    2,
  ) + '\n',
);
console.log(`\nWrote ${outPath}`);
process.exit(passed ? 0 : 1);
