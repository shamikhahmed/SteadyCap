#!/usr/bin/env node
/**
 * iPhone/WebKit behaviour check (Cap fleet mobile bugs), adapted from ScentCap scripts/ios-behaviour-check.mjs.
 * Usage: npm run serve  →  node scripts/ios-behaviour-check.mjs [baseUrl]   (default http://127.0.0.1:8768/)
 * Checks: tab bar + header tappable, no sideways overflow, the document (not an inner box) scrolls,
 * navigation opens at top without reloading, sheets keep the page position, inputs ≥16px, SW doesn't self-activate.
 */
import { webkit, devices } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:8768/';
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });
const step = async (name, fn) => {
  try {
    await fn();
  } catch (e) {
    check(name, false, String(e.message || e).split('\n')[0]);
  }
};

const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 15 Pro'], serviceWorkers: 'block' });
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
await page.goto(BASE + '?demo=1');
await page.waitForFunction(() => typeof window.Navigation !== 'undefined' && typeof window.Profile !== 'undefined' && typeof window.Emergency !== 'undefined', { timeout: 45000 });
await page.evaluate(() => document.getElementById('splash')?.remove());
await page.waitForTimeout(1200);
await page.evaluate(() => { window.__noReload = 1; });

// 1. Tabs + top-bar controls are the topmost element at their centre, ≥44pt
const covered = await page.evaluate(() =>
  [...document.querySelectorAll('#nav .nav-tab, #screen-dashboard .today-simple button')]
    .filter((t) => t.offsetParent !== null)
    .filter((t) => {
      const r = t.getBoundingClientRect();
      const bar = document.querySelector('#nav')?.getBoundingClientRect();
      // Only controls on screen above the floating bar (the rest scroll into view first)
      if (t.closest('#nav') === null && (r.bottom > (bar ? bar.top : innerHeight) || r.top < 0)) return false;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !t.contains(hit);
    })
    .map((t) => t.getAttribute('aria-label') || t.textContent.trim()),
);
check('tab bar + top bar tappable', covered.length === 0, covered.join(','));
const small = await page.evaluate(() =>
  [...document.querySelectorAll('#nav .nav-tab, #screen-dashboard .today-simple button')]
    .filter((t) => t.offsetParent !== null)
    .filter((t) => { const r = t.getBoundingClientRect(); return r.width < 44 || r.height < 34; })
    .map((t) => t.getAttribute('aria-label') || t.textContent.trim()),
);
check('hit areas (tabs ≥44pt, pills ≥34pt + slop)', small.length === 0, small.join(','));

// 2. The document scrolls; no sideways overflow
for (const tab of ['dashboard', 'recovery', 'knowledge', 'profile']) {
  await page.evaluate((t) => Navigation.go(t), tab);
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: innerWidth,
    docScroll: document.scrollingElement.scrollHeight > innerHeight,
    inner: getComputedStyle(document.querySelector('.screen.active')).overflowY,
  }));
  check(`no sideways overflow · ${tab}`, m.sw <= m.iw + 1, `${m.sw} > ${m.iw}`);
  check(`document scrolls (no inner scroller) · ${tab}`, m.docScroll && m.inner === 'visible', JSON.stringify(m));
}

// 3. Tab tap: new screen at top, no reload
await step('navigation by tapping', async () => {
  await page.evaluate(() => Navigation.go('dashboard'));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(200);
  await page.locator('#nav .nav-tab[data-tab="recovery"]').tap();
  await page.waitForTimeout(700);
  const nav = await page.evaluate(() => ({ y: scrollY, tab: document.querySelector('.screen.active')?.id, marker: window.__noReload }));
  check('tab tap navigates (no reload)', nav.tab === 'screen-recovery' && nav.marker === 1, JSON.stringify(nav));
  check('new screen opens at top', nav.y === 0, `scrollY ${nav.y}`);
});

// 4. Sheet keeps the page position (You → Add a habit → Cancel)
let smallInputs = 0;
await step('sheet flow', async () => {
  await page.evaluate(() => Navigation.go('profile'));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => scrollY);
  await page.evaluate(() => Profile._addHabit());
  await page.locator('#profile-modal .sheet-bar__cancel').waitFor();
  await page.waitForTimeout(300);
  const locked = await page.evaluate(() => document.body.style.position);
  await page.locator('#profile-modal .sheet-bar__cancel').tap();
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => scrollY);
  check('page locked behind sheet', locked === 'fixed', `body position "${locked}"`);
  check('sheet keeps scroll position', Math.abs(after - before) < 4, `before ${before} after ${after}`);
  smallInputs = await page.evaluate(() =>
    [...document.querySelectorAll('#screen-profile input, #screen-profile select, #screen-profile textarea, #daily-checkin-wrap textarea')]
      .filter((el) => el.offsetParent !== null && parseFloat(getComputedStyle(el).fontSize) < 16).length,
  );
});
check('inputs ≥16px (no zoom-on-focus)', smallInputs === 0, `${smallInputs} small`);

// 5. Mood tile on Today is tappable
await step('check-in tap', async () => {
  await page.evaluate(() => Navigation.go('dashboard'));
  await page.waitForTimeout(600);
  await page.locator('#daily-checkin-wrap .mood-btn[data-mood="ok"]').tap();
  const on = await page.evaluate(() => document.querySelector('#daily-checkin-wrap .mood-btn[data-mood="ok"]').classList.contains('selected'));
  check('mood tile tap selects', on);
});
check('no reload during session', (await page.evaluate(() => window.__noReload)) === 1);

// 6. Service worker never self-activates over a running app
const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
check('SW: no auto skipWaiting/clients.claim', !/^\s*self\.skipWaiting\(\);|clients\.claim\(\)/m.test(sw));

await browser.close();
let fail = 0;
for (const r of results) {
  if (!r.ok) fail++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok || !r.detail ? '' : `  (${r.detail})`}`);
}
process.exit(fail ? 1 : 0);
