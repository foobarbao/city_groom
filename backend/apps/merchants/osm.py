"""Import of real local businesses from OpenStreetMap.

Selection rules (docs/PRODUCT.md, "Demo goals and data"):

- services on items that fit in a locker: the tags listed in
  ``categories.OSM_TAG_CATEGORIES``;
- no food businesses: none of those tags is a food tag;
- no large chains: objects carrying a ``brand`` or ``brand:wikidata`` tag are
  excluded, as OpenStreetMap uses these tags for chain stores;
- named businesses only.

Data © OpenStreetMap contributors, ODbL.
"""

from dataclasses import dataclass
from typing import Any

from apps.core.osm import METRO_BBOX
from apps.merchants.categories import OSM_TAG_CATEGORIES, ServiceCategory

# Tags whose presence marks a chain store.
CHAIN_TAGS = ("brand", "brand:wikidata")


def build_query() -> str:
    """Return the Overpass query for every candidate business in the metropolitan area.

    Nodes, ways and relations are requested; ``out center`` gives a single
    point for buildings mapped as areas.
    """
    selectors = "\n".join(
        f'  nwr["{key}"="{value}"]({METRO_BBOX});' for key, value, _ in OSM_TAG_CATEGORIES
    )
    return f"[out:json][timeout:90];\n(\n{selectors}\n);\nout center tags;\n"


@dataclass(frozen=True)
class MerchantCandidate:
    """A business found in OpenStreetMap, ready to be stored."""

    osm_type: str
    osm_id: int
    name: str
    category: ServiceCategory
    longitude: float
    latitude: float
    address: str
    opening_hours: str
    website: str


def _category(tags: dict[str, str]) -> ServiceCategory | None:
    """Return the first category whose tag matches, or None."""
    for key, value, category in OSM_TAG_CATEGORIES:
        if tags.get(key) == value:
            return category
    return None


def _address(tags: dict[str, str]) -> str:
    """Build a French-style postal address from ``addr:*`` tags (may be empty)."""
    street = " ".join(p for p in (tags.get("addr:housenumber"), tags.get("addr:street")) if p)
    city = " ".join(p for p in (tags.get("addr:postcode"), tags.get("addr:city")) if p)
    return ", ".join(p for p in (street, city) if p)


def parse_merchants(payload: dict[str, Any]) -> list[MerchantCandidate]:
    """Turn an Overpass response into merchant candidates, applying the selection rules.

    Args:
        payload: Overpass JSON response (``out center tags``).

    Returns:
        Candidates sorted by name; excluded objects are silently skipped.
    """
    candidates = []
    for element in payload.get("elements", []):
        tags: dict[str, str] = element.get("tags", {})
        name = tags.get("name", "").strip()
        category = _category(tags)
        if not name or category is None or any(tag in tags for tag in CHAIN_TAGS):
            continue
        point = element if "lat" in element else element.get("center")
        if not point:
            continue
        candidates.append(
            MerchantCandidate(
                osm_type=element["type"],
                osm_id=element["id"],
                name=name,
                category=category,
                longitude=point["lon"],
                latitude=point["lat"],
                address=_address(tags),
                opening_hours=tags.get("opening_hours", ""),
                website=tags.get("website", tags.get("contact:website", "")),
            )
        )
    return sorted(candidates, key=lambda c: c.name)
