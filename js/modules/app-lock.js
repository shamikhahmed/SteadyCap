'use strict';
/**
 * Optional app lock (G-10) for medicines, craving log, and journal.
 * Uses CapLocalLock; seals sensitive blobs when locked.
 */
const AppLock = (() => {
  const META_KEY = 'steadycap_lock_meta_v1';
  const SEALED_KEY = 'steadycap_lock_sealed_v1';
  const JOURNAL_KEY = () => (window.StorageMigrate
    ? StorageMigrate.local('steadycap_journal_v1', ['dos_journal_v1'])
    : 'steadycap_journal_v1');

  let dataKey = null;
  let unlocked = true;

  function Lock() {
    return window.CapLocalLock || null;
  }

  function loadMeta() {
    try {
      const L = Lock();
      if (!L) return null;
      return L.normalizeMeta(JSON.parse(localStorage.getItem(META_KEY) || 'null'));
    } catch (_) {
      return null;
    }
  }

  function saveMeta(meta) {
    localStorage.setItem(META_KEY, JSON.stringify(meta || {}));
  }

  function isEnabled() {
    const m = loadMeta();
    return !!(m && m.enabled);
  }

  function isUnlocked() {
    if (!isEnabled()) return true;
    return unlocked && !!dataKey;
  }

  function pickSensitive() {
    const journal = localStorage.getItem(JOURNAL_KEY()) || '[]';
    return {
      medicines: State.get('medicines') || [],
      cravingLog: State.get('cravingLog') || [],
      journal
    };
  }

  function applySensitive(payload) {
    if (!payload) return;
    State.update((d) => {
      if (payload.medicines) d.medicines = payload.medicines;
      if (payload.cravingLog) d.cravingLog = payload.cravingLog;
    });
    if (typeof payload.journal === 'string') {
      localStorage.setItem(JOURNAL_KEY(), payload.journal);
    }
  }

  function clearSensitiveInMemory() {
    State.update((d) => {
      d.medicines = [];
      d.cravingLog = [];
    });
  }

  async function sealNow() {
    const L = Lock();
    if (!L || !dataKey || !isEnabled()) return;
    const sealed = await L.encryptJson(dataKey, pickSensitive());
    localStorage.setItem(SEALED_KEY, JSON.stringify(sealed));
  }

  function ensureGate() {
    let gate = document.getElementById('steadycap-applock');
    if (gate) return gate;
    gate = document.createElement('div');
    gate.id = 'steadycap-applock';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-label', 'App lock');
    gate.innerHTML = `
      <div class="applock-card">
        <h2 class="applock-title">SteadyCap is locked</h2>
        <p class="applock-body">Enter your passcode to open medicines, cravings, and journal.</p>
        <input id="steadycap-applock-pin" class="ob-input" type="password" inputmode="numeric" autocomplete="current-password" placeholder="Passcode" />
        <p id="steadycap-applock-status" class="applock-status" aria-live="polite"></p>
        <button type="button" class="btn btn-primary" id="steadycap-applock-go" style="width:100%;margin-top:12px">Unlock</button>
      </div>`;
    document.body.appendChild(gate);
    gate.querySelector('#steadycap-applock-go').addEventListener('click', () => {
      const pin = gate.querySelector('#steadycap-applock-pin').value;
      unlock(pin).catch(() => {});
    });
    gate.querySelector('#steadycap-applock-pin').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') gate.querySelector('#steadycap-applock-go').click();
    });
    return gate;
  }

  function showGate(msg) {
    const gate = ensureGate();
    gate.classList.add('on');
    document.documentElement.setAttribute('data-app-locked', '1');
    const st = gate.querySelector('#steadycap-applock-status');
    if (st) st.textContent = msg || '';
    const pin = gate.querySelector('#steadycap-applock-pin');
    if (pin) { pin.value = ''; setTimeout(() => pin.focus(), 40); }
  }

  function hideGate() {
    const gate = document.getElementById('steadycap-applock');
    if (gate) gate.classList.remove('on');
    document.documentElement.removeAttribute('data-app-locked');
  }

  async function enable() {
    const L = Lock();
    if (!L || !L.available()) {
      await CapAlert({ title: 'Unavailable', body: 'This browser cannot use WebCrypto app lock.' });
      return false;
    }
    await CapAlert({
      title: 'Export a backup first',
      body: 'If you forget your passcode, your protected data can\'t be recovered. Export a backup first.'
    });
    const pass = await CapPrompt({
      title: 'Create passcode',
      body: 'At least 6 digits. Medicines, cravings, and journal will be encrypted on this device.',
      placeholder: '6+ digit passcode',
      type: 'password',
      confirmLabel: 'Continue'
    });
    if (!pass) return false;
    const again = await CapPrompt({
      title: 'Confirm passcode',
      body: 'Enter the same passcode again.',
      placeholder: '6+ digit passcode',
      type: 'password',
      confirmLabel: 'Turn on'
    });
    if (again !== pass) {
      await CapAlert({ title: 'Passcodes did not match', body: 'Try again from You → App lock.' });
      return false;
    }
    try {
      const enabled = await L.enable(pass);
      dataKey = enabled.dataKey;
      saveMeta(enabled.meta);
      unlocked = true;
      await sealNow();
      if (window.App && App.showToast) App.showToast('App lock on', 'success');
      return true;
    } catch (err) {
      await CapAlert({ title: 'Could not enable lock', body: (err && err.message) || 'Use at least 6 digits.' });
      return false;
    }
  }

  async function disable() {
    if (!isEnabled()) return true;
    const pass = await CapPrompt({
      title: 'Turn off app lock',
      body: 'Enter your passcode to decrypt and keep your data available.',
      placeholder: 'Passcode',
      type: 'password',
      confirmLabel: 'Turn off',
      destructive: true
    });
    if (!pass) return false;
    try {
      await unlock(pass);
      const L = Lock();
      saveMeta(await L.disable());
      localStorage.removeItem(SEALED_KEY);
      dataKey = null;
      unlocked = true;
      hideGate();
      if (window.App && App.showToast) App.showToast('App lock off', 'success');
      return true;
    } catch (_) {
      return false;
    }
  }

  async function unlock(passcode) {
    const L = Lock();
    const meta = loadMeta();
    if (!L || !meta || !meta.enabled) return true;
    try {
      const res = await L.unlock(meta, passcode);
      saveMeta(res.meta);
      dataKey = res.dataKey;
      const raw = localStorage.getItem(SEALED_KEY);
      if (raw) {
        const payload = await L.decryptJson(dataKey, JSON.parse(raw));
        applySensitive(payload);
      }
      unlocked = true;
      hideGate();
      if (window.Dashboard) Dashboard.render();
      if (window.Profile) Profile.render();
      return true;
    } catch (err) {
      if (err && err.meta) saveMeta(err.meta);
      const st = document.querySelector('#steadycap-applock-status');
      let msg = 'Wrong passcode';
      if (err && err.code === 'LOCKED_OUT') msg = 'Too many attempts — wait and try again';
      if (st) st.textContent = msg;
      showGate(msg);
      throw err;
    }
  }

  async function lockSession() {
    if (!isEnabled() || !dataKey) {
      if (isEnabled()) {
        unlocked = false;
        clearSensitiveInMemory();
        showGate();
      }
      return;
    }
    await sealNow();
    dataKey = null;
    unlocked = false;
    clearSensitiveInMemory();
    showGate();
    if (window.Dashboard) Dashboard.render();
  }

  function boot() {
    if (!isEnabled()) return;
    unlocked = false;
    dataKey = null;
    clearSensitiveInMemory();
    showGate();
  }

  return { enable, disable, unlock, lockSession, boot, isEnabled, isUnlocked, sealNow };
})();
window.AppLock = AppLock;
