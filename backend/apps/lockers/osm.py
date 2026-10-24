"""Retrieval of candidate locker sites from OpenStreetMap.

Locker locations are not decided yet (docs/PRODUCT.md). For the demo, lockers
are placed at real places of Grenoble-Alpes Métropole:

- **tram stops**, public, well-known and spread over the city centre and the
  outskirts (service lockers);
- **strategic places** for the consigne (luggage-style storage): tourist
  sites, transport hubs, campuses, shopping centres, hospitals, business
  areas and squares lined with restaurants and cafés (smaller lockers, more
  numerous; docs/PRODUCT.md §4).

Data © OpenStreetMap contributors, ODbL. Queries go through the shared
Overpass client (``apps.core.osm``).
"""

from typing import Any

from apps.core.osm import METRO_BBOX, fetch_overpass
from apps.lockers.simulation import SimulatedSite

__all__ = [
    "STRATEGIC_CATEGORIES",
    "STRATEGIC_SITES_QUERY",
    "TRAM_STOPS_QUERY",
    "fetch_overpass",
    "parse_strategic_sites",
    "parse_tram_stops",
]

# Tram stops around Grenoble (metropolitan area bounding box).
TRAM_STOPS_QUERY = f"""
[out:json][timeout:60];
node["railway"="tram_stop"]({METRO_BBOX});
out body;
"""


def parse_tram_stops(payload: dict[str, Any]) -> list[SimulatedSite]:
    """Turn an Overpass response into one site per tram stop name.

    A stop usually has one node per direction; nodes sharing a name are merged
    at their average position. Unnamed nodes are ignored.

    Args:
        payload: Overpass JSON response containing nodes.

    Returns:
        Sites sorted by name.
    """
    by_name: dict[str, list[dict[str, Any]]] = {}
    for element in payload.get("elements", []):
        name = element.get("tags", {}).get("name")
        if element.get("type") == "node" and name:
            by_name.setdefault(name, []).append(element)
    sites = []
    for name, nodes in sorted(by_name.items()):
        node_ids = ", ".join(str(node["id"]) for node in nodes)
        sites.append(
            SimulatedSite(
                name=name,
                longitude=sum(node["lon"] for node in nodes) / len(nodes),
                latitude=sum(node["lat"] for node in nodes) / len(nodes),
                source=f"OpenStreetMap, arrêt de tram (nœuds {node_ids})",
            )
        )
    return sites


# Strategic places for consigne lockers, as (category, OSM tag filter).
# Category labels are shown in French in the apps. Squares stand for
# restaurant and café areas: lockers are never named after a real business.
# ASSUMPTION: this selection of OSM tags reflects "tourist sites, restaurants,
# large activity hubs" as asked by the project owner on 2026-10-24.
STRATEGIC_CATEGORIES: tuple[tuple[str, str], ...] = (
    ("tourism", '["tourism"~"^(attraction|museum|viewpoint|zoo|theme_park)$"]'),
    ("transport", '["railway"="station"]'),
    ("transport", '["amenity"="bus_station"]'),
    ("campus", '["amenity"~"^(university|college)$"]'),
    ("shopping", '["shop"="mall"]'),
    ("shopping", '["amenity"="marketplace"]'),
    ("health", '["amenity"="hospital"]'),
    ("business", '["landuse"~"^(commercial|retail)$"]["name"]'),
    ("square", '["place"="square"]'),
    ("square", '["highway"="pedestrian"]["area"="yes"]["name"]'),
    ("leisure", '["leisure"~"^(stadium|sports_centre|park)$"]["name"]'),
)

STRATEGIC_SITES_QUERY = (
    "[out:json][timeout:90];\n(\n"
    + "".join(f"  nwr{tags}({METRO_BBOX});\n" for _, tags in STRATEGIC_CATEGORIES)
    + ");\nout center tags;\n"
)

# OSM tag values that identify each category in a response.
_CATEGORY_MATCHERS: tuple[tuple[str, str, frozenset[str]], ...] = (
    ("tourism", "tourism", frozenset({"attraction", "museum", "viewpoint", "zoo", "theme_park"})),
    ("transport", "railway", frozenset({"station"})),
    ("transport", "amenity", frozenset({"bus_station"})),
    ("campus", "amenity", frozenset({"university", "college"})),
    ("shopping", "shop", frozenset({"mall"})),
    ("shopping", "amenity", frozenset({"marketplace"})),
    ("health", "amenity", frozenset({"hospital"})),
    ("business", "landuse", frozenset({"commercial", "retail"})),
    ("square", "place", frozenset({"square"})),
    ("square", "highway", frozenset({"pedestrian"})),
    ("leisure", "leisure", frozenset({"stadium", "sports_centre", "park"})),
)


def strategic_category(tags: dict[str, str]) -> str | None:
    """Return the strategic category of an OSM object, or None."""
    for category, key, values in _CATEGORY_MATCHERS:
        if tags.get(key) in values:
            return category
    return None


def parse_strategic_sites(payload: dict[str, Any]) -> list[tuple[str, SimulatedSite]]:
    """Turn an Overpass response into named strategic sites with their category.

    Ways and relations are placed at the centre given by ``out center``.
    Unnamed objects are ignored; objects sharing a name are merged (first one
    kept).

    Args:
        payload: Overpass JSON response (nodes, ways, relations).

    Returns:
        (category, site) pairs sorted by name.
    """
    by_name: dict[str, tuple[str, SimulatedSite]] = {}
    for element in payload.get("elements", []):
        tags = element.get("tags", {})
        name = tags.get("name")
        category = strategic_category(tags)
        position = element.get("center") or element
        if not name or not category or "lon" not in position or name in by_name:
            continue
        by_name[name] = (
            category,
            SimulatedSite(
                name=name,
                longitude=position["lon"],
                latitude=position["lat"],
                source=f"OpenStreetMap, {element['type']} {element['id']} ({category})",
            ),
        )
    return [by_name[name] for name in sorted(by_name)]
