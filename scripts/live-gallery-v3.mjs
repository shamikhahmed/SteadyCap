#!/usr/bin/env node
/** Live-URL gallery v3 — Today / Check-in / SOS × light/dark × devices. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GALLERY_DIR = join(ROOT, 'docs', 'screenshots', 'gallery');
const MANIFEST = join(GALLERY_DIR, 'gallery-manifest.json');
const BASE = process.env.GALLERY_BASE_URL || 'https://shamikhahmed.github.io/SteadyCap/?demo=1';
const ACCENT = '#FF8C42';
const CAPTURED_AT = new Date().toISOString();

const pwRoot =
  process.env.PW_CORE || join(ROOT, '..', 'MasteryCap', 'node_modules', 'playwright-core');
const { chromium } = createRequire(import.meta.url)(pwRoot);

const VIEWPORTS = {
  iphone: { width: 390, height: 844, deviceScaleFactor: 3 },
  ipad: { width: 1180, height: 820, deviceScaleFactor: 2 },
  mac: { width: 1440, height: 900, deviceScaleFactor: 2 },
};

const SCREENS = [
  { nav: 'dashboard', group: 'Today', screen: 'Today', caption: 'Due now, routines, and daily check-in (demo).' },
  { nav: 'journal', group: 'Check-in', screen: 'Check-in', caption: 'Mood check-in and journal history.' },
  { nav: 'emergency', group: 'SOS', screen: 'SOS', caption: 'Crisis SOS flow — centre tab, never weakened.' },
];

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function shotPath(theme, device, group, screen) {
  return `${theme}/${device}/${slug(group)}--${slug(screen)}--demo.webp`;
}

function pngToWebp(pngPath, webpPath) {
  mkdirSync(dirname(webpPath), { recursive: true });
  if (spawnSync('cwebp', ['-q', '82', pngPath, '-o', webpPath]).status === 0 && existsSync(webpPath)) {
    try {
      unlinkSync(pngPath);
    } catch {
      /* */
    }
    return;
  }
  spawnSync('cp', [pngPath, webpPath]);
}

function wipeLegacyGallery() {
  mkdirSync(GALLERY_DIR, { recursive: true });
  for (const f of readdirSync(GALLERY_DIR)) {
    if (/\.(png|webp)$/i.test(f)) unlinkSync(join(GALLERY_DIR, f));
  }
  for (const theme of ['light', 'dark']) {
    for (const device of ['iphone', 'ipad', 'mac']) {
      const sub = join(GALLERY_DIR, theme, device);
      if (!existsSync(sub)) continue;
      for (const f of readdirSync(sub)) {
        if (f.endsWith('.webp') || f.endsWith('.png')) unlinkSync(join(sub, f));
      }
    }
  }
}

async function setTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((t) => {
    const mode = t === 'light' ? 'light' : 'dark';
    try {
      localStorage.setItem('steadycap-theme', mode);
    } catch {
      /* */
    }
    document.documentElement.setAttribute('data-theme', mode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && window.SCBrand) {
      meta.setAttribute('content', mode === 'light' ? window.SCBrand.h_f4f0ea : window.SCBrand.h_1a1412);
    }
  }, theme);
  await page.waitForTimeout(200);
}

async function bootDemo(page) {
  await page.waitForFunction(
    () => typeof Navigation !== 'undefined' && window.__APP_READY__ === true,
    null,
    { timeout: 45000 },
  );
  await page.evaluate(() => {
    const banner = document.querySelector('.today-demo-banner');
    if (banner) banner.style.display = 'none';
  });
  await page.waitForTimeout(350);
}

async function goNav(page, navId) {
  await page.evaluate((id) => Navigation.go(id), navId);
  await page.waitForFunction(
    (id) => document.getElementById('screen-' + id)?.classList.contains('active'),
    navId,
    { timeout: 20000 },
  );
  await page.waitForTimeout(400);
}

async function main() {
  wipeLegacyGallery();
  const shots = [];
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [device, vp] of Object.entries(VIEWPORTS)) {
      for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: vp.deviceScaleFactor,
          colorScheme: theme,
          isMobile: device !== 'mac',
          hasTouch: device !== 'mac',
        });
        const page = await context.newPage();
        await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await bootDemo(page);
        await setTheme(page, theme);

        for (const scr of SCREENS) {
          await goNav(page, scr.nav);
          await setTheme(page, theme);
          const rel = shotPath(theme, device, scr.group, scr.screen);
          const webpPath = join(GALLERY_DIR, rel);
          const pngPath = webpPath.replace(/\.webp$/, '.png');
          mkdirSync(dirname(pngPath), { recursive: true });
          await page.screenshot({ path: pngPath, animations: 'disabled' });
          pngToWebp(pngPath, webpPath);
          shots.push({
            id: `${slug(scr.group)}--${slug(scr.screen)}--demo`,
            group: scr.group,
            screen: scr.screen,
            state: 'demo',
            theme,
            device,
            file: rel,
            route: `#/${scr.nav}`,
            caption: scr.caption,
            w: vp.width * vp.deviceScaleFactor,
            h: vp.height * vp.deviceScaleFactor,
          });
          process.stdout.write(`✓ ${theme}/${device}/${scr.nav}\n`);
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const version = JSON.parse(readFileSync(join(ROOT, 'VERSION.json'), 'utf8')).version;
  writeFileSync(
    MANIFEST,
    JSON.stringify({ app: 'SteadyCap', version, capturedAt: CAPTURED_AT, accent: ACCENT, schema: 2, shots }, null, 2),
  );
  console.log(`\nSteadyCap gallery v3: ${shots.length} shots → ${MANIFEST}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
