# SteadyCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/SteadyCap.md` before working here.
> Last updated: 2026-07-19 · Fleet-wide standard: `capricorn-tooling/shared/CAP-STANDARD.md`

## What this is
Personal recovery OS — habits, medicines, SOS/emergency, knowledge.

## Facts
**Version:** 2.3.1
**Live:** https://shamikhahmed.github.io/SteadyCap/
**Repo:** https://github.com/shamikhahmed/SteadyCap
**Stack:** Vanilla JS PWA. Desktop-adaptive sidebar shell. Playwright viewport QA.
**Data:** Local storage. Sensitive-by-nature data stays on device.

## Run & verify
```bash
python3 -m http.server 8768
npm run verify
npm run gallery
npm run gallery:view   # then open /screen-gallery.html
```

## Architecture
- `js/modules/` — dashboard, emergency, knowledge, onboarding, profile, recovery
- `js/ui/navigation.js` — shell nav
- `js/cap-demo-mode.js` — demo data

## Cap Standard status (2026-07-19)
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ |
| Screen gallery | ✅ |
| Version discipline | ✅ |
| QA / e2e | ✅ (SOS release blocker) |
| CI gate | ✅ |
| PWA polish | ✅ (brand lock v2.3.1) |
| Demo mode | ✅ |

Gaps are tracked as tasks in `ROADMAP.md`.

## Gotchas — read before coding
- SOS/emergency flow is the one path that must never break — treat as release blocker in any e2e.
- Recovery data is sensitive — keep local-only; no analytics.

## Where decisions live
- Dated decisions: Capricorn-Brain project note (path above)
- Release history: `CHANGELOG.md`
- Fleet-level events: `Cap-Apps/docs/CHANGELOG.md` (master)
