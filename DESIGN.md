# SteadyCap — Design system

Sober, Apple HIG-aligned, ported from the ScentCap 3.0 system (`ScentCap/src/design/system.css`, `DESIGN.md`) via VaultCap.
Content first; chrome stays quiet. SteadyCap keeps its own accent: **hospital teal**; SOS stays red.

Source of truth:

| File | Role | Loading |
|---|---|---|
| `css/design/tokens.css` | Semantic tokens (light / dark / increased contrast) + legacy bridge | render-blocking, unlayered |
| `css/design/system.css` | `ui-*` primitives (ScentCap port) | `@layer components` via `css/app.css` |
| `css/design/steadycap.css` | Reskin of 2.x shell + shared classes (`#nav`, `.nav-tab`, `.card`, `.btn-*`, profile sheets) | `@layer components` |
| `css/cascade.css` | Declares `@layer legacy, components` only; layered sheets are `<link>`d from `index.html` | render-blocking |

## Principles

1. **Content first.** Numbers and names carry the screen; surfaces are grey/white (light) or black/graphite (dark).
2. **One accent.** Gold (`--tint`) marks the single primary action per screen, selection and links. Never decorative.
3. **System type.** SF (`--font-ui`) at 17pt body; SF Rounded (`--font-rounded`) only for hero amounts. Tabular figures for money.
4. **Native patterns.** Large titles on top-level screens, inset-grouped lists for settings and records, segmented controls,
   sheets with grabber + Cancel / Title / Done, floating glass tab bar (phone) / glass sidebar (≥700px).
5. **Accessible by default.** 44pt targets, AA contrast in light / dark / increased contrast, reduced motion + transparency honoured,
   colour never the only signal, every icon button has `aria-label`.

## Accent

| Appearance | `--tint` | Contrast |
|---|---|---|
| Dark (default) | `#00d4e6` teal, `--on-tint: #000` | 9.4:1 on `#1c1c1e`; 11.6:1 black on teal |
| Light | `#0b6e78` deep teal, `--on-tint: #fff` | 6.0:1 on white, 5.4:1 on `#f2f2f7` |
| Increased contrast | `#095a63` light / `#5ce4f0` dark | — |
| SOS | `--danger` | status colour, never decorative |

Theme is `data-theme` on `<html>` (inline boot script in `index.html`, Profile theme switch).

## Tokens

Same names as ScentCap: `--bg`, `--surface(-2|-elevated)`, `--fill(-2)`, `--separator`, `--label(-2|-3|-4)`,
`--tint(-hover|-soft)`, `--on-tint`, `--success/--warning/--danger`, `--t-large … --t-caption2`, `--r-sm/md/lg/xl`,
`--shadow-1/2/3`, `--ease`, `--hit`, `--gutter`, `--tabbar-h`. The glass material is `--glass-material`
(`--glass` is a legacy name, bridged to `--surface`).

**Do not** use hex values or legacy tokens (`--bg2…4`, `--glass*`, `--border*`, `--text*`, `--teal`/`--orange`, `--sc-hex-*`) in new code.
They are bridged in `tokens.css` so 2.x screens inherit the palette, and will be removed once every screen is migrated.

## Primitives (`ui-*`)

Identical to ScentCap minus the bottle-specific classes (`ui-plinth`, `ui-bottle*`, `ui-grid`, `ui-tabbar`, `ui-sidebar`):
`ui-page`, `ui-header`, `ui-eyebrow`, `ui-largetitle`, `ui-section(-head|-title|-link)`, `ui-card(--lg)`, `ui-list`,
`ui-row(--media|--icon)`, `ui-row__main/__title/__sub/__value/__icon`, `ui-chevron`, `ui-list-header/-footer`,
`ui-btn` + `--primary/--secondary/--gray/--plain/--danger/--sm/--block`, `ui-icon-btn(--tint)`, `ui-chip`, `ui-tag(--tint)`,
`ui-segmented`, `ui-search`, `ui-field(--left)`, `ui-switch`, `ui-widgets`, `ui-widget(__label|__value|__unit)`, `ui-meter`,
`ui-scroller`, `ui-skeleton`, `ui-rise`, `ui-sheet*`, plus `.num` (tabular figures).

## Shell

- Phone (<700px): floating glass tab bar — Today · Recovery · SOS · Learn · You. The document scrolls (no inner `.screen`
  scrollers); a new screen opens at the top.
- ≥700px: sticky glass sidebar via CSS (`js/cap-desktop-nav.js` is generated from `shared/design-system` and still toggles
  `body.cap-desktop-nav` at 900px — change it at the source).
- Sheets (`#profile-modal`): grabber, Cancel / Title bar, page pinned underneath (`js/ui/scroll-lock.js`) and restored exactly.
- iPhone: clickable `<div onclick>` chips and switches are `<button>`s (switches use `role="switch"`). Check with `npm run ios:check`.

## Copy

Plain, warm, short. Sentence case. No exclamation marks. Fictional data is always labelled ("Sample · Fictional data only").
