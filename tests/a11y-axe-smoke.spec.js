// @ts-check
/**
 * Axe smoke — dashboard, knowledge, profile, add-habit sheet.
 * Fails on serious/critical (color-contrast, select-name, nested-interactive, …).
 * Reviewer runs this; agent sandbox cannot launch browsers.
 */
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function boot(page, theme) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('steadycap-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    } catch (_) {}
  }, theme);
  await page.goto('/?demo=1');
  await page.waitForFunction(
    () => typeof window.Navigation !== 'undefined' && typeof window.Profile !== 'undefined',
    { timeout: 30000 },
  );
  await page.evaluate((t) => {
    document.getElementById('splash')?.remove();
    document.documentElement.setAttribute('data-theme', t);
    const pro = document.getElementById('proUpgradeModal');
    if (pro) pro.style.display = 'none';
  }, theme);
  await page.waitForTimeout(500);
}

async function go(page, id) {
  await page.evaluate((s) => Navigation.go(s), id);
  await page.waitForTimeout(600);
}

async function expectNoSeriousCritical(page, label) {
  const results = await new AxeBuilder({ page }).analyze();
  const bad = (results.violations || []).filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  const summary = bad.map((v) => {
    const nodes = (v.nodes || []).slice(0, 3).map((n) => (n.target || []).join(' ')).join('; ');
    return `${v.id}(${v.impact}): ${nodes}`;
  });
  expect(bad, `${label}: ${summary.join(' | ') || 'ok'}`).toEqual([]);
}

for (const theme of ['light', 'dark']) {
  test.describe(`axe smoke · ${theme}`, () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test(`dashboard / knowledge / profile / add-habit (${theme})`, async ({ page }) => {
      await boot(page, theme);

      await go(page, 'dashboard');
      await expect(page.locator('#screen-dashboard.active')).toBeVisible();
      await expectNoSeriousCritical(page, `dashboard:${theme}`);

      await go(page, 'knowledge');
      await expect(page.locator('#screen-knowledge.active')).toBeVisible();
      await expectNoSeriousCritical(page, `knowledge:${theme}`);

      await go(page, 'profile');
      await expect(page.locator('#screen-profile.active')).toBeVisible();
      await expectNoSeriousCritical(page, `profile:${theme}`);

      await page.evaluate(() => Profile._addHabit());
      await page.waitForTimeout(500);
      await expect(page.locator('#profile-modal')).toBeVisible();
      await expectNoSeriousCritical(page, `sheet:_addHabit:${theme}`);
      await page.evaluate(() => Profile._closeModal && Profile._closeModal());
    });
  });
}
