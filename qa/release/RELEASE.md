# SteadyCap 2.7.0 — Release

| | |
|---|---|
| **Version** | 2.7.0 |
| **SW cache** | `steadycap-v70` (`sw.js?v=70`) |
| **Previous** | 2.6.6 / tag `v2.6.6` |
| **Branch** | `design/hig-3` |
| **PR** | [#2](https://github.com/shamikhahmed/SteadyCap/pull/2) |
| **Live** | https://shamikhahmed.github.io/SteadyCap/ |
| **Date** | 2026-10-25 |

## What changed

Apple-feel redesign of SteadyCap: clearer Today / Recovery / You screens, a glass tab bar, and smoother scrolling and sheets on iPhone. Accessibility fixes for contrast, form labels, and knowledge articles. SOS / crisis flows are unchanged. Version coherence and release gates added for this ship.

## Rollback

Revert the squash commit; previous tag **v2.6.6**.

## Reviewer commands

```bash
# Pre-merge gate (outside sandbox):
bash qa/release/run-checks.sh

# After merge + Pages deploy:
node qa/release/live-smoke.mjs https://shamikhahmed.github.io/SteadyCap/
```
