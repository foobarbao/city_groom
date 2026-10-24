# OpenStreetMap data

Raw Overpass API responses used to build the demo with real data:

| File | Content | Loaded with |
|---|---|---|
| `tram_stops.json` | Tram stops of Grenoble-Alpes Métropole (candidate locker sites) | `python manage.py seed_simulated_lockers --sites-file ../data/osm/tram_stops.json` |
| `merchants.json` | Businesses offering locker-compatible services (selection rules in `docs/DATA_SOURCES.md`) | `python manage.py import_osm_merchants --from-file ../data/osm/merchants.json` |

Data © OpenStreetMap contributors, available under the
[Open Database License (ODbL)](https://www.openstreetmap.org/copyright).
Attribution is required wherever the data is shown.

## Refreshing

The files are produced by `python manage.py fetch_osm_data --output-dir ../data/osm`
(from `backend/`), which needs internet access to `overpass-api.de`. The
`OSM data` GitHub Actions workflow runs it and commits the result: it runs
when `data/osm/REFRESH` changes (edit the date in it to request a refresh).
