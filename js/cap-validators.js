'use strict';
/**
 * Shared validation helpers — subset of VaultCap Validators pattern.
 * Vendored to vanilla Cap apps via capricorn-tooling/shared/validation/
 */
const CapValidators = (() => {
  function required(value, label) {
    if (value == null || String(value).trim() === '') return `${label} is required`;
    return null;
  }

  function positiveNumber(value, label) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return `${label} must be greater than 0`;
    return null;
  }

  function iban(value) {
    if (!value) return null;
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(String(value).replace(/\s/g, ''))) return 'Invalid IBAN format';
    return null;
  }

  function run(checks, onError) {
    for (const err of checks) {
      if (err) {
        if (typeof onError === 'function') onError(err);
        else if (typeof CapDemo !== 'undefined' && CapDemo.toast) CapDemo.toast(err, 'danger');
        else if (typeof showToast === 'function') showToast(err, 'error');
        return false;
      }
    }
    return true;
  }

  return { required, positiveNumber, iban, run };
})();

window.CapValidators = CapValidators;
