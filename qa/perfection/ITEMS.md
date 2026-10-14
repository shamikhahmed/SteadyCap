# SteadyCap — Perfection Loop v3 · ITEMS
Seeded from CURSOR-PERFECTION-LOOP.md §13.4. Status: only Auditor sets ✅ VERIFIED.

### STD-V3-1 — mood chip text < 11px
severity: P1 · status: ✅ VERIFIED
Where: Today daily check-in · `.mood-label` (Strong / Okay / Hard / Slipped)  
Evidence: baseline live soft text<11 → post-fix `qa/perfection/baseline/device-qa.json` tinyCount=0 all 7  
Cause: `font-size: 0.6875rem` could sub-pixel under 11px on SE  
Fix: `css/app.css` → `font-size: max(11px, 0.75rem)`; mood-btn `min-height/width: 44px`  
Test: device-qa local `?demo=1` · smoke check-in widget  
Auditor: ✅ VERIFIED 2026-10-14T11:40:00Z — playwright 9/9 (sos/smoke/app-lock) + auditor-independent 7/7 hard=0 tap=0 text=0 pageErr=0 @ 645d6c7

### STD-V3-2 — "Open journal" target < 32px
severity: P1 · status: ✅ VERIFIED
Where: Today journal prompt CTA  
Evidence: post-fix baseline smallCount=0 all 7  
Cause: ticket from live scan; hardened explicit touch class  
Fix: `btn-open-journal` (`min-height: 48px`, `min-width: 44px`) on dashboard CTA  
Test: device-qa · smoke  
Auditor: ✅ VERIFIED 2026-10-14T11:40:00Z — playwright 9/9 (sos/smoke/app-lock) + auditor-independent 7/7 hard=0 tap=0 text=0 pageErr=0 @ 645d6c7

### STD-V3-3 — merge stepR + reconcile wip/steadycap-2026-09 (G-8)
severity: P1 · status: ✅ VERIFIED
Where: Phase 0 merge + wip review  
Cause: `finish/steadycap-stepR` unmerged at program start; wip had demo-seed + 2.5.6 + MODULE_CHAIN  
Fix: Conductor merged stepR → `main` @ `b9d31a4`. Builder ported **compatible** wip: `js/modules/demo-seed.js`, Profile→SteadyDemo, skip-reseed, splash 220ms, light teal AA `#0B6E78`, G-8 → **2.5.6 / steadycap-v56 / ?v=56**. **Deferred** MODULE_CHAIN (SOS must stay eager under load). Kept self-hosted fonts (G-9). Fixed `insights.js` unescaped `day's` pageerror. Playwright → 1.63.0.  
Test: SOS + smoke + app-lock · device-qa 7/7  
Auditor: ✅ VERIFIED 2026-10-14T11:40:00Z — playwright 9/9 (sos/smoke/app-lock) + auditor-independent 7/7 hard=0 tap=0 text=0 pageErr=0 @ 645d6c7

### STD-V3-4 — G-10 app lock via shared local-lock + G-6
severity: P1 · status: ✅ VERIFIED
Where: `js/vendor/local-lock.js` ≡ `capricorn-tooling/shared/security/local-lock.js` (md5 match); `js/modules/app-lock.js`  
Evidence: `tests/app-lock.spec.js` + `tests/fixtures/pre-lock-v1.json` — enable → seal → lock → unlock restores medicines/journal/cravings  
Cause: ticket to confirm shared module + migration fixture  
Fix: confirmed vendor copy sync; G-6 fixture test; journal key via StorageMigrate  
Test: `npx playwright test tests/app-lock.spec.js`  
Auditor: ✅ VERIFIED 2026-10-14T11:40:00Z — playwright 9/9 (sos/smoke/app-lock) + auditor-independent 7/7 hard=0 tap=0 text=0 pageErr=0 @ 645d6c7

### STD-V3-5 — gallery / MATRIX completeness (v3)
severity: P2 · status: **✅ FIXED** (primary G17)  
Where: `scripts/live-gallery-v3.mjs` · manifest **2.6.0**  
Evidence: **18** WebP (Today/Check-in/SOS × light/dark × iphone/ipad/mac) · SOS centre tab captured · G17 ✅ · 5-phase SOS detail remains MATRIX follow-up  

### STD-V3-6 — Lighthouse Today / SOS / Journal to §7.11
severity: P2 · status: ⏳ OPEN  
