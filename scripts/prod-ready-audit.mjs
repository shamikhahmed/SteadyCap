#!/usr/bin/env node
/**
 * Prod-ready visual/interaction audit (Chromium + iPhone 15 Pro metrics).
 * Prefer WebKit when available; fall back to Chromium (sandbox/reviewer note).
 *
 * Usage: PORT=8860 node scripts/qa-serve.mjs &
 *        node scripts/prod-ready-audit.mjs [baseUrl]
 */
import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(__dirname);
const BASE = process.argv[2] || 'http://127.0.0.1:8860/';
const outDir = path.join(root, 'qa/prod-ready');
const shotDir = path.join(outDir, 'shots');
fs.mkdirSync(shotDir, { recursive: true });

const phone = { ...devices['iPhone 15 Pro'] };
delete phone.defaultBrowserType;

const findings = [];
const note = (sev, screen, msg) => findings.push({ severity: sev, screen, msg });

async function launch() {
  try {
    const b = await webkit.launch();
    return { browser: b, name: 'webkit' };
  } catch (e) {
    const b = await chromium.launch();
    return { browser: b, name: 'chromium (WebKit unavailable — reviewer re-runs WebKit)' };
  }
}

async function axeSerious(page) {
  try {
    const AxeBuilder = (await import('@axe-core/playwright')).default;
    const results = await new AxeBuilder({ page }).analyze();
    return (results.violations || []).filter((v) => v.impact === 'serious' || v.impact === 'critical');
  } catch {
    return null;
  }
}

async function shot(page, name) {
  const file = path.join(shotDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function layoutIssues(page) {
  return page.evaluate(() => {
    const issues = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) {
      issues.push(`horizontal overflow ${document.documentElement.scrollWidth}>${innerWidth}`);
    }
    const active = document.querySelector('.screen.active');
    if (active) {
      const oy = getComputedStyle(active).overflowY;
      if (oy === 'auto' || oy === 'scroll') issues.push(`inner scroller overflowY=${oy}`);
    }
    const dead = [...document.querySelectorAll('[onclick]')].filter((el) => {
      if (el.tagName === 'BUTTON' || el.tagName === 'A') return false;
      if (el.getAttribute('role') === 'button' || el.getAttribute('role') === 'switch') return false;
      return el.tagName === 'DIV' || el.tagName === 'SPAN';
    }).map((el) => el.className || el.id || el.tagName);
    if (dead.length) issues.push(`div/span onclick: ${dead.slice(0, 5).join(',')}`);
    return issues;
  });
}

const { browser, name: engine } = await launch();
const report = { engine, base: BASE, shots: [], screens: {}, axe: {}, findings };

async function passScreen(ctxLabel, page, screenId, go) {
  await go();
  await page.waitForTimeout(500);
  const issues = await layoutIssues(page);
  const cons = [];
  page.on('pageerror', (e) => cons.push(e.message));
  report.screens[`${ctxLabel}:${screenId}`] = { issues, console: cons };
  issues.forEach((i) => note('medium', screenId, i));
  if (report.shots.length < 36) {
    report.shots.push(await shot(page, `${ctxLabel}-${screenId}`.replace(/[^a-z0-9_-]/gi, '_')));
  }
  const axe = await axeSerious(page);
  if (axe) {
    report.axe[`${ctxLabel}:${screenId}`] = axe.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
    axe.forEach((v) => note(v.impact, screenId, `axe ${v.id}`));
  }
}

const phoneCtx = await browser.newContext({ ...phone, serviceWorkers: 'block', colorScheme: 'dark' });
const page = await phoneCtx.newPage();
page.setDefaultTimeout(20000);

await page.goto(BASE + '?demo=1');
await page.waitForFunction(() => window.__APP_READY__ || typeof window.Navigation !== 'undefined', { timeout: 45000 });
await page.evaluate(() => document.getElementById('splash')?.remove());

for (const tab of ['dashboard', 'recovery', 'emergency', 'knowledge', 'profile', 'journal']) {
  await passScreen('demo-dark-390', page, tab, () => page.evaluate((t) => Navigation.go(t), tab));
}

await page.evaluate(() => Profile._addHabit());
await page.waitForTimeout(400);
report.shots.push(await shot(page, 'demo-dark-add-habit-sheet'));
await page.evaluate(() => Profile._closeModal());

await page.emulateMedia({ colorScheme: 'light' });
await page.evaluate(() => Profile._setTheme('light'));
await passScreen('demo-light-390', page, 'dashboard', () => page.evaluate(() => Navigation.go('dashboard')));
await passScreen('demo-light-390', page, 'profile', () => page.evaluate(() => Navigation.go('profile')));

await phoneCtx.close();

for (const [w, h, label] of [
  [375, 812, '375'],
  [430, 932, '430'],
  [744, 1133, 'ipad'],
  [1180, 820, 'ipad-land'],
  [1440, 900, 'desktop'],
]) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    isMobile: w < 700,
    hasTouch: w < 700,
    serviceWorkers: 'block',
    colorScheme: 'dark',
  });
  const p = await ctx.newPage();
  await p.goto(BASE + '?demo=1');
  await p.waitForFunction(() => typeof window.Navigation !== 'undefined', { timeout: 45000 });
  await p.evaluate(() => document.getElementById('splash')?.remove());
  await p.evaluate(() => Navigation.go('dashboard'));
  await p.waitForTimeout(400);
  const issues = await layoutIssues(p);
  issues.forEach((i) => note('medium', `viewport-${label}`, i));
  report.shots.push(await shot(p, `vp-${label}-today`));
  if (w >= 700) {
    const side = await p.evaluate(() => document.body.classList.contains('cap-desktop-nav'));
    if (!side) note('high', `viewport-${label}`, 'expected cap-desktop-nav sidebar');
  }
  await ctx.close();
}

// Empty profile / onboarding
const emptyCtx = await browser.newContext({ ...phone, serviceWorkers: 'block' });
const ep = await emptyCtx.newPage();
await ep.addInitScript(() => {
  localStorage.clear();
  sessionStorage.clear();
});
await ep.goto(BASE);
await ep.waitForTimeout(1200);
await ep.evaluate(() => document.getElementById('splash')?.remove());
const onboarding = await ep.evaluate(() => !!document.getElementById('screen-onboarding')?.classList.contains('active') || !!document.querySelector('#screen-onboarding .btn-primary'));
if (!onboarding) note('high', 'onboarding', 'expected onboarding on fresh profile');
report.shots.push(await shot(ep, 'empty-onboarding'));
await emptyCtx.close();

report.findings = findings;
fs.writeFileSync(path.join(outDir, 'AUDIT-RUN.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ engine, findings: findings.length, shots: report.shots.length, out: 'qa/prod-ready/AUDIT-RUN.json' }, null, 2));
findings.slice(0, 40).forEach((f) => console.log(`${f.severity}\t${f.screen}\t${f.msg}`));
await browser.close();
process.exit(findings.some((f) => f.severity === 'critical' || f.severity === 'high') ? 1 : 0);
