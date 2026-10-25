'use strict';
/* ScrollLock — freezes the document while any sheet/overlay is open, then restores the exact position.
 * iOS ignores `overflow:hidden` on body for touch scrolling and jumps when it is toggled, so the body is
 * pinned with position:fixed + top:-scrollY (ScentCap 3.0.1 recipe). One observer covers every overlay type
 * (profile sheets, Pro modal, article reader, confirm dialogs), however it is opened or removed. */
const ScrollLock = (function () {
  const OPEN = '#profile-modal[style*="block"], #proUpgradeModal[style*="flex"], .reader-overlay.open, .sc-dialog-backdrop';
  let lockedY = null;
  let queued = false;

  function lock() {
    if (lockedY !== null) return;
    lockedY = window.scrollY;
    const b = document.body.style;
    b.position = 'fixed';
    b.top = -lockedY + 'px';
    b.left = '0';
    b.right = '0';
    b.width = '100%';
  }

  function unlock() {
    if (lockedY === null) return;
    const y = lockedY;
    lockedY = null;
    const b = document.body.style;
    b.position = '';
    b.top = '';
    b.left = '';
    b.right = '';
    b.width = '';
    window.scrollTo(0, y);
  }

  function sync() {
    queued = false;
    if (document.querySelector(OPEN)) lock();
    else unlock();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  function init() {
    new MutationObserver(schedule).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /** Page position as the user sees it (the body is offset while locked). */
  function currentY() {
    return lockedY !== null ? lockedY : window.scrollY;
  }

  /** Navigation while a sheet is open: land at y when the lock releases instead of the old position. */
  function scrollTo(y) {
    if (lockedY !== null) lockedY = y;
    else window.scrollTo(0, y);
  }

  return { lock, unlock, sync, currentY, scrollTo, isLocked: () => lockedY !== null };
})();

window.ScrollLock = ScrollLock;
