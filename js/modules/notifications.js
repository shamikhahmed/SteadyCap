'use strict';
const Notifications = (() => {
  let checkInterval = null;
  const NUDGE_GRACE_MIN = 15;

  function isSupported() {
    return 'Notification' in window;
  }

  function permission() {
    return isSupported() ? Notification.permission : 'denied';
  }

  async function requestPermission() {
    if (!isSupported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      State.update(d => { d.settings.notificationsEnabled = true; });
      return true;
    }
    return false;
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function nowMinutes() {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }

  function parseTime(t) {
    const [h, m] = (t || '00:00').split(':').map(Number);
    return h * 60 + (m || 0);
  }

  function getPeriod() {
    const h = new Date().getHours();
    if (h < 12) return 'am';
    if (h < 17) return 'pm';
    return 'evening';
  }

  function isWeeklyDue(step) {
    if (!step.weekday) return true;
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return step.weekday === days[new Date().getDay()];
  }

  function getDueItems() {
    const items = [];
    const medicines = State.get('medicines') || [];
    const routines = State.get('routines') || {};
    const log = State.getDailyLog();
    const mins = nowMinutes();
    const period = getPeriod();

    medicines.forEach(med => {
      if (!med.enabled) return;
      if (med.schedule === 'as_needed') {
        items.push({ kind: 'medicine', id: med.id, label: med.name, sub: med.dose || 'As needed', time: null, asNeeded: true });
        return;
      }
      (med.times || []).forEach(time => {
        const tMins = parseTime(time);
        items.push({
          kind: 'medicine', id: med.id, timeKey: time, label: med.name,
          sub: `${med.dose || ''} · ${time}`.trim(), time, tMins,
          done: !!(log.medicines && log.medicines[`${med.id}_${time}`]),
          overdue: mins > tMins + NUDGE_GRACE_MIN,
        });
      });
    });

    ['skincare', 'hair'].forEach(cat => {
      const r = routines[cat] || {};
      ['am', 'pm'].forEach(slot => {
        if (slot === 'am' && period === 'evening') return;
        if (slot === 'pm' && period === 'am') return;
        (r[slot] || []).forEach(step => {
          if (!step.enabled) return;
          items.push({
            kind: 'routine', cat, slot, id: step.id, label: step.label,
            sub: `${cat} · ${slot.toUpperCase()}`, time: null,
            done: !!(log.routines && log.routines[`${cat}_${slot}_${step.id}`]),
          });
        });
      });
      (r.weekly || []).forEach(step => {
        if (!step.enabled || !isWeeklyDue(step)) return;
        items.push({
          kind: 'routine', cat, slot: 'weekly', id: step.id, label: step.label,
          sub: `${cat} · Weekly`, time: null,
          done: !!(log.routines && log.routines[`${cat}_weekly_${step.id}`]),
        });
      });
    });

    return items;
  }

  function getMissedNudges() {
    const mins = nowMinutes();
    return getDueItems().filter(item => {
      if (item.asNeeded || item.done || !item.time) return false;
      return mins > item.tMins + NUDGE_GRACE_MIN;
    });
  }

  function showPush(title, body, tag) {
    if (!isSupported() || Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, tag: tag || 'steadycap-reminder', icon: './assets/icons/icon-192.png' });
    } catch (e) {}
  }

  function firedKey() {
    return StorageMigrate.session('steadycap_fired', ['dos_fired']);
  }

  function fireDueNotifications() {
    const fired = JSON.parse(sessionStorage.getItem(firedKey()) || '{}');
    const key = todayKey();
    if (!fired[key]) fired[key] = {};
    const mins = nowMinutes();

    getDueItems().forEach(item => {
      if (!item.time || item.done || item.asNeeded) return;
      const fireKey = `${item.kind}_${item.id}_${item.time}`;
      if (fired[key][fireKey]) return;
      if (mins >= item.tMins && mins < item.tMins + 5) {
        fired[key][fireKey] = true;
        sessionStorage.setItem(firedKey(), JSON.stringify(fired));
        showPush('SteadyCap', `${item.label} — ${item.sub}`, fireKey);
        if (window.App) App.showToast(`Reminder: ${item.label}`, 'info');
      }
    });
  }

  function startChecking() {
    if (checkInterval) clearInterval(checkInterval);
    checkInterval = setInterval(() => {
      if (!State.get('onboardingComplete')) return;
      fireDueNotifications();
      const tab = (window.Navigation && Navigation.readStoredTab) ? Navigation.readStoredTab() : (sessionStorage.getItem('steadycap_tab') || sessionStorage.getItem('dos_tab') || 'dashboard');
      if (tab === 'dashboard' && window.Dashboard) Dashboard.render();
    }, 60000);
    fireDueNotifications();
  }

  function init() {
    if (State.get('settings')?.notificationsEnabled && permission() === 'granted') {
      startChecking();
    }
  }

  function enableAndStart() {
    return requestPermission().then(ok => {
      if (ok) startChecking();
      return ok;
    });
  }

  return {
    isSupported, permission, requestPermission, getDueItems, getMissedNudges,
    showPush, startChecking, init, enableAndStart, getPeriod, todayKey,
  };
})();
window.Notifications = Notifications;
