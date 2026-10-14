# SteadyCap — Perfection Loop v3 · INVENTORY
Seeded from §13.4 + code. Updated: 2026-10-14

## Identity
- Name: **SteadyCap** · clinical warmth (orange + teal)
- Stack: static JS PWA · own Pages · demo `?demo=1`
- Safety: SOS centre tab — never weaken crisis content

## Tabs (5 + journal via Today)
| ID | Label | Notes |
|---|---|---|
| dashboard | Today | Due now · check-in · journal prompt (P-STDY-1) |
| recovery | Recovery | Quit timelines / milestones |
| emergency | **SOS** | Centre tab · 5-phase flow · danger icon |
| knowledge | Learn | Articles / programs |
| profile | You | Habits, meds, settings, app lock |
| journal | (screen) | History — reached from Today, not a tab |

## Sheets / dialogs
- CapConfirm / CapPrompt / CapAlert (`js/ui/dialogs.js`)
- App lock gate `#steadycap-applock` (G-10)
- Pro upgrade modal (display:none — G-2 dead UI; triage later)

## Forms
- Medicine add/edit (+ §4.2 footnote)
- Routine / habit config
- Check-in: mood chips Strong/Okay/Hard/Slipped, triggers, note
- Journal entry
- App-lock passcode setup (6+)
- Onboarding

## Network destinations
- Self only (CSP `connect-src 'self'`) · no analytics (G-9)
- Optional: none beyond SW / same-origin assets

## External links
- Hub support via privacy/about patterns · no personal email (G-4)
