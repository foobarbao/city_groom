"""Retrieval of candidate locker sites from OpenStreetMap.

Locker locations are not decided yet (docs/PRODUCT.md). For the demo, lockers
are placed at **real tram stops** of Grenoble-Alpes Métropole, which are
public, well-known and spread over the city centre and the outskirts.

Data © OpenStreetMap contributors, ODbL. Queries go through the public
Overpass API, which is meant for low-volume use: this module is called by a
management command run occasionally, never by user requests.
"""

import json
import urllib.parse
import urllib.request
from typing import Any

from apps.lockers.simulation import SimulatedSite

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
USER_AGENT = "CityGroom-demo/0.1 (locker site import)"
REQUEST_TIMEOUT_S = 90

# Tram stops inside the metropolitan area boundary.
TRAM_STOPS_QUERY = """
[out:json][timeout:60];
area["name"="Grenoble-Alpes Métropole"]["boundary"="administrative"]->.metro;
node(area.metro)["railway"="tram_stop"];
out body;
"""


def fetch_overpass(query: str, url: str = OVERPASS_URL) -> dict[str, Any]:
    """Run an Overpass QL query and return the decoded JSON response.

    Args:
        query: Overpass QL query.
        url: Overpass endpoint.

    Returns:
        The JSON response.

    Raises:
        ValueError: If ``url`` does not use HTTPS.
        urllib.error.URLError: On network failure or HTTP error.
    """
    # Only HTTPS is allowed, so a misconfigured URL cannot read local files
    # (``file:``) or other unexpected schemes.
    if not url.startswith("https://"):
        raise ValueError(f"Overpass URL must use HTTPS: {url!r}")
    data = urllib.parse.urlencode({"data": query}).encode()
    request = urllib.request.Request(  # noqa: S310 - scheme checked above
        url, data=data, headers={"User-Agent": USER_AGENT}
    )
    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_S) as response:  # noqa: S310
        result: dict[str, Any] = json.load(response)
    return result


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
