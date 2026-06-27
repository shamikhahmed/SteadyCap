// @ts-check
const { test, expect } = require('@playwright/test');
const {
  resize,
  assertCapSharedMobile,
  assertCapSharedDesktop,
} = require('../../capricorn-tooling/shared/testing/viewport-helpers');

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
});
