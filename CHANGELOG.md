# Changelog

All notable changes to this project are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) ·
Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added

- List rows with an icon on every item (category pictogram, lock, quote),
  a short title and a discreet description, on the home "En cours" list,
  orders, consigne bookings and Swap Sport exchanges (`ListRow.vue`).
- "Seed hosted database" workflow (manual): fills the Neon database with
  the demo site's simulated lockers and real OpenStreetMap merchants, plus
  the fictitious "Démo ·" shops (`load_demo_merchants` command, with
  `--remove`).
- Hosted backend on Render + Neon (`https://citypal.onrender.com`); the
  hosted customer app sends the Google sign-in to it (real token check,
  account stored server-side) instead of the on-device demo fallback.
- Coloured menu icons: each top-level entry has its own tone (emerald,
  teal, blue, coral, plum), inherited by its children.
- Checkout: a disabled "Payer" button now looks disabled and a line lists
  what is left to choose (drop place, pickup place, pickup slot).
- Neon agent skills (`neon`, `neon-postgres`) for Claude Code, installed
  with `npx neon@latest skills -s neon -s neon-postgres -y` into
  `.claude/skills/` (pinned in `skills-lock.json`); they guide the Neon
  database setup (docs/BUILD_AND_RELEASE.md §6).
- Refined green palette (owner's brief: ecological, welcoming, tech and
  digital, lively but not colourful in every direction): emerald and a teal
  touch on a pale green-white ground, soft contrasts, plain greeting
  instead of a gradient band, frosted glass cards and side menu over one
  slow emerald/teal aurora, translucent emerald menu highlight (the former
  dark tint looked olive), emerald/teal category tiles; motion: aurora
  drift, staggered rise-in, hover lift, press feedback, sheen on promotions
  (all off with reduced motion). Menu navigation unchanged.
- Customer Google sign-in without a backend (demo site): the profile is
  read on the device from the Google credential, unverified and labelled as
  a demonstration (`PROD:` the backend verifies the token).

- Google OAuth client ID set for the hosted demo (public value, in the
  demo-site env files): Google Agenda sync and the Google sign-in button
  are active; the sign-in completes once the backend is hosted.
- Swap Sport (sport exchange): weekly exchange at one slot and one place (collect last
  week's clean sport outfit, shirt and trousers, drop the dirty ones in the
  same compartment), subscribers only (7 € Plus, 5 € Premium), bought by
  the week; "Swap Sport" screen, exchange variant of the order screen,
  "Nouveau" promotion. Offers now have a kind and an optional welcome price.
- "Notre engagement" draft page (ecology and digital axis), on hold: not
  linked from the menu or the home screen yet.
- Promotions: catalogue data (pack, audience, badge, texts, colour theme;
  price taken from the pack), "Offres du moment" strip on the home screen
  and promotion card on the pack screen.
- Livelier colours: accent tokens (sky, coral, plum), a tint per order and
  booking status, coloured category tiles.
- Weekly pack (5 shirts + 2 trousers washed, ironed, folded each week,
  bought by 4 weeks): customer "Pack semaine" screen with welcome price
  then price by plan, weekly drop-off day and slot, computed return, pickup
  slot and locker, four weekly orders with guided drop-off; operator
  "Packs semaine" (dispatch to laundries by declared availability, volume
  announced for the month); laundry dashboard card with announced volume
  and availability. Pack definition exported from the backend catalogue.
- "Continuer avec Google" is always visible on the account screen (shown as
  being activated until the Google client ID is configured), above the demo
  sign-in; merchant dashboard banner to the Google Agenda sync. The client ID
  can be committed in the demo-site env files (public value).
- Customer app: order detail screen with a guided drop-off. "Déposer"
  opens the locker drawing with the door open, then "J'ai déposé mon
  article" confirms; the door chosen at checkout is stored with the order.
- Privacy policy draft in French (`docs/legal/privacy-policy.fr.md`),
  written from the data the code actually collects, with the points to
  complete and to have validated by a legal adviser.
- Merchant planning: Google Agenda synchronisation (Google Calendar API,
  scope `calendar.app.created`): "CityPal" calendar created in the
  merchant's agenda, every task written with a stable ID and updated when
  marked done; enabled by `VITE_GOOGLE_CLIENT_ID` (ADR-0009 update).

- Sign in with Google (ADR-0010): `POST /api/v1/auth/google/` verifies the
  Google ID token with Google's library and returns a token;
  `GET /api/v1/auth/me/`, `POST /api/v1/auth/sign-out/`. Customer app:
  "Continuer avec Google" on the account screen when `VITE_GOOGLE_CLIENT_ID`
  is set (basic profile only), profile with photo and e-mail.
- Project user model `accounts.User` with linked `GoogleAccount`, and an
  accounts administration: photo, sign-in method, customer/team, dates,
  filters, search, key figures, deactivation. Admin branded "CityPal".
- Hosting on Render + Neon (ADR-0004 accepted, option A): start script
  (migrations, first administrator from environment variables, `$PORT`),
  deployment guide (`docs/BUILD_AND_RELEASE.md` §6) and Google setup guide
  (`docs/GOOGLE_SIGN_IN.md`).

- Merchant planning ("Planning"): week strip with open-task counts, timeline
  of courier arrivals, work and handovers, order details, "Marquer fait" on
  every task (a handover done marks its items ready), .ics export of the
  week, "add to Google Agenda / Outlook" per task.
- Merchant connectors page: calendars, planners and automation tools, with
  their status; iCal subscription and webhook simulated (ADR-0009, proposed).

- Merchant offers: "Mes offres" in the merchant space (create, edit, hide,
  delete; photo, title, service type, description, price, locker size,
  turnaround), shared with the customer app on the same device in the demo
  (`packages/demo-data`, offers.ts).
- Customer app: search by service type (service grid, suggestions with
  keywords, list of shops offering a service with price and turnaround);
  shop pages and checkout use the merchant's offers; map with the customer's
  position in "Casiers autour de moi".
- Catalogue: "Repassage pantalon" and "Ressemelage" services, search
  keywords for every service.
- Translation key check in both apps (a missing key fails the tests).
- Customer app: "Casiers autour de moi" view (nearest lockers, walking
  distance, free consigne compartments, drop now / book a slot), entry points
  on the home page and the Consigne tab, "Près de moi" sort in locker lists;
  location used on the device only.
- Coding and documentation standards (`docs/CODING_STANDARDS.md`), including
  the "never invent, ask when in doubt" rule.
- Product document: vision, actors, main flow, business model, red lines and
  open questions (`docs/PRODUCT.md`).
- Git workflow, commit and pull request conventions (`CONTRIBUTING.md`).
- Instructions for the AI assistant (`CLAUDE.md`).
- ADR-0001 (adopt ADRs), ADR-0002 (technical stack: Vue 3 + Ionic + Capacitor,
  MapLibre, Django REST + GeoDjango + PostGIS), ADR-0003 (monorepo layout,
  Django admin, integration boundaries), ADR-0004 (hosting, proposed).
- Product requirements clarified: offer types (standard, packs, quotes with
  chat), guest checkout, simulated payment, 10 % initial commission, two
  collection rounds per day, business selection rules.
- Backend skeleton: Django 5.2 LTS + DRF + GeoDjango project with
  environment-based settings, French admin, OpenAPI schema and docs, public
  health check endpoint, tests, Ruff and strict mypy configuration.
- Docker setup: backend `Dockerfile` and `docker-compose.yml` (PostGIS).
- Backend CI workflow (lint, format, type check, migrations, tests).
- ADR-0005: single partner web portal (`apps/portal/`) with merchant, courier
  and operator spaces; courier partner and operator experiences added to
  `docs/PRODUCT.md`.
- ADR-0006: partner portal built with Ionic + Capacitor, also shipped as an
  Android "pro" app for merchants.
- Product: 12-hour pickup slots aligned with two daily rounds, NFC confirmed,
  locker visualisation, operator dashboards (volume, fill rate), real-time
  tracking and flow forecasts.
- Lockers backend: models, simulated sizes and layouts, simulated occupancy,
  `seed_simulated_lockers` command (real tram stops from OpenStreetMap),
  public and operator APIs, admin (`docs/LOCKERS.md`).
- Product: overdue pickups (item stays, small late fee, first occurrence
  free); domain based on "city reconnect".
- Roadmap (`docs/ROADMAP.md`).
- Customer app (`apps/customer/`): Ionic + Vue 3 + TypeScript, map of the
  lockers (MapLibre, OpenStreetMap tiles), locker page with size picker and
  drawing of the locker front highlighting the door that opens, French i18n,
  ESLint, Prettier, Vitest.
- `packages/api-client`: TypeScript types generated from the OpenAPI schema.
- Frontend CI workflow.
- Realistic lockers: sizes aligned with Mondial Relay lockers (S/M/L) and
  dry-cleaning lockers (183 cm hanging compartment), laundry-oriented column
  templates, hardware profiles (access methods and connectivity), locker
  events (`LockerEvent`), `LockerDriver` interface with a simulated driver.
- Integration API: versioned under `/api/v1/` (breaking change for earlier
  `/api/` paths), integration API keys with scopes, rate limits, locker event
  feed, ReDoc, OpenAPI validation in CI, integration guide
  (`docs/api/README.md`), ADR-0007.
- Soft redesign of the customer app (`docs/DESIGN.md`): rounded type and
  shapes, green palette with dark theme, size cards with pictograms, locker
  drawing whose door swings open, locker cards in a bottom sheet with a list
  fallback when the map cannot load.
- Standalone demo build with fictitious data (`npm run build:demo`).
- Merchants: model, `import_osm_merchants` command (OpenStreetMap, services
  only, no food, no chains), `GET /api/v1/merchants/`, admin, map markers and
  "Commerces" tab in the customer app (`docs/DATA_SOURCES.md`).
- Standalone demo: embedded offline map of Grenoble (OpenFreeMap extract
  served through a custom MapLibre protocol), since the published demo page
  blocks external requests.
- Real OpenStreetMap data fetched by the `OSM data` GitHub Actions workflow
  (`fetch_osm_data`, bounding box, retries and mirror): 81 tram stops and 100
  businesses after filtering (self-service laundromats excluded), in
  `data/osm/`; demo fixtures regenerated with lockers at real tram stops and
  real businesses. Merchant import now prunes businesses no longer selected.
- Demo dataset: `apps.demo` generator of fictitious activity (orders, rounds
  at 08:00 and 20:00, daily figures, forecast, fictitious demo merchants and
  placeholder prices), `export_demo_data` command, shared package
  `packages/demo-data` used by the customer app demo builds.
- Android project (Capacitor) with the provisional application id
  `fr.reliance.app`; working name "Reliance" in the app; build guide
  (`docs/BUILD_AND_RELEASE.md`).
- Partner portal (`apps/portal/`), demo version on the bundled dataset: demo
  home page, merchant space (incoming items per round, items being
  processed, revenue and commission, forecast, degressive commission from
  10 % towards 1 %), courier space (rounds, averages, monthly projection,
  next rounds, indicative route map), operator space (volumes, fill rate per
  size and per locker, live map, daily orders and forecast, locker detail
  with door statuses). Chart rules in `docs/DESIGN.md`.
- Hosted demo site combining the customer app (`/client/`) and the portal
  (`/pro/`): `npm run build:demo-site` at the repository root,
  `scripts/assemble-demo-site.mjs`, Netlify configuration; portal and demo
  site jobs in the frontend CI.
- The app is named **CityPal** (provisional Android id `fr.citypal.app`).
- Consigne requirements (docs/PRODUCT.md §4b): storage up to 24 h, slots
  between three rounds (07:00, 14:00, 20:00) booked at least 4 h ahead or
  immediate drop-off, subscription-based prices; ADR-0008 (verified reviews,
  internal first).
- Lockers at strategic places for the consigne: `site_category` on lockers
  (API, admin), strategic places from OpenStreetMap with selection rules
  (`docs/DATA_SOURCES.md`), smaller consigne locker models; demo network of
  70 lockers.
- Demo dataset: three rounds with pickup until the next round; customer
  catalogue (`catalogue.json`) with fictitious partner shops, services and
  reviews, placeholder subscription plans and consigne prices.
- Customer app, complete UX: tab bar (home, shops, consigne, messages,
  account), choice of mode, shop catalogue grouped by category with search
  and filters, shop pages with ratings and reviews, ordering of services and
  quotes, consigne booking flow and booking page with the door, chat with
  photos and quotes, demo sign-in, subscription plans, orders and reviews;
  business rules unit-tested in `src/domain/`.
- "Notre mission" page in the partner portal (`/mission`, linked from the demo
  home): the double mission (everyday convenience and ecology, served by
  technology) told in full-screen chapters over photos of green Grenoble
  streets that cross-fade on scroll and loop; photos from Wikimedia Commons
  under free licences, credited on the page. Wording to be reviewed (open
  question 10 in `docs/PRODUCT.md`).
- Consigne transfer: stored items can be moved to another locker at a round
  within the 24 hours (docs/PRODUCT.md §4b); plans include transfers per
  month, then a supplement reduced by the plan (placeholder amounts); new
  transfer screen and booking page states.
- New visual theme: green, warm lemon and cream, frosted glass cards, floating
  tab bar, vivid mode cards (docs/DESIGN.md); applies to both apps.
- Consigne pickup slot: the customer chooses when they collect (same slot or
  a later one, at most 24 h after drop-off); transfers arrive before the end
  of the pickup slot.
- Guided drop-off and collection on the booking page: the door opens, "put
  your things in / take them out, then close the door", then a clear
  confirmation.
- Merchant space: sub-menu with rounds (arrivals and departures at each of
  the three rounds, items marked ready), messages and quotes, reviews with
  public replies, services (on/off, price, turnaround); all 14 demo partner
  shops selectable.
- Courier space: "Présenter l'activité" tab (three rounds, consigne
  transfers) and "Feuille de tournée" tab (stops in a valid order with what
  to pick up and drop off, progress, route map).
- Operator space: sub-menu with overview (alerts to watch, consigne
  transfers, data management), alerts, lockers (search, filter, sort),
  orders (search, status filter), rounds (today's totals, link to the round
  sheet), partner shops (rating, revenue, commission) and forecasts (per
  day, per round, per locker).
- Demo dataset: consigne transfers at rounds (`transfers` in the activity).

### Changed

- Status tags reworked to look serious on phones: one line, small radius,
  light translucent tint with a hairline edge, toned text (new
  `--cg-sun-strong` for honey text); calmer titles in the home lists.
- Yellows softened to honey (`--cg-sun`, welcome promotion card): the
  lemon hurt the eyes.

- Compartments are given on arrival at the locker, never at booking: orders,
  weekly pack, consigne and transfers reserve a size; the door appears when
  the customer opens the locker ("Je suis devant la machine : ouvrir un
  casier …"). Places are called "lieu" in the drop-off and pickup choices.
- Orders: the pickup locker is chosen explicitly, and the customer picks a
  pickup slot starting at the return round (collect before the next round);
  the order date is labelled as such instead of looking like a pickup time.
- Customer app navigation: folding side menu with nested entries (same
  component as the portal, `NavTree` in `packages/ui`), drawer on phones,
  replacing the bottom tab bar; top bar with menu button on every screen.
- More professional look (project owner's request): Inter instead of
  Nunito, moderate radii, opaque cards with hairline borders, plain ground
  without colour halos or frosted glass, lighter weights, icons instead of
  emoji, lemon used as an accent only. Rules in `docs/DESIGN.md`.
- Partner portal navigation: folding side menu with nested entries (spaces,
  groups, pages, icons, counters), fixed column on wide screens and drawer
  on narrow ones; page titles and breadcrumbs come from the menu. Replaces
  the rows of pill buttons (`CourierNav`, `OperatorNav`, merchant sub-menu).
  Rules recorded in `docs/DESIGN.md`.
- API authentication: token (apps) and session (admin); HTTP Basic, never
  documented, is no longer accepted. Local databases must be recreated for
  the new user model.
- Merchant space: rounds show what to have ready for each courier visit
  (time first, ready counter), then what the courier brings; the dashboard
  shows "À remettre au coursier : 14:00"; lockers are no longer shown to
  merchants.

### Fixed

- .ics export: semicolons are now escaped as RFC 5545 requires.
- Consigne "how it works": step 3 showed a raw key (`consigne.how.step2b`).
- Demo dates keep their local time across a daylight-saving change (rounds
  showed at 13:00 and 19:00 after the switch to winter time).
- Map screen: welcome card in the brand green (was hard to read over the
  map); businesses grouped by category with a link to the searchable
  catalogue (the list was unsorted).
- Customer app: after choosing a locker, a size or a round, the page scrolls
  to the next part of the form, so the "Continuer" button is no longer hidden
  below the list on phones.
- MapLibre could not start its worker in built apps (the worker file was not
  emitted by Vite): the live map now loads in the hosted demo.
- `export_demo_data` failed when `ALLOWED_HOSTS` did not include `localhost`
  (CI without a local `.env`).

- Backend tests no longer depend on a local `.env` (HTTPS redirect disabled in
  tests), so CI passes.
- Pull request template, `.editorconfig`, `.gitignore`.
