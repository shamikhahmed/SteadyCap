# SteadyCap — Production-readiness A–Z report

**App:** SteadyCap · **Branch:** `design/hig-3` · **Date:** 2026-10-25  
**Ports:** 8860 (qa-serve) · **Engine note:** Cursor agent sandbox blocks Chromium (SEGV / missing mac-x64 alias). WebKit not launched here. Reviewer: run with host Playwright + WebKit.

**Commits this audit**

| SHA | Message |
|---|---|
| `503f838` | `fix(pwa): align G-8 version and precache HIG shell assets` |
| `75ecf4d` | `fix(a11y): escape user HTML, Esc sheets, real buttons` |
| `60b4485` | `docs(prod-ready): inventory, teal README/HANDOVER, audit harness` |

---

## Checklist A–L

| # | Area | Status | Evidence |
|---|---|---|---|
| A | Build & gates | **FIXED** (static) / **FAIL** (browser e2e in-agent) | `VERSION.json` ↔ `sw.js` CACHE `steadycap-v267` ↔ `register ?v=267` verified by Node. `tests/version.spec.js` added. Playwright e2e could not launch browsers in this environment (`qa/prod-ready/e2e-core.txt`, `runner.log`). No lint/typecheck scripts in package (N/A). Install-free static serve OK on :8860. |
| B | Screen inventory | **PASS** | `qa/prod-ready/INVENTORY.md` from `navigation.js` + `#screens` + profile sheets |
| C | Visual pass | **FAIL** (blocked) | Harness `scripts/prod-ready-audit.mjs` ready; `qa/prod-ready/shots/` empty — no PNGs captured in-agent. Reviewer: `node scripts/prod-ready-audit.mjs http://127.0.0.1:8860/` |
| D | Interaction pass | **FIXED** (code) / **FAIL** (live proof) | Dead `div`/`span` onclick removed on hair tiles + icon chips; Esc on sheets/reader/Pro. Live tap pass not executed here. |
| E | Core flows + persistence | **FAIL** (blocked) | SOS/smoke/app-lock specs exist; not green in-agent. Persistence/import/export/lock covered by existing specs once browsers run. |
| F | iPhone behaviour | **FAIL** (blocked) | `scripts/ios-behaviour-check.mjs` has Chromium fallback; not run to completion here. Prior HIG branch note: 18/18 on WebKit. |
| G | Accessibility | **FIXED** (partial) / **FAIL** (axe live) | Buttons + keyboard article cards + Esc/aria-modal on sheets. axe-core not run live. AA tint tokens documented in DESIGN.md. |
| H | PWA / offline | **FIXED** | SW precaches design CSS, scroll-lock, cap-desktop-nav, hig-dt, woff2 fonts. No `skipWaiting`/`clients.claim`. Manifest name/icons/maskable; theme `#000`. Offline reload not proven in-agent. |
| I | Performance | **PASS** (static) | Blocking CSS: tokens + design tokens + cascade (intentional). Splash/screen min-heights for CLS. Secondary modules idle-loaded. No double unused giant CSS newly introduced. |
| J | Robustness & privacy | **FIXED** | `escapeHtml` for user/journal strings; quota toast on save; CSP in `index.html`; clinician export `noopener`; no secrets in repo; connect-src self. Corrupted storage → State.load catch → DEFAULT. |
| K | Content | **FIXED** | Pro waitlist “coming soon” removed; README teal (was orange); journal not listed as tab. Demo labelled via demo banner / `?demo=1`. |
| L | Docs | **PASS** | README, HANDOVER (2.6.6 / v267), DESIGN.md, CHANGELOG Unreleased updated. |

---

## Defects found → fixed

| Sev | Screen / area | Cause | Fix commit |
|---|---|---|---|
| High | PWA / update path | `VERSION.json` `steadycap-v266` ≠ SW `v267` ≠ register `?v=64` | `503f838` |
| High | Offline shell | Missing SW precache: `cap-desktop-nav.js`, `hig-dt.js`, local fonts | `503f838` |
| High | XSS | User name/goals/meds/journal/custom habit interpolated into `innerHTML` unescaped | `75ecf4d` |
| Med | You · hair | `<div onclick>` tiles (non-button) | `75ecf4d` |
| Med | You · custom habit | Icon pickers were `<span onclick>` | `75ecf4d` |
| Med | Sheets / Pro / reader | Esc did not close | `75ecf4d` |
| Med | Learn | Article cards not keyboard-activatable | `75ecf4d` |
| Med | Storage | QuotaExceeded swallowed silently | `75ecf4d` |
| Low | Manifest | theme/background `#080808` ≠ HIG `#000` | `503f838` |
| Low | Content / docs | README orange accent; Journal as tab; Pro “coming soon”; HANDOVER 2.6.1 | `60b4485` + `75ecf4d` |

## Still FAIL / blocked

1. **Browser e2e + ios:check + screenshots + axe** — agent cannot launch Chromium/WebKit (sandbox). Reviewer commands:
   ```bash
   cd Cap-Apps/_workspace/SteadyCap-hig
   PORT=8860 node scripts/qa-serve.mjs &
   npx playwright test tests/version.spec.js tests/smoke.spec.js tests/sos.spec.js tests/viewport.spec.js tests/hig-design.spec.js tests/app-lock.spec.js
   node scripts/ios-behaviour-check.mjs http://127.0.0.1:8860/
   node scripts/prod-ready-audit.mjs http://127.0.0.1:8860/
   ```
2. **Live offline / SW update path** — not exercised with a real SW registration in this session.
3. **500+ items / RTL edge fuzz** — not load-tested here (no harness data).

## Test counts

| | Before (listed) | After |
|---|---|---|
| Playwright files / tests | 7 files / 23 tests | 8 files / 25 tests (+ `version.spec.js` ×2) |
| In-agent run | — | 0 pass (browser launch failed) |

## ios-check

Not completed in-agent. Script updated with Chromium + iPhone 15 Pro metrics fallback (`engine=` log line). Reviewer re-runs WebKit.

## External hosts (app shell)

None at runtime (CSP `connect-src 'self'`). Static OG tags reference `shamikhahmed.github.io` images only.
