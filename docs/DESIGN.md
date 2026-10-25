# Design — CityPal apps

> **Status**: living document · **Last updated**: 2026-10-25

## Direction

History: the first brief asked for a **very soft** interface ("très douce");
on 2026-10-24 the palette became green, warm lemon and cream, with frosted
glass and colour halos. On **2026-10-25** the project owner found the result
childish and asked for something **more professional and serious**. Later
the same day the result looked too sad: the owner asked for **warmer
colours with a meaning — blue for trust and tech, yellow for warmth, green
for the planet — with transparency and a little more animation**, keeping
the menu navigation as it is. The current principles:

- **Three-colour palette**: trust blue (`--cg-sky`) for the hero band and
  "tech" cues (lockers, location), warm yellow (`--cg-sun`) for warmth and
  things to do, planet green (`--cg-leaf`) for actions and services. The
  home screen opens on a blue-to-green gradient band (`--cg-hero`, white
  text, a warm yellow glow in the corner).
- **Sober shapes, translucent surfaces**: moderate radii (8 / 10 / 14 px);
  cards are translucent glass (`--cg-glass` + `--cg-glass-filter`) over a
  ground lit by soft blue, yellow and green glows (`--cg-backdrop`). Pills
  only for chips (filters) and counters.
- **Colour with intent** (revised 2026-10-25: the sober version looked too
  monochrome; the owner asked for more life, especially on promotions):
  deep green text and green actions stay; colour now carries meaning:
  - **promotions** are the only large colour blocks: gradient cards (`sun`
    lemon, `leaf` green, `coral`), with a badge, the weekly price in large
    type and a call to action (`PromoCard.vue`); they keep their colours in
    dark mode, like a printed flyer;
  - **statuses** each have a tint (`utils/tones.ts`): lemon = something to
    do, sky = in a locker, plum = being processed, solid green = ready to
    collect, grey = done;
  - **categories** cycle through soft accent tiles (leaf, sky, coral, plum,
    lemon) behind line icons.
  Accent tokens: `--cg-sky`, `--cg-coral`, `--cg-plum` and their `-soft`
  tints, light and dark; strong tone on soft tint keeps text above 4.5:1.
- **Neutral type**: Inter (variable, bundled with the apps so it works
  offline and in the Android app); headings 700, emphasis 600, no black
  weights.
- **Icons, not emoji**: outline Ionicons in tinted squares; emoji are not
  used in the interface (the typographic ✓ and rating stars ★ stay).
- **Light motion** (revised 2026-10-25): page blocks rise in with a short
  stagger (`cg-rise`, 40 ms steps); clickable cards lift by 2 px on hover
  and shrink slightly when pressed; portal cards rise in; the locker door
  still swings open. Durations come from `--cg-motion` / `--cg-ease`, and
  all motion is off when the user prefers reduced motion. The navigation
  menu is not animated beyond Ionic's own drawer.
- **Show, don't explain**: the locker is drawn; the door the customer will
  use is highlighted; sizes are shown with pictograms.
- **Accessible**: visible keyboard focus, doors reachable with the keyboard,
  text contrast kept on both light and dark themes.

## Customer app details

- Buttons in sentence case (not Material capitals), moderate radius, no drop
  shadow; choices as cards with a green border when selected; multi-step
  flows show a numbered stepper.
- Partner shops get a green initial mark and a "Partenaire" pill; other
  businesses stay neutral and never show stars.

## Navigation (both apps)

Decided on 2026-10-25 at the project owner's request: the rows of pill
buttons used as section menus looked unprofessional ("vibecode"); the portal
uses a **folding side menu with nested entries** instead, and the customer
app adopted the same system the same day, replacing its bottom tab bar. One
component renders both menus (`packages/ui/src/NavTree.vue`, tree types in
`navTree.ts`); each app describes its tree in `src/navigation.ts`.

- **Where**: one side menu per app (`App.vue`, Ionic split pane). From
  992 px wide it is a fixed column (264–272 px); below (phones, the Android
  apps), it is a drawer opened by the ☰ button of each screen and closed
  after choosing a page. Web parallel: a classic admin sidebar that becomes an off-canvas
  menu on mobile.
- **Structure** (`src/navigation.ts` of each app, the single source):
  area → page or group → page, **three levels at most**. Groups gather
  related pages and are never created for a single page. Portal: Commerce ›
  Activité › Planning, Tournées… Customer app: Accueil; Services (Trouver un
  service, Mes commandes, Messages et devis); Consigne (Casiers autour de
  moi, Réserver, Mes consignes); Carte des casiers; Compte (Mon compte,
  Abonnement).
- **Behaviour**: groups fold and unfold (chevron, `aria-expanded`); the
  groups leading to the current page unfold on their own, the others keep
  the person's choice; a folded group containing the current page stays
  tinted. The current page is highlighted (mint background, `aria-current`).
- **Look**: an outline icon (Ionicons) per entry, sentence-case labels,
  nested levels hanging from a thin guide line, counters as small lemon
  badges on the entry (portal: messages to answer, alerts; customer app:
  quotes to answer, active consigne bookings).
- **Page header**: portal: breadcrumb of the groups (eyebrow, e.g.
  "Exploitation › Réseau") and the page name as title, both taken from the
  menu. Customer app: a top bar with the ☰ button and the way back on detail
  screens (`AppHeader.vue`). A back button only on detail pages.
- **Pills are for filtering, not for navigating**: chips stay for filters
  and choices inside a page (order status, day of the planning), never as a
  section menu.
- **Roles**: the demo lists every space so it can be toured. PROD: each
  person sees only the spaces of their role.
- **Exception**: the portal's mission page is a full-screen story without
  menu.
- **Trade-off accepted** (customer app): a bottom tab bar is the usual
  mobile pattern (one tap, reachable with the thumb); the side menu costs one
  more tap on phones but gives one consistent, structured navigation across
  CityPal. The most frequent actions stay one tap away on the home screen
  (modes, "Casiers autour de moi", current items).

## Tokens

Defined once in `packages/ui/src/theme.css` (shared by every frontend) (light and dark values) and
mapped onto Ionic's colour variables. Components only use these tokens.

| Token | Role |
|---|---|
| `--cg-ground` | Page background |
| `--cg-surface`, `--cg-surface-soft` | Cards and sheets; chips and inactive controls |
| `--cg-ink`, `--cg-ink-soft` | Main and secondary text |
| `--cg-leaf`, `--cg-leaf-soft` | Accent (actions, selected, available) and its background |
| `--cg-pine` | Strong text on soft backgrounds |
| `--cg-sun`, `--cg-sun-soft` | Warm lemon accent (consigne, badges, opening door) and its pastel |
| `--cg-glass`, `--cg-glass-strong`, `--cg-glass-filter` | Frosted glass cards and bars |
| `--cg-sky`, `--cg-sky-soft` | Trust blue (tech, lockers, location) and its tint |
| `--cg-backdrop` | Ground with soft blue, yellow and green glows, behind every page |
| `--cg-hero` | Blue-to-green gradient of the home hero band (white text) |
| `--cg-ease`, `--cg-motion` | Easing and duration of every transition |
| `--cg-locker-*` | Locker drawing |
| `--cg-radius-*`, `--cg-shadow*` | Shapes and depth |
| `--cg-chart-1`, `--cg-chart-2`, `--cg-chart-grid` | Chart series and grid (never text) |

## Charts (partner portal)

The portal dashboards follow one set of rules (`apps/portal/src/components/BarChart.vue`):

- Column charts: columns at most 24 px wide, 4 px rounded tops, square
  baseline, 2 px gap between stacked segments, one recessive grid, clean
  ticks.
- Series colours: `--cg-chart-1` (green, main series, e.g. what the merchant
  receives) and `--cg-chart-2` (orange, second series, e.g. commission),
  checked with a colour-vision-deficiency validator in light and dark mode.
  The orange is below the text contrast threshold against the surface, so
  values are never conveyed by colour alone: legend, tooltip and a data
  table ("Voir les données") accompany every chart.
- Forecast columns use the main colour, lighter, and are named in the legend.
- Fill rate on maps uses one hue from light to dark: a darker locker is
  fuller.
- Text inside charts keeps its size at any width (the chart measures its
  container).

## Brand

The product name is not final (see `docs/PRODUCT.md`); colours and wording are
placeholders until it is chosen.
