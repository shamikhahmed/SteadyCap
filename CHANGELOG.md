# Changelog — SteadyCap

## 2.3.0 (2026-07-11)
- Cap Standard rollout: 14-shot screen gallery (7 screens x mobile/desktop, `npm run gallery`) + browsable `screen-gallery.html`.
- SOS flow e2e (safety-critical): walks all five phases + Skip-all exit, zero page errors.
- CI: SteadyCap CI workflow runs full Playwright suite on every push; viewport-helpers vendored into tests/.
- `verify` / `gallery` / `gallery:view` npm scripts per Cap Standard contract.
- SW cache steadycap-v42.


## 2.1.1 (2026-06-15)
- Restore pre–Capricorn identity home-screen icons (192/512/1024); service worker cache bump.

## 2.1.0 (2026-06-15)
- Daily check-in on Today tab with mood + streak (journal merged into dashboard).
- Journal tab removed from nav; full history via Today → History.
- Legacy `dos_*` storage keys migrate to `steadycap_*` on first load.

## 2.0.3 (2026-06-12)
- Phase P4: Playwright test for linked recovery insight on dashboard in demo mode; service worker cache bump.

## 2.0.0 (2026-06-10)
- Portfolio CTO pass: PWA icons (192/512 maskable), service worker cache bump (`discipline-v6`)
- Truth sprint: docs aligned with shipped features
- Journal trigger chips + TriggerEngine forecast
