# SteadyCap 2.7.0 — Release report

**Branch:** `design/hig-3` (PR [#2](https://github.com/shamikhahmed/SteadyCap/pull/2))  
**Date:** 2026-10-25  
**Previous tag:** `v2.6.6`

## Version

| Field | Value |
|---|---|
| App | **2.7.0** |
| SW cache | `steadycap-v70` |
| Register | `sw.js?v=70` |
| In-app | `window.APP_VERSION` + You-screen `data-version` |

## What shipped

- HIG redesign (glass tab bar, tokens, Today / Recovery / You restyle)
- iPhone scroll + sheet lock/restore; real buttons for chips/switches
- Round-2 a11y (contrast, select names, nested interactive); `tests/a11y-axe-smoke.spec.js` in Playwright suite
- SOS / crisis flows unchanged
- Release gate + live smoke scripts under `qa/release/`

## Commits (this release prep)

See `git log` on `design/hig-3` — release prep commits bump G-8 to 2.7.0, add CHANGELOG/RELEASE, and add `run-checks.sh` / `live-smoke.mjs`.

## Reviewer must run

```bash
cd Cap-Apps/_workspace/SteadyCap-hig
bash qa/release/run-checks.sh
# after merge + Pages deploy:
node qa/release/live-smoke.mjs https://shamikhahmed.github.io/SteadyCap/
```

Do **not** push / merge / tag / deploy from the agent — reviewer owns those one-liners.

## Agent verification

- G-8 strings coherent at 2.7.0 / `steadycap-v70` (static check)
- Browsers cannot launch in agent sandbox — full gate is `run-checks.sh` outside sandbox
- Never weakened gates; WebKit-only for release ios-check (`WEBKIT_ONLY=1`) and live-smoke (no Chromium fallback)
