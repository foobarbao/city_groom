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

import math
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
    ("leisure", '["leisure"~"^(stadium|park)$"]["name"]'),
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
    ("leisure", "leisure", frozenset({"stadium", "park"})),
)


def strategic_category(tags: dict[str, str]) -> str | None:
    """Return the strategic category of an OSM object, or None."""
    for category, key, values in _CATEGORY_MATCHERS:
        if tags.get(key) in values:
            return category
    return None


# Selection rules for strategic places (docs/DATA_SOURCES.md). The raw query
# is broad; these rules keep places that are urban, public and well known.
# ASSUMPTION: thresholds and name patterns chosen for the demo, to review with
# the project owner when locker locations are decided.
CENTRE_LAT_LON = (45.1885, 5.7245)  # Grenoble city centre
MAX_DISTANCE_KM = 7.0  # urban area served by the cargo-bike rounds
# Categories whose places must be notable (a Wikidata or Wikipedia entry),
# which removes private clubs, small rooms and minor squares.
NOTABLE_ONLY = frozenset({"tourism", "campus", "leisure", "square"})
BUSINESS_AREA_PREFIXES = ("Zone ", "ZA ", "ZAC ", "ZI ", "Parc ", "Secteur ", "Espace ")
# Hospitals proper (not day units or consultation rooms).
HOSPITAL_WORDS = ("CHU", "hospitalier")
# Names too generic to help a customer find the locker.
GENERIC_NAMES = frozenset({"Gymnase", "Kiosque", "Belvédère", "Bois", "Parc", "Square"})


def _distance_km(lat: float, lon: float) -> float:
    """Distance from the centre of Grenoble (equirectangular, fine at city scale)."""
    mean_lat = math.radians((lat + CENTRE_LAT_LON[0]) / 2)
    dx = math.radians(lon - CENTRE_LAT_LON[1]) * math.cos(mean_lat)
    dy = math.radians(lat - CENTRE_LAT_LON[0])
    return 6371 * math.hypot(dx, dy)


def is_strategic_candidate(category: str, tags: dict[str, str], lat: float, lon: float) -> bool:
    """Whether a place passes the selection rules for consigne lockers."""
    name = tags.get("name", "")
    notable = bool(tags.get("wikidata") or tags.get("wikipedia"))
    if _distance_km(lat, lon) > MAX_DISTANCE_KM or name in GENERIC_NAMES:
        return False
    if tags.get("brand") or tags.get("shop") not in (None, "mall"):
        return False  # a business, not a place
    if category in NOTABLE_ONLY:
        return notable
    if category == "shopping":
        return notable or tags.get("amenity") == "marketplace"
    if category == "business":
        return notable or name.startswith(BUSINESS_AREA_PREFIXES)
    if category == "health":
        return notable or any(word in name for word in HOSPITAL_WORDS)
    return True


# Places that must have a locker whatever the rules above (project owner's
# request of 2026-10-26: "il me faut absolument des casiers jusqu'à
# Meylan / Inovallée", large business parks). OpenStreetMap name → name shown
# to customers (OSM spells the Montbonnot part "Innovallée").
REQUIRED_SITES = {
    "Inovallée Meylan": "Inovallée Meylan",
    "Innovallée Montbonnot": "Inovallée Montbonnot",
}


def parse_required_sites(payload: dict[str, Any]) -> list[tuple[str, SimulatedSite]]:
    """Return the owner-requested places of ``REQUIRED_SITES`` found in the payload.

    They skip the selection rules (distance, naming): the project owner asked
    for them explicitly. Category: business area.
    """
    found: dict[str, tuple[str, SimulatedSite]] = {}
    for element in payload.get("elements", []):
        name = element.get("tags", {}).get("name")
        position = element.get("center") or element
        if name not in REQUIRED_SITES or "lon" not in position or name in found:
            continue
        found[name] = (
            "business",
            SimulatedSite(
                name=REQUIRED_SITES[name],
                longitude=position["lon"],
                latitude=position["lat"],
                source=f"OpenStreetMap, {element['type']} {element['id']} (business, requested)",
            ),
        )
    return [found[name] for name in REQUIRED_SITES if name in found]


def _display_name(category: str, name: str) -> str:
    """Name shown to customers; stations get "Gare" when OSM names the town only."""
    if category == "transport" and not name.lower().startswith(("gare", "pôle", "station")):
        return f"Gare {name}"
    return name


def parse_strategic_sites(payload: dict[str, Any]) -> list[tuple[str, SimulatedSite]]:
    """Turn an Overpass response into named strategic sites with their category.

    Ways and relations are placed at the centre given by ``out center``.
    Places failing ``is_strategic_candidate`` and unnamed objects are ignored;
    objects sharing a name are merged (first one kept).

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
        if not name or not category or "lon" not in position:
            continue
        if not is_strategic_candidate(category, tags, position["lat"], position["lon"]):
            continue
        name = _display_name(category, name)
        if name in by_name:
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
