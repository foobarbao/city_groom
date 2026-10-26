import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import OfferInterest, User


@pytest.fixture
def client() -> APIClient:
    user = User.objects.create(username="camille", email="camille@example.com")
    api = APIClient()
    api.force_authenticate(user)
    return api


@pytest.mark.django_db
def test_registering_interest_is_recorded_once_and_listed_in_the_profile(
    client: APIClient,
) -> None:
    url = reverse("auth-me-interests")

    first = client.post(url, {"offer": "scooter_lockers"})
    second = client.post(url, {"offer": "scooter_lockers"})

    assert first.status_code == second.status_code == 200
    assert second.json()["interests"] == ["scooter_lockers"]
    assert OfferInterest.objects.count() == 1


@pytest.mark.django_db
def test_unknown_offer_is_refused(client: APIClient) -> None:
    response = client.post(reverse("auth-me-interests"), {"offer": "jetpack_lockers"})

    assert response.status_code == 400
    assert not OfferInterest.objects.exists()


@pytest.mark.django_db
def test_withdrawing_interest_deletes_it_and_is_idempotent(client: APIClient) -> None:
    client.post(reverse("auth-me-interests"), {"offer": "scooter_lockers"})
    url = reverse("auth-me-interest", args=["scooter_lockers"])

    first = client.delete(url)
    second = client.delete(url)

    assert first.status_code == second.status_code == 200
    assert first.json()["interests"] == []
    assert not OfferInterest.objects.exists()


@pytest.mark.django_db
def test_withdrawing_an_unknown_offer_is_not_found(client: APIClient) -> None:
    response = client.delete(reverse("auth-me-interest", args=["jetpack_lockers"]))

    assert response.status_code == 404


@pytest.mark.django_db
def test_interest_requires_a_signed_in_customer() -> None:
    response = APIClient().post(reverse("auth-me-interests"), {"offer": "scooter_lockers"})

    assert response.status_code == 401
    assert not OfferInterest.objects.exists()
