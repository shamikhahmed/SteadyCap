# SteadyCap — iOS simulator pass (v7 §7.4)

Date: 2026-10-22 · Capacitor/PWA · Safari via simctl openurl

## Devices (one at a time)

| Device | Light | Dark | Larger Text AX3 | VoiceOver (10 controls) |
|---|---|---|---|---|
| iPhone SE (3rd gen) | ✅ | ✅ | ✅ | ✅ spot (a11y tree) |
| iPhone 16 Pro | ✅ | ✅ | ✅ | ✅ spot (a11y tree) |
| iPad Air 11" (M2) | ✅ | ✅ | ✅ | ✅ spot (a11y tree) |

## Evidence (gitignored)

Screenshots: `SteadyCap/build/qa/v7/sim/*.png` (9 PNGs)
Run log: `SteadyCap/build/qa/v7/sim/sim-run.jsonl`
Script: `capricorn-tooling/scripts/v7-sim-pass.mjs` + `run-v7-sim-fleet.sh`

## VoiceOver spot-check (honest — live page a11y tree / aria labels)

Native VoiceOver not automated in CI; labels pulled from live demo via Playwright accessibility tree (https://shamikhahmed.github.io/SteadyCap/?demo=1).

| # | Role | Label |
|---|---|---|
| 1 | `a` | Skip to content |
| 2 | `button` | Profiles |
| 3 | `button` | Edit |
| 4 | `button` | Taken |
| 5 | `button` | Skip |
| 6 | `button` | History |
| 7 | `button` | Strong |
| 8 | `button` | Okay |
| 9 | `button` | Hard |
| 10 | `button` | Slipped |

## Notes

- Demo URL: `https://shamikhahmed.github.io/SteadyCap/?demo=1`
- Matrix: 3 devices × light / dark / Larger Text AX3 (`--larger-text`).
- Dynamic Type AX3 via Simulator Accessibility prefs; appearance via `simctl ui`.
