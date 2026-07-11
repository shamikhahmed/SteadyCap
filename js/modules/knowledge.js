'use strict';
const Knowledge = (() => {
  let searchTerm = '';
  let activeCategory = 'All';
  let bookmarks = [];

  const BOOKMARK_KEY = StorageMigrate.local('steadycap_bookmarks', ['dos_bookmarks']);

  function getBookmarks() {
    try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveBookmarks(bm) {
    try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bm)); } catch (e) {}
  }

  function render() {
    const screen = document.getElementById('screen-knowledge');
    if (!screen) return;
    bookmarks = getBookmarks();
    const db = window.KNOWLEDGE_DB || [];
    const categories = ['All', ...new Set(db.map(a => a.category))];

    screen.innerHTML = `
      <div style="padding:calc(env(safe-area-inset-top,20px)+16px) 20px 16px">
        <div class="t-title">Knowledge Base</div>
        <div class="t-caption" style="margin-top:4px">${db.length} articles · Science-backed recovery</div>
      </div>
      <div class="kb-search">
        <svg class="kb-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="kb-input" type="search" id="kb-search-input" placeholder="Search articles…" value="${searchTerm}"
          oninput="Knowledge._search(this.value)" autocomplete="off" autocorrect="off">
      </div>
      <div class="cat-scroll">
        ${categories.map(c => `<button type="button" class="cat-chip${c===activeCategory?' active':''}" onclick="Knowledge._setCategory('${c}')">${c}</button>`).join('')}
      </div>
      <div id="kb-articles">${buildArticleList(db)}</div>
      <div id="reader-overlay" class="reader-overlay"></div>
    `;
  }

  function buildArticleList(db) {
    const filtered = db.filter(a => {
      const matchCat = activeCategory === 'All' || a.category === activeCategory;
      const matchSearch = !searchTerm || a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.preview.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
    if (!filtered.length) return `<div style="padding:40px 20px;text-align:center;color:var(--text3)">No articles found.</div>`;
    return filtered.map(a => `
      <div class="article-card" onclick="Knowledge._openArticle('${a.id}')">
        <div class="a-category">${a.category}</div>
        <div class="a-title">${a.title}</div>
        <div class="a-preview">${a.preview}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
          <div class="a-evidence">${a.evidence}</div>
          <div style="font-size:1rem;cursor:pointer" onclick="event.stopPropagation();Knowledge._toggleBookmark('${a.id}')">${bookmarks.includes(a.id)?'🔖':'🏷️'}</div>
        </div>
      </div>
    `).join('');
  }

  function _search(val) {
    searchTerm = val;
    const db = window.KNOWLEDGE_DB || [];
    const el = document.getElementById('kb-articles');
    if (el) el.innerHTML = buildArticleList(db);
  }

  function _setCategory(cat) {
    activeCategory = cat;
    const db = window.KNOWLEDGE_DB || [];
    const screen = document.getElementById('screen-knowledge');
    if (!screen) return;
    screen.querySelectorAll('.cat-chip').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.trim() === cat);
    });
    const el = document.getElementById('kb-articles');
    if (el) el.innerHTML = buildArticleList(db);
  }

  function _openArticle(id) {
    const db = window.KNOWLEDGE_DB || [];
    const article = db.find(a => a.id === id);
    if (!article) return;
    bookmarks = getBookmarks();
    const overlay = document.getElementById('reader-overlay');
    if (!overlay) return;
    overlay.innerHTML = `
      <div class="reader-header">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <button type="button" onclick="Knowledge._closeArticle()" style="background:none;border:none;color:var(--teal);font-size:0.9rem;font-weight:600;cursor:pointer">← Back</button>
          <button type="button" onclick="Knowledge._toggleBookmark('${article.id}')" style="background:none;border:none;font-size:1.2rem;cursor:pointer" id="reader-bookmark">${bookmarks.includes(id)?'🔖':'🏷️'}</button>
        </div>
        <div style="font-size:0.65rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--teal);margin-top:10px">${article.category}</div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--text);margin-top:4px;line-height:1.3">${article.title}</div>
        <div style="font-size:0.65rem;color:var(--green);font-weight:600;margin-top:6px">${article.evidence}</div>
      </div>
      <div class="reader-content">${article.content}</div>
    `;
    requestAnimationFrame(() => overlay.classList.add('open'));
  }

  function _closeArticle() {
    const overlay = document.getElementById('reader-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
  }

  function _toggleBookmark(id) {
    bookmarks = getBookmarks();
    const idx = bookmarks.indexOf(id);
    if (idx === -1) bookmarks.push(id);
    else bookmarks.splice(idx, 1);
    saveBookmarks(bookmarks);
    const btn = document.getElementById('reader-bookmark');
    if (btn) btn.textContent = bookmarks.includes(id) ? '🔖' : '🏷️';
    const db = window.KNOWLEDGE_DB || [];
    const el = document.getElementById('kb-articles');
    if (el) el.innerHTML = buildArticleList(db);
  }

  return { render, _search, _setCategory, _openArticle, _closeArticle, _toggleBookmark };
})();
window.Knowledge = Knowledge;
