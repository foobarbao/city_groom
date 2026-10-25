# CityPal — Customer app

Ionic + Vue 3 + TypeScript app for city dwellers (ADR-0002), delivered as an
installable web app (PWA) and, later, an Android app through Capacitor.
User interface in French.

## Screens

Navigation is a folding **side menu** (`src/navigation.ts`, shared component
`NavTree`): a fixed column on wide screens, a drawer behind the ☰ button on
phones (docs/DESIGN.md "Navigation"). The table groups the screens by menu
area.

| Area      | Route                                                                                                | Screen                                                                                                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accueil   | `/accueil`                                                                                           | Choose a mode (have something serviced / store belongings), what is in progress, shop categories, link to the map                                                                        |
|           | `/carte`, `/casiers/:code`                                                                           | Map of the lockers and businesses; locker page with the door that opens                                                                                                                  |
|           | `/autour`                                                                                            | Lockers around me: nearest lockers with walking distance and free consigne compartments, "drop now" and "book a slot" shortcuts; falls back to the city centre without location          |
| Boutiques | `/boutiques`                                                                                         | Shop catalogue: search (name, service, category, street), category filters, partners only; grouped by category, partners first, best rated first                                         |
|           | `/boutiques/:code`                                                                                   | Shop page: rating out of 5 and verified reviews, the merchant's offers (photo, description, price), order, quote and chat buttons (partners); public information only (other businesses) |
|           | `/commander`                                                                                         | Order a service or an accepted quote: drop-off locker, pickup locker chosen explicitly, pickup slot from the return round, simulated payment                                             |
|           | `/pack`                                                                                              | Weekly pack: 5 shirts + 2 trousers each week, bought by 4 weeks; welcome price then price by plan; weekly drop-off day and slot, computed return, pickup slot and locker                 |
|           | `/echange-sport`                                                                                     | Sport exchange: one slot and place each week, collect clean items and drop dirty ones in the same compartment; subscribers only                                                          |
|           | `/engagement`                                                                                        | "Notre engagement": ecology and digital approach                                                                                                                                         |
| Consigne  | `/consigne`                                                                                          | How it works, current bookings, history                                                                                                                                                  |
|           | `/consigne/reserver`                                                                                 | Booking in 4 steps: locker (filter by kind of place), when (now, or a slot at least 4 h ahead), size, summary and simulated payment                                                      |
|           | `/consigne/:id`                                                                                      | Booking: slot, deadline (24 h after drop-off), locker front with the door, drop-off / collect / cancel / transfer                                                                        |
|           | `/consigne/:id/transfert`                                                                            | Transfer to another locker at a round within the 24 hours, price by plan                                                                                                                 |
| Messages  | `/messages`, `/messages/:shop`                                                                       | Quotes and conversations; chat with photos, quotes to accept or decline                                                                                                                  |
| Compte    | `/compte`, `/compte/abonnement`, `/compte/commandes`, `/compte/commandes/:id`, `/compte/avis/:order` | Sign-in (Google or demo), subscription plans, orders, order detail with guided drop-off, review after a collected order                                                                  |

Visual direction and tokens: [`docs/DESIGN.md`](../../docs/DESIGN.md).

### Demo data and state

- Lockers, sizes and real businesses come from `@city-groom/demo-data`;
  partner shops, reviews, services, plans and consigne rules from its
  `catalogue.json` (fictitious, placeholder prices).
- There is no customer API yet: bookings, orders, conversations, quotes and
  reviews live on the device (`src/stores/account.ts`, `localStorage` when
  available), start from a few fictitious items and merchant replies are
  simulated. "Réinitialiser la démo" in the account tab resets them.
  PROD: customer endpoints of the API.
- Business rules are pure, unit-tested functions in `src/domain/`: slots and
  booking notice (`slots.ts`), transfers (`transfer.ts`), Grenoble time (`time.ts`), prices
  (`pricing.ts`), shop search (`shops.ts`), verified reviews (`reviews.ts`).
  The backend will enforce them; the app previews them.

## Layout

```
src/
├── api/          HTTP client and locker / merchant API calls
├── components/   AppNav (side menu), AppHeader (top bar), LockerMap, LockerPicker, ShopCard…
├── demo/         Demo API answers and offline map for the single-page demo
├── domain/       Business rules (slots, prices, search, reviews), unit-tested
├── i18n/         French strings — no user-facing text in components
├── router/       Routes (French paths, user-visible)
├── navigation.ts Side menu tree, unit-tested
├── services/     Customer catalogue (shops, services, plans, lockers)
├── stores/       Customer state (Pinia), demo persistence
├── utils/        Formats (prices, Grenoble dates), photo downscaling
└── views/        Screens
```

## Running locally

Prerequisites: Node.js 22+, the backend running on `http://localhost:8000`
(see `backend/README.md`) with `CORS_ALLOWED_ORIGINS=http://localhost:5173` in
`backend/.env`, and some lockers (`python manage.py seed_simulated_lockers`).

```bash
# From the repository root (npm workspace)
npm install
cp apps/customer/.env.example apps/customer/.env.local
npm run dev -w apps/customer        # http://localhost:5173
```

Sign in with Google appears on the account screen when
`VITE_GOOGLE_CLIENT_ID` is set (`docs/GOOGLE_SIGN_IN.md`); otherwise the demo
sign-in (a first name) is shown. Not available in the Android app yet
(ADR-0010).

## Quality checks

Run in CI (`.github/workflows/frontend.yml`) and before pushing:

```bash
npm run lint -w apps/customer
npm run format:check -w apps/customer
npm run typecheck -w apps/customer
npm test -w apps/customer
```

## Android

The Android project lives in `android/` (Capacitor, provisional application id
`fr.citypal.app`). Build steps: [`docs/BUILD_AND_RELEASE.md`](../../docs/BUILD_AND_RELEASE.md).

## Standalone demo

A self-contained HTML page with bundled **fictitious** lockers (`src/demo/`)
and an **embedded map of Grenoble**, used to show the app without a server.
The page it is published on blocks external requests, so the map extract is
embedded instead of loaded live (the real app loads the map live).

```bash
cd apps/customer
python3 scripts/fetch_offline_map.py   # download the Grenoble map extract (~10 MB, git-ignored)
npm run build:demo                     # -> dist-demo/index.html
```

Without the extract, the demo shows the list of lockers instead of the map.

## Not done yet

- PWA manifest and offline support.
