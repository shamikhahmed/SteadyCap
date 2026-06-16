'use strict';
const Dashboard = (() => {
  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function formatDate() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  function toggleItem(kind, key) {
    const log = State.getDailyLog();
    const isDone = kind === 'medicine'
      ? !!log.medicines[key]
      : !!log.routines[key];
    State.toggleDailyItem(kind === 'medicine' ? 'medicine' : 'routine', key, !isDone);
    render();
  }

  function buildNudgeBanner(missed) {
    if (!missed.length) return '';
    const names = missed.slice(0, 2).map(m => m.label).join(', ');
    const extra = missed.length > 2 ? ` +${missed.length - 2} more` : '';
    return `<div class="nudge-banner card-press" onclick="Dashboard.render()">
      <span class="nudge-icon">🔔</span>
      <div>
        <div class="nudge-title">Gentle reminder</div>
        <div class="nudge-body">You missed ${names}${extra}. No pressure — tap to check off when ready.</div>
      </div>
    </div>`;
  }

  function buildSOS() {
    return `<button class="sos-tap card-press" onclick="Navigation.go('emergency')">
      <span class="sos-tap-icon">🆘</span>
      <div class="sos-tap-text">
        <div class="sos-tap-title">SOS — One Tap</div>
        <div class="sos-tap-sub">Craving protocol · breathe · act · survive</div>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`;
  }

  function buildChecklist() {
    const items = Notifications.getDueItems();
    const period = Notifications.getPeriod();
    if (!items.length) {
      return `<div class="today-empty" style="text-align:center;padding:20px 16px">
        <div style="font-size:36px;margin-bottom:10px">🌅</div>
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">No routines yet</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.5;margin-bottom:14px">Daily routines anchor your recovery. Medicine reminders, skincare, hair care — small acts of self-care add up.</div>
        <button class="btn btn-ghost" style="font-size:0.85rem;padding:10px 20px" onclick="Navigation.go('profile')">Set up my routines →</button>
      </div>`;
    }

    const groups = { medicine: [], skincare: [], hair: [] };
    items.forEach(item => {
      if (item.kind === 'medicine') groups.medicine.push(item);
      else if (item.cat === 'skincare') groups.skincare.push(item);
      else groups.hair.push(item);
    });

    const renderGroup = (title, icon, list) => {
      if (!list.length) return '';
      const done = list.filter(i => i.done).length;
      const rows = list.map(item => {
        const key = item.kind === 'medicine'
          ? `${item.id}_${item.timeKey || 'asneeded'}`
          : `${item.cat}_${item.slot}_${item.id}`;
        const logKey = item.kind === 'medicine' ? key : key;
        const checked = item.done;
        return `<div class="check-row card-press${checked ? ' done' : ''}${item.overdue && !checked ? ' overdue' : ''}" onclick="Dashboard._toggle('${item.kind}','${logKey}')">
          <div class="check-box${checked ? ' checked' : ''}">${checked ? '✓' : ''}</div>
          <div class="check-info">
            <div class="check-label">${item.label}</div>
            <div class="check-sub">${item.sub}${item.overdue && !checked ? ' · missed' : ''}</div>
          </div>
        </div>`;
      }).join('');
      return `<div class="check-group">
        <div class="check-group-head">
          <span>${icon} ${title}</span>
          <span class="check-progress">${done}/${list.length}</span>
        </div>
        ${rows}
      </div>`;
    };

    return `
      <div class="period-pill">${period === 'am' ? '☀️ Morning' : period === 'pm' ? '🌤️ Afternoon' : '🌙 Evening'} routine</div>
      ${renderGroup('Medicines', '💊', groups.medicine)}
      ${renderGroup('Skincare', '✨', groups.skincare)}
      ${renderGroup('Hair', '💇', groups.hair)}
    `;
  }

  function buildSmartInsights(habits) {
    const linked = window.LinkedRecoveryEngine;
    if (!linked || habits.length < 2) return '';
    const insights = linked.getSmartInsights(habits);
    if (!insights.length) return '';
    const top = insights[0];
    return `<div class="card" style="margin-bottom:12px;border-left:3px solid var(--teal)">
      <div style="display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:1.3rem">${top.icon}</span>
        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Linked recovery</div>
          <div style="font-size:0.85rem;font-weight:700;color:var(--text);margin-bottom:4px">${top.title}</div>
          <div style="font-size:0.78rem;color:var(--text2);line-height:1.5">${top.body}</div>
        </div>
      </div>
    </div>`;
  }

  function buildFinanceSaved(habits) {
    if (!habits.length || !window.FinanceEngine) return '';
    const settings = State.get('settings') || {};
    const currency = settings.currency || 'USD';
    const sym = FinanceEngine.CURRENCY_SYMBOLS[currency] || '$';
    const totalSaved = FinanceEngine.totalSaved(habits, currency);
    const hasCost = habits.some(h => FinanceEngine.calculate(h, currency).hasCost);
    if (!hasCost || totalSaved < 0.01) return '';
    const formatted = totalSaved >= 1000
      ? sym + (totalSaved / 1000).toFixed(1) + 'k'
      : sym + totalSaved.toFixed(2);
    return `<div class="card" style="margin-bottom:12px;background:linear-gradient(135deg,rgba(6,214,160,0.12),transparent);border-left:3px solid var(--green)">
      <div style="display:flex;gap:12px;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Money saved</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--green)">${formatted}</div>
          <div class="t-caption" style="margin-top:4px">Total across all habits since quit</div>
        </div>
        <span style="font-size:1.8rem">💰</span>
      </div>
    </div>`;
  }

  function buildHabitProgress(habits) {
    if (!habits.length) {
      return `<div class="today-empty" style="text-align:center;padding:20px 16px">
        <div style="font-size:36px;margin-bottom:10px">🧡</div>
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">Your recovery starts here</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.5;margin-bottom:14px">Every hour clean is progress. Add your first habit and SteadyCap will track your milestones, predict hard moments, and celebrate every win.</div>
        <button class="btn btn-primary" style="font-size:0.9rem;padding:12px 24px" onclick="Navigation.go('profile');setTimeout(function(){Profile._addHabit()},200)">Add your first habit →</button>
      </div>`;
    }
    const totalDays = habits.reduce((s, h) => s + RecoveryEngine.daysClean(h.quitTime), 0);
    const score = RecoveryEngine.recoveryScore(habits);
    const cards = habits.slice(0, 4).map(h => {
      const cfg = State.habitConfig(h.type, h.isCustom, h);
      const days = RecoveryEngine.daysClean(h.quitTime);
      const hrs = RecoveryEngine.hoursClean(h.quitTime);
      const prog = RecoveryEngine.progressToNext(h.isCustom ? 'custom' : h.type, h.quitTime);
      const curr = RecoveryEngine.currentMilestone(h.isCustom ? 'custom' : h.type, h.quitTime);
      return `<div class="habit-mini card-press" onclick="Navigation.go('recovery',{habitId:'${h.id}'})">
        <span class="habit-mini-icon">${cfg.icon || '✨'}</span>
        <div class="habit-mini-info">
          <div class="habit-mini-name">${cfg.name || h.type}</div>
          <div class="habit-mini-days">${days}d ${Math.floor(hrs % 24)}h · ${curr ? curr.title : 'Starting'}</div>
          <div class="prog-bar" style="margin-top:6px"><div class="prog-fill" style="width:${prog}%;background:${cfg.color || 'var(--orange)'}"></div></div>
        </div>
      </div>`;
    }).join('');

    return `
      ${buildFinanceSaved(habits)}
      <div class="habit-summary">
        <div class="habit-summary-stat">
          <div class="habit-summary-val" style="color:var(--orange)">${score}</div>
          <div class="t-label">Recovery</div>
        </div>
        <div class="habit-summary-stat">
          <div class="habit-summary-val" style="color:var(--teal)">${totalDays}</div>
          <div class="t-label">Total Days</div>
        </div>
        <div class="habit-summary-stat">
          <div class="habit-summary-val" style="color:var(--green)">${habits.length}</div>
          <div class="t-label">Habits</div>
        </div>
      </div>
      <div class="habit-minis">${cards}</div>
      ${habits.length > 4 ? `<button class="btn btn-ghost" style="width:100%;margin-top:8px;font-size:0.78rem" onclick="Navigation.go('recovery',{habitId:Recovery.getSelectedHabitId()})">View all habits →</button>` : ''}
    `;
  }

  function buildHourlyMilestone(habits) {
    const selectedId = window.Recovery && Recovery.getSelectedHabitId ? Recovery.getSelectedHabitId() : null;
    const primary = habits.find(h => h.id === selectedId) || habits[0];
    if (!primary) return '';
    const type = primary.isCustom ? 'custom' : primary.type;
    const curr = RecoveryEngine.currentMilestone(type, primary.quitTime);
    const next = RecoveryEngine.nextMilestone(type, primary.quitTime);
    if (!curr) return '';
    const cfg = State.habitConfig(primary.type, primary.isCustom, primary);
    return `<div class="milestone-card card-press" onclick="Navigation.go('recovery',{habitId:'${primary.id}'})">
      <div class="milestone-icon">${curr.icon || cfg.icon || '✨'}</div>
      <div>
        <div class="t-label" style="margin-bottom:4px">Body healing now · ${cfg.name}</div>
        <div class="milestone-title">${curr.title}</div>
        <div class="milestone-body">${curr.body.substring(0, 120)}${curr.body.length > 120 ? '…' : ''}</div>
        ${next ? `<div class="milestone-next">Next: ${next.title} in ${RecoveryEngine.timeUntilNext(type, primary.quitTime)}</div>` : ''}
      </div>
    </div>`;
  }

  function render() {
    const screen = document.getElementById('screen-dashboard');
    if (!screen) return;
    const habits = State.getAllHabits();
    const user = State.get('user') || {};
    const missed = Notifications.getMissedNudges();
    const insight = RecoveryEngine.todayInsight();
    const checklistDone = Notifications.getDueItems().filter(i => i.done).length;
    const checklistTotal = Notifications.getDueItems().filter(i => !i.asNeeded).length;

    screen.innerHTML = `
      <div class="today-header">
        <div class="t-caption">${formatDate()}</div>
        <div class="t-display t-display--compact">${greeting()}${user.name ? ', ' + user.name.split(' ')[0] : ''}</div>
        ${checklistTotal > 0 ? `<div class="today-progress-pill">${checklistDone}/${checklistTotal} today&apos;s tasks done</div>` : ''}
      </div>

      ${buildNudgeBanner(missed)}
      ${buildSOS()}

      <div class="section-header">
        <span class="section-title">Daily check-in</span>
        ${Journal.getStreak() > 0 ? `<span class="today-progress-pill">${Journal.getStreak()}d streak</span>` : ''}
        <button class="section-link" onclick="Navigation.go('journal')">History</button>
      </div>
      <div id="daily-checkin-wrap" style="padding:0 20px 8px"></div>

      <div class="section-header"><span class="section-title">Today&apos;s Routines</span>
        <button class="section-link" onclick="Navigation.go('profile')">Edit</button>
      </div>
      <div class="today-checklist">${buildChecklist()}</div>

      <div class="section-header"><span class="section-title">Habit Progress</span>
        <button class="section-link" onclick="Navigation.go('recovery',{habitId:Recovery.getSelectedHabitId()})">Details</button>
      </div>
      <div style="padding:0 20px 8px">${buildSmartInsights(habits)}${buildHabitProgress(habits)}</div>

      ${buildHourlyMilestone(habits)}

      ${insight ? `
        <div class="insight-card" style="margin:12px 20px 20px">
          <div class="insight-emoji">${insight.emoji}</div>
          <div>
            <div class="insight-text">${insight.text}</div>
            <div style="font-size:0.65rem;color:var(--text3);margin-top:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">— ${insight.source}</div>
          </div>
        </div>
      ` : ''}
      <div style="height:16px"></div>
    `;

    if (window.Journal) Journal.renderInline(document.getElementById('daily-checkin-wrap'));
  }

  function _toggle(kind, key) {
    toggleItem(kind, key);
  }

  return { render, _toggle };
})();
window.Dashboard = Dashboard;
