# SteadyCap — Roadmap

> Updated 2026-07-11. Fleet order & standard: `capricorn-tooling/shared/CAP-STANDARD.md`.

## Now — v2.2.0
Current shipped state. See `CHANGELOG.md` for how we got here.

## Cap Standard gaps
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ |
| Screen gallery | ✅ |
| Version discipline | ✅ |
| QA / e2e | ✅ |
| CI gate | ✅ |
| PWA polish | ✅ |
| Demo mode | ✅ |

## Next (ordered)
1. CI: Pages deploy workflow with test gate (currently NO workflows)
2. Screen gallery per Cap Standard
3. `verify` script; e2e smoke for SOS flow specifically (safety-critical path)

## Later
- Medicine reminder notifications (needs push decision)

## Ground rules
- No dirty trees: commit or discard before ending a session.
- CI green before tag; tag `vX.Y.Z` per release.
- Bump SW cache with any asset change (PWA apps).
- Never commit `.env` / secrets.
