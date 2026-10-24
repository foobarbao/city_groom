import random
from typing import Any

import pytest
from django.contrib.auth.models import User
from django.core.management import call_command
from rest_framework.test import APIClient

from apps.lockers.models import Compartment, Locker
from apps.lockers.simulation import create_simulated_locker, simulate_occupancy
from apps.lockers.tests.factories import FAKE_SITES, fake_overpass_payload


@pytest.fixture
def lockers(db: Any) -> list[Locker]:
    created = [
        create_simulated_locker(site, code=f"fake-{i}", model="compact")
        for i, site in enumerate(FAKE_SITES[:3])
    ]
    for locker in created:
        simulate_occupancy(locker, random.Random(3))
    return created


@pytest.fixture
def staff_client(db: Any) -> APIClient:
    client = APIClient()
    client.force_authenticate(User.objects.create_user("operator", is_staff=True))
    return client


def test_public_list_is_geojson_without_compartment_status(lockers: list[Locker]) -> None:
    response = APIClient().get("/api/lockers/")

    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 3
    properties = data["features"][0]["properties"]
    assert set(properties["free_by_size"]) == {"S", "M", "L", "XL"}
    assert "fill_rate" not in properties


def test_public_list_hides_lockers_not_in_service(lockers: list[Locker]) -> None:
    Locker.objects.filter(pk=lockers[0].pk).update(status=Locker.Status.MAINTENANCE)

    response = APIClient().get("/api/lockers/")

    assert len(response.json()["features"]) == 2


def test_public_list_filters_by_distance_nearest_first(lockers: list[Locker]) -> None:
    # Fake North is ~2.4 km and Fake South ~3.2 km from the centre.
    response = APIClient().get("/api/lockers/?lng=5.7245&lat=45.1885&radius_km=3")

    names = [f["properties"]["name"] for f in response.json()["features"]]
    assert names == ["Fake Centre", "Fake North"]


def test_public_list_rejects_invalid_coordinates(lockers: list[Locker]) -> None:
    response = APIClient().get("/api/lockers/?lng=abc&lat=45")

    assert response.status_code == 400


def test_public_detail_gives_layout_without_status(lockers: list[Locker]) -> None:
    response = APIClient().get("/api/lockers/fake-0/")

    assert response.status_code == 200
    data = response.json()
    assert data["column_grid_units"] == 20
    assert len(data["compartments"]) == lockers[0].compartments.count()
    assert "status" not in data["compartments"][0]


def test_size_catalogue_is_public(db: Any) -> None:
    response = APIClient().get("/api/lockers/sizes/")

    assert response.status_code == 200
    assert [s["code"] for s in response.json()] == ["S", "M", "L", "XL"]


def test_operator_endpoints_require_staff(lockers: list[Locker]) -> None:
    client = APIClient()
    assert client.get("/api/operator/lockers/").status_code in (401, 403)
    assert client.get("/api/operator/lockers/stats/").status_code in (401, 403)


def test_operator_detail_includes_compartment_status(
    lockers: list[Locker], staff_client: APIClient
) -> None:
    response = staff_client.get("/api/operator/lockers/fake-0/")

    assert response.status_code == 200
    assert "status" in response.json()["compartments"][0]
    assert 0 <= response.json()["fill_rate"] <= 1


def test_operator_stats_aggregate_the_network(
    lockers: list[Locker], staff_client: APIClient
) -> None:
    response = staff_client.get("/api/operator/lockers/stats/")

    data = response.json()
    assert data["lockers"] == 3
    assert data["compartments"] == Compartment.objects.count()
    assert sum(data["capacity_by_size"].values()) == data["compartments"]


@pytest.mark.django_db
def test_seed_command_creates_spread_lockers_from_a_saved_response(tmp_path: Any) -> None:
    sites_file = tmp_path / "stops.json"
    sites_file.write_text(__import__("json").dumps(fake_overpass_payload()))

    call_command("seed_simulated_lockers", "--sites-file", str(sites_file), "--count", "5")

    assert Locker.objects.filter(is_simulated=True).count() == 2
    assert Locker.objects.get(code="fake-stop").placement_source.startswith("OpenStreetMap")
