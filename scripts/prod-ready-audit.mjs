#!/usr/bin/env node
/**
 * Prod-ready visual/a11y/offline audit for SteadyCap.
 * Chromium + iPhone 15 Pro metrics (documents WebKit unavailability if so).
 * Usage: node scripts/prod-ready-audit.mjs [baseUrl]
 */
import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'qa', 'prod-ready');
const SHOTS = path.join(OUT, 'shots');
const BASE = (process.argv[2] || 'http://127.0.0.1:8860').replace(/\/?$/, '');
const MAX_SHOTS = 40;

let shotCount = 0;
const findings = [];
const shots = [];
const consoleErrors = [];
let engine = 'chromium';
let webkitNote = null;

function find(severity, screen, message, extra = {}) {
  findings.push({ severity, screen, message, ...extra, at: new Date().toISOString() });
}

async function tryAxe() {
  try {
    return (await import('@axe-core/playwright')).default;
  } catch {
    return null;
  }
}

async function launch() {
  const iphone = devices['iPhone 15 Pro'];
  try {
    const b = await webkit.launch();
    await b.close();
  } catch (e) {
    webkitNote = `WebKit unavailable: ${String(e.message || e).split('\n')[0]} — using Chromium + iPhone 15 Pro metrics`;
    console.error(webkitNote);
  }
  const { defaultBrowserType: _omit, ...metrics } = iphone;
  const browser = await chromium.launch();
  engine = 'chromium';
  return { browser, metrics };
}

async function shot(page, name) {
  if (shotCount >= MAX_SHOTS) return null;
  const file = `${String(shotCount + 1).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(SHOTS, file), fullPage: false });
  shotCount++;
  shots.push(file);
  return file;
}

async function waitReady(page) {
  await page.waitForFunction(
    () =>
      (window.__APP_READY__ === true || document.documentElement.dataset.appReady === 'true') &&
      typeof window.Navigation?.go === 'function',
    null,
    { timeout: 45000 },
  );
  await page.evaluate(() => document.getElementById('splash')?.remove());
  await page.waitForTimeout(400);
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem('steadycap-theme', t);
    } catch (_) {}
    if (typeof Profile?._setTheme === 'function') Profile._setTheme(t);
  }, theme);
  await page.waitForTimeout(200);
}

async function auditScreen(page, AxeBuilder, screenId, label) {
  const errorsBefore = consoleErrors.length;
  const metrics = await page.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const iw = window.innerWidth;
    const unnamed = [...document.querySelectorAll('button, a, [role="button"], input, select, textarea')]
      .filter((el) => el.offsetParent !== null)
      .filter((el) => {
        const name =
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          el.getAttribute('title') ||
          el.getAttribute('alt') ||
          (el.labels && el.labels[0] && el.labels[0].textContent) ||
          el.textContent ||
          el.getAttribute('placeholder') ||
          el.getAttribute('value') ||
          '';
        return !String(name).trim();
      })
      .map((el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}`)
      .slice(0, 12);
    // Dead onclick div/span without role=button (exclude full-screen backdrop dismiss overlays)
    const deadDivs = [...document.querySelectorAll('div[onclick], span[onclick]')]
      .filter((el) => el.offsetParent !== null)
      .filter((el) => el.getAttribute('role') !== 'button' && el.getAttribute('role') !== 'switch')
      .filter((el) => {
        const st = el.getAttribute('style') || '';
        if (/position:\s*fixed/i.test(st) && /inset:\s*0/i.test(st)) return false; // backdrop
        return true;
      })
      .map((el) => ({
        class: String(el.className || '').split(/\s+/).slice(0, 3).join('.'),
        onclick: (el.getAttribute('onclick') || '').slice(0, 80),
      }))
      .slice(0, 20);
    return { sw, iw, overflow: sw > iw + 1, unnamed, deadDivs };
  });

  if (metrics.overflow) find('high', label, `Horizontal overflow ${metrics.sw} > ${metrics.iw}`, { sw: metrics.sw, iw: metrics.iw });
  for (const u of metrics.unnamed) find('medium', label, `Unnamed interactive control: ${u}`);
  for (const d of metrics.deadDivs) find('medium', label, `onclick div/span without role=button: .${d.class || '(no-class)'} → ${d.onclick}`);

  for (const e of consoleErrors.slice(errorsBefore).filter((x) => !/serviceWorker|ResizeObserver|favicon/i.test(x))) {
    find('high', label, `Console error: ${e}`);
  }

  let axeSerious = [];
  if (AxeBuilder) {
    try {
      const axe = await new AxeBuilder({ page }).analyze();
      axeSerious = (axe.violations || []).filter((v) => v.impact === 'serious' || v.impact === 'critical');
      for (const v of axeSerious) {
        find(v.impact === 'critical' ? 'critical' : 'high', label, `axe ${v.impact}: ${v.id} — ${v.help}`, {
          nodes: (v.nodes || []).slice(0, 3).map((n) => n.target),
        });
      }
    } catch (e) {
      find('low', label, `axe failed: ${String(e.message || e).split('\n')[0]}`);
    }
  }
  return { screenId, label, overflow: metrics.overflow, unnamed: metrics.unnamed.length, deadDivs: metrics.deadDivs.length, axeSerious: axeSerious.length };
}

fs.mkdirSync(SHOTS, { recursive: true });
for (const f of fs.readdirSync(SHOTS)) {
  if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS, f));
}

const AxeBuilder = await tryAxe();
const { browser, metrics: iphoneMetrics } = await launch();
const screenAudits = [];
const offlineResult = { ok: false, detail: '' };

{
  const ctx = await browser.newContext({
    ...iphoneMetrics,
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    serviceWorkers: 'allow',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto(BASE + '/?demo=1', { waitUntil: 'domcontentloaded' });
  await waitReady(page);

  const phoneVps = [
    { w: 375, h: 812, name: '375x812' },
    { w: 390, h: 844, name: '390x844' },
    { w: 430, h: 932, name: '430x932' },
  ];
  const screens = ['dashboard', 'recovery', 'emergency', 'knowledge', 'profile', 'journal'];

  for (const theme of ['light', 'dark']) {
    await setTheme(page, theme);
    for (const vp of phoneVps) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      const primary = vp.name === '390x844' ? screens : ['dashboard', 'emergency', 'knowledge'];
      for (const s of primary) {
        await page.evaluate((id) => Navigation.go(id), s);
        await page.waitForTimeout(500);
        if (vp.name === '390x844') screenAudits.push(await auditScreen(page, AxeBuilder, s, `${s}:${theme}:${vp.name}`));
        await shot(page, `${s}-${theme}-${vp.name}`);
      }
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await setTheme(page, 'light');
  await page.evaluate(() => Navigation.go('profile'));
  await page.waitForTimeout(400);
  await page.evaluate(() => Profile._addHabit());
  await page.waitForTimeout(500);
  screenAudits.push(await auditScreen(page, AxeBuilder, 'add-habit', 'sheet:_addHabit'));
  await shot(page, 'sheet-addHabit-light-390');
  await page.evaluate(() => Profile._closeModal?.());
  await page.waitForTimeout(300);
  await page.evaluate(() => Profile._addMed());
  await page.waitForTimeout(500);
  screenAudits.push(await auditScreen(page, AxeBuilder, 'add-med', 'sheet:_addMed'));
  await shot(page, 'sheet-addMed-light-390');
  await page.evaluate(() => Profile._closeModal?.());

  await page.evaluate(() => Navigation.go('emergency'));
  await page.waitForTimeout(500);
  await shot(page, 'sos-start-light-390');
  const skipAll = page.locator('.sos-header button', { hasText: 'Skip all' });
  if (await skipAll.count()) {
    await skipAll.click();
    await page.waitForTimeout(400);
    screenAudits.push(await auditScreen(page, AxeBuilder, 'sos-skip', 'sos:skip-all'));
    await shot(page, 'sos-after-skipAll-light-390');
  } else find('medium', 'sos:skip-all', 'Skip all button not found');

  await page.evaluate(() => Navigation.go('knowledge'));
  await page.waitForTimeout(600);
  const opened = await page.evaluate(() => {
    const card = document.querySelector('.article-card');
    if (!card) return false;
    const m = (card.getAttribute('onclick') || '').match(/_openArticle\('([^']+)'\)/);
    if (m && window.Knowledge?._openArticle) {
      Knowledge._openArticle(m[1]);
      return m[1];
    }
    card.click();
    return true;
  });
  await page.waitForTimeout(500);
  if (opened) {
    screenAudits.push(await auditScreen(page, AxeBuilder, 'article', 'knowledge:article'));
    await shot(page, 'article-open-light-390');
    await page.evaluate(() => Knowledge._closeArticle?.());
  } else find('low', 'knowledge:article', 'No article card to open');

  for (const vp of [
    { w: 744, h: 1133, name: '744x1133' },
    { w: 1180, h: 820, name: '1180x820' },
    { w: 1440, h: 900, name: '1440x900' },
  ]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await setTheme(page, 'light');
    for (const s of ['dashboard', 'emergency', 'profile']) {
      await page.evaluate((id) => Navigation.go(id), s);
      await page.waitForTimeout(450);
      screenAudits.push(await auditScreen(page, null, s, `${s}:light:${vp.name}`));
      await shot(page, `${s}-light-${vp.name}`);
    }
  }

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + '/?demo=1', { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    const swState = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { ok: false, detail: 'no SW API' };
      try {
        const reg = await navigator.serviceWorker.register('./sw.js');
        await navigator.serviceWorker.ready;
        return { ok: true, detail: `scope=${reg.scope}` };
      } catch (e) {
        return { ok: false, detail: String(e.message || e) };
      }
    });
    await page.context().setOffline(true);
    try {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(800);
      const bodyLen = await page.evaluate(() => document.body?.innerText?.length || 0);
      offlineResult.ok = bodyLen > 20;
      offlineResult.detail = `SW register: ${swState.detail}; offline reload bodyLen=${bodyLen}`;
      await shot(page, 'offline-reload-390');
      if (!offlineResult.ok) find('high', 'offline', offlineResult.detail);
    } catch (e) {
      offlineResult.ok = false;
      offlineResult.detail = `offline reload failed: ${String(e.message || e).split('\n')[0]} (SW: ${swState.detail})`;
      find('high', 'offline', offlineResult.detail);
    }
    await page.context().setOffline(false);
  } catch (e) {
    offlineResult.ok = false;
    offlineResult.detail = String(e.message || e);
    find('high', 'offline', offlineResult.detail);
  }
  await ctx.close();
}

{
  const ctx = await browser.newContext({
    ...iphoneMetrics,
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => consoleErrors.push(`[fresh] ${e.message}`));
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch (_) {}
  });
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('splash')?.remove());
  await page.waitForTimeout(800);
  screenAudits.push(await auditScreen(page, AxeBuilder, 'onboarding', 'onboarding:fresh'));
  await shot(page, 'onboarding-fresh-light-390');
  await setTheme(page, 'dark');
  await shot(page, 'onboarding-fresh-dark-390');
  await ctx.close();
}

await browser.close();

const seen = new Set();
const deduped = [];
for (const f of findings) {
  const key = `${f.severity}|${f.screen}|${f.message}`;
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(f);
}

const summary = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  engine,
  webkitNote,
  axeAvailable: Boolean(AxeBuilder),
  shotCount: shots.length,
  shots,
  offline: offlineResult,
  screenAudits,
  findings: deduped,
  counts: {
    critical: deduped.filter((f) => f.severity === 'critical').length,
    high: deduped.filter((f) => f.severity === 'high').length,
    medium: deduped.filter((f) => f.severity === 'medium').length,
    low: deduped.filter((f) => f.severity === 'low').length,
  },
};

fs.writeFileSync(path.join(OUT, 'AUDIT-RUN.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ engine, webkitNote, shots: shots.length, counts: summary.counts, offline: offlineResult }, null, 2));
console.log(`Wrote ${path.join(OUT, 'AUDIT-RUN.json')}`);
process.exit(0);
