// @ts-check
// G-10 / STD-V3-4 — optional app lock via CapLocalLock (shared local-lock.js).
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const FIXTURE = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'pre-lock-v1.json'), 'utf8')
);

test.describe('SteadyCap app lock (G-10)', () => {
  test('enable → seal → unlock preserves medicines / journal (G-6)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/?demo=1');
    await page.waitForFunction(() => window.__APP_READY__ === true || document.documentElement.dataset.appReady === 'true', null, { timeout: 15000 });
    await page.waitForFunction(() => typeof window.AppLock !== 'undefined' && typeof window.CapLocalLock !== 'undefined');

    // Seed plaintext sensitive stores (pre-lock fixture).
    await page.evaluate((fx) => {
      const journalKey = window.StorageMigrate
        ? StorageMigrate.local('steadycap_journal_v1', ['dos_journal_v1'])
        : 'steadycap_journal_v1';
      State.update((d) => {
        d.medicines = fx.medicines;
        d.cravingLog = fx.cravingLog;
        d.onboardingComplete = true;
      });
      localStorage.setItem(journalKey, JSON.stringify(fx.journal));
      localStorage.removeItem('steadycap_lock_meta_v1');
      localStorage.removeItem('steadycap_lock_sealed_v1');
    }, FIXTURE);

    // Stub CapAlert / CapPrompt so enable() can run without UI.
    await page.evaluate(() => {
      window.CapAlert = async () => {};
      let promptN = 0;
      window.CapPrompt = async () => {
        promptN += 1;
        return '123456';
      };
    });

    const enabled = await page.evaluate(async () => AppLock.enable());
    expect(enabled).toBe(true);

    const sealed = await page.evaluate(() => !!localStorage.getItem('steadycap_lock_sealed_v1'));
    expect(sealed).toBe(true);

    await page.evaluate(async () => {
      await AppLock.lockSession();
    });
    await expect(page.locator('#steadycap-applock.on')).toBeVisible({ timeout: 5000 });

    const cleared = await page.evaluate(() => {
      const meds = (State.get('medicines') || []).length;
      const cravings = (State.get('cravingLog') || []).length;
      return { meds, cravings };
    });
    expect(cleared.meds).toBe(0);
    expect(cleared.cravings).toBe(0);

    await page.evaluate(async () => {
      await AppLock.unlock('123456');
    });
    await expect(page.locator('#steadycap-applock.on')).toHaveCount(0);

    const restored = await page.evaluate(() => {
      const journalKey = window.StorageMigrate
        ? StorageMigrate.local('steadycap_journal_v1', ['dos_journal_v1'])
        : 'steadycap_journal_v1';
      return {
        meds: (State.get('medicines') || []).map((m) => m.name),
        journal: JSON.parse(localStorage.getItem(journalKey) || '[]'),
        cravingN: (State.get('cravingLog') || []).length,
      };
    });
    expect(restored.meds).toEqual(FIXTURE.medicines.map((m) => m.name));
    expect(restored.journal.length).toBe(FIXTURE.journal.length);
    expect(restored.cravingN).toBe(FIXTURE.cravingLog.length);

    const fatal = errors.filter((e) => !/serviceWorker|ResizeObserver|favicon/i.test(e));
    expect(fatal).toEqual([]);
  });

  test('vendor local-lock matches CapLocalLock API surface', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForFunction(() => typeof window.CapLocalLock !== 'undefined');
    const api = await page.evaluate(() => {
      const L = window.CapLocalLock;
      return {
        hasEnable: typeof L.enable === 'function',
        hasUnlock: typeof L.unlock === 'function',
        hasEncrypt: typeof L.encryptJson === 'function',
        hasDecrypt: typeof L.decryptJson === 'function',
        hasDisable: typeof L.disable === 'function',
        available: L.available(),
      };
    });
    expect(api.hasEnable).toBe(true);
    expect(api.hasUnlock).toBe(true);
    expect(api.hasEncrypt).toBe(true);
    expect(api.hasDecrypt).toBe(true);
    expect(api.hasDisable).toBe(true);
    expect(api.available).toBe(true);
  });
});
