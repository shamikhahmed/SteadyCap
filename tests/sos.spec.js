// @ts-check
// SOS / emergency flow — safety-critical path. Release blocker if red.
const { test, expect } = require('@playwright/test');

test.describe('SteadyCap SOS flow', () => {
  test('SOS screen renders all five phases via skip', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/?demo=1');
    await page.waitForFunction(() => typeof window.Navigation !== 'undefined');
    await page.waitForTimeout(500);

    await page.evaluate(() => window.Navigation.go('emergency'));
    await expect(page.locator('.sos-header')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.sos-dot')).toHaveCount(5);
    await expect(page.locator('.sos-dot.active')).toHaveCount(1);

    // Walk phases 0→4 with Skip; each phase must render content
    for (let phase = 0; phase < 4; phase++) {
      await expect(page.locator('.sos-content')).not.toBeEmpty();
      await page.locator('.sos-footer button', { hasText: 'Skip' }).first().click();
      await page.waitForTimeout(300);
    }
    // Phase 4 = complete screen, no skip footer
    await expect(page.locator('.sos-content')).not.toBeEmpty();
    await expect(page.locator('.sos-dot.done')).toHaveCount(4);

    const fatal = errors.filter((e) => !/serviceWorker|ResizeObserver|favicon/i.test(e));
    expect(fatal).toEqual([]);
  });

  test('Skip all exits the flow without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/?demo=1');
    await page.waitForFunction(() => typeof window.Navigation !== 'undefined');
    await page.evaluate(() => window.Navigation.go('emergency'));
    await expect(page.locator('.sos-header')).toBeVisible({ timeout: 10_000 });
    await page.locator('.sos-header button', { hasText: 'Skip all' }).click();
    await page.waitForTimeout(400);

    const fatal = errors.filter((e) => !/serviceWorker|ResizeObserver|favicon/i.test(e));
    expect(fatal).toEqual([]);
  });
});
