"""Retrieval of candidate locker sites from OpenStreetMap.

Locker locations are not decided yet (docs/PRODUCT.md). For the demo, lockers
are placed at **real tram stops** of Grenoble-Alpes Métropole, which are
public, well-known and spread over the city centre and the outskirts.

Data © OpenStreetMap contributors, ODbL. Queries go through the shared
Overpass client (``apps.core.osm``).
"""

from typing import Any

from apps.core.osm import METRO_BBOX, fetch_overpass
from apps.lockers.simulation import SimulatedSite

__all__ = ["TRAM_STOPS_QUERY", "fetch_overpass", "parse_tram_stops"]

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
