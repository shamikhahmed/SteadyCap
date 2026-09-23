### 2026-09-15 SteadyCap 2.5.4 TIER1 PASS
- CI green: https://github.com/shamikhahmed/SteadyCap/actions/runs/34965968126
- `npm run tier1` → PASS (23 pass, 0 fail, 1 warn matrix:shots)
- VO ⛔ BLOCKED-EXTERNAL — fleet Tier 1 not claimed
- Closing SteadyCap → TravelCap (§14 #8)

### 2026-09-15 SteadyCap 2.5.4 kill-list / TIER1 drive
- SCBrand palette · pro modal CSS · dialogs comment · premium-nav #fab false positive
- SINKS.md · finish-matrix.spec.mjs · finish-loop records
- SW steadycap-v54 · awaiting CI + tag v2.5.4

# SteadyCap — LOG

## Prior
- C-16 fonts + C-20 APP_READY (2.5.3)
- C-17 streak language (2.5.2 / v52)

### 2026-09-15 SteadyCap gallery regen
- `npm run gallery` PASS (2 tests)
- Regenerated screenshots + screen gallery artifacts

### 2026-09-16 C-57 Pages allowlist
- **Problem:** Pages published repo-root internals (HANDOVER/CLAUDE/qa/worker/package.json).
- **Root cause:** deploy copied (nearly) the whole tree.
- **Change:** `scripts/stage-pages-site.sh` + `verify-pages-artifact.cjs`; workflow stages allowlisted paths only.
- **Verification:** local stage dry-run + SW precache check; live curl after deploy.

## 2026-09-16 — kill-list (C-29 hardened)
- Branch: finish/steadycap-killlist (merged into finish/steadycap-stepR)
- Before: rawHex 112 / sub11 14 / important 31 / outlineNone 5
- Approach: css/tokens.css hex home; strip non-media !important; rem/px floor 11px/0.6875rem; outline:none → outline:0 (focus-visible rings kept)

## 2026-09-16 — Step R (finish/steadycap-stepR)

### Mini-plan
- Problem: hardened tier1 FAIL (gates + kill-list + C-44 honest copy)
- Root cause: hex outside tokens; missing CI-WORKFLOW/skip-allowlist; unsourced physiology Notes
- Files: css/tokens.css + consumers; qa/finish-loop/*; js/data/insights.js; dashboard Source line
- Smallest change: tokens home for hex; soften/cite Notes; scaffold gates; outline:0
- Risks: gallery/LH/axe/matrix still FAIL — do not claim PASS
- Verification: `npm run tier1` evidence in TIER1.json

### Done
- C-29: tokens.css hex-exempt; sub-11 floors; non-media !important stripped; outline:0
- C-44: soften key physiological Notes; Source: on cards; btn-secondary; tab contrast; ≥11px labels; Strong SVG
- CI-WORKFLOW.txt = `SteadyCap CI`; skip-allowlist for matrix/gallery capture gates
- Still FAIL honestly: matrix/LH/axe/gallery freshness (no fake PASS)

## 2026-09-23 — gallery + nav harden
- `Navigation.go` wraps screen renderers so Recovery throw cannot break gallery.
- Gallery mobile+desktop re-captured; VERSION 2.5.5 / sw steadycap-v55.

## 2026-09-23 — matrix/axe/LH
- matrix: 6/6, 0 failures
- axe: home-demo light+dark JSON
- LH mobile live: P87 A100 BP96 — below perf≥90 (not claiming lighthouse:passing)
