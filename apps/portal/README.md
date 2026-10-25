# City Groom — Partner portal

Ionic + Vue 3 + TypeScript web app for merchants, courier partners and the
operator team (ADR-0005), to be packaged later as the merchants' Android "pro"
app (ADR-0006). User interface in French, working name "CityPal Pro".

For now the portal runs **only on the demo dataset** of
`@city-groom/demo-data` (real lockers snapshot and businesses, fictitious
activity, see [`docs/DEMO.md`](../../docs/DEMO.md)); the merchant, courier and
operator API endpoints do not exist yet (roadmap item 7).

## Screens

| Route                         | Screen                                                                                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                           | Demo home: one card per space, including the customer app                                                                                                      |
| `/mission`                    | "Notre mission": full-screen chapters over photos of green Grenoble streets                                                                                    |
| `/commerce/:code?`            | Merchant dashboard: incoming items, items being processed, revenue and commission, forecast                                                                    |
| `/commerce/:code/planning`    | Week planning: courier arrivals, work to do, handovers, order details, "Marquer fait", Google Agenda sync (`VITE_GOOGLE_CLIENT_ID`), .ics export, add to Outlook                             |
| `/commerce/:code/connecteurs` | Connectors to calendars, planners and automation tools (iCal subscription and webhook simulated, ADR-0009)                                                     |
| `/commerce/:code/tournees`    | What arrives and what goes back at each round (07:00, 14:00, 20:00), items to mark ready                                                                       |
| `/commerce/:code/messages`    | Customer requests, answers and quotes (label, price, locker size) with their status                                                                            |
| `/commerce/:code/avis`        | Rating out of 5, distribution, verified reviews, public replies                                                                                                |
| `/commerce/:code/offres`      | "Mes offres": create and edit offers (photo, title, service, description, price, locker size, turnaround), hide or delete                                      |
| `/coursier`                   | Courier space, presentation: rounds per day, items and km per round, monthly projection, consigne transfers, next rounds, map                                  |
| `/coursier/tournee`           | Round sheet: stops in order with items to pick up and drop off (orders and consigne transfers), stops ticked as done, route map                                |
| `/exploitation`               | Operator overview: volumes, fill rate, consigne transfers today, orders and forecast, live map, fill per size, alerts to watch, data management (Django admin) |
| `/exploitation/alertes`       | Alerts: lockers almost full or without a large free door, doors out of service, late pickups                                                                   |
| `/exploitation/casiers`       | Lockers: search, filter by kind of place, sort by fill rate                                                                                                    |
| `/exploitation/casiers/:code` | Locker detail: locker front with the status of every door                                                                                                      |
| `/exploitation/commandes`     | Orders: search and filter by status                                                                                                                            |
| `/exploitation/tournees`      | Rounds: today's totals, planned and past rounds, link to the round sheet                                                                                       |
| `/exploitation/commerces`     | Partner shops: rating, orders, revenue, commission, items in progress                                                                                          |
| `/exploitation/previsions`    | Forecasts: items per day, per round and busiest lockers                                                                                                        |

The demo merchants are fictitious ("Démo · …"): no real business is shown
with invented orders or revenue.

## Layout

```
src/
├── assets/     Mission page photos (free licences, credited on the page, see data/missionPhotos.ts)
├── components/   PortalPage (frame + fictitious notice), StatTile, BarChart, PortalMap
├── data/         Data source (demo dataset), figures (summaries.ts), round sheet (roundSheet.ts),
│                 partner demo state (partnerState.ts) and French formats, unit-tested
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

## Demo state

Merchant conversations, quotes, replies to reviews, service settings, items
marked ready and courier stops ticked as done live on the device
(`src/data/partnerState.ts`, `localStorage` when available). Conversations
start from fictitious customer requests and customer answers are simulated
(labelled in the app). PROD: merchant and courier endpoints of the API.
