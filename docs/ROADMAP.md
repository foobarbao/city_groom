# Roadmap

> **Status**: living document · **Last updated**: 2026-10-24
>
> Iterations are deliberately small: each one produces something that can be
> shown, then refined with the project owner. All activity data is simulated
> until real partners join.

## Done

1. **Foundations** — coding standards, workflow, product document, ADRs
   0001–0006, backend skeleton (Django + PostGIS, Docker, CI).
2. **Lockers (backend)** — models, simulated sizes and layouts, simulated
   occupancy, import of candidate sites from OpenStreetMap, public and
   operator APIs, admin. See `docs/LOCKERS.md`.

3. **Customer app (first screens)** — `apps/customer/` (Ionic + Vue): map of
   Grenoble with the lockers and their free compartments; user-friendly
   **locker view** highlighting the door to open; API types generated from
   the OpenAPI schema (`packages/api-client`). Capacitor / Android packaging
   is pending the application id.

4. **Realistic lockers and integration API** — sizes and layouts aligned
   with French parcel lockers and dry-cleaning lockers, hardware profiles
   (QR / NFC / offline Bluetooth, 4G / Ethernet), locker events and driver
   interface, versioned API `/api/v1/` with scoped integration API keys, rate
   limits and an integration guide (`docs/api/README.md`).

## Next

5. **Operator space (first dashboards)** — initialise `apps/portal/`; network
   map; **volume** and **fill rate** indicators; locker view with the status
   of every door.
6. **Activity simulator** — orders, drop-offs, two rounds per day (e.g. 08:00
   and 20:00), 12-hour pickup slots, modest volumes; runs as a scheduled job.
7. **Real-time tracking** — live updates of lockers and rounds on the map;
   simulated cargo-bike rounds following real streets. Requires decisions on
   the live update mechanism and on the routing engine (new ADRs).
8. **Flow forecasts** — expected items per locker, round and merchant, for the
   operator, courier and merchant spaces.
9. **Merchants and catalogue** — import of real Grenoble businesses (public
   data, no food, no large chains), standard services, packs, quotes with
   chat.
10. **Courier space** — projected activity and volume to present to courier
   partners (demo mode).
11. **Merchant space and "pro" app** — incoming items, forecasts, revenue and
    commission.

## Blockers and dependencies

- **Network access of the development environment**: the AI assistant's cloud
  environment uses a restricted network access level (package registries
  allowed, other hosts denied), so it cannot reach OpenStreetMap services
  (`overpass-api.de`), map tiles (`tiles.openfreemap.org`) or open data portals
  (`www.data.gouv.fr`, `data.mobilites-m.fr`). Real data must be imported from a machine with internet
  access (`seed_simulated_lockers`), or the environment's allowed domains must
  be extended.
- **Android application ids** (customer app, pro app) depend on the final
  product name and domain.
- Reminders and open questions: see `docs/PRODUCT.md`.
