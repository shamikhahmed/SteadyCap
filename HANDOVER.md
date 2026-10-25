# SteadyCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/SteadyCap.md` before working here.
> Last updated: 2026-10-25 · Fleet-wide standard: `capricorn-tooling/shared/CAP-STANDARD.md`

## What this is
Personal recovery companion — habits, medicines, SOS/emergency, knowledge. (Never “…OS” in user-facing copy — G-3.)

## Facts
**Version:** 2.6.6  
**SW cache:** `steadycap-v267` (register `sw.js?v=267`)  
**Live:** https://shamikhahmed.github.io/SteadyCap/  
**Repo:** https://github.com/shamikhahmed/SteadyCap  
**Stack:** Vanilla JS PWA. HIG 3 design (`DESIGN.md`, teal accent). Desktop sidebar ≥700px. Playwright QA + `npm run ios:check`.  
**Data:** Local storage. Sensitive-by-nature data stays on device.

## Run & verify
```bash
PORT=8860 node scripts/qa-serve.mjs   # or python3 -m http.server 8768
npm run verify
npm run ios:check
npm run gallery
npm run gallery:view   # then open /screen-gallery.html
```

## Architecture
- `js/modules/` — dashboard, emergency, knowledge, onboarding, profile, recovery, journal, app-lock
- `js/ui/navigation.js` — shell nav; `js/ui/scroll-lock.js` — sheets
- `css/design/*` + `css/cascade.css` — HIG 3 tokens/system/steadycap over `@layer legacy`
- `js/cap-demo-mode.js` — demo data (`?demo=1`)

## Cap Standard status
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ |
| Screen gallery | ✅ |
| Version discipline | ✅ G-8 (`VERSION.json` ↔ SW ↔ `?v=`) |
| QA / e2e | ✅ (SOS release blocker) |
| CI gate | ✅ |
| PWA polish | ✅ |
| Demo mode | ✅ |

## Gotchas — read before coding
- SOS/emergency flow must never break — treat as release blocker in any e2e.
- Recovery data is sensitive — keep local-only; no analytics.
- Do not reintroduce `skipWaiting` / `clients.claim` on the SW.
- Document scroll (no inner `.screen` scrollers); sheets use ScrollLock.

## Where decisions live
- Dated decisions: Capricorn-Brain project note (path above)
- Release history: `CHANGELOG.md`
- Prod-ready audit: `qa/prod-ready/REPORT.md`
