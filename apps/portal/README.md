# City Groom — Partner portal

Ionic + Vue 3 + TypeScript web app for merchants, courier partners and the
operator team (ADR-0005), to be packaged later as the merchants' Android "pro"
app (ADR-0006). User interface in French, working name "Reliance Pro".

For now the portal runs **only on the demo dataset** of
`@city-groom/demo-data` (real lockers snapshot and businesses, fictitious
activity, see [`docs/DEMO.md`](../../docs/DEMO.md)); the merchant, courier and
operator API endpoints do not exist yet (roadmap item 7).

## Screens

| Route                         | Screen                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `/`                           | Demo home: one card per space, including the customer app                                                 |
| `/mission`                    | "Notre mission": full-screen chapters over photos of green Grenoble streets                               |
| `/commerce/:code?`            | Merchant space: incoming items per round, items being processed, revenue and commission, forecast         |
| `/coursier`                   | Courier space: rounds per day, items and km per round, monthly projection, next rounds, map of next round |
| `/exploitation`               | Operator space: volumes, fill rate per size and per locker, live map, daily orders and forecast           |
| `/exploitation/casiers/:code` | Locker detail: locker front with the status of every door                                                 |

The demo merchants are fictitious ("Démo · …"): no real business is shown
with invented orders or revenue.

## Layout

```
src/
├── assets/     Mission page photos (free licences, credited on the page, see data/missionPhotos.ts)
├── components/   PortalPage (frame + fictitious notice), StatTile, BarChart, PortalMap
├── data/         Data source (demo dataset), figures (summaries.ts) and French formats, unit-tested
├── i18n/         French strings — no user-facing text in components
├── router/       Routes (French paths, user-visible); spaces are loaded on demand
└── views/        Screens
```

Charts follow the dataviz rules recorded in `docs/DESIGN.md` (colour tokens
`--cg-chart-*` in `packages/ui/src/theme.css`). Times are always shown in the
Grenoble time zone (`SERVICE_TIME_ZONE` in `src/data/format.ts`).

## Running locally

```bash
# From the repository root (npm workspace)
npm install
npm run dev -w apps/portal          # http://localhost:5174
```

The home page links to the customer app at `VITE_CUSTOMER_URL`
(default `http://localhost:5173/`, run it with `npm run dev -w apps/customer`).

The hosted demo site (customer app + portal) is built from the repository
root with `npm run build:demo-site`.

## Quality checks

Run in CI (`.github/workflows/frontend.yml`) and before pushing:

```bash
npm run lint -w apps/portal
npm run format:check -w apps/portal
npm run typecheck -w apps/portal
npm test -w apps/portal
```
