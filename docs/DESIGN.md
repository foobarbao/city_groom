# Design — CityPal apps

> **Status**: living document · **Last updated**: 2026-10-25

## Direction

The project owner asked for an interface that is **very soft** ("très douce"),
user-friendly, and that conveys the **eco-social** identity of the project
together with **convenience and time saved**.

Principles:

- **Soft shapes**: generous corner radii (14 / 20 / 28 px), cushioned cards
  with diffuse shadows, no hard toolbars, pill-shaped chips.
- **Green, warm lemon and cream** (revised 2026-10-24, the first palette
  was found too bland): cream ground with soft mint and lemon halos, deep
  green text, a vivid green for actions (white text, 5.3:1) and a warm
  lemon accent (dark text) for the consigne and highlights. Pastel but
  assertive.
- **Transparency** for a tech touch: cards, sheets and the floating tab bar
  are frosted glass (`--cg-glass`, `backdrop-filter`) over the halos, with a
  thin light edge built into `--cg-shadow`.
- **Friendly, not grotesque**: rounded Nunito kept, headings in black weight
  (900).
- **Rounded type**: Nunito (variable, bundled with the app so it works offline
  and in the Android app).
- **Show, don't explain**: the locker is drawn; the door the customer will use
  glows and gently swings open; sizes are shown with pictograms (watch, shoe,
  laundry bag, hanger).
- **Accessible**: visible keyboard focus, doors reachable with the keyboard,
  motion disabled when the user prefers reduced motion, text contrast kept on
  both light and dark themes.

## Customer app navigation

- A bottom **tab bar** with five areas (Accueil, Boutiques, Consigne,
  Messages, Compte), badges for active bookings and quotes to answer.
- Buttons in sentence case (not Material capitals), rounded; choices as
  soft cards with a green border when selected; multi-step flows show a
  numbered stepper.
- Partner shops get a green initial mark and a "Partenaire" pill; other
  businesses stay neutral and never show stars.

## Partner portal navigation

Decided on 2026-10-25 at the project owner's request: the rows of pill
buttons used as section menus looked unprofessional ("vibecode"); the portal
uses a **folding side menu with nested entries** instead.

- **Where**: one side menu for the whole portal (`App.vue`, Ionic split
  pane). From 992 px wide it is a fixed column (272 px); below, it is a
  drawer opened by the ☰ button of each page and closed after choosing a
  page. Web parallel: a classic admin sidebar that becomes an off-canvas
  menu on mobile.
- **Structure** (`apps/portal/src/navigation.ts`, the single source):
  space → page or group → page, **three levels at most**. Groups gather
  related pages (e.g. Commerce › Activité › Planning, Tournées) and are never
  created for a single page.
- **Behaviour**: groups fold and unfold (chevron, `aria-expanded`); the
  groups leading to the current page unfold on their own, the others keep
  the person's choice; a folded group containing the current page stays
  tinted. The current page is highlighted (mint background, `aria-current`).
- **Look**: an outline icon (Ionicons) per entry, sentence-case labels,
  nested levels hanging from a thin guide line, counters as small lemon
  badges on the entry (messages to answer, alerts).
- **Page header**: breadcrumb of the groups (eyebrow, e.g. "Exploitation ›
  Réseau") and the page name as title, both taken from the menu; a back
  button only on detail pages (e.g. one locker).
- **Pills are for filtering, not for navigating**: chips stay for filters
  and choices inside a page (order status, day of the planning), never as a
  section menu.
- **Roles**: the demo lists every space so it can be toured. PROD: each
  person sees only the spaces of their role.
- **Exceptions**: the mission page is a full-screen story without menu. The
  **customer mobile app keeps its bottom tab bar** (five areas): it is the
  mobile convention for primary navigation on Android and iOS, reachable with
  the thumb; nested navigation there happens inside screens (lists → detail).

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
| `--cg-backdrop` | Cream ground with colour halos, behind every page |
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
