'use strict';
const Emergency = (() => {
  let phase = 0;
  let breathCycle = 0;
  let breathTimer = null;
  let breathState = 'inhale';
  let breathCount = 0;
  const TOTAL_CYCLES = 4;

  const ACTIONS = [
    { icon: '💪', label: '20 Push-Ups', desc: 'Drop and do 20 push-ups right now. Physical exertion burns off craving energy.', duration: 60 },
    { icon: '❄️', label: 'Cold Water Face', desc: 'Fill a basin or splash cold water on your face for 30 seconds. Activates the dive reflex.', duration: 30 },
    { icon: '🚶', label: 'Walk Outside', desc: 'Step outside and walk for 5 minutes. Change of environment breaks the craving cue.', duration: 300 },
    { icon: '💧', label: 'Drink Water', desc: 'Drink a full glass of water slowly. Occupies your hands and mouth, reduces craving intensity.', duration: 30 },
    { icon: '📞', label: 'Call Someone', desc: 'Call a friend or family member — anyone. Social connection is a craving interrupt.', duration: 0 },
    { icon: '🧊', label: 'Hold Ice', desc: 'Hold an ice cube in your hand. The sharp sensation interrupts the craving loop.', duration: 60 },
  ];
  let currentAction = 0;
  let actionTimer = null;
  let actionElapsed = 0;

  function render() {
    phase = 0;
    breathCycle = 0;
    breathState = 'inhale';
    breathCount = 0;
    if (breathTimer) clearInterval(breathTimer);
    if (actionTimer) clearInterval(actionTimer);
    currentAction = 0;
    actionElapsed = 0;
    renderPhase();
  }

  function renderPhase() {
    const screen = document.getElementById('screen-emergency');
    if (!screen) return;
    const habits = State.getAllHabits();
    const habitKey = StorageMigrate.session('steadycap_recovery_habit', ['dos_recovery_habit']);
    const selectedId = sessionStorage.getItem(habitKey);
    const primary = habits.find(h => h.id === selectedId) || habits[0];

    const dots = [0,1,2,3,4].map(i =>
      `<div class="sos-dot${i<phase?' done':i===phase?' active':''}"></div>`
    ).join('');

    let content = '';
    if (phase === 0) content = buildBreath();
    else if (phase === 1) content = buildWhy(primary);
    else if (phase === 2) content = buildProgress(primary);
    else if (phase === 3) content = buildAction();
    else content = buildComplete();

    screen.innerHTML = `
      <div class="emergency-screen">
        <div class="sos-header" style="padding:calc(env(safe-area-inset-top,20px)+16px) 20px 16px">
          <div style="font-size:0.7rem;font-weight:800;letter-spacing:0.2em;color:var(--text3)">SOS</div>
          <button type="button" onclick="Emergency._skipAll()" style="font-size:0.8rem;color:var(--text3);background:none;border:none;cursor:pointer">Skip all</button>
        </div>
        <div class="sos-phase-dots">${dots}</div>
        <div class="sos-content">${content}</div>
        <div class="sos-footer">
          ${phase < 4 ? `<div style="display:flex;gap:10px">
            <button type="button" class="btn btn-ghost" style="flex:1" onclick="Emergency._skip()">Skip →</button>
            ${phase > 0 ? `<button type="button" class="btn btn-ghost" style="padding:14px" onclick="Emergency._back()">←</button>` : ''}
          </div>` : ''}
        </div>
      </div>
    `;

    if (phase === 0) startBreath();
    if (phase === 3) setupAction();
  }

  function buildBreath() {
    const stateLabels = { inhale: 'Inhale', hold: 'Hold', exhale: 'Exhale' };
    const counts = { inhale: 4, hold: 7, exhale: 8 };
    return `
      <div style="text-align:center">
        <div class="t-label" style="margin-bottom:8px">Phase 1 · Breathe</div>
        <div class="t-display" style="margin-bottom:24px">Breathe First</div>
        <div class="breath-ring ${breathState}" id="breath-ring" style="margin:0 auto 24px">
          <div style="text-align:center">
            <div class="countdown" id="breath-count">4</div>
            <div style="font-size:0.75rem;color:var(--text2);font-weight:600" id="breath-label">${stateLabels[breathState]}</div>
          </div>
        </div>
        <div style="font-size:0.8rem;color:var(--text2)">4-7-8 · Cycle ${Math.min(breathCycle+1, TOTAL_CYCLES)} of ${TOTAL_CYCLES}</div>
        <div style="font-size:0.72rem;color:var(--text3);margin-top:6px">Inhale 4s · Hold 7s · Exhale 8s</div>
      </div>
    `;
  }

  function startBreath() {
    if (breathTimer) clearInterval(breathTimer);
    const sequence = [
      { state: 'inhale', duration: 4 },
      { state: 'hold', duration: 7 },
      { state: 'exhale', duration: 8 },
    ];
    let seqIdx = 0;
    let tick = sequence[0].duration;
    breathState = 'inhale';
    updateBreathUI(breathState, tick);

    breathTimer = setInterval(() => {
      tick--;
      if (tick <= 0) {
        seqIdx = (seqIdx + 1) % sequence.length;
        if (seqIdx === 0) {
          breathCycle++;
          if (breathCycle >= TOTAL_CYCLES) {
            clearInterval(breathTimer);
            setTimeout(() => { phase = 1; renderPhase(); }, 800);
            return;
          }
        }
        breathState = sequence[seqIdx].state;
        tick = sequence[seqIdx].duration;
      }
      updateBreathUI(breathState, tick);
    }, 1000);
  }

  function updateBreathUI(state, count) {
    const ring = document.getElementById('breath-ring');
    const countEl = document.getElementById('breath-count');
    const labelEl = document.getElementById('breath-label');
    if (!ring) return;
    ring.className = `breath-ring ${state}`;
    if (countEl) countEl.textContent = count;
    if (labelEl) labelEl.textContent = { inhale: 'Inhale', hold: 'Hold', exhale: 'Exhale' }[state];
  }

  function buildWhy(habit) {
    const user = State.get('user') || {};
    const goals = user.goals || [];
    const hCfg = habit && (window.HABITS_CONFIG||{})[habit.type];
    const insight = RecoveryEngine.todayInsight();
    return `
      <div style="text-align:center;width:100%">
        <div class="t-label" style="margin-bottom:8px">Phase 2 · Purpose</div>
        <div class="t-display" style="margin-bottom:20px">Remember Why</div>
        ${goals.length ? goals.map(g => `<div style="background:rgba(255,107,53,0.08);border:1px solid rgba(255,107,53,0.2);border-radius:var(--r);padding:14px 20px;margin-bottom:10px;font-size:0.9rem;font-weight:600;color:var(--text)">${g}</div>`).join('') :
          `<div style="font-size:1rem;color:var(--text2);margin-bottom:20px;line-height:1.6">What matters to you<br>more than this craving?</div>`}
        ${insight ? `<div class="card" style="margin-top:16px;text-align:left">
          <div style="font-size:0.65rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text3)">Today&apos;s note</div>
          <div style="font-size:0.82rem;color:var(--text2);margin-top:8px;line-height:1.6">${insight.text}</div>
        </div>` : ''}
      </div>
    `;
  }

  function buildProgress(habit) {
    if (!habit) return `<div class="t-display">Look How Far</div>`;
    const hrs = RecoveryEngine.hoursClean(habit.quitTime);
    const days = RecoveryEngine.daysClean(habit.quitTime);
    const type = habit.isCustom ? 'custom' : habit.type;
    const tl = (window.RECOVERY_TIMELINES || {})[type] || [];
    const reached = tl.filter(m => hrs >= m.hours).slice(-3);
    const habits = State.getAllHabits();
    const linked = window.LinkedRecoveryEngine;
    const systems = (linked
      ? linked.getLinkedBodySystems(habit, habits)
      : BodyEngine.getBodySystems(type, hrs)).slice(0, 3);
    return `
      <div style="width:100%">
        <div class="t-label" style="text-align:center;margin-bottom:8px">Phase 3 · Evidence</div>
        <div class="t-display" style="text-align:center;margin-bottom:6px">Look What's Healed</div>
        <div style="text-align:center;font-size:0.85rem;color:var(--green);font-weight:700;margin-bottom:20px">${days} days of healing</div>
        ${reached.length ? reached.map(m=>`
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px;padding:12px;background:rgba(6,214,160,0.06);border:1px solid rgba(6,214,160,0.15);border-radius:var(--r-sm)">
            <span style="font-size:1.2rem">${m.icon||'✓'}</span>
            <div>
              <div style="font-size:0.85rem;font-weight:700;color:var(--text)">${m.title}</div>
              <div style="font-size:0.75rem;color:var(--text2)">${m.body.substring(0,70)}…</div>
            </div>
          </div>
        `).join('') : `<div style="color:var(--text3);font-size:0.85rem;text-align:center;margin-bottom:12px">${days} day${days === 1 ? '' : 's'} clean — healing milestones unlock as you progress.</div>`}
        ${systems.map(s=>`
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span>${s.icon}</span>
            <span style="font-size:0.75rem;color:var(--text2);width:80px">${s.label}</span>
            <div style="flex:1;height:4px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden">
              <div style="height:100%;background:var(--green);border-radius:2px;width:${s.pct}%"></div>
            </div>
            <span style="font-size:0.72rem;font-weight:700;color:var(--green);width:30px;text-align:right">${s.pct}%</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function buildAction() {
    const action = ACTIONS[currentAction];
    return `
      <div style="text-align:center;width:100%">
        <div class="t-label" style="margin-bottom:8px">Phase 4 · Act</div>
        <div class="t-display" style="margin-bottom:6px">Do This Now</div>
        <div style="font-size:3rem;margin-bottom:12px">${action.icon}</div>
        <div style="font-size:1.2rem;font-weight:700;color:var(--text);margin-bottom:12px">${action.label}</div>
        <div style="font-size:0.85rem;color:var(--text2);line-height:1.6;margin-bottom:20px">${action.desc}</div>
        ${action.duration ? `<div id="action-timer" style="font-size:2rem;font-weight:800;color:var(--teal)">${action.duration}s</div>` : ''}
        <button type="button" class="btn btn-ghost" style="margin-top:16px" onclick="Emergency._shuffleAction()">Try another action</button>
        <button type="button" class="btn btn-teal" style="margin-top:10px;border-radius:var(--r);padding:14px 20px;width:100%" onclick="Emergency._nextPhase()">Done → Complete</button>
      </div>
    `;
  }

  function setupAction() {
    const action = ACTIONS[currentAction];
    if (!action.duration) return;
    let remaining = action.duration;
    actionTimer = setInterval(() => {
      remaining--;
      const el = document.getElementById('action-timer');
      if (el) el.textContent = remaining + 's';
      if (remaining <= 0) {
        clearInterval(actionTimer);
        if (el) el.style.color = 'var(--green)';
      }
    }, 1000);
  }

  function buildComplete() {
    const cravings = (State.get('cravingLog')||[]).filter(c=>c.survived).length;
    return `
      <div style="text-align:center">
        <div style="font-size:4rem;margin-bottom:16px">✅</div>
        <div style="font-size:1.8rem;font-weight:800;color:var(--green);letter-spacing:-0.02em;margin-bottom:8px">Craving Survived</div>
        <div style="font-size:0.9rem;color:var(--text2);margin-bottom:24px">You proved it doesn't control you.</div>
        <div style="font-size:0.8rem;color:var(--text3)">Total cravings survived: <strong style="color:var(--green)">${cravings}</strong></div>
        <button type="button" class="btn btn-primary" style="margin-top:28px" onclick="Navigation.go('dashboard')">Return Home</button>
      </div>
    `;
  }

  function _skip() {
    if (phase === 0 && breathTimer) clearInterval(breathTimer);
    if (phase === 3 && actionTimer) clearInterval(actionTimer);
    _nextPhase();
  }

  function _nextPhase() {
    if (phase === 3) {
      const habits = State.get('habits') || [];
      if (habits.length) State.logCraving(habits[0].id, 7);
    }
    phase = Math.min(4, phase + 1);
    renderPhase();
  }

  function _back() {
    phase = Math.max(0, phase - 1);
    renderPhase();
  }

  function _skipAll() {
    if (breathTimer) clearInterval(breathTimer);
    if (actionTimer) clearInterval(actionTimer);
    const habits = State.get('habits') || [];
    if (habits.length) State.logCraving(habits[0].id, 7);
    phase = 4;
    renderPhase();
  }

  function _shuffleAction() {
    if (actionTimer) clearInterval(actionTimer);
    currentAction = (currentAction + 1) % ACTIONS.length;
    renderPhase();
  }

  return { render, _skip, _nextPhase, _back, _skipAll, _shuffleAction };
})();
window.Emergency = Emergency;
