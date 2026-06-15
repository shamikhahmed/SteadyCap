'use strict';
/** One-time migration from legacy DOS-era storage keys to SteadyCap names. */
const StorageMigrate = (() => {
  function local(newKey, legacyKeys) {
    if (localStorage.getItem(newKey) != null) return newKey;
    for (let i = 0; i < legacyKeys.length; i++) {
      const val = localStorage.getItem(legacyKeys[i]);
      if (val != null) {
        localStorage.setItem(newKey, val);
        return newKey;
      }
    }
    return newKey;
  }

  function session(newKey, legacyKeys) {
    if (sessionStorage.getItem(newKey) != null) return newKey;
    for (let i = 0; i < legacyKeys.length; i++) {
      const val = sessionStorage.getItem(legacyKeys[i]);
      if (val != null) {
        sessionStorage.setItem(newKey, val);
        return newKey;
      }
    }
    return newKey;
  }

  return { local, session };
})();
window.StorageMigrate = StorageMigrate;
