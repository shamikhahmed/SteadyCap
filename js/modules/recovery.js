'use strict';
const Recovery = (() => {
  let currentHabitId = null;
  const STORAGE_KEY = StorageMigrate.session('steadycap_recovery_habit', ['dos_recovery_habit']);

  function habitType(habit) {
    return habit.isCustom ? 'custom' : habit.type;
  }

  function resolveHabitId(habitId, habits) {
    const ids = new Set(habits.map(h => h.id));
    if (habitId && ids.has(habitId)) return habitId;
    if (currentHabitId && ids.has(currentHabitId)) return currentHabitId;
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && ids.has(saved)) return saved;
    return habits[0] ? habits[0].id : null;
  }

  function getSelectedHabitId() {
    return currentHabitId || sessionStorage.getItem(STORAGE_KEY);
  }

  function render(habitId) {
    const screen = document.getElementById('screen-recovery');
    if (!screen) return;
    const habits = State.getAllHabits();

    if (!habits.length) {
      screen.innerHTML = `<div style="padding:40px 20px;text-align:center;color:var(--text3)">
        <div style="font-size:36px;margin-bottom:10px">🧡</div>
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:8px">No habits yet</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.5;margin-bottom:16px">Add a habit in Profile to start tracking recovery milestones.</div>
        <button type="button" class="btn btn-primary" onclick="Navigation.go('profile');setTimeout(function(){Profile._addHabit()},200)" style="max-width:240px;margin:0 auto">Add habit in Profile →</button></div>`;
      return;
    }

    currentHabitId = resolveHabitId(habitId, habits);
    if (currentHabitId) sessionStorage.setItem(STORAGE_KEY, currentHabitId);
    const habit = habits.find(h => h.id === currentHabitId) || habits[0];
    if (!habit) return;

    const hCfg = State.habitConfig(habit.type, habit.isCustom, habit);
    const type = habitType(habit);
    const hrs = RecoveryEngine.hoursClean(habit.quitTime);
    const days = RecoveryEngine.daysClean(habit.quitTime);
    const phase = RecoveryEngine.recoveryPhase(hrs);
    const timeline = (window.RECOVERY_TIMELINES || {})[type] || [];
    const linked = window.LinkedRecoveryEngine;
    const linkedDop = linked ? linked.getLinkedDopamine(habit, habits) : null;
    const dopStage = linkedDop ? linkedDop.stage : DopamineEngine.getStage(type, hrs);
    const dopProg = linkedDop ? linkedDop.progress : DopamineEngine.progressInStage(type, hrs);
    const systems = linked
      ? linked.getLinkedBodySystems(habit, habits)
      : BodyEngine.getBodySystems(type, hrs);
    const interferences = linked ? linked.getInterferences(habit, habits) : [];
    const wholeBody = linked && habits.length > 1 ? linked.wholeBodySummary(habits) : null;
    const relapses = (habit.relapses || []).length;
    const integrityPct = relapses === 0 ? 100 : Math.max(0, Math.round(100 - (relapses / (days + 1)) * 100 * 7));
    const program = window.ProgramData ? ProgramData.getProgram(type) : null;
    const programWeek = window.ProgramData ? ProgramData.currentWeek(days) : 1;
    const weekData = program ? program.weeks.find(w => w.week === programWeek) : null;
    const currentM = RecoveryEngine.currentMilestone(type, habit.quitTime);
    const cravingLog = State.get('cravingLog') || [];
    let triggerHtml = '';
    if (window.TriggerEngine) {
      const journalEntries = (window.Journal && Journal.getEntries) ? Journal.getEntries() : [];
      const forecast = TriggerEngine.forecastCard(cravingLog, habits, habit, journalEntries);
      const { risk, withdrawalWarning, analysis } = forecast;
      const parts = [];
      if (withdrawalWarning) {
        parts.push(`<div style="padding:12px 14px;background:rgba(255,107,53,0.1);border:1px solid rgba(255,107,53,0.3);border-radius:var(--r-sm);margin-bottom:8px">
          <div style="font-size:0.7rem;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Withdrawal Alert</div>
          <div style="font-size:0.82rem;color:var(--text2);line-height:1.5">${withdrawalWarning}</div></div>`);
      }
      if (risk.level === 'high' || risk.level === 'medium') {
        parts.push(`<div style="padding:12px 14px;background:rgba(255,255,255,0.03);border:1px solid ${risk.color}40;border-radius:var(--r-sm);margin-bottom:8px">
          <div style="font-size:0.7rem;font-weight:700;color:${risk.color};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">${risk.label}</div>
          <div style="font-size:0.82rem;color:var(--text2)">Higher-risk window based on your patterns.</div></div>`);
      }
      if (analysis && analysis.insights) {
        analysis.insights.forEach(ins => {
          parts.push(`<div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
            <span>${ins.icon}</span><span style="font-size:0.82rem;color:var(--text2);line-height:1.4">${ins.message}</span></div>`);
        });
      }
      if (parts.length) {
        triggerHtml = `<div style="padding:0 20px;margin-bottom:12px"><div class="section-title" style="margin-bottom:8px">Trigger forecast</div>${parts.join('')}</div>`;
      }
    }

    const selectorHtml = habits.length > 1 ? `
      <div class="cap-tab-bar" role="tablist" aria-label="Recovery habits" style="padding-left:20px;padding-right:20px">
        ${habits.map(h => {
          const hc = State.habitConfig(h.type, h.isCustom, h);
          const active = h.id === currentHabitId;
          return `<button type="button" class="cap-tab${active ? ' on' : ''}" role="tab" aria-selected="${active}" onclick="Recovery.selectHabit('${h.id}')">${hc.icon||''} ${hc.name||h.type}</button>`;
        }).join('')}
      </div>` : '';

    const hourlyCount = timeline.filter(m => m.hours <= 72).length;
    const timelineHtml = timeline.map(m => {
      const linkSt = linked ? linked.milestoneStatus(habit, habits, m, hrs) : null;
      const reached = linkSt ? linkSt.reached : hrs >= m.hours;
      const partial = linkSt?.partial;
      const isCurrent = currentM && currentM.hours === m.hours;
      const isHourly = m.hours <= 72;
      const ring = partial ? 'var(--gold)' : reached ? 'var(--green)' : isCurrent ? 'var(--orange)' : 'var(--border)';
      const mark = partial ? '◐' : reached ? '✓' : m.icon || '○';
      return `<div style="display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);align-items:flex-start${isHourly ? ';opacity:' + (reached ? '1' : '0.85') : ''}">
        <div style="width:32px;height:32px;border-radius:50%;border:2px solid ${ring};display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${reached ? (partial ? 'rgba(255,214,10,0.12)' : 'rgba(6,214,160,0.1)') : 'transparent'}">
          <span style="font-size:1rem">${mark}</span>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:0.88rem;font-weight:700;color:${reached ? 'var(--text)' : isCurrent ? 'var(--orange)' : 'var(--text3)'}">${m.title}</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">${RecoveryEngine.formatDuration(m.hours)} ${partial ? '— partial recovery' : reached ? '— reached' : ''}${isHourly ? ' · hourly' : ''}</div>
          ${partial && linkSt?.note ? `<div style="font-size:0.72rem;color:var(--gold);margin-top:4px;line-height:1.4">${linkSt.note}</div>` : ''}
          ${reached || isCurrent ? `<div style="font-size:0.78rem;color:var(--text2);margin-top:6px;line-height:1.5">${m.body}</div>` : ''}
          <div style="font-size:0.65rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-top:4px;color:${m.level === 'scientific' ? 'var(--green)' : 'var(--gold)'}">${m.level}</div>
        </div>
      </div>`;
    }).join('');

    const systemsHtml = systems.map(s => {
      const col = s.capped ? 'var(--gold)' : s.pct > 70 ? 'var(--green)' : s.pct > 40 ? 'var(--teal)' : 'var(--orange)';
      return `<div class="system-row" title="${s.capped && s.capReason ? s.capReason.replace(/"/g, '&quot;') : ''}">
        <span class="system-icon">${s.icon}</span>
        <span class="system-label">${s.label}${s.capped ? ' <span style="color:var(--gold);font-size:0.65rem">⚠ linked</span>' : ''}</span>
        <div class="system-bar"><div class="system-fill" style="width:${s.pct}%;background:${col}"></div></div>
        <span class="system-pct" style="color:${col}">${s.pct}%</span>
      </div>`;
    }).join('');

    const interferenceHtml = interferences.length ? `
      <div style="padding:0 20px;margin-bottom:12px">
        <div class="section-title" style="margin-bottom:8px">How your habits interact</div>
        ${interferences.map(c => `
          <div class="card" style="margin-bottom:8px;border-left:3px solid ${c.severity === 'high' ? 'var(--orange)' : 'var(--gold)'}">
            <div style="display:flex;gap:10px;align-items:flex-start">
              <span style="font-size:1.2rem">${c.icon}</span>
              <div>
                <div style="font-size:0.82rem;font-weight:700;color:var(--text);margin-bottom:4px">${c.title}</div>
                <div style="font-size:0.78rem;color:var(--text2);line-height:1.5">${c.body}</div>
              </div>
            </div>
          </div>`).join('')}
      </div>` : '';

    const wholeBodyHtml = wholeBody ? `
      <div style="padding:0 20px;margin-bottom:12px">
        <div class="card" style="background:linear-gradient(135deg,rgba(78,205,196,0.12),transparent)">
          <div style="font-size:0.72rem;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Whole-body recovery</div>
          <div style="font-size:1.4rem;font-weight:800;color:var(--teal);margin-bottom:4px">${wholeBody.score}%</div>
          <div class="t-caption">Tracking ${wholeBody.habitCount} linked habits${wholeBody.nicotineFreeHours != null ? ` · nicotine-free: ${RecoveryEngine.formatDuration(wholeBody.nicotineFreeHours)}` : ''}${wholeBody.sleepRecoveryHours != null ? ` · sleep recovery: ${RecoveryEngine.formatDuration(wholeBody.sleepRecoveryHours)}` : ''}</div>
          ${wholeBody.weakestSystems?.length ? `<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">
            <div style="font-size:0.68rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Slowest healing systems</div>
            ${wholeBody.weakestSystems.map(s => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span>${s.icon}</span><span style="font-size:0.78rem;color:var(--text2);flex:1">${s.label}</span>
              <span style="font-size:0.78rem;font-weight:700;color:var(--gold)">${s.pct}%</span>
            </div>`).join('')}
          </div>` : ''}
        </div>
      </div>` : '';

    screen.innerHTML = `
      <div style="padding:calc(env(safe-area-inset-top,20px) + 16px) 20px 16px;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:2rem">${hCfg.icon||'✨'}</span>
          <div>
            <div class="t-title">${hCfg.name||habit.type}</div>
            <div class="t-caption">${days}d ${Math.floor(hrs%24)}h clean</div>
          </div>
        </div>
      </div>

      ${selectorHtml}
      ${wholeBodyHtml}
      ${interferenceHtml}
      ${triggerHtml}

      <div style="padding:0 20px;margin-bottom:12px">
        <div class="card" style="background:linear-gradient(135deg,${phase.color}18,transparent)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <div style="width:8px;height:8px;border-radius:50%;background:${phase.color}"></div>
            <span style="font-size:0.78rem;font-weight:700;color:${phase.color};text-transform:uppercase;letter-spacing:0.08em">${phase.name} Phase</span>
          </div>
          <div class="t-body">${phase.description}</div>
        </div>
      </div>

      <div style="padding:0 20px;margin-bottom:12px">
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <span style="font-size:0.78rem;font-weight:700;color:${dopStage.color};text-transform:uppercase;letter-spacing:0.06em">Dopamine: ${dopStage.name}</span>
            <span style="font-size:0.75rem;color:var(--text3)">${dopProg}% through stage</span>
          </div>
          <div class="prog-bar" style="margin-bottom:12px"><div class="prog-fill" style="width:${dopProg}%;background:${dopStage.color}"></div></div>
          ${linkedDop?.delayed ? `<div style="font-size:0.72rem;color:var(--gold);margin-bottom:8px;line-height:1.45;padding:8px 10px;background:rgba(255,214,10,0.08);border-radius:var(--r-sm)">${linkedDop.note || 'Dopamine stage reflects linked recovery across your habits.'}</div>` : ''}
          <div class="t-body" style="margin-bottom:10px">${dopStage.description}</div>
          <div style="font-size:0.75rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Symptoms</div>
          ${dopStage.symptoms.map(s=>`<div style="font-size:0.78rem;color:var(--text2);margin-bottom:4px">· ${s}</div>`).join('')}
          <div style="font-size:0.75rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin:10px 0 6px">What helps</div>
          ${dopStage.tips.map(t=>`<div style="font-size:0.78rem;color:var(--text2);margin-bottom:4px">· ${t}</div>`).join('')}
        </div>
      </div>

      ${weekData ? `
      <div class="section-header"><span class="section-title">30-Day Program · Week ${programWeek}</span></div>
      <div style="padding:0 20px;margin-bottom:12px">
        <div class="card" style="border-left:3px solid var(--teal)">
          <div style="font-size:0.72rem;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">${program.title}</div>
          <div style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:8px">${weekData.label}</div>
          ${weekData.tips.map(t => `<div style="font-size:0.78rem;color:var(--text2);margin-bottom:6px;line-height:1.5">· ${t}</div>`).join('')}
          <div style="margin-top:10px;font-size:0.68rem;color:var(--text3)">Day ${Math.min(days, 30)} of 30 · advances weekly</div>
        </div>
      </div>` : ''}

      <div class="section-header"><span class="section-title">Body Healing Timeline</span></div>
      <div style="padding:0 20px 8px"><div class="t-caption">${hourlyCount} hourly milestones in first 72h, then daily & weekly</div></div>
      <div style="padding:0 20px">${timelineHtml}</div>

      <div class="section-header"><span class="section-title">Body Systems</span></div>
      <div class="systems-list">${systemsHtml}</div>

      <div style="padding:0 20px;margin-top:20px">
        <div class="card-sm card" style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="t-label">Integrity Score</div>
            <div style="font-size:1.5rem;font-weight:800;color:${integrityPct>70?'var(--green)':integrityPct>40?'var(--gold)':'var(--red)'}">${integrityPct}%</div>
          </div>
          <div style="text-align:right">
            <div class="t-label">Relapses</div>
            <div style="font-size:1.5rem;font-weight:800;color:var(--text)">${relapses}</div>
          </div>
        </div>
      </div>

      <div style="padding:20px">
        <button type="button" class="btn btn-danger" onclick="Recovery._confirmRelapse('${habit.id}',${!!habit.isCustom})">Log Relapse</button>
      </div>
      <div style="height:8px"></div>
    `;
  }

  function selectHabit(id) {
    render(id);
  }

  function _confirmRelapse(id, isCustom) {
    if (confirm('Log a relapse? This will reset your clean time for this habit.')) {
      State.logRelapse(id, isCustom);
      if (window.App) App.showToast('Relapse logged. Your streak resets now. Keep going.', 'info');
      render(id);
    }
  }

  return { render, selectHabit, getSelectedHabitId, _confirmRelapse };
})();
window.Recovery = Recovery;
