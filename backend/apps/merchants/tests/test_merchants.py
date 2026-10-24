from typing import Any

import pytest
from django.core.management import call_command
from rest_framework.test import APIClient

from apps.merchants.categories import ServiceCategory
from apps.merchants.models import Merchant
from apps.merchants.osm import build_query, parse_merchants
from apps.merchants.services import import_candidates


def fake_payload() -> dict[str, Any]:
    """Overpass-like response with fake businesses (test data, not real places)."""
    return {
        "elements": [
            {
                "type": "node",
                "id": 1,
                "lat": 45.19,
                "lon": 5.72,
                "tags": {
                    "shop": "dry_cleaning",
                    "name": "Fake Pressing",
                    "addr:housenumber": "3",
                    "addr:street": "Rue Fictive",
                    "addr:postcode": "38000",
                    "addr:city": "Grenoble",
                    "opening_hours": "Mo-Fr 09:00-19:00",
                },
            },
            {
                "type": "way",
                "id": 2,
                "center": {"lat": 45.18, "lon": 5.73},
                "tags": {"craft": "shoemaker", "name": "Fake Cordonnerie"},
            },
            # Chain store: excluded
            {
                "type": "node",
                "id": 3,
                "lat": 45.2,
                "lon": 5.7,
                "tags": {"shop": "dry_cleaning", "name": "Fake Chain", "brand": "Fake Chain"},
            },
            # Unnamed: excluded
            {"type": "node", "id": 4, "lat": 45.2, "lon": 5.7, "tags": {"shop": "laundry"}},
            # Not a service category: excluded
            {
                "type": "node",
                "id": 5,
                "lat": 45.2,
                "lon": 5.7,
                "tags": {"shop": "bakery", "name": "x"},
            },
        ]
    }


def test_build_query_covers_every_category_tag() -> None:
    query = build_query()

    assert '"shop"="dry_cleaning"' in query
    assert '"craft"="shoemaker"' in query
    assert "out center tags" in query


def test_parse_merchants_applies_selection_rules() -> None:
    candidates = parse_merchants(fake_payload())

    assert [c.name for c in candidates] == ["Fake Cordonnerie", "Fake Pressing"]
    pressing = candidates[1]
    assert pressing.category == ServiceCategory.DRY_CLEANING
    assert pressing.address == "3 Rue Fictive, 38000 Grenoble"
    assert candidates[0].latitude == 45.18  # way centre


@pytest.mark.django_db
def test_import_is_idempotent_and_keeps_partner_flag() -> None:
    assert import_candidates(parse_merchants(fake_payload())) == (2, 0)
    Merchant.objects.filter(name="Fake Pressing").update(is_partner=True)

    assert import_candidates(parse_merchants(fake_payload())) == (0, 2)
    assert Merchant.objects.get(name="Fake Pressing").is_partner


@pytest.mark.django_db
def test_command_imports_from_saved_response(tmp_path: Any) -> None:
    path = tmp_path / "merchants.json"
    path.write_text(__import__("json").dumps(fake_payload()))

    call_command("import_osm_merchants", "--from-file", str(path))

    assert Merchant.objects.count() == 2


@pytest.mark.django_db
def test_public_api_lists_and_filters_merchants() -> None:
    import_candidates(parse_merchants(fake_payload()))
    client = APIClient()

    data = client.get("/api/v1/merchants/").json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 2
    assert data["features"][0]["properties"]["is_partner"] is False

    shoes = client.get("/api/v1/merchants/", {"category": "shoe_repair"}).json()
    assert [f["properties"]["name"] for f in shoes["features"]] == ["Fake Cordonnerie"]
