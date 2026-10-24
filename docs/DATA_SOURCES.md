# Data sources

> **Status**: living document · **Last updated**: 2026-10-24

Every external data source used by City Groom, its licence and how it is
imported. Real data is preferred everywhere; simulated data is labelled
(`is_simulated`) and never presented as real.

| Data | Source | Licence | How | Status |
|---|---|---|---|---|
| Map background | OpenStreetMap-based vector tiles (OpenFreeMap for the demo) | ODbL (data), attribution required | Loaded by MapLibre at runtime (`VITE_MAP_STYLE_URL`) | Works in the app (live); embedded as an offline extract in the published demo (`apps/customer/scripts/fetch_offline_map.py`) |
| Candidate locker sites | OpenStreetMap tram stops of Grenoble-Alpes Métropole (Overpass API) | ODbL | `python manage.py seed_simulated_lockers` | Code ready; not yet run against real data (see below) |
| Merchants | OpenStreetMap businesses (Overpass API) | ODbL | `python manage.py import_osm_merchants` | Code ready; not yet run against real data (see below) |
| Locker sizes and layouts | Public documentation of locker networks and manufacturers | — | Encoded in `backend/apps/lockers/sizes.py` | Done, sources in `docs/LOCKERS.md` |

## Area

Queries cover a bounding box around Grenoble-Alpes Métropole (south 45.02,
west 5.55, north 45.33, east 5.93; `METRO_BBOX` in `backend/apps/core/osm.py`),
slightly larger than the metropolitan area.

## Merchant selection rules

Implemented in `backend/apps/merchants/osm.py` and `categories.py`
(requirements in `docs/PRODUCT.md`):

- services on items that fit in a locker, selected by these OpenStreetMap tags:

| Category | Tags |
|---|---|
| Pressing | `shop=dry_cleaning` |
| Blanchisserie | `shop=laundry` |
| Cordonnerie | `shop=shoe_repair`, `craft=shoemaker` |
| Retouches | `shop=tailor`, `craft=tailor`, `craft=dressmaker` |
| Horlogerie | `craft=watchmaker` |
| Bijouterie | `craft=jeweller` |
| Réparation électronique | `craft=electronics_repair` |
| Clés | `craft=key_cutter`, `shop=locksmith` |

- **no food businesses** (none of the tags above is a food tag);
- **no chains**: objects with a `brand` or `brand:wikidata` tag are excluded;
- named businesses only;
- shown with public data only (name, address, opening hours, website), no
  logo, with "Partenariat non établi" until a partnership is signed.

This tag list is a first selection: review it against the real Grenoble data
at the first import (missing categories, false positives such as self-service
laundromats under `shop=laundry`).

## Attribution

Wherever OpenStreetMap data is shown (map, lists of businesses), display
"© les contributeurs OpenStreetMap" with a link to
<https://www.openstreetmap.org/copyright>.

## Getting the data

The raw OpenStreetMap responses are stored in [`data/osm/`](../data/osm/)
and loaded from there. They are refreshed by the **OSM data** GitHub Actions
workflow (`.github/workflows/osm-data.yml`), which runs
`python manage.py fetch_osm_data` on a GitHub runner and commits the result:
edit `data/osm/REFRESH` to trigger it. This is needed because the AI
assistant's development environment cannot reach `overpass-api.de` (the
connection is reset), while GitHub runners have open internet access.

The same command can be run on any machine with internet access, from
`backend/`: `python manage.py fetch_osm_data --output-dir ../data/osm`.
