# City Groom — Customer app

Ionic + Vue 3 + TypeScript app for residents (ADR-0002), delivered as an
installable web app (PWA) and, later, an Android app through Capacitor.
User interface in French.

## Current screens

| Route | Screen |
|---|---|
| `/carte` | Map of Grenoble (MapLibre, OpenStreetMap tiles) with the lockers, green when compartments are free |
| `/casiers/:code` | Locker page: size picker with free compartments, drawing of the locker front highlighting the door that opens, drop-off steps |

Until orders exist, the highlighted door is an **example** of the chosen size
(the public API does not reveal which doors are free, see
`docs/LOCKERS.md` §5). Tapping a door highlights it.

## Layout

```
src/
├── api/          HTTP client and API calls (types from @city-groom/api-client)
├── components/   LockerMap (MapLibre), LockerFront (SVG drawing)
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

## Not done yet

- Capacitor / Android project: it needs the Android **application id**
  (e.g. `fr.example.citygroom`), which depends on the final product name and
  domain (open question in `docs/PRODUCT.md`).
- PWA manifest and offline support.
