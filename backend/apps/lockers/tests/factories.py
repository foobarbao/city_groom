"""Test helpers. All places and coordinates here are fake test data."""

from typing import Any

from apps.lockers.simulation import SimulatedSite

# Fake sites roughly around Grenoble, for tests only (not real places).
FAKE_SITES = [
    SimulatedSite("Fake Centre", 5.7245, 45.1885, "test"),
    SimulatedSite("Fake North", 5.7245, 45.2100, "test"),
    SimulatedSite("Fake South", 5.7245, 45.1600, "test"),
    SimulatedSite("Fake East", 5.7700, 45.1885, "test"),
    SimulatedSite("Fake Centre Bis", 5.7250, 45.1890, "test"),
]


def fake_overpass_payload() -> dict[str, Any]:
    """Return an Overpass-like response with fake tram stop nodes."""
    return {
        "elements": [
            {"type": "node", "id": 1, "lat": 45.10, "lon": 5.70, "tags": {"name": "Fake Stop"}},
            {"type": "node", "id": 2, "lat": 45.12, "lon": 5.72, "tags": {"name": "Fake Stop"}},
            {"type": "node", "id": 3, "lat": 45.20, "lon": 5.80, "tags": {"name": "Other Stop"}},
            {"type": "node", "id": 4, "lat": 45.30, "lon": 5.90, "tags": {}},
        ]
    }
