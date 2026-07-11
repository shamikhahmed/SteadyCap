# SteadyCap

**Personal Recovery Operating System — by Capricorn Systems.** Habits, daily routines, medicines, recovery timelines, emergency SOS, journal, and trigger intelligence.

🔗 **Live:** https://shamikhahmed.github.io/SteadyCap/  
📁 **Repo:** https://github.com/shamikhahmed/SteadyCap

---

## What's New

### Today (Home)
- **Today's Routines** — medicines, skincare AM/PM, hair AM/PM, and weekly steps in one checklist
- **SOS one-tap** — instant craving protocol from the home screen
- **Habit progress** — recovery score, streaks, and body-healing milestone preview
- **Gentle nudges** — in-app reminders for missed medicine/routine times (no guilt)

### Medicines
- Fixed times **or** as-needed scheduling
- Push notifications (with permission) + in-app toasts
- Add, edit, enable/disable in **Profile**

### Skincare & Hair Routines
- AM / PM checklists + weekly steps per category
- Set once, modify anytime in **Profile**

### Bad Habits
- **12 built-in habits** including smoking, vape, alcohol, porn, social media, masturbation, weed, gaming, sugar, caffeine, and more
- **Custom habits** — user-defined name, icon, and quit date

### Recovery Database
- **Hourly body-healing milestones** for the first 72 hours per habit type
- Daily and weekly milestones beyond 72h
- Full timeline view on the **Recovery** tab with body system scores

---

## Install on iPhone

1. Open the live URL in **Safari**
2. **Share → Add to Home Screen**
3. Launch from home screen for full-screen PWA mode
4. Enable **Push Reminders** in Profile for medicine alerts (iOS 16.4+)

## iPhone test checklist

- [ ] Onboarding completes and lands on Today
- [ ] Bottom nav switches all tabs (Today, Recovery, SOS, Learn, Journal, You)
- [ ] Today's checklist: medicines + skincare + hair
- [ ] SOS opens from one-tap button
- [ ] Recovery timeline shows hourly milestones (first 72h)
- [ ] Custom habit can be added in Profile
- [ ] App works offline after first load (service worker)
- [ ] Safe area: no content under notch / home indicator

## Local dev

```bash
cd SteadyCap
python3 -m http.server 8765
# → http://localhost:8765
```

## Stack

Vanilla JS PWA · orange accent `#FF6B35` · offline-first · localStorage

## Modules

- **Today** — routines checklist, habit progress, SOS, gentle nudges
- **Recovery** — hourly + daily body-healing timelines, craving forecast, body engine
- **SOS** — emergency craving protocol, grounding tools
- **Learn** — recovery knowledge library
- **Journal** — daily entries
- **You (Profile)** — medicines, routines, habits, settings, export/import

## Documentation

| Resource | Path |
|----------|------|
| User guide | [docs/GUIDE.md](docs/GUIDE.md) |
| Presentation | [docs/PRESENTATION.md](docs/PRESENTATION.md) |
| Landing page | [landing.html](landing.html) |

---

Built by Shamikh Ahmed.

## Screen gallery

```bash
npm run gallery        # regenerate docs/screenshots/gallery/ (14 shots)
npm run gallery:view   # then open http://127.0.0.1:8768/screen-gallery.html
```

## Verify

```bash
npm run verify   # full Playwright suite incl. SOS flow — CI runs this on every push
```
