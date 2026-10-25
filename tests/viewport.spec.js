// @ts-check
const { test, expect } = require('@playwright/test');
const {
  resize,
  assertCapSharedMobile,
  assertCapSharedDesktop,
} = require('./helpers/viewport-helpers');

test.describe('SteadyCap viewport contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.Navigation !== 'undefined');
    await page.waitForTimeout(600);
  });

  test('375px — phone shell and bottom nav', async ({ page }) => {
    await resize(page, 'mobile');
    await assertCapSharedMobile(page, expect);
  });

  test('1280px — sidebar and full-width main', async ({ page }) => {
    await resize(page, 'desktop');
    await assertCapSharedDesktop(page, expect);
  });

  test('375px — no content clipped behind bottom nav on primary tabs', async ({ page }) => {
    await resize(page, 'mobile');
    for (const tab of ['dashboard', 'recovery', 'emergency', 'knowledge', 'profile']) {
      await page.evaluate((t) => window.Navigation.go(t), tab);
      await page.waitForTimeout(400);
      const ok = await page.evaluate(() => {
        const screen = document.querySelector('.screen.active');
        const nav = document.getElementById('nav');
        if (!screen || !nav) return false;
        const scroller = screen.scrollHeight > screen.clientHeight ? screen : document.documentElement;
        scroller.scrollTop = scroller.scrollHeight;
        // Fixed overlays (closed article reader) are not page content
        const kids = [...screen.children].filter((el) => getComputedStyle(el).position !== 'fixed');
        const lastKid = kids[kids.length - 1];
        const last = lastKid?.lastElementChild || lastKid;
        if (!last) return true;
        return last.getBoundingClientRect().bottom <= nav.getBoundingClientRect().top + 1;
      });
      expect(ok, `tab ${tab}: last element clear of bottom nav`).toBe(true);
    }
  });
});
