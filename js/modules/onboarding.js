'use strict';
const Onboarding = (() => {
  let step = 0;
  let selectedHabits = [];
  let habitConfigs = {};

  function render() {
    const screen = document.getElementById('screen-onboarding');
    if (!screen) return;
    screen.classList.add('active');
    document.getElementById('nav').style.display = 'none';
    renderStep();
  }

  function renderStep() {
    const screen = document.getElementById('screen-onboarding');
    if (step === 0) screen.innerHTML = buildWelcome();
    else if (step === 1) screen.innerHTML = buildStep1();
    else if (step === 2) screen.innerHTML = buildStep2();
    else if (step === 3) screen.innerHTML = buildStep3();
  }

  function buildDots(active) {
    return `<div class="ob-progress">${[1,2,3].map(i =>
      `<div class="ob-dot${i < active ? ' done' : i === active ? ' active' : ''}"></div>`
    ).join('')}</div>`;
  }

  function buildWelcome() {
    return `<div class="ob-screen" style="text-align:center;padding:0 28px;justify-content:center;min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:0">
      <div style="font-size:72px;line-height:1;margin-bottom:20px;filter:drop-shadow(0 4px 24px rgba(255,150,80,0.35))">🧡</div>
      <div class="ob-logo" style="font-size:26px;margin-bottom:12px">SteadyCap</div>
      <div class="ob-title" style="font-size:28px;font-weight:900;letter-spacing:-0.03em;margin-bottom:14px;line-height:1.2">Recovery is a system.<br>Not a streak.</div>
      <div class="ob-sub" style="font-size:16px;line-height:1.6;max-width:300px;margin-bottom:36px">This app tracks your progress — no judgment, no streaks lost forever. Every day counts. Even the hard ones.</div>
      <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:320px;margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:12px;background:rgba(255,150,80,0.08);border:1px solid rgba(255,150,80,0.2);border-radius:14px;padding:14px 16px">
          <span style="font-size:20px">🔒</span>
          <span style="font-size:13px;color:var(--text2,#ccc)">Private by default — your data never leaves this device</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;background:rgba(255,150,80,0.08);border:1px solid rgba(255,150,80,0.2);border-radius:14px;padding:14px 16px">
          <span style="font-size:20px">🧠</span>
          <span style="font-size:13px;color:var(--text2,#ccc)">Craving forecasts that actually predict hard moments</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;background:rgba(255,150,80,0.08);border:1px solid rgba(255,150,80,0.2);border-radius:14px;padding:14px 16px">
          <span style="font-size:20px">🆘</span>
          <span style="font-size:13px;color:var(--text2,#ccc)">5-phase SOS when you need it most — works offline</span>
        </div>
      </div>
      <button type="button" class="btn btn-primary" onclick="Onboarding._goToStep1()" style="width:100%;max-width:320px;padding:16px;font-size:16px;font-weight:700;border-radius:16px">I'm ready to start →</button>
      <p style="font-size:12px;color:var(--text3,#666);margin-top:14px">Takes about 90 seconds</p>
    </div>`;
  }

  function buildStep1() {
    const habits = window.HABITS_CONFIG || {};
    return `<div class="ob-screen">
      <div class="ob-logo">SteadyCap</div>
      ${buildDots(1)}
      <div class="ob-title">What are you quitting?</div>
      <div class="ob-sub">Select all that apply. You can add more later.</div>
      <div class="habit-grid" id="habit-grid">
        ${Object.entries(habits).map(([key, h]) => `
          <div class="habit-chip${selectedHabits.includes(key) ? ' selected' : ''}" data-habit="${key}" onclick="Onboarding._toggleHabit('${key}')">
            <span class="habit-chip-icon">${h.icon}</span>
            <span class="habit-chip-name">${h.name}</span>
          </div>
        `).join('')}
      </div>
      <div class="ob-footer">
        <button type="button" class="btn btn-primary" onclick="Onboarding._nextStep1()" id="ob-btn1" ${selectedHabits.length === 0 ? 'style="opacity:0.4"' : ''}>Continue →</button>
      </div>
    </div>`;
  }

  function buildStep2() {
    const habits = window.HABITS_CONFIG || {};
    const sections = selectedHabits.map(key => {
      const h = habits[key];
      if (!h) return '';
      const cfg = habitConfigs[key] || {};
      const fields = h.configFields.filter(f => f.type !== 'hidden');
      return `<div style="margin-bottom:28px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <span style="font-size:1.6rem">${h.icon}</span>
          <span class="t-heading">${h.name}</span>
        </div>
        <div class="ob-field">
          <div class="ob-label">When did you last use it?</div>
          <input class="ob-input" type="datetime-local" id="quit_${key}"
            value="${cfg.quitTime || DateTimeLocal.toInputValue(new Date(Date.now() - 3600000))}"
            oninput="Onboarding._setQuit('${key}', this.value)" onchange="Onboarding._setQuit('${key}', this.value)">
        </div>
        ${fields.map(f => {
          const shouldShow = !f.showIf || (cfg[f.showIf.field] === f.showIf.value);
          const style = shouldShow ? '' : 'style="display:none"';
          const fieldId = `f_${key}_${f.id}`;
          if (f.type === 'select') {
            return `<div class="ob-field" id="wrap_${key}_${f.id}" ${style}>
              <div class="ob-label">${f.label}</div>
              <select class="ob-select" id="${fieldId}" onchange="Onboarding._setField('${key}','${f.id}',this.value)">
                ${(f.options||[]).map(o => `<option value="${o}" ${cfg[f.id]===o?'selected':''}>${o}</option>`).join('')}
              </select></div>`;
          }
          if (f.type === 'text') {
            return `<div class="ob-field" id="wrap_${key}_${f.id}" ${style}>
              <div class="ob-label">${f.label}${f.optional?' <span style="color:var(--text3)">(optional)</span>':''}</div>
              <input class="ob-input" type="text" id="${fieldId}" placeholder="${f.placeholder||''}"
                value="${cfg[f.id]||''}" oninput="Onboarding._setField('${key}','${f.id}',this.value)"></div>`;
          }
          return `<div class="ob-field" id="wrap_${key}_${f.id}" ${style}>
            <div class="ob-label">${f.label}${f.optional?' <span style="color:var(--text3)">(optional)</span>':''}</div>
            <input class="ob-input" type="number" id="${fieldId}" placeholder="${f.placeholder||''}"
              value="${cfg[f.id]||''}" oninput="Onboarding._setField('${key}','${f.id}',this.value)"></div>`;
        }).join('')}
      </div>`;
    }).join('');

    return `<div class="ob-screen" style="overflow-y:auto;-webkit-overflow-scrolling:touch">
      <div class="ob-logo">SteadyCap</div>
      ${buildDots(2)}
      <div class="ob-title">Set your start date</div>
      <div class="ob-sub">When did you last use each habit?</div>
      ${sections}
      <div class="ob-footer">
        <button type="button" class="btn btn-primary" onclick="Onboarding._nextStep2()">Continue →</button>
        <button type="button" class="btn btn-ghost" style="text-align:center;padding:10px" onclick="Onboarding._back()">← Back</button>
      </div>
    </div>`;
  }

  function buildStep3() {
    const state = window.State ? State.get() : {};
    const name = (state.user && state.user.name) || '';
    const currency = (state.settings && state.settings.currency) || 'USD';
    return `<div class="ob-screen">
      <div class="ob-logo">SteadyCap</div>
      ${buildDots(3)}
      <div class="ob-title">Almost done</div>
      <div class="ob-sub">A few quick details to personalise your recovery.</div>
      <div class="ob-field">
        <div class="ob-label">Your name <span style="color:var(--text3)">(optional)</span></div>
        <input class="ob-input" type="text" id="ob-name" placeholder="What should we call you?" value="${name}">
      </div>
      <div class="ob-field">
        <div class="ob-label">Currency</div>
        <select class="ob-select" id="ob-currency">
          ${['USD','GBP','AED','PKR','EUR'].map(c => `<option value="${c}" ${currency===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="ob-field">
        <div class="ob-label">Why you're quitting <span style="color:var(--text3)">(powers SOS screen)</span></div>
        <textarea class="ob-input" id="ob-goals" rows="3" placeholder="One reason per line — e.g. My family, My health, Save money" style="resize:vertical;min-height:72px"></textarea>
      </div>
      <div class="ob-footer">
        <button type="button" class="btn btn-primary" onclick="Onboarding._finish()">Start Recovery →</button>
        <button type="button" class="btn btn-ghost" style="text-align:center;padding:10px" onclick="Onboarding._back()">← Back</button>
      </div>
    </div>`;
  }

  function _toggleHabit(key) {
    const idx = selectedHabits.indexOf(key);
    if (idx === -1) selectedHabits.push(key);
    else selectedHabits.splice(idx, 1);
    renderStep();
  }

  function _setQuit(key, val) {
    habitConfigs[key] = habitConfigs[key] || {};
    habitConfigs[key].quitTime = val;
  }

  function _setField(key, field, val) {
    habitConfigs[key] = habitConfigs[key] || {};
    habitConfigs[key][field] = val;
    const habits = window.HABITS_CONFIG || {};
    const hCfg = habits[key];
    if (hCfg) {
      hCfg.configFields.forEach(f => {
        if (f.showIf) {
          const wrap = document.getElementById(`wrap_${key}_${f.id}`);
          if (wrap) {
            wrap.style.display = (habitConfigs[key][f.showIf.field] === f.showIf.value) ? '' : 'none';
          }
        }
      });
    }
  }

  function _goToStep1() {
    step = 1;
    renderStep();
  }

  function _nextStep1() {
    if (selectedHabits.length === 0) return;
    step = 2;
    renderStep();
    setTimeout(() => document.querySelector('.ob-screen').scrollTop = 0, 50);
  }

  function _nextStep2() {
    selectedHabits.forEach(key => {
      const el = document.getElementById('quit_' + key);
      if (el && el.value) _setQuit(key, el.value);
    });
    step = 3;
    renderStep();
  }

  function _back() {
    if (step > 0) { step--; renderStep(); }
  }

  function _finish() {
    const name = document.getElementById('ob-name').value.trim();
    const currency = document.getElementById('ob-currency').value;
    const goalsRaw = (document.getElementById('ob-goals')?.value || '').trim();
    const goals = goalsRaw.split('\n').map(g => g.trim()).filter(Boolean).slice(0, 5);
    State.update(d => {
      d.user.name = name;
      d.user.currency = currency;
      d.user.goals = goals.length ? goals : d.user.goals;
      d.settings.currency = currency;
    });
    selectedHabits.forEach(key => {
      const cfg = habitConfigs[key] || {};
      const quitTime = cfg.quitTime
        ? DateTimeLocal.fromInputValue(cfg.quitTime)
        : new Date(Date.now() - 3600000).toISOString();
      const config = { ...cfg };
      delete config.quitTime;
      State.addHabit({ type: key, quitTime, config });
    });
    State.set('onboardingComplete', true);
    document.getElementById('nav').style.display = '';
    document.getElementById('screen-onboarding').classList.remove('active');
    if (window.App) App.launch();
  }

  return { render, _goToStep1, _toggleHabit, _setQuit, _setField, _nextStep1, _nextStep2, _back, _finish };
})();
window.Onboarding = Onboarding;
