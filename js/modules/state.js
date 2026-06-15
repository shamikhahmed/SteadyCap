'use strict';
const State = (() => {
  const KEY = StorageMigrate.local('steadycap_v2', ['dos_v2']);
  const DEFAULT = {
    user: { name: '', currency: 'USD', goals: [], triggers: [], spiritualMode: false, hairTreatment: 'none' },
    habits: [],
    customHabits: [],
    medicines: [],
    routines: {
      skincare: { am: [], pm: [], weekly: [] },
      hair: { am: [], pm: [], weekly: [] },
    },
    dailyLog: {},
    cravingLog: [],
    settings: { currency: 'USD', notificationsEnabled: false },
    onboardingComplete: false,
  };

  let data = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        data = { ...JSON.parse(JSON.stringify(DEFAULT)), ...parsed };
        data.routines = { ...JSON.parse(JSON.stringify(DEFAULT.routines)), ...(parsed.routines || {}) };
        data.settings = { ...DEFAULT.settings, ...(parsed.settings || {}) };
        data.customHabits = parsed.customHabits || [];
        data.medicines = parsed.medicines || [];
        data.dailyLog = parsed.dailyLog || {};
      } else {
        data = JSON.parse(JSON.stringify(DEFAULT));
      }
    } catch (e) {
      data = JSON.parse(JSON.stringify(DEFAULT));
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  function get(key) {
    if (!data) load();
    return key ? data[key] : data;
  }

  function set(key, val) {
    if (!data) load();
    data[key] = val;
    save();
  }

  function update(fn) {
    if (!data) load();
    fn(data);
    save();
  }

  function reset() {
    data = JSON.parse(JSON.stringify(DEFAULT));
    save();
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function getDailyLog(date) {
    if (!data) load();
    const key = date || todayKey();
    if (!data.dailyLog[key]) {
      data.dailyLog[key] = { medicines: {}, routines: {}, habitChecks: {} };
    }
    return data.dailyLog[key];
  }

  function toggleDailyItem(type, key, val) {
    if (!data) load();
    const log = getDailyLog();
    if (type === 'medicine') log.medicines[key] = val !== false;
    else if (type === 'routine') log.routines[key] = val !== false;
    save();
  }

  function getAllHabits() {
    const builtIn = (get('habits') || []).map(h => ({ ...h, isCustom: false }));
    const custom = (get('customHabits') || []).map(h => ({
      ...h,
      type: h.type || 'custom',
      isCustom: true,
      config: h.config || {},
    }));
    return [...builtIn, ...custom];
  }

  function habitConfig(type, isCustom, customData) {
    if (isCustom && customData) {
      return { name: customData.name, icon: customData.icon || '✨', color: customData.color || '#FF6B35' };
    }
    return (window.HABITS_CONFIG || {})[type] || { name: type, icon: '✨', color: '#FF6B35' };
  }

  function addHabit(habitData) {
    if (!data) load();
    const habit = {
      id: Date.now().toString(),
      type: habitData.type,
      quitTime: habitData.quitTime || new Date().toISOString(),
      config: habitData.config || {},
      relapses: [],
      createdAt: new Date().toISOString(),
    };
    data.habits.push(habit);
    save();
    return habit;
  }

  function addCustomHabit(habitData) {
    if (!data) load();
    const habit = {
      id: 'c' + Date.now().toString(),
      name: habitData.name,
      icon: habitData.icon || '✨',
      color: habitData.color || '#FF6B35',
      type: 'custom',
      quitTime: habitData.quitTime || new Date().toISOString(),
      relapses: [],
      createdAt: new Date().toISOString(),
    };
    data.customHabits.push(habit);
    save();
    return habit;
  }

  function updateHabit(id, changes, isCustom) {
    if (!data) load();
    const list = isCustom ? data.customHabits : data.habits;
    const idx = list.findIndex(h => h.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...changes };
      save();
    }
  }

  function removeCustomHabit(id) {
    if (!data) load();
    data.customHabits = data.customHabits.filter(h => h.id !== id);
    save();
  }

  function addMedicine(med) {
    if (!data) load();
    const item = {
      id: 'm' + Date.now().toString(),
      name: med.name,
      dose: med.dose || '',
      schedule: med.schedule || 'fixed',
      times: med.times || ['08:00'],
      notes: med.notes || '',
      enabled: true,
    };
    data.medicines.push(item);
    save();
    return item;
  }

  function updateMedicine(id, changes) {
    if (!data) load();
    const idx = data.medicines.findIndex(m => m.id === id);
    if (idx !== -1) {
      data.medicines[idx] = { ...data.medicines[idx], ...changes };
      save();
    }
  }

  function removeMedicine(id) {
    if (!data) load();
    data.medicines = data.medicines.filter(m => m.id !== id);
    save();
  }

  function addRoutineStep(cat, slot, label) {
    if (!data) load();
    if (!data.routines[cat]) data.routines[cat] = { am: [], pm: [], weekly: [] };
    const step = {
      id: 'r' + Date.now().toString(),
      label,
      enabled: true,
      weekday: slot === 'weekly' ? ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()] : undefined,
    };
    data.routines[cat][slot].push(step);
    save();
    return step;
  }

  function updateRoutineStep(cat, slot, id, changes) {
    if (!data) load();
    const list = data.routines[cat]?.[slot];
    if (!list) return;
    const idx = list.findIndex(s => s.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...changes };
      save();
    }
  }

  function removeRoutineStep(cat, slot, id) {
    if (!data) load();
    if (!data.routines[cat]) return;
    data.routines[cat][slot] = data.routines[cat][slot].filter(s => s.id !== id);
    save();
  }

  function logRelapse(habitId, isCustom) {
    if (!data) load();
    const list = isCustom ? data.customHabits : data.habits;
    const h = list.find(x => x.id === habitId);
    if (h) {
      h.relapses = h.relapses || [];
      h.relapses.push({ at: new Date().toISOString() });
      h.quitTime = new Date().toISOString();
      save();
    }
  }

  function logCraving(habitId, intensity) {
    if (!data) load();
    data.cravingLog = data.cravingLog || [];
    data.cravingLog.push({ habitId, intensity: intensity || 5, at: new Date().toISOString(), survived: true });
    save();
  }

  function journalKey() {
    return StorageMigrate.local('steadycap_journal_v1', ['dos_journal_v1']);
  }

  function exportJSON() {
    let journal = [];
    try { journal = JSON.parse(localStorage.getItem(journalKey()) || '[]'); } catch (e) {}
    return JSON.stringify({ ...data, journal }, null, 2);
  }

  function importJSON(str) {
    try {
      const parsed = JSON.parse(str);
      const journal = parsed.journal;
      const copy = { ...parsed };
      delete copy.journal;
      data = { ...JSON.parse(JSON.stringify(DEFAULT)), ...copy };
      if (Array.isArray(journal)) {
        try { localStorage.setItem(journalKey(), JSON.stringify(journal)); } catch (e) {}
      }
      save();
      return true;
    } catch (e) {
      return false;
    }
  }

  function longestStreak() {
    const all = getAllHabits();
    if (!all.length) return 0;
    return Math.max(...all.map(h => {
      const relapses = (h.relapses || []).map(r => new Date(r.at).getTime()).sort();
      if (!relapses.length) return RecoveryEngine.daysClean(h.quitTime);
      let maxGap = relapses[0] - new Date(h.createdAt).getTime();
      for (let i = 1; i < relapses.length; i++) maxGap = Math.max(maxGap, relapses[i] - relapses[i - 1]);
      maxGap = Math.max(maxGap, Date.now() - relapses[relapses.length - 1]);
      return Math.floor(maxGap / 86400000);
    }));
  }

  load();
  return {
    get, set, update, save, reset, todayKey, getDailyLog, toggleDailyItem, getAllHabits, habitConfig,
    addHabit, addCustomHabit, updateHabit, removeCustomHabit, logRelapse, logCraving,
    addMedicine, updateMedicine, removeMedicine, addRoutineStep, updateRoutineStep, removeRoutineStep,
    exportJSON, importJSON, longestStreak,
  };
})();
window.State = State;
