'use strict';
const Profile = (() => {
  function render() {
    const screen = document.getElementById('screen-profile');
    if (!screen) return;
    const habits = State.getAllHabits();
    const medicines = State.get('medicines') || [];
    const routines = State.get('routines') || {};
    const user = State.get('user') || {};
    const settings = State.get('settings') || {};
    const notifOn = settings.notificationsEnabled && Notifications.permission() === 'granted';
    const spiritualMode = user.spiritualMode === true;
    const hairTreatment = user.hairTreatment || 'none';
    const currency = settings.currency || 'USD';
    const cravingLog = State.get('cravingLog') || [];
    const sym = FinanceEngine.CURRENCY_SYMBOLS[currency] || '$';

    const totalDays = habits.reduce((s, h) => s + RecoveryEngine.daysClean(h.quitTime), 0);
    const totalSaved = FinanceEngine.totalSaved(habits, currency);
    const cravingsSurvived = cravingLog.filter(c => c.survived).length;
    const longest = State.longestStreak ? State.longestStreak() : 0;

    const habitsHtml = habits.map(h => {
      const hCfg = State.habitConfig(h.type, h.isCustom, h);
      const days = RecoveryEngine.daysClean(h.quitTime);
      const hrs = RecoveryEngine.hoursClean(h.quitTime);
      const relapses = (h.relapses || []).length;
      const fin = FinanceEngine.calculate(h, currency);
      let bodyScore = BodyEngine.overallBodyScore(h.type, hrs);
      if (window.LinkedRecoveryEngine) {
        const linkedSys = LinkedRecoveryEngine.getLinkedBodySystems(h, habits);
        if (linkedSys.length) bodyScore = Math.round(linkedSys.reduce((a, x) => a + x.pct, 0) / linkedSys.length);
      }
      return `<div class="card" style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <span style="font-size:1.4rem">${hCfg.icon||'✨'}</span>
          <div class="t-heading">${hCfg.name||h.type}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div><div class="t-label">Days Clean</div><div style="font-size:1.3rem;font-weight:800;color:var(--text)">${days}</div></div>
          <div><div class="t-label">Relapses</div><div style="font-size:1.3rem;font-weight:800;color:var(--text)">${relapses}</div></div>
          ${fin.hasCost?`<div><div class="t-label">Saved</div><div style="font-size:1.3rem;font-weight:800;color:var(--green)">${sym}${fin.savedTotal.toFixed(2)}</div></div>`:''}
          <div><div class="t-label">Body Score</div><div style="font-size:1.3rem;font-weight:800;color:var(--teal)">${bodyScore}%</div></div>
        </div>
        <button class="btn btn-ghost" style="font-size:0.78rem;padding:10px 16px;width:100%" onclick="Profile._editHabit('${h.id}',${h.isCustom})">Edit Habit Config</button>
      </div>`;
    }).join('');

    const medsHtml = medicines.map(m => `
      <div class="card profile-item-card" style="margin-bottom:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div><span style="font-size:1.1rem">💊</span> <strong>${m.name}</strong></div>
          <div onclick="Profile._toggleMed('${m.id}')" style="width:40px;height:24px;background:${m.enabled?'var(--green)':'var(--bg2)'};border-radius:12px;position:relative;cursor:pointer;border:1px solid var(--border)">
            <div style="position:absolute;top:2px;${m.enabled?'right:2px':'left:2px'};width:18px;height:18px;border-radius:50%;background:white;transition:all 0.2s"></div>
          </div>
        </div>
        <div class="t-caption">${m.dose || '—'} · ${m.schedule === 'as_needed' ? 'As needed' : (m.times || []).join(', ')}</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-ghost" style="flex:1;font-size:0.75rem;padding:8px" onclick="Profile._editMed('${m.id}')">Edit</button>
          <button class="btn btn-ghost" style="font-size:0.75rem;padding:8px;color:var(--red)" onclick="Profile._removeMed('${m.id}')">Remove</button>
        </div>
      </div>
    `).join('') || '<div class="t-caption t-dim" style="padding:0 20px 8px">No medicines added yet.</div>';

    const routineSection = (cat, label, icon) => {
      const r = routines[cat] || { am: [], pm: [], weekly: [] };
      const slotHtml = (slot, slotLabel) => {
        const steps = r[slot] || [];
        if (!steps.length) return '';
        return `<div style="margin-bottom:12px">
          <div class="t-label" style="margin-bottom:6px">${slotLabel}</div>
          ${steps.map(s => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
              <span style="flex:1;font-size:0.85rem;color:var(--text2)">${s.label}</span>
              <button onclick="Profile._removeRoutine('${cat}','${slot}','${s.id}')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:0.9rem">✕</button>
            </div>
          `).join('')}
        </div>`;
      };
      return `<div class="card" style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><span>${icon}</span><span class="t-heading">${label}</span></div>
        ${slotHtml('am', 'AM')}
        ${slotHtml('pm', 'PM')}
        ${slotHtml('weekly', 'Weekly')}
        <button class="btn btn-ghost" style="width:100%;font-size:0.78rem;margin-top:4px" onclick="Profile._addRoutine('${cat}')">+ Add step</button>
      </div>`;
    };

    screen.innerHTML = `
      <div class="profile-header">
        <div class="t-display">${user.name ? user.name : 'Your Recovery'}</div>
        <div class="t-caption" style="margin-top:4px">${habits.length} habit${habits.length!==1?'s':''} tracked</div>
      </div>

      <div class="stat-grid">
        <div class="stat-cell">
          <div class="stat-val" style="color:var(--orange)">${totalDays}</div>
          <div class="stat-label">Total Days</div>
        </div>
        <div class="stat-cell">
          <div class="stat-val" style="color:var(--green)">${sym}${totalSaved.toFixed(0)}</div>
          <div class="stat-label">Total Saved</div>
        </div>
        <div class="stat-cell">
          <div class="stat-val" style="color:var(--teal)">${cravingsSurvived}</div>
          <div class="stat-label">Cravings Survived</div>
        </div>
        <div class="stat-cell">
          <div class="stat-val" style="color:var(--gold)">${longest}</div>
          <div class="stat-label">Longest Streak</div>
        </div>
      </div>

      <div class="section-header"><span class="section-title">Your Habits</span></div>
      <div style="padding:0 20px">${habitsHtml}</div>

      <div class="section-header"><span class="section-title">Add Habit</span></div>
      <div style="padding:0 20px 12px;display:flex;gap:8px">
        <button class="btn btn-ghost" style="flex:1;text-align:center" onclick="Profile._addHabit()">+ Built-in</button>
        <button class="btn btn-ghost" style="flex:1;text-align:center" onclick="Profile._addCustomHabit()">+ Custom</button>
      </div>

      <div class="section-header"><span class="section-title">Medicines</span></div>
      <div style="padding:0 20px 8px">${medsHtml}</div>
      <div style="padding:0 20px 16px">
        <button class="btn btn-ghost" style="width:100%;text-align:center" onclick="Profile._addMed()">+ Add medicine</button>
      </div>

      <div class="section-header"><span class="section-title">Daily Routines</span></div>
      <div style="padding:0 20px 16px">
        ${routineSection('skincare', 'Skincare', '✨')}
        ${routineSection('hair', 'Hair', '💇')}
      </div>

      <div class="section-header"><span class="section-title">Your Why</span></div>
      <div style="padding:0 20px 12px">
        <div class="card" style="margin-bottom:10px">
          <div class="ob-label">Recovery goals — shown in Emergency SOS</div>
          <textarea class="ob-input" id="p-goals" rows="3" placeholder="One per line" style="resize:vertical;margin-top:8px"
            oninput="Profile._saveGoals(this.value)">${(user.goals||[]).join('\n')}</textarea>
        </div>
      </div>

      <div class="section-header"><span class="section-title">Settings</span></div>
      <div style="padding:0 20px">
        <div class="card" style="margin-bottom:10px">
          <div class="ob-field">
            <div class="ob-label">Name</div>
            <input class="ob-input" type="text" id="p-name" placeholder="Your name" value="${user.name||''}" oninput="Profile._saveName(this.value)">
          </div>
          <div class="ob-field">
            <div class="ob-label">Currency</div>
            <select class="ob-select" id="p-currency" onchange="Profile._saveCurrency(this.value)">
              ${['USD','GBP','AED','PKR','EUR'].map(c=>`<option value="${c}" ${currency===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="ob-field" style="display:flex;align-items:center;justify-content:space-between">
            <div class="ob-label" style="margin-bottom:0">Push Reminders</div>
            <div onclick="Profile._toggleNotifications()" style="width:44px;height:26px;background:${notifOn ? 'var(--green)' : 'var(--bg2)'};border-radius:13px;border:1px solid var(--border);position:relative;cursor:pointer;transition:background 0.2s;flex-shrink:0">
              <div style="position:absolute;top:3px;${notifOn ? 'right:3px' : 'left:3px'};width:18px;height:18px;border-radius:50%;background:white;transition:all 0.2s;"></div>
            </div>
          </div>
          <div class="ob-field" style="margin-bottom:0;display:flex;align-items:center;justify-content:space-between">
            <div class="ob-label" style="margin-bottom:0">Spiritual Mode</div>
            <div onclick="Profile._toggleSpiritual()" style="width:44px;height:26px;background:${spiritualMode ? 'var(--orange)' : 'var(--bg2)'};border-radius:13px;border:1px solid var(--border);position:relative;cursor:pointer;transition:background 0.2s;flex-shrink:0">
              <div style="position:absolute;top:3px;${spiritualMode ? 'right:3px' : 'left:3px'};width:18px;height:18px;border-radius:50%;background:white;transition:all 0.2s;"></div>
            </div>
          </div>
        </div>
      </div>

      ${spiritualMode ? `
      <div class="section-header"><span class="section-title">Prayer Anchors</span></div>
      <div style="padding:0 20px">
        <div style="padding:16px;background:var(--glass);border:1px solid var(--border);border-radius:var(--r);margin-bottom:10px">
          <div class="t-caption t-dim" style="margin-bottom:12px">Use your prayer times as recovery check-ins</div>
          ${[
            { name: 'Fajr', time: 'Morning', note: 'Set your intention for the day. Declare your commitment.' },
            { name: 'Dhuhr', time: 'Midday', note: 'Midday check-in. How are cravings so far?' },
            { name: 'Asr', time: 'Afternoon', note: 'Afternoon reset. High-risk window for many.' },
            { name: 'Maghrib', time: 'Evening', note: 'Evening review. Reflect on your wins today.' },
            { name: 'Isha', time: 'Night', note: 'Night protection. Highest risk window. Guard this time.' },
          ].map((p, i, arr) => `
            <div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;${i < arr.length-1 ? 'border-bottom:1px solid var(--border)' : ''}">
              <div style="min-width:62px">
                <div style="font-size:0.85rem;font-weight:700;color:var(--text)">${p.name}</div>
                <div style="font-size:0.7rem;color:var(--text3)">${p.time}</div>
              </div>
              <div style="font-size:0.8rem;color:var(--text2);line-height:1.4">${p.note}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <div class="section-header"><span class="section-title">Hair Recovery Tracking</span></div>
      <div style="padding:0 20px">
        <div class="t-caption t-dim" style="margin-bottom:12px">Quitting habits supports hair follicle health</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
          ${[
            { id: 'none', icon: '🚫', label: 'No treatment' },
            { id: 'minoxidil', icon: '💧', label: 'Minoxidil' },
            { id: 'finasteride', icon: '💊', label: 'Finasteride / Dut.' },
            { id: 'both', icon: '💊💧', label: 'Both' },
            { id: 'natural', icon: '🌿', label: 'Natural approach' },
            { id: 'transplant', icon: '🏥', label: 'Hair transplant' },
          ].map(t => `
            <div onclick="Profile._setHairTreatment('${t.id}')" style="padding:12px 8px;background:${hairTreatment===t.id ? 'rgba(255,107,53,0.12)' : 'var(--glass)'};border:1px solid ${hairTreatment===t.id ? 'var(--orange)' : 'var(--border)'};border-radius:var(--r-sm);cursor:pointer;touch-action:manipulation;text-align:center">
              <div style="font-size:1.2rem;margin-bottom:4px">${t.icon}</div>
              <div style="font-size:0.7rem;font-weight:600;color:${hairTreatment===t.id ? 'var(--orange)' : 'var(--text2)'}">${t.label}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section-header"><span class="section-title">Clinician Summary</span></div>
      <div style="padding:0 20px 12px">
        <p class="t-caption t-dim" style="margin-bottom:10px;line-height:1.5">Generate a printable summary of habits, milestones, and recovery score — no raw journal text included.</p>
        <button class="btn btn-ghost" style="width:100%" onclick="Profile._exportClinicianSummary()">🖨 Export Clinician Summary</button>
      </div>

      <div class="section-header"><span class="section-title">Enterprise Demo</span></div>
      <div style="padding:0 20px 12px">
        <p class="t-caption t-dim" style="margin-bottom:10px;line-height:1.5">Load anonymized sample habits, journal triggers, and craving history for investor demos — no code edits required.</p>
        <button class="btn btn-primary" style="width:100%;margin-bottom:8px" onclick="Profile._loadDemo()">📦 Load Demo Recovery Profile</button>
      </div>

      <div style="padding:0 20px;margin-bottom:8px">
        <button class="btn btn-ghost" style="width:100%;text-align:center;margin-bottom:8px" onclick="Profile._exportData()">Export Data (JSON)</button>
        <label class="btn btn-ghost" style="width:100%;text-align:center;display:block;cursor:pointer">
          Import Data
          <input type="file" accept=".json" style="display:none" onchange="Profile._importData(event)">
        </label>
      </div>

      <div style="padding:0 20px 8px">
        <div class="t-caption t-dim" style="text-align:center;margin-bottom:12px">SteadyCap v2.0.0 · Local-only · Not a medical device</div>
      </div>
      <div style="padding:0 20px 20px">
        <button class="btn btn-danger" onclick="Profile._reset()">Reset All Data</button>
      </div>
      <div style="height:8px"></div>

      <div id="profile-modal" style="display:none"></div>
    `;
  }

  function _saveName(val) {
    State.update(d => { d.user.name = val; });
  }

  function _saveCurrency(val) {
    State.update(d => { d.settings.currency = val; d.user.currency = val; });
  }

  function _saveGoals(val) {
    const goals = (val || '').split('\n').map(g => g.trim()).filter(Boolean).slice(0, 5);
    State.update(d => { d.user.goals = goals; });
  }

  function _exportData() {
    const json = State.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SteadyCap-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function _importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (State.importJSON(ev.target.result)) {
        App.showToast('Data imported successfully', 'success');
        render();
      } else {
        App.showToast('Import failed — invalid file', 'error');
      }
    };
    reader.readAsText(file);
  }

  function loadDemoData(opts) {
    const silent = opts && opts.silent;
    if (!silent && !confirm('Load demo recovery profile? Replaces current data with anonymized sample habits, journal entries, and craving log.')) return;
    const day = 86400000;
    const now = Date.now();
    const smokingQuit = new Date(now - 90 * day).toISOString();
    const vapeQuit = new Date(now - 2 * day).toISOString();
    State.update(d => {
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
          config: { deviceType: 'Pod System', nicType: 'Nicotine Salt (Nic Salt)', podsPerWeek: 2, costPerPod: 6, yearsVaping: 3 },
          relapses: [],
          createdAt: vapeQuit,
        },
      ];
      d.customHabits = [];
      d.medicines = [{
        id: 'demo-med-1', name: 'Nicotine patch', dose: '21mg', schedule: 'fixed',
        times: ['08:00'], enabled: true,
      }];
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
    localStorage.setItem(StorageMigrate.local('steadycap_journal_v1', ['dos_journal_v1']), JSON.stringify(journalEntries));
    if (!silent) App.showToast('Demo recovery profile loaded', 'success');
    render();
    if (window.Recovery) Recovery.render();
    if (window.Dashboard) Dashboard.render();
    return true;
  }

  function _loadDemo() {
    loadDemoData();
  }

  function _reset() {
    if (confirm('Reset ALL data? This cannot be undone.')) {
      State.reset();
      App.showToast('Data reset', 'info');
      State.set('onboardingComplete', false);
      document.getElementById('nav').style.display = 'none';
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      if (window.Onboarding) Onboarding.render();
    }
  }

  function _editHabit(id, isCustom) {
    const habits = State.getAllHabits();
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    if (isCustom || habit.isCustom) return _editCustomHabit(id);
    const hCfg = (window.HABITS_CONFIG || {})[habit.type];
    if (!hCfg) return;
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    const cfg = habit.config || {};
    modal.style.display = 'block';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end" onclick="if(event.target===this)Profile._closeModal()">
        <div style="background:var(--bg3);border-radius:var(--r-lg) var(--r-lg) 0 0;padding:24px 20px calc(20px + env(safe-area-inset-bottom));width:100%;max-height:80vh;overflow-y:auto">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <div class="t-heading">${hCfg.icon} ${hCfg.name}</div>
            <button onclick="Profile._closeModal()" style="background:none;border:none;color:var(--text3);font-size:1.2rem;cursor:pointer">✕</button>
          </div>
          <div class="ob-field">
            <div class="ob-label">Quit date</div>
            <input class="ob-input" type="datetime-local" id="edit-quit" value="${DateTimeLocal.toInputValue(habit.quitTime)}">
          </div>
          ${hCfg.configFields.filter(f=>f.type!=='hidden').map(f=>{
            if(f.type==='select') return `<div class="ob-field"><div class="ob-label">${f.label}</div><select class="ob-select" id="edit_${f.id}" name="${f.id}">${(f.options||[]).map(o=>`<option value="${o}" ${cfg[f.id]===o?'selected':''}>${o}</option>`).join('')}</select></div>`;
            return `<div class="ob-field"><div class="ob-label">${f.label}</div><input class="ob-input" type="${f.type==='text'?'text':'number'}" id="edit_${f.id}" name="${f.id}" value="${cfg[f.id]||''}" placeholder="${f.placeholder||''}"></div>`;
          }).join('')}
          <button class="btn btn-primary" onclick="Profile._saveEdit('${id}')">Save Changes</button>
        </div>
      </div>
    `;
  }

  function _saveEdit(id) {
    const habits = State.get('habits') || [];
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    const hCfg = (window.HABITS_CONFIG || {})[habit.type];
    const quitEl = document.getElementById('edit-quit');
    const newQuit = quitEl ? DateTimeLocal.fromInputValue(quitEl.value) : habit.quitTime;
    const newCfg = {};
    if (hCfg) {
      hCfg.configFields.forEach(f => {
        const el = document.getElementById('edit_' + f.id);
        if (el) newCfg[f.id] = el.type === 'number' ? parseFloat(el.value) || 0 : el.value;
      });
    }
    State.updateHabit(id, { quitTime: newQuit, config: newCfg });
    _closeModal();
    App.showToast('Habit updated', 'success');
    render();
  }

  function _closeModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'none';
  }

  function _addHabit() {
    const habits = window.HABITS_CONFIG || {};
    const existing = (State.get('habits') || []).map(h => h.type);
    const available = Object.entries(habits).filter(([k]) => !existing.includes(k));
    if (!available.length) { App.showToast('All habits already tracked', 'info'); return; }
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    modal.style.display = 'block';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end" onclick="if(event.target===this)Profile._closeModal()">
        <div style="background:var(--bg3);border-radius:var(--r-lg) var(--r-lg) 0 0;padding:24px 20px calc(20px + env(safe-area-inset-bottom));width:100%;max-height:70vh;overflow-y:auto">
          <div class="t-heading" style="margin-bottom:16px">Add a Habit</div>
          <div class="habit-grid">
            ${available.map(([k,h])=>`
              <div class="habit-chip" onclick="Profile._startAddHabit('${k}')">
                <span class="habit-chip-icon">${h.icon}</span>
                <span class="habit-chip-name">${h.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function _startAddHabit(type) {
    const hCfg = (window.HABITS_CONFIG || {})[type];
    if (!hCfg) return;
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    const now = DateTimeLocal.nowInputValue();
    modal.style.display = 'block';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end" onclick="if(event.target===this)Profile._closeModal()">
        <div style="background:var(--bg3);border-radius:var(--r-lg) var(--r-lg) 0 0;padding:24px 20px calc(20px + env(safe-area-inset-bottom));width:100%;max-height:80vh;overflow-y:auto">
          <div class="t-heading" style="margin-bottom:16px">${hCfg.icon} ${hCfg.name}</div>
          <div class="ob-field">
            <div class="ob-label">Quit date</div>
            <input class="ob-input" type="datetime-local" id="add-quit" value="${now}">
          </div>
          ${hCfg.configFields.filter(f=>f.type!=='hidden').map(f=>{
            if(f.type==='select') return `<div class="ob-field"><div class="ob-label">${f.label}</div><select class="ob-select" id="add_${f.id}">${(f.options||[]).map(o=>`<option value="${o}">${o}</option>`).join('')}</select></div>`;
            return `<div class="ob-field"><div class="ob-label">${f.label}</div><input class="ob-input" type="${f.type==='text'?'text':'number'}" id="add_${f.id}" placeholder="${f.placeholder||''}"></div>`;
          }).join('')}
          <button class="btn btn-primary" onclick="Profile._confirmAddHabit('${type}')">Add Habit</button>
        </div>
      </div>
    `;
  }

  function _confirmAddHabit(type) {
    const hCfg = (window.HABITS_CONFIG || {})[type];
    const quitEl = document.getElementById('add-quit');
    const quitTime = quitEl ? DateTimeLocal.fromInputValue(quitEl.value) : new Date().toISOString();
    const cfg = {};
    if (hCfg) {
      hCfg.configFields.forEach(f => {
        const el = document.getElementById('add_' + f.id);
        if (el) cfg[f.id] = el.type === 'number' ? parseFloat(el.value) || 0 : el.value;
      });
    }
    _closeModal();
    State.addHabit({ type, quitTime, config: cfg });
    App.showToast('Habit added', 'success');
    render();
  }

  function _toggleSpiritual() {
    const user = State.get('user') || {};
    State.set('user', { ...user, spiritualMode: !user.spiritualMode });
    render();
  }

  function _setHairTreatment(val) {
    const user = State.get('user') || {};
    State.set('user', { ...user, hairTreatment: val });
    render();
  }

  function _toggleNotifications() {
    if (Notifications.permission() === 'granted') {
      State.update(d => { d.settings.notificationsEnabled = !d.settings.notificationsEnabled; });
      if (State.get('settings').notificationsEnabled) Notifications.startChecking();
      render();
    } else {
      Notifications.enableAndStart().then(ok => {
        App.showToast(ok ? 'Reminders enabled' : 'Notifications blocked — in-app nudges still work', ok ? 'success' : 'info');
        render();
      });
    }
  }

  function _addMed() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    modal.style.display = 'block';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end" onclick="if(event.target===this)Profile._closeModal()">
        <div style="background:var(--bg3);border-radius:var(--r-lg) var(--r-lg) 0 0;padding:24px 20px calc(20px + env(safe-area-inset-bottom));width:100%;max-height:80vh;overflow-y:auto">
          <div class="t-heading" style="margin-bottom:16px">Add Medicine</div>
          <div class="ob-field"><div class="ob-label">Name</div><input class="ob-input" id="med-name" placeholder="e.g. Finasteride"></div>
          <div class="ob-field"><div class="ob-label">Dose</div><input class="ob-input" id="med-dose" placeholder="e.g. 1mg"></div>
          <div class="ob-field"><div class="ob-label">Schedule</div>
            <select class="ob-select" id="med-schedule" onchange="document.getElementById('med-times-wrap').style.display=this.value==='fixed'?'block':'none'">
              <option value="fixed">Fixed times</option>
              <option value="as_needed">As needed</option>
            </select>
          </div>
          <div class="ob-field" id="med-times-wrap"><div class="ob-label">Times (comma-separated)</div><input class="ob-input" id="med-times" placeholder="08:00, 20:00" value="08:00, 20:00"></div>
          <button class="btn btn-primary" onclick="Profile._saveMed()">Save Medicine</button>
        </div>
      </div>`;
  }

  function _saveMed(editId) {
    const name = document.getElementById('med-name')?.value?.trim();
    if (!name) { App.showToast('Name required', 'error'); return; }
    const dose = document.getElementById('med-dose')?.value?.trim() || '';
    const schedule = document.getElementById('med-schedule')?.value || 'fixed';
    const timesRaw = document.getElementById('med-times')?.value || '08:00';
    const times = schedule === 'fixed' ? timesRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (editId) {
      State.updateMedicine(editId, { name, dose, schedule, times });
      App.showToast('Medicine updated', 'success');
    } else {
      State.addMedicine({ name, dose, schedule, times });
      App.showToast('Medicine added', 'success');
    }
    _closeModal();
    render();
  }

  function _editMed(id) {
    const med = (State.get('medicines') || []).find(m => m.id === id);
    if (!med) return;
    _addMed();
    setTimeout(() => {
      document.getElementById('med-name').value = med.name;
      document.getElementById('med-dose').value = med.dose || '';
      document.getElementById('med-schedule').value = med.schedule;
      document.getElementById('med-times-wrap').style.display = med.schedule === 'fixed' ? 'block' : 'none';
      document.getElementById('med-times').value = (med.times || []).join(', ');
      const btn = document.querySelector('#profile-modal .btn-primary');
      if (btn) { btn.onclick = () => Profile._saveMed(id); btn.textContent = 'Update Medicine'; }
    }, 50);
  }

  function _removeMed(id) {
    if (confirm('Remove this medicine?')) { State.removeMedicine(id); render(); }
  }

  function _toggleMed(id) {
    const med = (State.get('medicines') || []).find(m => m.id === id);
    if (med) { State.updateMedicine(id, { enabled: !med.enabled }); render(); }
  }

  function _addRoutine(cat) {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    modal.style.display = 'block';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end" onclick="if(event.target===this)Profile._closeModal()">
        <div style="background:var(--bg3);border-radius:var(--r-lg) var(--r-lg) 0 0;padding:24px 20px calc(20px + env(safe-area-inset-bottom));width:100%">
          <div class="t-heading" style="margin-bottom:16px">Add ${cat} step</div>
          <div class="ob-field"><div class="ob-label">Step name</div><input class="ob-input" id="routine-label" placeholder="e.g. Cleanser, Minoxidil"></div>
          <div class="ob-field"><div class="ob-label">When</div>
            <select class="ob-select" id="routine-slot">
              <option value="am">AM (morning)</option>
              <option value="pm">PM (evening)</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="Profile._saveRoutine('${cat}')">Add Step</button>
        </div>
      </div>`;
  }

  function _saveRoutine(cat) {
    const label = document.getElementById('routine-label')?.value?.trim();
    const slot = document.getElementById('routine-slot')?.value || 'am';
    if (!label) { App.showToast('Step name required', 'error'); return; }
    State.addRoutineStep(cat, slot, label);
    _closeModal();
    App.showToast('Step added', 'success');
    render();
  }

  function _removeRoutine(cat, slot, id) {
    if (confirm('Remove this step?')) { State.removeRoutineStep(cat, slot, id); render(); }
  }

  function _addCustomHabit() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    const icons = ['✨', '🎯', '🔥', '💪', '🚫', '📵', '🍕', '🎰', '💳', '🛒'];
    modal.style.display = 'block';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end" onclick="if(event.target===this)Profile._closeModal()">
        <div style="background:var(--bg3);border-radius:var(--r-lg) var(--r-lg) 0 0;padding:24px 20px calc(20px + env(safe-area-inset-bottom));width:100%">
          <div class="t-heading" style="margin-bottom:16px">Custom Habit</div>
          <div class="ob-field"><div class="ob-label">Habit name</div><input class="ob-input" id="custom-name" placeholder="e.g. Nail biting"></div>
          <div class="ob-field"><div class="ob-label">Icon</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">${icons.map(i => `<span onclick="Profile._pickIcon('${i}')" class="habit-chip" style="padding:8px 12px;cursor:pointer" id="icon-${i}">${i}</span>`).join('')}</div>
            <input type="hidden" id="custom-icon" value="✨">
          </div>
          <div class="ob-field"><div class="ob-label">Quit date</div><input class="ob-input" type="datetime-local" id="custom-quit" value="${DateTimeLocal.nowInputValue()}"></div>
          <button class="btn btn-primary" onclick="Profile._saveCustomHabit()">Add Custom Habit</button>
        </div>
      </div>`;
  }

  function _pickIcon(icon) {
    document.getElementById('custom-icon').value = icon;
    document.querySelectorAll('[id^="icon-"]').forEach(el => el.classList.remove('selected'));
    const el = document.getElementById('icon-' + icon);
    if (el) el.classList.add('selected');
  }

  function _saveCustomHabit() {
    const name = document.getElementById('custom-name')?.value?.trim();
    const icon = document.getElementById('custom-icon')?.value || '✨';
    const quitTime = DateTimeLocal.fromInputValue(document.getElementById('custom-quit')?.value);
    if (!name) { App.showToast('Name required', 'error'); return; }
    State.addCustomHabit({ name, icon, quitTime });
    _closeModal();
    App.showToast('Custom habit added', 'success');
    render();
  }

  function _editCustomHabit(id) {
    const habit = (State.get('customHabits') || []).find(h => h.id === id);
    if (!habit) return;
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    modal.style.display = 'block';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end" onclick="if(event.target===this)Profile._closeModal()">
        <div style="background:var(--bg3);border-radius:var(--r-lg) var(--r-lg) 0 0;padding:24px 20px calc(20px + env(safe-area-inset-bottom));width:100%">
          <div class="t-heading" style="margin-bottom:16px">${habit.icon} ${habit.name}</div>
          <div class="ob-field"><div class="ob-label">Name</div><input class="ob-input" id="edit-custom-name" value="${habit.name}"></div>
          <div class="ob-field"><div class="ob-label">Quit date</div><input class="ob-input" type="datetime-local" id="edit-custom-quit" value="${DateTimeLocal.toInputValue(habit.quitTime)}"></div>
          <button class="btn btn-primary" onclick="Profile._saveCustomEdit('${id}')">Save</button>
          <button class="btn btn-danger" style="margin-top:8px" onclick="Profile._removeCustom('${id}')">Remove Habit</button>
        </div>
      </div>`;
  }

  function _saveCustomEdit(id) {
    const name = document.getElementById('edit-custom-name')?.value?.trim();
    const quitTime = DateTimeLocal.fromInputValue(document.getElementById('edit-custom-quit')?.value);
    if (!name) return;
    State.updateHabit(id, { name, quitTime }, true);
    _closeModal();
    App.showToast('Habit updated', 'success');
    render();
  }

  function _exportClinicianSummary() {
    const habits = State.getAllHabits();
    const user = State.get('user') || {};
    const settings = State.get('settings') || {};
    const currency = settings.currency || 'USD';
    const sym = FinanceEngine.CURRENCY_SYMBOLS[currency] || '$';
    const cravingLog = State.get('cravingLog') || [];
    const cravingsSurvived = cravingLog.filter(c => c.survived).length;
    const longest = State.longestStreak ? State.longestStreak() : 0;
    const score = window.RecoveryEngine && habits.length
      ? RecoveryEngine.recoveryScore(habits)
      : null;

    const habitRows = habits.map(h => {
      const cfg = State.habitConfig(h.type, h.isCustom, h);
      const days = RecoveryEngine.daysClean(h.quitTime);
      const fin = FinanceEngine.calculate(h, currency);
      const milestone = RecoveryEngine.currentMilestone(h.type, h.quitTime);
      return `<tr>
        <td>${cfg.name || h.type}</td>
        <td>${days} days</td>
        <td>${(h.relapses || []).length}</td>
        <td>${fin.hasCost ? sym + fin.savedTotal.toFixed(0) : '—'}</td>
        <td>${milestone ? milestone.title : '—'}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>SteadyCap Clinician Summary</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#111;max-width:720px;margin:32px auto;padding:0 24px;line-height:1.5}
  h1{font-size:22px;margin-bottom:4px} .sub{color:#555;font-size:13px;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
  th,td{border:1px solid #ddd;padding:8px 10px;text-align:left}
  th{background:#f5f5f5;font-weight:600}
  .metric{display:inline-block;margin-right:24px;margin-bottom:8px}
  .metric strong{display:block;font-size:20px}
  @media print{body{margin:16px}}
</style></head><body>
<h1>Recovery Summary</h1>
<p class="sub">${user.name || 'Patient'} · Generated ${new Date().toLocaleDateString()} · SteadyCap (local data only)</p>
<div>
  <div class="metric"><span>Recovery Score</span><strong>${score != null ? score + '/100' : '—'}</strong></div>
  <div class="metric"><span>Longest Streak</span><strong>${longest} days</strong></div>
  <div class="metric"><span>Cravings Survived</span><strong>${cravingsSurvived}</strong></div>
</div>
<h2>Habits & Milestones</h2>
<table><thead><tr><th>Habit</th><th>Days Clean</th><th>Relapses</th><th>Saved</th><th>Current Milestone</th></tr></thead>
<tbody>${habitRows || '<tr><td colspan="5">No habits tracked</td></tr>'}</tbody></table>
<p style="font-size:11px;color:#888;margin-top:32px">Anonymized export — journal entries and SOS content excluded. For clinical use only with patient consent.</p>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) { App.showToast('Allow pop-ups to print summary', 'error'); return; }
    w.document.write(html);
    w.document.close();
  }

  function _removeCustom(id) {
    if (confirm('Remove this custom habit?')) {
      State.removeCustomHabit(id);
      _closeModal();
      render();
    }
  }

  return {
    render, loadDemoData, _saveName, _saveCurrency, _saveGoals, _exportData, _importData, _reset, _loadDemo,
    _editHabit, _saveEdit, _closeModal, _addHabit, _startAddHabit, _confirmAddHabit,
    _toggleSpiritual, _setHairTreatment, _toggleNotifications,
    _addMed, _saveMed, _editMed, _removeMed, _toggleMed,
    _addRoutine, _saveRoutine, _removeRoutine,
    _addCustomHabit, _pickIcon, _saveCustomHabit, _editCustomHabit, _saveCustomEdit, _removeCustom,
    _exportClinicianSummary,
  };
})();
window.Profile = Profile;
