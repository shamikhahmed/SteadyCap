# SteadyCap — Perfection v3 ITEMS
Seeded from CURSOR-PERFECTION-LOOP.md §13.4. Status: only Auditor sets ✅ VERIFIED.

### STD-V3-1 — mood chip text < 11px (Strong/Okay/Hard/Slipped)
severity: P1     status: ✅ FIXED
Where: Today daily check-in · `.mood-label` · Evidence: baseline + post-fix device-qa `tinyCount=0`
Cause: `font-size: 0.6875rem` could sub-pixel under 11px on SE.
Fix: `css/app.css` → `font-size: max(11px, 0.75rem)`; `.mood-btn` min 44×44.
Test: device-qa `qa/perfection/device/` · smoke check-in widgets
Auditor: _(pending)_

### STD-V3-2 — "Open journal" tap target < 32px
severity: P1     status: ✅ FIXED
Where: Today journal prompt CTA
Cause: hit area not explicitly floored for touch audit.
Fix: `btn-open-journal` class — `min-height:48px; min-width:44px` + dashboard markup.
Test: device-qa `smallCount=0` · post-fix folder
Auditor: _(pending)_

### STD-V3-3 — merge stepR + reconcile wip/steadycap-2026-09
severity: P1     status: ✅ FIXED
Where: Phase 0 / wip review
Cause: `finish/steadycap-stepR` merged to main @ `b9d31a4`; wip had demo-seed + 2.5.6 + MODULE_CHAIN.
Fix: Ported `js/modules/demo-seed.js`, MODULE_CHAIN cold path, light-theme teal AA; kept self-hosted fonts (G-9); G-8 bump 2.5.6 / `steadycap-v56` / `?v=56`. Skipped wip system-font swap (identity).
Test: device-qa 7/7 · SOS flow still centre tab
Auditor: _(pending)_

### STD-V3-4 — G-10 app lock via shared local-lock + G-6 fixture
severity: P1     status: ✅ FIXED
Where: Profile → App lock · medicines/cravings/journal
Cause: Ticket required shared module + migration fixture; vendor already matched shared MD5.
Fix: Confirmed `js/vendor/local-lock.js` ≡ `capricorn-tooling/shared/security/local-lock.js`; Playwright `tests/app-lock.spec.js` + `tests/fixtures/pre-lock-v1.json` (enable→seal→unlock).
Test: `npx playwright test tests/app-lock.spec.js`
Auditor: _(pending)_
