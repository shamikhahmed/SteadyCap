'use strict';
/** Escape user/legacy strings before interpolating into innerHTML (XSS). */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;

const DateTimeLocal = (() => {
  function toInputValue(dateInput) {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fromInputValue(str) {
    if (!str) return new Date().toISOString();
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  function nowInputValue() {
    return toInputValue(new Date());
  }

  return { toInputValue, fromInputValue, nowInputValue };
})();
window.DateTimeLocal = DateTimeLocal;
