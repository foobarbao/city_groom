from unittest import mock

import pytest
from django.db import OperationalError
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_health_returns_ok_when_database_is_reachable() -> None:
    response = APIClient().get(reverse("health"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_returns_503_when_database_is_unreachable() -> None:
    with mock.patch(
        "apps.core.views.connection.ensure_connection",
        side_effect=OperationalError("connection refused"),
    ):
        response = APIClient().get(reverse("health"))

    assert response.status_code == 503
    assert response.json() == {"status": "unavailable"}


@pytest.mark.django_db
def test_openapi_schema_is_generated() -> None:
    response = APIClient().get(reverse("schema"))

    assert response.status_code == 200
    assert b"City Groom API" in response.content
