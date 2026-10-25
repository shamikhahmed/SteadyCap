# SteadyCap — Screen inventory (prod-ready A–Z)

Source: `js/ui/navigation.js`, `index.html` `#screens`, `js/modules/*` (not guesses).  
Branch: `design/hig-3` · App: Vanilla PWA · Accent: hospital teal (DESIGN.md)

## Top-level screens (`#screens`)

| id | Nav label | Entry | Notes |
|---|---|---|---|
| `screen-onboarding` | — | first run (`!onboardingComplete`) | 4 steps: welcome → habits → config → name/goals |
| `screen-dashboard` | Today | tab `dashboard` | Due now, check-in, journal CTA, SOS shortcut, demo banner |
| `screen-recovery` | Recovery | tab `recovery` | Habit tabs + timeline; empty → Profile CTA |
| `screen-emergency` | SOS | tab `emergency` | 5-phase craving protocol (+ Skip all) |
| `screen-knowledge` | Learn | tab `knowledge` | Category chips, search, article list |
| `screen-journal` | — | from Today “Open journal” | Not in tab bar (removed); Back → Today |
| `screen-profile` | You | tab `profile` | Habits, meds, routines, settings, lock, export |

## Chrome

| Surface | Selector / id | Notes |
|---|---|---|
| Phone tab bar | `#nav` `.nav-tab` | Today · Recovery · SOS · Learn · You |
| Desktop sidebar | `#cap-nav-sidebar` (≥700px) | Same five destinations |
| Splash | `#splash` | Removed after boot |
| Toast | `#toast-wrap` | |
| Pro modal | `#proUpgradeModal` | Hidden by default; Esc / backdrop closes |
| App lock gate | `#steadycap-applock` | When G-10 lock enabled |

## Sheets / dialogs (Profile `#profile-modal`)

| Flow | Opener | Close |
|---|---|---|
| Edit habit (built-in) | Edit Habit Config | ✕ / backdrop / Esc |
| Add built-in habit | + Built-in | Cancel / backdrop / Esc |
| Configure new habit | chip in Add list | backdrop / Esc |
| Add / edit medicine | + Add medicine / Edit | backdrop / Esc |
| Add routine step | + Add step | backdrop / Esc |
| Add / edit custom habit | + Custom / Edit | backdrop / Esc |
| CapConfirm / CapPrompt | reset, remove, app lock | Esc (dialogs.js) |
| Knowledge reader | `.article-card` → `#reader-overlay` | ← Back / Esc |

## Secondary HTML (marketing / docs — not app shell)

`landing.html` · `presentation.html` · `pitch.html` · `privacy.html` · `changelog.html` · `screen-gallery.html`

## Demo / empty profiles

| Mode | How | Storage |
|---|---|---|
| Demo | `?demo=1` | `steadycap_demo_v2` (+ journal demo key) |
| Real / empty | no demo, clear `steadycap_v2` | onboarding if incomplete |

## External hosts (runtime app shell)

Same-origin only (CSP `connect-src 'self'`). No analytics. OG meta points at github.io (static tags only).
