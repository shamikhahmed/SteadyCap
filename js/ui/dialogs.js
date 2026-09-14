'use strict';
/* Accessible dialogs — replaces window.alert / confirm / prompt (STDY-P1-05). */
(function () {
  function ensureStyles() {
    if (document.getElementById('sc-dialog-css')) return;
    const style = document.createElement('style');
    style.id = 'sc-dialog-css';
    style.textContent = `
.sc-dialog-backdrop{position:fixed;inset:0;background:rgba(10,10,12,.48);z-index:9000;display:flex;align-items:flex-end;justify-content:center;padding:max(12px,env(safe-area-inset-bottom))}
@media(min-width:560px){.sc-dialog-backdrop{align-items:center}}
.sc-dialog{width:min(100%,420px);background:var(--bg3,#16161a);color:var(--text,#f5f5f5);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px 16px 12px 12px;padding:18px 16px 14px;box-shadow:0 18px 48px rgba(0,0,0,.35)}
.sc-dialog h2{margin:0 0 8px;font:600 1.125rem/1.25 var(--font,system-ui);color:var(--text)}
.sc-dialog p{margin:0;font-size:.9375rem;line-height:1.45;color:var(--text2)}
.sc-dialog__actions{display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}
.sc-dialog__actions .btn{min-height:44px;padding:0 14px}
.sc-dialog input{width:100%;margin-top:12px;min-height:44px;border-radius:10px;border:1px solid var(--border);background:var(--bg2,#1c1c1e);color:var(--text);padding:0 12px;font-size:1rem;box-sizing:border-box}
`;
    document.head.appendChild(style);
  }

  function mountDialog({ title, body, input, confirmLabel, cancelLabel, destructive, showCancel }) {
    ensureStyles();
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'sc-dialog-backdrop';
      backdrop.setAttribute('role', 'presentation');
      const dialog = document.createElement('div');
      dialog.className = 'sc-dialog';
      dialog.setAttribute('role', 'alertdialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'sc-dlg-title');
      const h = document.createElement('h2');
      h.id = 'sc-dlg-title';
      h.tabIndex = -1;
      h.textContent = title || '';
      dialog.appendChild(h);
      if (body) {
        const p = document.createElement('p');
        p.textContent = body;
        dialog.appendChild(p);
      }
      let inputEl = null;
      if (input) {
        inputEl = document.createElement('input');
        inputEl.type = input.type || 'password';
        inputEl.autocomplete = 'off';
        inputEl.placeholder = input.placeholder || '';
        dialog.appendChild(inputEl);
      }
      const actions = document.createElement('div');
      actions.className = 'sc-dialog__actions';
      const close = (val) => {
        backdrop.remove();
        window.removeEventListener('keydown', onKey);
        resolve(val);
      };
      const onKey = (e) => {
        if (e.key === 'Escape') close(input ? null : false);
        if (e.key === 'Enter' && inputEl && document.activeElement === inputEl) {
          e.preventDefault();
          close(inputEl.value);
        }
      };
      if (showCancel !== false) {
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'btn btn-ghost';
        cancel.textContent = cancelLabel || 'Cancel';
        cancel.addEventListener('click', () => close(input ? null : false));
        actions.appendChild(cancel);
      }
      const confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'btn btn-primary';
      if (destructive) confirm.style.color = 'var(--danger, #ff453a)';
      confirm.textContent = confirmLabel || 'OK';
      confirm.addEventListener('click', () => close(input ? inputEl.value : true));
      actions.appendChild(confirm);
      dialog.appendChild(actions);
      backdrop.appendChild(dialog);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close(input ? null : false);
      });
      document.body.appendChild(backdrop);
      window.addEventListener('keydown', onKey);
      (inputEl || h).focus();
    });
  }

  window.CapConfirm = function CapConfirm(opts) {
    opts = opts || {};
    return mountDialog({
      title: opts.title,
      body: opts.body || '',
      confirmLabel: opts.confirmLabel || 'Confirm',
      cancelLabel: opts.cancelLabel || 'Cancel',
      destructive: !!opts.destructive,
      showCancel: true
    });
  };
  window.CapAlert = function CapAlert(opts) {
    opts = opts || {};
    return mountDialog({
      title: opts.title,
      body: opts.body || '',
      confirmLabel: opts.confirmLabel || 'OK',
      showCancel: false
    });
  };
  window.CapPrompt = function CapPrompt(opts) {
    opts = opts || {};
    return mountDialog({
      title: opts.title,
      body: opts.body || '',
      input: { placeholder: opts.placeholder || '', type: opts.type || 'text' },
      confirmLabel: opts.confirmLabel || 'OK',
      cancelLabel: opts.cancelLabel || 'Cancel',
      showCancel: true
    });
  };
})();
