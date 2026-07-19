## [2.4.0] — 2026-07-20

### Beauty — clinical chart / medical tray
- Splash: chart clipboard open beat (light + dark)
- Dual theme tokens (paper chart light / calm tray dark); You → Appearance toggle
- Desaturated neon semantics; SOS breath ring opacity pulse (no glow bloom)
- Tray card chrome + subtle chart grid; SW `steadycap-v46`

## [2.3.3] — 2026-07-19

### QA
- Capricorn QR precached in SW; Playwright 9 passed
- SW `steadycap-v45`

## [2.3.2] — 2026-07-19

### Pitch
- Premium Capricorn QR (`assets/qr-steadycap.png`) — H ECC, Capricorn Systems center mark, gold quiet frame on CTA

### Ops
- SW `steadycap-v44`

# Changelog — SteadyCap

## 2.3.1 (2026-07-19)
- Cap Family Mega-Wave: Capricorn OS brand lock — wired favicon, apple-touch-icon-180, and separate any/maskable PWA icons in `manifest.json` + `index.html`.
- Apple polish: theme-color aligned to shell background; emoji tiles use Apple Color Emoji stack; safe-area insets unchanged (already solid).
- SW cache bump (`steadycap-v43`); SW register query `?v=43`.
- FEATURES.md (S/W/L/R) at root; gallery + SOS e2e remain release gates.

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
