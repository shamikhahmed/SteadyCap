# SteadyCap — Production-readiness A–Z report

**App:** SteadyCap · **Branch:** `design/hig-3` · **Date:** 2026-10-25  
**Ports:** 8860 / 8861 (qa-serve) · **Round:** 2 (axe findings from reviewer `AUDIT-RUN.json`)

**Reviewer (round 1 evidence):** WebKit ios-check 19/19; `npm run verify` 17 pass / 8 skip; FINISH_MATRIX 6/6; Pages staging ALLOW_PATHS OK (no 404s). Agent sandbox still cannot launch browsers.

**Commits this audit**

| SHA | Message |
|---|---|
| `503f838` | `fix(pwa): align G-8 version and precache HIG shell assets` |
| `75ecf4d` | `fix(a11y): escape user HTML, Esc sheets, real buttons` |
| `60b4485` | `docs(prod-ready): inventory, teal README/HANDOVER, audit harness` |
| `5b983c8` | `fix(a11y): AA contrast via --tint-text, label-3, signal tokens` |
| `2981c59` | `fix(a11y): accessible names on profile and sheet selects` |
| `196f94f` | `fix(a11y): unnest knowledge article open and bookmark controls` |
| `6715d48` | `test(a11y): Playwright axe smoke for core screens and add-habit` |

---

## Checklist A–L

| # | Area | Status | Evidence |
|---|---|---|---|
| A | Build & gates | **PASS** (reviewer) / static OK | verify 17/8skip; matrix 6/6; G-8 VERSION↔SW aligned |
| B | Screen inventory | **PASS** | `qa/prod-ready/INVENTORY.md` |
| C | Visual pass | **PASS** (reviewer) | 40 shots in `qa/prod-ready/shots/` |
| D | Interaction pass | **FIXED** | Real buttons; Esc sheets; knowledge open/bookmark siblings |
| E | Core flows | **PASS** (reviewer) | SOS + smoke via verify |
| F | iPhone behaviour | **PASS** (reviewer) | WebKit ios-check 19/19 |
| G | Accessibility | **FIXED** (code) / **pending re-axe** | Round-2: 15 AUDIT findings addressed (contrast tokens, select-name, nested-interactive). New `tests/a11y-axe-smoke.spec.js` — reviewer runs |
| H | PWA / offline | **PASS** (reviewer) | Offline reload OK in AUDIT-RUN |
| I | Performance | **PASS** (static) | Unchanged |
| J | Robustness & privacy | **PASS** | escapeHtml + CSP |
| K | Content | **PASS** | Teal docs |
| L | Docs | **PASS** | This REPORT round 2 |

---

## Round 2 — AUDIT-RUN findings → fixes

| Sev | Finding | Fix commit |
|---|---|---|
| High | color-contrast (dashboard/recovery/emergency/knowledge/onboarding + SOS skip; light; profile dark ghost) | `5b983c8` — `--label-3` AA; `--tint-text`; `--signal-*` for phase/dopamine text; SOS label stays `--danger` |
| Critical | select-name `#p-currency`, `#med-schedule` (+ sheets) | `2981c59` — `<label for>` + `aria-label` |
| High | nested-interactive knowledge article cards | `196f94f` — open + bookmark sibling buttons |
| — | Regression gate | `6715d48` — axe smoke (dashboard, knowledge, profile, `_addHabit`) light+dark |

## Still for reviewer

```bash
cd Cap-Apps/_workspace/SteadyCap-hig
PORT=8861 node scripts/qa-serve.mjs &
npx playwright test tests/a11y-axe-smoke.spec.js
node scripts/prod-ready-audit.mjs http://127.0.0.1:8861/
```

Expect axe serious/critical = 0 on audited surfaces.

## Test counts

| | After round 2 |
|---|---|
| Playwright | + `tests/a11y-axe-smoke.spec.js` (2 theme describes × 1 test) |
| In-agent browser | Not run (sandbox) |

## External hosts

None at runtime (`connect-src 'self'`).
