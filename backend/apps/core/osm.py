"""Client for the public OpenStreetMap Overpass API.

Data © OpenStreetMap contributors, ODbL (attribution required wherever the
data is shown). The public Overpass API is meant for low-volume use: callers
are management commands run occasionally, never user requests.
"""

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
# Public instances tried in order. The main instance is often overloaded
# (HTTP 429/502/504); a well-known mirror serves the same data.
OVERPASS_ENDPOINTS = (OVERPASS_URL, "https://overpass.kumi.systems/api/interpreter")
ATTEMPTS_PER_ENDPOINT = 3
RETRY_BASE_DELAY_S = 10.0
USER_AGENT = "CityGroom-demo/0.1 (open data import)"
REQUEST_TIMEOUT_S = 90

# Bounding box (south, west, north, east) around Grenoble-Alpes Métropole.
# A box is used rather than the administrative area: a query on the area name
# returned no element (first workflow run), and a box is predictable. It
# slightly exceeds the metropolitan area, which is fine for the demo.
METRO_BBOX = "45.02,5.55,45.33,5.93"


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


def fetch_overpass_with_retries(
    query: str,
    endpoints: tuple[str, ...] = OVERPASS_ENDPOINTS,
    sleep: Any = time.sleep,
) -> dict[str, Any]:
    """Run an Overpass query, retrying with back-off and falling back to mirrors.

    Args:
        query: Overpass QL query.
        endpoints: Instances to try, in order.
        sleep: Waiting function (replaced in tests).

    Returns:
        The JSON response of the first instance that answers.

    Raises:
        urllib.error.URLError: The last error, if every attempt failed.
    """
    last_error: urllib.error.URLError | None = None
    for url in endpoints:
        for attempt in range(ATTEMPTS_PER_ENDPOINT):
            try:
                return fetch_overpass(query, url=url)
            except urllib.error.URLError as error:
                last_error = error
                sleep(RETRY_BASE_DELAY_S * 2**attempt)
    assert last_error is not None  # noqa: S101 - endpoints is never empty here
    raise last_error
