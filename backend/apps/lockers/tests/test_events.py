import random
from typing import Any

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.lockers.drivers.base import LockerDriverError, get_driver
from apps.lockers.drivers.simulated import (
    MAX_DOOR_OPEN_SECONDS,
    MIN_DOOR_OPEN_SECONDS,
    SimulatedLockerDriver,
)
from apps.lockers.models import AccessMethod, Compartment, Locker, LockerEvent
from apps.lockers.simulation import create_simulated_locker
from apps.lockers.tests.factories import FAKE_SITES

EVENTS_URL = "/api/v1/operator/locker-events/"


@pytest.fixture
def locker(db: Any) -> Locker:
    return create_simulated_locker(
        FAKE_SITES[0], code="fake-centre", model="compact", access_methods=[AccessMethod.QR_CODE]
    )


@pytest.fixture
def staff_client(db: Any) -> APIClient:
    client = APIClient()
    client.force_authenticate(
        User.objects.create_user("operator", "operator@citypal.example", is_staff=True)
    )
    return client


def test_opening_a_door_records_opened_then_closed_events(locker: Locker) -> None:
    compartment = locker.compartments.first()
    assert compartment is not None

    get_driver(locker).open_compartment(compartment, AccessMethod.QR_CODE)

    closed, opened = LockerEvent.objects.filter(compartment=compartment)  # newest first
    assert opened.kind == LockerEvent.Kind.DOOR_OPENED
    assert opened.access_method == AccessMethod.QR_CODE
    assert closed.kind == LockerEvent.Kind.DOOR_CLOSED
    open_seconds = (closed.occurred_at - opened.occurred_at).total_seconds()
    assert MIN_DOOR_OPEN_SECONDS <= open_seconds <= MAX_DOOR_OPEN_SECONDS
    locker.refresh_from_db()
    assert locker.last_seen_at == opened.occurred_at


def test_driver_refuses_unsupported_access_method(locker: Locker) -> None:
    compartment = locker.compartments.first()
    assert compartment is not None

    with pytest.raises(LockerDriverError, match="not offered"):
        get_driver(locker).open_compartment(compartment, AccessMethod.BLUETOOTH)


def test_driver_refuses_out_of_service_compartment(locker: Locker) -> None:
    compartment = locker.compartments.first()
    assert compartment is not None
    compartment.status = Compartment.Status.OUT_OF_SERVICE

    with pytest.raises(LockerDriverError, match="out of service"):
        SimulatedLockerDriver(locker).open_compartment(compartment, AccessMethod.QR_CODE)


def test_no_driver_for_real_lockers_yet(locker: Locker) -> None:
    locker.is_simulated = False

    with pytest.raises(LockerDriverError, match="No driver"):
        get_driver(locker)


def test_events_feed_filters_and_paginates(locker: Locker, staff_client: APIClient) -> None:
    driver = SimulatedLockerDriver(locker, rng=random.Random(1))
    for compartment in locker.compartments.all()[:3]:
        driver.open_compartment(compartment, AccessMethod.QR_CODE)

    response = staff_client.get(EVENTS_URL, {"kind": "door_opened", "page_size": "2"})

    data = response.json()
    assert response.status_code == 200
    assert len(data["results"]) == 2
    assert data["next"] is not None
    assert {e["kind"] for e in data["results"]} == {"door_opened"}
    assert data["results"][0]["locker"] == "fake-centre"


def test_events_feed_since_and_validation(locker: Locker, staff_client: APIClient) -> None:
    assert staff_client.get(EVENTS_URL, {"since": "not-a-date"}).status_code == 400
    response = staff_client.get(EVENTS_URL, {"since": "2999-01-01T00:00:00Z"})
    assert response.json()["results"] == []


def test_events_feed_requires_operator_access(locker: Locker) -> None:
    assert APIClient().get(EVENTS_URL).status_code in (401, 403)
