# Design — CityPal apps

> **Status**: living document · **Last updated**: 2026-10-26

## Direction

History: the first brief asked for a **very soft** interface ("très douce");
on 2026-10-24 the palette became green, warm lemon and cream, with frosted
glass and colour halos. On **2026-10-25** the project owner found the result
childish and asked for something **more professional and serious**. Later
the same day it looked too sad; a blue / yellow / green attempt with a
gradient hero band and colour blobs was then rejected as too contrasted and
too colourful ("ce n'est pas un cirque"), and the green of the menu looked
olive. The owner's brief, still 2026-10-25: **stay in the green;
ecological, welcoming, but also tech and digital; lively, with animation;
not colourful in every direction; refined**. The current principles:

- **One family of greens**: emerald (`--cg-leaf`) for actions and the
  selected menu item (a light translucent tint, never an opaque dark
  green), a teal touch (`--cg-teal`) for the "digital" side (the logo
  gradient, the consigne and location cues, every other category tile).
  Warm yellow (`--cg-sun`, a soft honey since the lemon hurt the eyes)
  stays only for promotions and "to do" pills. Menu icons carry one tone
  per top-level entry (emerald, teal, blue, coral, plum), inherited by its
  children; labels stay ink.
- **Soft contrasts**: deep green ink rather than black, pale green-white
  ground (deep green-black in dark mode); no saturated band behind
  headings: the greeting is plain text.
- **Sober shapes, translucent surfaces**: moderate radii (8 / 10 / 14 px);
  cards and the side menu are frosted glass (`--cg-glass` +
  `--cg-glass-filter`) over one slow emerald and teal **aurora** at the top
  of the screens (`--cg-aurora-1/2`). No scattered colour spots. Pills only
  for chips (filters) and counters.
- **Colour with intent** (revised 2026-10-25: the sober version looked too
  monochrome; the owner asked for more life, especially on promotions):
  deep green text and green actions stay; colour now carries meaning:
  - **promotions** are the only large colour blocks: gradient cards (`sun`
    lemon, `leaf` green, `coral`), with a badge, the weekly price in large
    type and a call to action (`PromoCard.vue`); they keep their colours in
    dark mode, like a printed flyer;
  - **statuses** are compact tags (one line, 6 px radius, light
    translucent tint, hairline edge, toned text), each with a tint (`utils/tones.ts`): lemon = something to
    do, sky = in a locker, plum = being processed, solid green = ready to
    collect, grey = done;
  - **categories** alternate emerald and teal tiles behind line icons.
    Accent tokens (status pills only): `--cg-sky`, `--cg-coral`, `--cg-plum`
    and their `-soft` tints, light and dark; strong tone on soft tint keeps
    text above 4.5:1.
- **Neutral type**: Inter (variable, bundled with the apps so it works
  offline and in the Android app); headings 700, emphasis 600, no black
  weights.
- **List rows** (`components/ListRow.vue`, 2026-10-25): every item of a
  list (orders, consigne bookings, quotes, Swap Sport exchanges) starts
  with an icon in a tinted square (the shop's category pictogram, the lock
  for a consigne, a document for a quote; `utils/icons.ts`), then a short
  title, a discreet description line (shop, place, price) and the status
  tag on the right, like the side menu. The whole card is clickable through
  its title link, so action buttons are never nested in a link.
- **Icons, not emoji**: outline Ionicons in tinted squares; emoji are not
  used in the interface (the typographic ✓ and rating stars ★ stay).
- **Light motion** (revised 2026-10-25): the aurora drifts slowly
  (`cg-drift`, 30 s); page blocks rise in with a short stagger (`cg-rise`,
  40 ms steps); clickable cards lift on hover and shrink slightly when
  pressed; a soft sheen crosses the promotion cards every few seconds
  (`cg-sheen`); portal cards rise in; the locker door still swings open. Durations come from `--cg-motion` / `--cg-ease`, and
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
- **Choosing a locker** (owner, 2026-10-26: the row of place chips was
  neither pretty nor practical): a map beside a list panel built like the
  side menu, folding by kind of place with an icon per kind and the free
  compartments of each locker; search and "Près de moi" (icon button) give
  a flat list. Tapping a locker on the map or in the list chooses it, and
  the consigne booking moves straight on to the next step. Side by side
  when the chooser is at least 760 px wide (the booking page widens for
  it), the map above the list otherwise (`LockerPicker.vue`).
- **Roles**: the demo lists every space so it can be toured. PROD: each
  person sees only the spaces of their role.
- **Photo stories** (exception to the page layout): full-screen chapters
  over photos that cross-fade as each chapter scrolls into view, frosted
  green cards, white text on a dark veil whatever the theme, photo credits
  at the bottom. Shared by the portal's mission page (without menu) and the
  customer app's scooter lockers page (`@city-groom/ui`: `StoryBackdrop`,
  `StoryCredits`, `useStory`; `story-*` classes).
- **Menu tags**: an entry can carry a short status ("Bientôt", outlined
  honey pill), quieter than a counter.
- **Trade-off accepted** (customer app): a bottom tab bar is the usual
  mobile pattern (one tap, reachable with the thumb); the side menu costs one
  more tap on phones but gives one consistent, structured navigation across
  CityPal. The most frequent actions stay one tap away on the home screen
  (modes, "Casiers autour de moi", current items).

## Tokens

Defined once in `packages/ui/src/theme.css` (shared by every frontend) (light and dark values) and
mapped onto Ionic's colour variables. Components only use these tokens.

| Token                                                  | Role                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| `--cg-ground`                                          | Page background                                                   |
| `--cg-surface`, `--cg-surface-soft`                    | Cards and sheets; chips and inactive controls                     |
| `--cg-ink`, `--cg-ink-soft`                            | Main and secondary text                                           |
| `--cg-leaf`, `--cg-leaf-soft`                          | Accent (actions, selected, available) and its background          |
| `--cg-pine`                                            | Strong text on soft backgrounds                                   |
| `--cg-sun`, `--cg-sun-soft`                            | Warm lemon accent (consigne, badges, opening door) and its pastel |
| `--cg-glass`, `--cg-glass-strong`, `--cg-glass-filter` | Frosted glass cards and bars                                      |
| `--cg-teal`                                            | Teal touch: the digital side (logo, consigne and location cues)   |
| `--cg-aurora-1`, `--cg-aurora-2`                       | Emerald and teal veil drifting behind every screen                |
| `--cg-backdrop`                                        | Page ground (plain)                                               |
| `--cg-ease`, `--cg-motion`                             | Easing and duration of every transition                           |
| `--cg-locker-*`                                        | Locker drawing                                                    |
| `--cg-radius-*`, `--cg-shadow*`                        | Shapes and depth                                                  |
| `--cg-chart-1`, `--cg-chart-2`, `--cg-chart-grid`      | Chart series and grid (never text)                                |

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

Product name: **CityPal** (owner, 2026-10-24; trademark checks still open,
`docs/PRODUCT.md`). The partner portal is "CityPal Pro".

**Mark** (created 2026-10-26; the owner had no logo and asked for one that
is aesthetic, visual, modern and ecological): a white **"C"** whose upper end
sprouts a **honey leaf**, on a rounded **emerald-to-teal tile**. The C is the
city and its open circle (a service that comes back), the leaf the
ecological promise, the green-to-teal gradient the digital side. It reads
down to 16 px (favicon).

- Source: `packages/ui/brand/citypal-mark.svg`; in the apps, the
  `BrandMark` component of `@city-groom/ui` (same drawing), next to the
  product name in the side menu. Keep both in sync.
- Favicon, home-screen icons and web manifests of both apps (`public/`) are
  generated by `scripts/build-brand-icons.cjs`; re-run it after any change
  to the mark. The Android launcher icons are still Capacitor's defaults:
  the store release is on hold (owner, 2026-10-26).
- Colours: tile `#1fa67d` → `--cg-leaf` `#0e7a5c` → `--cg-teal` `#12808a`;
  leaf `--cg-sun` `#e8c468` with a `--cg-sun-strong` vein. The mark keeps
  these colours in dark mode (the tile carries its own contrast).
- Always shown with the name as text; never stretched, recoloured or put
  on a busy photo.
