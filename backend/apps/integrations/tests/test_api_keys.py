from datetime import timedelta
from typing import Any

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.integrations.models import IntegrationAPIKey
from apps.integrations.scopes import Scope

STATS_URL = "/api/v1/operator/lockers/stats/"


def client_with_key(key: str) -> APIClient:
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Api-Key {key}")
    return client


def create_key(**kwargs: Any) -> str:
    _, key = IntegrationAPIKey.objects.create_key(name="test", **kwargs)
    return key


@pytest.mark.django_db
def test_key_with_scope_can_read_operations() -> None:
    key = create_key(scopes=[Scope.OPERATIONS_READ])

    assert client_with_key(key).get(STATS_URL).status_code == 200


@pytest.mark.django_db
def test_key_without_scope_is_refused() -> None:
    key = create_key(scopes=[])

    assert client_with_key(key).get(STATS_URL).status_code in (401, 403)


@pytest.mark.django_db
def test_revoked_key_is_refused() -> None:
    key = create_key(scopes=[Scope.OPERATIONS_READ], revoked=True)

    assert client_with_key(key).get(STATS_URL).status_code in (401, 403)


@pytest.mark.django_db
def test_expired_key_is_refused() -> None:
    key = create_key(
        scopes=[Scope.OPERATIONS_READ], expiry_date=timezone.now() - timedelta(minutes=1)
    )

    assert client_with_key(key).get(STATS_URL).status_code in (401, 403)


@pytest.mark.django_db
def test_forged_key_is_refused() -> None:
    key = create_key(scopes=[Scope.OPERATIONS_READ])
    prefix, _, _ = key.partition(".")

    assert client_with_key(f"{prefix}.forged").get(STATS_URL).status_code in (401, 403)


@pytest.mark.django_db
def test_only_the_hash_is_stored() -> None:
    key = create_key(scopes=[Scope.OPERATIONS_READ])

    stored = IntegrationAPIKey.objects.get()
    assert key not in stored.hashed_key
    assert key.startswith(stored.prefix)


@pytest.mark.django_db
def test_public_endpoints_need_no_key() -> None:
    assert APIClient().get("/api/v1/lockers/").status_code == 200
