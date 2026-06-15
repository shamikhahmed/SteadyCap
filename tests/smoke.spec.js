// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('SteadyCap smoke', () => {
  test('loads shell without fatal errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
    await page.waitForTimeout(800);
    const fatal = errors.filter(e => !/serviceWorker|ResizeObserver|favicon/i.test(e));
    expect(fatal).toEqual([]);
  });

  test('manifest link present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  });

  test('demo mode shows linked recovery insight on dashboard', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.Navigation !== 'undefined');
    await page.waitForTimeout(800);
    await expect(page.locator('#screen-dashboard.active')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Linked recovery', { exact: true }).first()).toBeVisible({ timeout: 10000 });
  });

  test('daily check-in widget on Today tab', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.Journal !== 'undefined');
    await expect(page.getByText('Daily check-in', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#daily-checkin-wrap .mood-btn')).toHaveCount(4);
    await page.locator('#daily-checkin-wrap .mood-btn').first().click();
    await page.locator('#daily-checkin-wrap #journal-save').click();
    await expect(page.getByText(/Check-in saved/i)).toBeVisible({ timeout: 5000 });
  });

  test('journal tab removed from bottom nav', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.nav-tab[data-tab="journal"]')).toHaveCount(0);
    await expect(page.locator('.nav-tab')).toHaveCount(5);
  });
});
