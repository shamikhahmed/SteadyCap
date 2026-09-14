'use strict';
/* Today (P-STDY-1): inline demo banner → Due now (Taken/Skip) → check-in → journal prompt.
   SOS lives only in the center tab. No streak language. */
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

  function logKeyFor(item) {
    if (item.kind === 'medicine') {
      return `${item.id}_${item.timeKey || 'asneeded'}`;
    }
    return `${item.cat}_${item.slot}_${item.id}`;
  }

  function markItem(kind, key, done) {
    State.toggleDailyItem(kind === 'medicine' ? 'medicine' : 'routine', key, !!done);
    render();
  }

  function demoBanner() {
    const demo = (window.CapDemo && CapDemo.isActive('steadycap')) ||
      (typeof location !== 'undefined' && /(?:\?|&)demo=1(?:&|$)/.test(location.search));
    if (!demo) return '';
    return `<div class="today-demo-banner" role="status">
      <div class="today-demo-banner__text">Sample data — explore freely. Your real profile stays separate.</div>
      <button type="button" class="btn btn-ghost today-demo-banner__btn" onclick="Navigation.go('profile')">Profiles</button>
    </div>`;
  }

  function buildDueNow() {
    const items = (Notifications.getDueItems() || []).filter((i) => !i.asNeeded || !i.done);
    const open = items.filter((i) => !i.done);
    const list = open.length ? open : items.slice(0, 6);

    if (!items.length) {
      return `<div class="today-empty" style="text-align:center;padding:20px 16px">
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">Nothing due right now</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.5;margin-bottom:14px">Add medicines or routines in You when you are ready.</div>
        <button type="button" class="btn btn-ghost" style="font-size:0.85rem;padding:10px 20px" onclick="Navigation.go('profile')">Set up routines</button>
      </div>`;
    }

    const rows = list.map((item) => {
      const key = logKeyFor(item);
      const kind = item.kind;
      if (item.done) {
        return `<div class="due-row due-row--done">
          <div class="due-row__info">
            <div class="due-row__label">${item.label}</div>
            <div class="due-row__sub">${item.sub || ''}</div>
          </div>
          <span class="due-row__done-mark">Done</span>
        </div>`;
      }
      return `<div class="due-row${item.overdue ? ' due-row--overdue' : ''}">
        <div class="due-row__info">
          <div class="due-row__label">${item.label}</div>
          <div class="due-row__sub">${item.sub || ''}${item.overdue ? ' · overdue' : ''}</div>
        </div>
        <div class="due-row__actions">
          <button type="button" class="btn btn-primary due-btn" onclick="Dashboard._taken('${kind}','${key}')">Taken</button>
          <button type="button" class="btn btn-ghost due-btn" onclick="Dashboard._skip('${kind}','${key}')">Skip</button>
        </div>
      </div>`;
    }).join('');

    return `<div class="due-list">${rows}</div>`;
  }

  function render() {
    const screen = document.getElementById('screen-dashboard');
    if (!screen) return;
    const user = State.get('user') || {};
    const insight = RecoveryEngine.todayInsight ? RecoveryEngine.todayInsight() : null;

    screen.innerHTML = `
      <div class="today-simple">
        ${demoBanner()}
        <div class="today-simple__header">
          <div class="t-caption">${formatDate()}</div>
          <div class="t-display t-display--compact">${greeting()}${user.name ? ', ' + user.name.split(' ')[0] : ''}</div>
        </div>

        <div class="section-header"><span class="section-title">Due now</span>
          <button type="button" class="section-link" onclick="Navigation.go('profile')">Edit</button>
        </div>
        ${buildDueNow()}

        <div class="section-header" style="margin-top:8px">
          <span class="section-title">Daily check-in</span>
          <button type="button" class="section-link" onclick="Navigation.go('journal')">History</button>
        </div>
        <div id="daily-checkin-wrap" style="padding:0 0 8px"></div>

        <div class="section-header" style="margin-top:4px"><span class="section-title">Journal</span></div>
        <div class="card today-journal-prompt">
          <div style="font-size:14px;color:var(--text2);line-height:1.5;margin-bottom:10px">One private line about today stays on this device.</div>
          <button type="button" class="btn btn-secondary" style="width:100%" onclick="Navigation.go('journal')">Open journal</button>
        </div>

        ${insight ? `
          <div class="insight-card" style="margin:12px 0 8px">
            <div class="insight-mark" aria-hidden="true">Note</div>
            <div>
              <div class="insight-text">${insight.text}</div>
              <div style="font-size:12px;color:var(--text3);margin-top:6px;font-weight:600">${insight.source || ''}</div>
            </div>
          </div>
        ` : ''}
        <div style="height:20px"></div>
      </div>
    `;

    if (window.Journal) Journal.renderInline(document.getElementById('daily-checkin-wrap'));
  }

  return {
    render,
    _taken: function (kind, key) { markItem(kind, key, true); },
    _skip: function (kind, key) { markItem(kind, key, true); },
    _toggle: function (kind, key) {
      const log = State.getDailyLog();
      const isDone = kind === 'medicine' ? !!log.medicines[key] : !!log.routines[key];
      markItem(kind, key, !isDone);
    }
  };
})();
window.Dashboard = Dashboard;
