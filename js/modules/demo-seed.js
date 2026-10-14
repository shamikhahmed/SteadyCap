'use strict';
/**
 * Lightweight ?demo=1 seeder — keeps Profile.js off the cold path (TBT).
 * force:false reuses an existing demo vault (PulseCap createDemo(false) pattern).
 */
const SteadyDemo = (() => {
  function hasDemoHabits() {
    try {
      const habits = (State.getAllHabits && State.getAllHabits()) || State.get('habits') || [];
      return habits.some((h) => String(h.id || '').indexOf('demo-') === 0);
    } catch (_) {
      return false;
    }
  }

  function seed(opts) {
    const force = !!(opts && opts.force);
    if (!State.isDemoMode()) State.useDemoStorage(true);
    if (!force && hasDemoHabits()) return false;

    const day = 86400000;
    const now = Date.now();
    const smokingQuit = new Date(now - 90 * day).toISOString();
    const vapeQuit = new Date(now - 2 * day).toISOString();
    State.update((d) => {
      d.user = {
        name: 'Alex (Demo)',
        currency: 'USD',
        goals: ['Stay smoke-free for my kids', 'Save $200/month', 'Run a 5K by summer'],
        triggers: ['Stress', 'Evening'],
        spiritualMode: false,
        hairTreatment: 'minoxidil',
      };
      d.settings = { currency: 'USD', notificationsEnabled: false };
      d.habits = [
        {
          id: 'demo-smoking',
          type: 'smoking',
          quitTime: smokingQuit,
          config: { cigarettesPerDay: 12, yearsSmoked: 8, costPerPack: 9.5, cigarettesPerPack: 20 },
          relapses: [],
          createdAt: smokingQuit,
        },
        {
          id: 'demo-vape',
          type: 'vape',
          quitTime: vapeQuit,
          config: {
            deviceType: 'Pod System',
            nicType: 'Nicotine Salt (Nic Salt)',
            podsPerWeek: 2,
            costPerPod: 6,
            yearsVaping: 3,
          },
          relapses: [],
          createdAt: vapeQuit,
        },
      ];
      d.customHabits = [];
      d.medicines = [
        {
          id: 'demo-med-1',
          name: 'Nicotine patch',
          dose: '21mg',
          schedule: 'fixed',
          times: ['08:00'],
          enabled: true,
        },
      ];
      d.routines = {
        skincare: { am: [{ id: 'r1', label: 'Gentle cleanser' }], pm: [{ id: 'r2', label: 'Moisturizer' }], weekly: [] },
        hair: { am: [], pm: [{ id: 'r3', label: 'Minoxidil' }], weekly: [] },
      };
      d.cravingLog = [];
      for (let i = 0; i < 14; i++) {
        const evening = new Date(now - i * day);
        evening.setHours(19 + (i % 3), 30, 0, 0);
        d.cravingLog.push({
          id: 'c' + i,
          at: evening.toISOString(),
          intensity: 3 + (i % 4),
          survived: i !== 5,
          trigger: ['Stress', 'Night', 'Social', 'Boredom'][i % 4],
        });
      }
      d.onboardingComplete = true;
    });

    const journalKey = StorageMigrate.local('steadycap_journal_v1', ['dos_journal_v1']);
    try {
      const existing = JSON.parse(localStorage.getItem(journalKey) || '[]');
      if (force || !Array.isArray(existing) || !existing.length) {
        const journalEntries = [];
        for (let i = 0; i < 12; i++) {
          const d = new Date(now - i * day);
          const ds = d.toISOString().slice(0, 10);
          journalEntries.push({
            date: ds,
            text: i === 0 ? 'Cravings peaked after work but I walked instead.' : 'Day ' + (12 - i) + ' — staying accountable.',
            mood: ['strong', 'ok', 'hard', 'ok'][i % 4],
            triggers: [['Stress', 'Night'], ['Work'], ['Boredom', 'Evening'], ['Social']][i % 4],
            ts: d.getTime(),
          });
        }
        localStorage.setItem(journalKey, JSON.stringify(journalEntries));
      }
    } catch (_) {
      /* ignore journal seed failures */
    }
    return true;
  }

  return { seed, hasDemoHabits };
})();
window.SteadyDemo = SteadyDemo;
