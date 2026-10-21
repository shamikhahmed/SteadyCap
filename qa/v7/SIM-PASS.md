# SteadyCap — iOS simulator pass (v7 §7.4)

Capacitor config present; `ios/` generated locally via `npm run cap:init` (not committed).

| Device | Light | Dark | AX3 | VoiceOver ×10 |
|---|---|---|---|---|
| iPhone SE 3 | ◐ | ◐ | ◐ | ◐ |
| iPhone 16 Pro | ◐ | ◐ | ◐ | ◐ |
| iPad Air 11 | ◐ | ◐ | ◐ | ◐ |

Safari sim evidence (WKWebView parity): `SteadyCap/build/qa/v7/sim/` via `v7-sim-pass.mjs` + `https://shamikhahmed.github.io/SteadyCap/?demo=1`.

Native shell: `npm run cap:sync && npx cap run ios` (requires local `ios/` + signing).
