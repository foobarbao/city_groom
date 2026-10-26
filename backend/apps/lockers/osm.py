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
from apps.lockers.simulation import SimulatedSite, distance_m

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

# Education sites for small lockers (project owner's decision of 2026-10-26:
# small mixed lockers, services and consigne, in front of every lycée and
# higher-education site; collèges and primary schools excluded).
EDUCATION_QUERY = (
    "[out:json][timeout:90];\n(\n"
    f'  nwr["amenity"="school"]["school:FR"~"lycée"]({METRO_BBOX});\n'
    f'  nwr["amenity"="school"]["name"~"^Lycée"]({METRO_BBOX});\n'
    f'  nwr["amenity"~"^(university|college)$"]["name"]({METRO_BBOX});\n'
    ");\nout center tags;\n"
)

# Boundary of the town of Grenoble: every locker inside gets a large model
# (project owner's decision of 2026-10-26: "gros casiers dans le centre",
# the centre being the whole town).
GRENOBLE_BOUNDARY_QUERY = (
    "[out:json][timeout:90];\n"
    'relation["boundary"="administrative"]["admin_level"="8"]["name"="Grenoble"]'
    f"({METRO_BBOX});\nout geom;\n"
)

# Candidate sites of large companies, to be validated one by one by the
# project owner before any locker is placed there.
COMPANY_SITES_QUERY = (
    "[out:json][timeout:90];\n(\n"
    f'  nwr["office"~"^(company|research|it)$"]["name"]({METRO_BBOX});\n'
    f'  nwr["amenity"="research_institute"]["name"]({METRO_BBOX});\n'
    f'  nwr["landuse"="industrial"]["name"]({METRO_BBOX});\n'
    ");\nout center tags;\n"
)

# Large companies validated by the project owner on 2026-10-26 (zones
# "Presqu'île scientifique", "Sud agglo", "Est"), as OpenStreetMap
# (type, id) → locker name. Lockers are named after the place, never after
# the company (owner's decision of the same day: no company name, so no
# partnership is implied); street names come from the OSM address tags or
# from Nominatim reverse geocoding of the site. The company stays in the
# comment for traceability.
COMPANY_SITES: dict[tuple[str, int], str] = {
    ("way", 135788328): "Polygone scientifique · Rue Félix Esclangon",  # CEA-Leti
    ("way", 41832636): "Polygone scientifique · Rue Jules Horowitz",  # STMicroelectronics
    ("node", 7982692311): "Polygone scientifique · 160 avenue des Martyrs",  # Schneider Electric
    ("node", 487712413): "Polygone scientifique · 71 avenue des Martyrs",  # ILL
    ("way", 135788628): "Polygone scientifique · Place de la Résistance",  # Institut Néel
    ("way", 40629368): "Eybens · Nouvelle rue Jean Mermoz",  # Hewlett Packard
    ("way", 38968477): "Eybens · Rue François Quesnay",  # Schneider Electric
    ("way", 95560291): "Échirolles · Rue Pierre Semard",  # Caterpillar
    ("way", 1551529859): "Le Pont-de-Claix · Rue Aristide Bergès",  # Becton Dickinson
    ("node", 11758650441): "Grenoble · Avenue Léon Blum",  # GE Renewable Hydro
    ("relation", 6037451): "Montbonnot · Rue René Thom",  # Inria
    ("node", 14104886930): "Montbonnot · Avenue de l'Europe",  # Thales
    ("node", 11518577268): "Meylan · 22 chemin du Vieux Chêne",  # Siemens EDA
    ("node", 5888623719): "Meylan · 14 chemin du Vieux Chêne",  # Schneider Electric
}


def parse_company_sites(payload: dict[str, Any]) -> list[tuple[str, SimulatedSite]]:
    """Return the validated company sites of ``COMPANY_SITES`` found in the payload."""
    found: dict[tuple[str, int], tuple[str, SimulatedSite]] = {}
    for element in payload.get("elements", []):
        key = (element.get("type", ""), element.get("id", 0))
        position = element.get("center") or element
        if key not in COMPANY_SITES or "lon" not in position:
            continue
        found[key] = (
            "business",
            SimulatedSite(
                name=COMPANY_SITES[key],
                longitude=position["lon"],
                latitude=position["lat"],
                source=f"OpenStreetMap, {key[0]} {key[1]} (company, validated)",
            ),
        )
    return [found[key] for key in COMPANY_SITES if key in found]


# Minimum distance between two education lockers, in metres: a campus has
# many university buildings close together. ASSUMPTION, to review.
EDUCATION_MIN_SPACING_M = 200


def _is_lycee(tags: dict[str, str]) -> bool:
    return tags.get("amenity") == "school" and (
        "lycée" in tags.get("school:FR", "") or tags.get("name", "").startswith("Lycée")
    )


def parse_education_sites(payload: dict[str, Any]) -> list[tuple[str, SimulatedSite]]:
    """Return every lycée and higher-education site, one locker each.

    Lycées get the "school" category, universities and colleges "campus".
    Sites closer than ``EDUCATION_MIN_SPACING_M`` to an already kept one are
    skipped (central sites first), so a campus gets a few lockers rather than
    one per building. Deterministic.
    """
    candidates: list[tuple[str, SimulatedSite]] = []
    seen_names: set[str] = set()
    for element in payload.get("elements", []):
        tags = element.get("tags", {})
        name = tags.get("name", "").strip()
        position = element.get("center") or element
        if not name or "lon" not in position or name in seen_names:
            continue
        # Laboratories and one-letter building names are not schools.
        if len(name) < 4 or name.startswith(("Laboratoire", "Laboratory")):
            continue
        if _is_lycee(tags):
            category = "school"
        elif tags.get("amenity") in ("university", "college"):
            category = "campus"
        else:
            continue
        seen_names.add(name)
        candidates.append(
            (
                category,
                SimulatedSite(
                    name=name,
                    longitude=position["lon"],
                    latitude=position["lat"],
                    source=f"OpenStreetMap, {element['type']} {element['id']} ({category})",
                ),
            )
        )
    candidates.sort(
        key=lambda pair: (_distance_km(pair[1].latitude, pair[1].longitude), pair[1].name)
    )
    kept: list[tuple[str, SimulatedSite]] = []
    for category, site in candidates:
        if all(distance_m(site, other) >= EDUCATION_MIN_SPACING_M for _, other in kept):
            kept.append((category, site))
    return kept


def parse_town_boundary(payload: dict[str, Any]) -> list[list[tuple[float, float]]]:
    """Return the outer rings (lon, lat) of a town boundary relation (``out geom``).

    OpenStreetMap stores the boundary as ways in any order and direction;
    they are joined end to end into closed rings.
    """
    segments: list[list[tuple[float, float]]] = []
    for element in payload.get("elements", []):
        for member in element.get("members", []):
            if member.get("type") == "way" and member.get("role") in ("outer", ""):
                points = [(p["lon"], p["lat"]) for p in member.get("geometry", [])]
                if len(points) >= 2:
                    segments.append(points)
    rings: list[list[tuple[float, float]]] = []
    while segments:
        ring = segments.pop(0)
        progress = True
        while ring[0] != ring[-1] and progress:
            progress = False
            for i, segment in enumerate(segments):
                if segment[0] == ring[-1]:
                    ring += segment[1:]
                elif segment[-1] == ring[-1]:
                    ring += segment[-2::-1]
                elif segment[-1] == ring[0]:
                    ring = segment[:-1] + ring
                elif segment[0] == ring[0]:
                    ring = segment[:0:-1] + ring
                else:
                    continue
                segments.pop(i)
                progress = True
                break
        if ring[0] == ring[-1] and len(ring) >= 4:
            rings.append(ring)
    return rings


def point_in_rings(
    longitude: float, latitude: float, rings: list[list[tuple[float, float]]]
) -> bool:
    """Whether a point lies inside one of the rings (ray casting)."""
    for ring in rings:
        inside = False
        for (x1, y1), (x2, y2) in zip(ring, ring[1:], strict=False):
            if (y1 > latitude) != (y2 > latitude):
                x_cross = x1 + (latitude - y1) * (x2 - x1) / (y2 - y1)
                if longitude < x_cross:
                    inside = not inside
        if inside:
            return True
    return False


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
