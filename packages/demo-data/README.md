# @city-groom/demo-data

Dataset used by the demo builds of the customer app and the partner portal,
which run without a backend (docs/DEMO.md).

| File | Content | Nature |
|---|---|---|
| `data/public.json` | Public API snapshot: lockers, locker fronts, sizes, merchants | Lockers simulated at **real tram stops**; merchants are **real** OpenStreetMap businesses |
| `data/operator.json` | Operator API snapshot: lockers with fill rates, door statuses, network stats | Simulated occupancy |
| `data/activity.json` | Orders, courier rounds, daily figures, forecast, demo merchants and services | **Fictitious** (`apps.demo.activity` in the backend) |

`src/index.ts` exposes typed accessors. Activity dates are shifted at load
time so that the demo always looks current (`rebaseActivity`).

## Regenerating

From `backend/`, after importing the OpenStreetMap data (see
`docs/DATA_SOURCES.md`):

```bash
python manage.py export_demo_data --output-dir ../packages/demo-data/data --now 2026-10-24T18:00:00+02:00
```

A fixed `--now` keeps the dataset reproducible.
