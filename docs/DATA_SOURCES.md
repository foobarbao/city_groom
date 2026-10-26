# Data sources

> **Status**: living document · **Last updated**: 2026-10-24

Every external data source used by City Groom, its licence and how it is
imported. Real data is preferred everywhere; simulated data is labelled
(`is_simulated`) and never presented as real.

| Data                                | Source                                                                                                                                               | Licence                                                                             | How                                                        | Status                                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Map background                      | OpenStreetMap-based vector tiles (OpenFreeMap for the demo)                                                                                          | ODbL (data), attribution required                                                   | Loaded by MapLibre at runtime (`VITE_MAP_STYLE_URL`)       | Works in the app (live); embedded as an offline extract in the published demo (`apps/customer/scripts/fetch_offline_map.py`) |
| Candidate locker sites              | OpenStreetMap tram stops of Grenoble-Alpes Métropole (Overpass API)                                                                                  | ODbL                                                                                | `python manage.py seed_simulated_lockers`                  | Imported (`data/osm/`)                                                                                                       |
| Strategic places (consigne lockers) | OpenStreetMap tourist sites, stations, campuses, shopping centres and markets, hospitals, business areas, squares, parks and stadiums (Overpass API) | ODbL                                                                                | `python manage.py seed_simulated_lockers --strategic-file` | Imported (`data/osm/`)                                                                                                       |
| Merchants                           | OpenStreetMap businesses (Overpass API)                                                                                                              | ODbL                                                                                | `python manage.py import_osm_merchants`                    | Imported (`data/osm/`)                                                                                                       |
| 5àsec public prices                 | Web offers published on <https://www.5asec.fr/fr/nos-offres-web/>, read on 2026-10-26                                                                | Public prices, shown for information with source and date (no logo, no partnership) | `apps/merchants/public_prices.py` (copied by hand)         | Read by hand; to re-check before relying on them                                                                             |
| Locker sizes and layouts            | Public documentation of locker networks and manufacturers                                                                                            | —                                                                                   | Encoded in `backend/apps/lockers/sizes.py`                 | Done, sources in `docs/LOCKERS.md`                                                                                           |

## Area

Queries cover a bounding box around Grenoble-Alpes Métropole (south 45.02,
west 5.55, north 45.33, east 5.93; `METRO_BBOX` in `backend/apps/core/osm.py`),
slightly larger than the metropolitan area.

## Strategic places selection rules

Implemented in `backend/apps/lockers/osm.py` (`STRATEGIC_CATEGORIES`,
`is_strategic_candidate`) and `simulation.py` (`spread_by_category`), for
the consigne lockers (docs/PRODUCT.md §4):

| Category                    | OSM tags                                                   | Kept when                                                                              |
| --------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Tourist site                | `tourism` = attraction, museum, viewpoint, zoo, theme_park | notable¹                                                                               |
| Station                     | `railway=station`, `amenity=bus_station`                   | always (shown as "Gare …")                                                             |
| Campus                      | `amenity` = university, college                            | notable¹                                                                               |
| Shopping                    | `shop=mall`, `amenity=marketplace`                         | notable¹, or a market                                                                  |
| Hospital                    | `amenity=hospital`                                         | notable¹, or name with "CHU" / "hospitalier"                                           |
| Business area               | named `landuse` = commercial, retail                       | notable¹, or name starting with "Zone", "ZA", "ZAC", "ZI", "Parc", "Secteur", "Espace" |
| Square (restaurants, cafés) | `place=square`, named pedestrian areas                     | notable¹                                                                               |
| Park or stadium             | named `leisure` = park, stadium                            | notable¹                                                                               |

¹ Notable: the object has a `wikidata` or `wikipedia` tag. This removes
private clubs, small rooms and minor squares.

Always excluded: places more than 7 km from the centre of Grenoble (outside
the area served by cargo bikes), objects with a `brand` or a `shop` tag
other than `mall` (businesses), unnamed objects and generic names
("Gymnase", "Kiosque"…). Squares stand for restaurant areas: a locker is
never named after a real restaurant or business.

Placement: categories are taken in turn so that every kind of place is
represented; within a category, the place closest to the city centre is
chosen, at least 250 m from every other locker. ASSUMPTION: thresholds
chosen for the demo (70 lockers: 25 at tram stops, 45 at strategic places),
to review when real locations are decided.

## Merchant selection rules

Implemented in `backend/apps/merchants/osm.py` and `categories.py`
(requirements in `docs/PRODUCT.md`):

- services on items that fit in a locker, selected by these OpenStreetMap tags:

| Category                | Tags                                              |
| ----------------------- | ------------------------------------------------- |
| Pressing                | `shop=dry_cleaning`                               |
| Blanchisserie           | `shop=laundry`                                    |
| Cordonnerie             | `shop=shoe_repair`, `craft=shoemaker`             |
| Retouches               | `shop=tailor`, `craft=tailor`, `craft=dressmaker` |
| Horlogerie              | `craft=watchmaker`                                |
| Bijouterie              | `craft=jeweller`                                  |
| Réparation électronique | `craft=electronics_repair`                        |
| Clés                    | `craft=key_cutter`, `shop=locksmith`              |

- **no food businesses** (none of the tags above is a food tag);
- **no chains**: objects with a `brand` or `brand:wikidata` tag are excluded;
- **no self-service laundromats**: `shop=laundry` with `self_service=yes` is
  excluded (project owner's decision, 2026-10-24);
- named businesses only;
- shown with public data only (name, address, opening hours, website), no
  logo, with "Partenariat non établi" until a partnership is signed.

Import of 2026-10-24: 180 OpenStreetMap objects, **100 businesses kept**
(chains, unnamed objects and 59 self-service laundromats excluded): 34
tailoring, 19 electronics repair, 16 shoe repair, 15 dry cleaning, 9 keys, 3
laundries, 3 jewellery, 1 watchmaker. Two of the remaining laundries are named
"Laverie" and "Laverie automatique" without a `self_service` tag in
OpenStreetMap: probably self-service too, to confirm with the project owner.
Re-running the import deletes businesses no longer selected (except partners).

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
