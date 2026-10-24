# City Groom — Customer app

Ionic + Vue 3 + TypeScript app for residents (ADR-0002), delivered as an
installable web app (PWA) and, later, an Android app through Capacitor.
User interface in French.

## Current screens

| Route            | Screen                                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `/carte`         | Map of Grenoble (MapLibre, OpenStreetMap tiles) with the lockers, plus a sheet listing them; the list takes over when the map cannot load |
| `/casiers/:code` | Locker page: size cards with free compartments, drawing of the locker front where the door to use glows and swings open, drop-off steps   |

Visual direction and tokens: [`docs/DESIGN.md`](../../docs/DESIGN.md).

Until orders exist, the highlighted door is an **example** of the chosen size
(the public API does not reveal which doors are free, see
`docs/LOCKERS.md` §5). Tapping a door highlights it.

## Layout

```
src/
├── api/          HTTP client and API calls (types from @city-groom/api-client)
├── components/   LockerMap (MapLibre), LockerCard, MerchantCard, SizePicker
│                 (theme and locker drawing come from @city-groom/ui)
├── demo/         Fictitious data for the standalone demo build
├── composables/  Reusable logic (error messages…)
├── i18n/         French strings — no user-facing text in components
├── router/       Routes (French paths, user-visible)
├── utils/        Pure functions, unit-tested (locker drawing geometry)
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
