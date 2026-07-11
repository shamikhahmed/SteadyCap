// @ts-check
// Screen gallery capture — every screen, mobile + desktop. CAPTURE_GALLERY-gated.
const { test, expect } = require('@playwright/test');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const GALLERY_DIR = join(process.cwd(), 'docs', 'screenshots', 'gallery');

const SCREENS = ['onboarding', 'dashboard', 'recovery', 'emergency', 'knowledge', 'journal', 'profile'];

const VIEWPORTS = {
  mobile: { width: 393, height: 852 },
  desktop: { width: 1280, height: 800 },
};

function appendManifest(shots) {
  const manifestPath = join(GALLERY_DIR, 'gallery-manifest.json');
  let existing = { shots: [] };
  try {
    existing = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    /* first writer */
  }
  const merged = [...existing.shots.filter((s) => !shots.some((n) => n.file === s.file)), ...shots];
  merged.sort((a, b) => a.file.localeCompare(b.file));
  const version = JSON.parse(readFileSync(join(process.cwd(), 'VERSION.json'), 'utf8')).version;
  writeFileSync(
    manifestPath,
    JSON.stringify({ app: 'SteadyCap', version, generated: new Date().toISOString(), shots: merged }, null, 2),
  );
}

for (const viewport of ['mobile', 'desktop']) {
  test.describe(`Screen gallery — ${viewport}`, () => {
    test.skip(!process.env.CAPTURE_GALLERY, 'Gallery capture runs via `npm run gallery` (CAPTURE_GALLERY=1)');
    test.use({ viewport: VIEWPORTS[viewport], deviceScaleFactor: 2 });

    test.beforeAll(() => {
      mkdirSync(GALLERY_DIR, { recursive: true });
    });

    test(`capture ${SCREENS.length} ${viewport} screens`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.goto('/?demo=1');
      await page.waitForFunction(() => typeof window.Navigation !== 'undefined');
      await page.waitForTimeout(600);

      const shots = [];
      for (const [i, id] of SCREENS.entries()) {
        const ok = await page.evaluate((screen) => {
          try {
            window.Navigation.go(screen);
            return true;
          } catch {
            return false;
          }
        }, id);
        expect(ok, `Navigation.go('${id}') should not throw`).toBe(true);
        await page.waitForTimeout(500);
        const file = `${viewport}-${String(i + 1).padStart(2, '0')}-${id}.png`;
        await page.screenshot({ path: join(GALLERY_DIR, file), fullPage: false });
        shots.push({ file, label: id.charAt(0).toUpperCase() + id.slice(1), route: `Navigation.go('${id}')`, viewport });
      }
      appendManifest(shots);
    });
  });
}
