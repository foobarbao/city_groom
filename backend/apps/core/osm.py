"""Client for the public OpenStreetMap Overpass API.

Data © OpenStreetMap contributors, ODbL (attribution required wherever the
data is shown). The public Overpass API is meant for low-volume use: callers
are management commands run occasionally, never user requests.
"""

import json
import urllib.parse
import urllib.request
from typing import Any

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
USER_AGENT = "CityGroom-demo/0.1 (open data import)"
REQUEST_TIMEOUT_S = 90

# Area filter selecting the Grenoble-Alpes Métropole administrative boundary,
# to prefix queries with; results are then filtered with ``(area.metro)``.
METRO_AREA = 'area["name"="Grenoble-Alpes Métropole"]["boundary"="administrative"]->.metro;'


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
