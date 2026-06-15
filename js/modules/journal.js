'use strict';
const Journal = (() => {
  const STORAGE_KEY = StorageMigrate.local('steadycap_journal_v1', ['dos_journal_v1']);

  const MOODS = [
    { id: 'strong', emoji: '💪', label: 'Strong' },
    { id: 'ok', emoji: '😐', label: 'Okay' },
    { id: 'hard', emoji: '😔', label: 'Hard' },
    { id: 'relapsed', emoji: '🔁', label: 'Slipped' },
  ];

  const TRIGGERS = ['Stress', 'Boredom', 'Loneliness', 'Night', 'Anxiety', 'Social', 'Work', 'Habit'];

  function getEntries() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  }

  function saveEntry(text, mood, triggers) {
    const entries = getEntries();
    const today = new Date().toISOString().split('T')[0];
    const existing = entries.findIndex(e => e.date === today);
    const entry = { date: today, text: (text || '').trim(), mood: mood || null, triggers: triggers || [], ts: Date.now() };
    if (existing >= 0) entries[existing] = entry;
    else entries.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 365)));
    return entry;
  }

  function getTodayEntry() {
    const today = new Date().toISOString().split('T')[0];
    return getEntries().find(e => e.date === today) || null;
  }

  function getStreak() {
    const entries = getEntries();
    if (!entries.length) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (entries.find(e => e.date === ds)) streak++;
      else break;
    }
    return streak;
  }

  function bindCheckInForm(root, opts) {
    if (!root) return;
    const todayEntry = getTodayEntry();
    let selectedMood = todayEntry?.mood || null;
    let selectedTriggers = [...(todayEntry?.triggers || [])];

    root.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMood = btn.dataset.mood;
        root.querySelectorAll('.mood-btn').forEach(b => {
          const sel = b.dataset.mood === selectedMood;
          b.classList.toggle('selected', sel);
          b.style.background = sel ? 'rgba(255,107,53,0.15)' : 'var(--glass2)';
          b.style.borderColor = sel ? 'var(--orange)' : 'var(--border)';
        });
      });
    });

    root.querySelectorAll('.trigger-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.trigger;
        if (selectedTriggers.includes(t)) selectedTriggers = selectedTriggers.filter(x => x !== t);
        else selectedTriggers.push(t);
        root.querySelectorAll('.trigger-chip').forEach(b => {
          const on = selectedTriggers.includes(b.dataset.trigger);
          b.classList.toggle('on', on);
          b.style.borderColor = on ? 'var(--orange)' : 'var(--border)';
          b.style.background = on ? 'rgba(255,107,53,0.12)' : 'var(--glass2)';
          b.style.color = on ? 'var(--orange)' : 'var(--text3)';
        });
      });
    });

    root.querySelector('#journal-save')?.addEventListener('click', () => {
      const input = root.querySelector('#journal-input');
      const text = input?.value?.trim();
      if (!selectedMood && !text) {
        App.showToast('Pick a mood or write a line', 'error');
        return;
      }
      saveEntry(text || '', selectedMood, selectedTriggers);
      App.showToast('Check-in saved', 'success');
      if (opts?.onSaved) opts.onSaved();
      else render();
    });
  }

  function buildCheckInHtml(compact) {
    const todayEntry = getTodayEntry();
    const journalStreak = getStreak();
    const triggerBlock = compact ? '' : `
        <div class="t-label t-dim" style="margin:14px 0 8px;">Triggers today (optional)</div>
        <div class="journal-triggers" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
          ${TRIGGERS.map(t => {
            const on = (todayEntry?.triggers || []).includes(t);
            return `<button type="button" class="trigger-chip${on ? ' on' : ''}" data-trigger="${t}" style="padding:6px 10px;border-radius:99px;border:1px solid ${on ? 'var(--orange)' : 'var(--border)'};background:${on ? 'rgba(255,107,53,0.12)' : 'var(--glass2)'};color:${on ? 'var(--orange)' : 'var(--text3)'};font-size:0.68rem;font-weight:600;cursor:pointer;">${t}</button>`;
          }).join('')}
        </div>`;

    return `
      ${journalStreak > 0 ? `<div class="check-in-streak">${journalStreak}-day check-in streak</div>` : ''}
      <div class="check-in-card">
        <div class="check-in-moods">
          ${MOODS.map(m => `
            <button type="button" class="mood-btn ${todayEntry?.mood === m.id ? 'selected' : ''}" data-mood="${m.id}" aria-label="${m.label}">
              <span class="mood-emoji">${m.emoji}</span>
              <span class="mood-label">${m.label}</span>
            </button>
          `).join('')}
        </div>
        ${triggerBlock}
        <textarea id="journal-input" class="check-in-input" placeholder="One line about today (optional)…" rows="${compact ? 2 : 3}">${todayEntry?.text || ''}</textarea>
        <button type="button" id="journal-save" class="btn btn-primary check-in-save">${todayEntry ? 'Update check-in' : 'Save check-in'}</button>
      </div>`;
  }

  function renderInline(container, onSaved) {
    if (!container) return;
    container.innerHTML = buildCheckInHtml(true);
    bindCheckInForm(container, { onSaved: onSaved || (() => Dashboard.render()) });
  }

  function render() {
    const screen = document.getElementById('screen-journal');
    if (!screen) return;
    const entries = getEntries();
    const today = new Date().toISOString().split('T')[0];

    screen.innerHTML = `
    <div style="padding-bottom:20px;">
      <div style="padding:calc(env(safe-area-inset-top,20px) + 20px) 20px 12px;">
        <button type="button" class="btn btn-ghost" style="padding:0;margin-bottom:12px;font-size:0.82rem" onclick="Navigation.go('dashboard')">← Today</button>
        <div class="t-label t-dim">JOURNAL HISTORY</div>
        <div class="t-title" style="margin-top:4px;">Past entries</div>
      </div>

      <div id="journal-checkin-full" style="margin:0 20px 20px;"></div>

      ${entries.filter(e => e.date !== today).length > 0 ? `
      <div class="section-header"><span class="section-title">Earlier</span></div>
      <div style="display:flex;flex-direction:column;gap:8px;padding:0 20px;">
        ${entries.filter(e => e.date !== today).slice(0, 30).map(e => {
          const mood = MOODS.find(m => m.id === e.mood);
          const dateStr = new Date(e.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
          return `
          <div style="padding:14px 16px;background:var(--glass);border:1px solid var(--border);border-radius:var(--r-sm);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <div class="t-caption">${dateStr}</div>
              ${mood ? `<div style="font-size:0.9rem;">${mood.emoji}</div>` : ''}
            </div>
            <div style="font-size:0.85rem;color:var(--text2);line-height:1.5;">${e.text || '—'}</div>
          </div>`;
        }).join('')}
      </div>` : `<div class="today-empty" style="margin:0 20px"><div class="t-caption">No past entries yet.</div></div>`}
    </div>`;

    renderInline(document.getElementById('journal-checkin-full'), () => render());
  }

  return { render, renderInline, getEntries, getTodayEntry, getStreak, saveEntry, buildCheckInHtml };
})();
window.Journal = Journal;
