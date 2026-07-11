# SteadyCap — Monetization Plan

## Model: Freemium → Pro ($2.99/mo or $24.99/yr)

### Why someone pays
Recovery is not casual — it's high-stakes. Someone using SteadyCap for a real recovery journey will pay $2.99/mo without hesitation if it means having trigger forecasting and a 5-phase SOS available. This is a highly underserved niche with low competition and high willingness to pay among committed users.

### Revenue logic
- Target: 300 MAU at 12% Pro conversion = 36 × $2.99 = **$107/mo**
- Recovery apps have extremely high retention among Pro users (life-critical use case)
- Annual plan ($24.99/yr) will be the dominant choice — users want certainty
- B2B: counselors, therapists recommending to clients — potential group pricing

---

## Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Habit tracking | 3 habits | ✅ Unlimited |
| Journal | ✅ Basic | ✅ Full with pattern tags |
| Milestone celebrations | ✅ | ✅ |
| Offline PWA | ✅ | ✅ |
| Trigger forecast | ❌ | ✅ Pattern-based risk windows |
| 5-phase SOS flow | ❌ | ✅ Offline emergency protocol |
| Medicine scheduler | ❌ | ✅ Unlimited medicines + reminders |
| Risk window alerts | ❌ | ✅ |
| Recovery analytics | ❌ | ✅ |
| Skincare/hair routines on Today tab | ❌ | ✅ |
| Future: emergency contact share | ❌ | ✅ Roadmap |

---

## Implementation gates
- `window.SteadyPro.isPro()` — reads `localStorage.getItem('sc_pro_active') === '1'`
- Demo mode: `isPro() = true` (full experience for demos)
- Gates at: 4th habit add, medicine tracker, SOS full flow (show basic), trigger forecast
- Gate copy: "Trigger Forecast is a Pro feature →" + `openProUpgrade()`

## Known fix applied (2026-06-28)
- `.reader-overlay` z-index was 200, blocking `#nav` — fixed: `#nav` now `z-index:300`
- Reader overlay bottom set to `calc(64px + env(safe-area-inset-bottom))` so nav remains visible

## Payment path (current)
- Waitlist via `openProUpgrade()` modal in-app
- Next: Stripe for web PWA or RevenueCat for Capacitor App Store

---

*Last updated: 2026-06-28*
