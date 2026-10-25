// @ts-check
/**
 * HIG design gate — Today, Recovery list, add habit, You (settings), SOS; light + dark; iPad sidebar.
 * Captures before/after evidence when HIG_SHOTS=<label> (writes build/qa/hig/<label>/).
 */
const { test, expect } = require('@playwright/test');
const path = require('path');

const LABEL = process.env.HIG_SHOTS || '';
const OUT = path.join(__dirname, '..', 'build', 'qa', 'hig', LABEL || 'tmp');

async function shot(page, name) {
  if (!LABEL) return;
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, name + '.png') });
}

async function boot(page, theme) {
  await page.addInitScript((t) => localStorage.setItem('steadycap-theme', t), theme);
  await page.goto('/?demo=1');
  await page.waitForFunction(() => typeof window.Navigation !== 'undefined' && typeof window.Profile !== 'undefined' && typeof window.Emergency !== 'undefined', { timeout: 30000 });
  await page.evaluate(() => {
    document.getElementById('splash')?.remove();
    const pro = document.getElementById('proUpgradeModal');
    if (pro) pro.style.display = 'none';
  });
  await page.waitForTimeout(600);
}

async function go(page, id) {
  await page.evaluate((s) => Navigation.go(s), id);
  await page.waitForTimeout(700);
}

for (const theme of ['dark', 'light']) {
  test.describe(`HIG phone · ${theme}`, () => {
    test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });

    test(`today, recovery, add, you, sos (${theme})`, async ({ page }) => {
      await boot(page, theme);
      await go(page, 'dashboard');
      await shot(page, `phone-${theme}-01-today`);

      const tabs = page.locator('#nav .nav-tab');
      await expect(tabs).toHaveCount(5);
      for (const h of await tabs.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) {
        expect.soft(h).toBeGreaterThanOrEqual(44);
      }

      await go(page, 'recovery');
      await shot(page, `phone-${theme}-02-recovery`);

      await go(page, 'profile');
      await shot(page, `phone-${theme}-04-you`);

      await page.evaluate(() => Profile._addHabit());
      await page.waitForTimeout(600);
      await shot(page, `phone-${theme}-03-add`);
      await page.evaluate(() => Profile._closeModal && Profile._closeModal());

      await go(page, 'emergency');
      await shot(page, `phone-${theme}-05-sos`);
    });
  });
}

test.describe('HIG iPad · sidebar', () => {
  test.use({ viewport: { width: 1180, height: 820 } });

  test('sidebar shell + today + recovery', async ({ page }) => {
    await boot(page, 'dark');
    await go(page, 'dashboard');
    await expect(page.locator('#cap-nav-sidebar')).toBeVisible();
    await shot(page, 'ipad-dark-01-today');
    await go(page, 'recovery');
    await shot(page, 'ipad-dark-02-recovery');
  });
});
