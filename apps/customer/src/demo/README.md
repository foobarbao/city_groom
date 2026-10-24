# Demo data

`fixtures.json` holds the data used by the demo builds (`build:demo`,
`build:demo-site`), which run without a backend. It is a snapshot of the
backend's public API (`/api/v1/lockers/`, each locker front,
`/api/v1/lockers/sizes/`, `/api/v1/merchants/`) after loading real
OpenStreetMap data:

```bash
# from backend/
python manage.py import_osm_merchants --from-file ../data/osm/merchants.json
python manage.py seed_simulated_lockers --sites-file ../data/osm/tram_stops.json --reset --count 20
```

- **Lockers and their occupancy are fictitious** (simulation), placed at
  **real tram stops** and named after them.
- **Merchants are real businesses** (OpenStreetMap public data, ODbL), shown
  with "Partenariat non établi".
- It is only bundled when `VITE_DEMO=true` (see `src/api/lockers.ts`).

Regenerate it after any change to the public locker API so the demo keeps the
real response format.
