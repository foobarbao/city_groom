from typing import Any
from unittest import mock

import pytest
from django.urls import reverse
from pytest_django.fixtures import Settings
from rest_framework.test import APIClient

from apps.accounts.models import GoogleAccount, User

CLIENT_ID = "web-client.apps.googleusercontent.com"


def claims(**overrides: Any) -> dict[str, Any]:
    return {
        "iss": "https://accounts.google.com",
        "aud": CLIENT_ID,
        "sub": "1234567890",
        "email": "Camille.Martin@example.com",
        "email_verified": True,
        "given_name": "Camille",
        "family_name": "Martin",
        "picture": "https://lh3.googleusercontent.com/a/photo",
        **overrides,
    }


@pytest.fixture(autouse=True)
def _client_id(settings: Settings) -> None:
    settings.GOOGLE_OAUTH_CLIENT_IDS = [CLIENT_ID]


def post(credential: str = "token", **claim_overrides: Any) -> Any:
    with mock.patch(
        "apps.accounts.google.id_token.verify_oauth2_token",
        return_value=claims(**claim_overrides),
    ) as verify:
        response = APIClient().post(reverse("auth-google"), {"credential": credential})
    return response, verify


@pytest.mark.django_db
def test_first_sign_in_creates_a_customer_account_from_the_basic_profile() -> None:
    response, verify = post()

    assert response.status_code == 200
    body = response.json()
    assert body["created"] is True
    assert body["user"]["email"] == "camille.martin@example.com"
    assert body["user"]["first_name"] == "Camille"
    assert body["user"]["signed_in_with_google"] is True
    # The token is checked against our client IDs (audience).
    assert verify.call_args.kwargs["audience"] == [CLIENT_ID]
    user = User.objects.get()
    assert not user.is_staff
    assert not user.has_usable_password()
    assert user.google_account.sub == "1234567890"
    assert user.last_login is not None


@pytest.mark.django_db
def test_next_sign_in_finds_the_account_by_google_id_and_refreshes_the_profile() -> None:
    post()
    response, _ = post(email="new@example.com", given_name="Cam")

    assert response.json()["created"] is False
    assert User.objects.count() == 1
    assert User.objects.get().first_name == "Cam"
    assert GoogleAccount.objects.get().email == "new@example.com"


@pytest.mark.django_db
def test_token_gives_access_to_the_profile_and_sign_out_revokes_it() -> None:
    token = post()[0].json()["token"]
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    assert client.get(reverse("auth-me")).json()["last_name"] == "Martin"
    assert client.post(reverse("auth-sign-out")).status_code == 204
    assert client.get(reverse("auth-me")).status_code == 401


@pytest.mark.django_db
def test_invalid_token_is_refused() -> None:
    with mock.patch(
        "apps.accounts.google.id_token.verify_oauth2_token",
        side_effect=ValueError("Token has wrong audience"),
    ):
        response = APIClient().post(reverse("auth-google"), {"credential": "forged"})

    assert response.status_code == 400
    assert User.objects.count() == 0


@pytest.mark.django_db
def test_google_unreachable_gives_503() -> None:
    from google.auth.exceptions import TransportError

    with mock.patch(
        "apps.accounts.google.id_token.verify_oauth2_token",
        side_effect=TransportError("no route to host"),  # type: ignore[no-untyped-call]
    ):
        response = APIClient().post(reverse("auth-google"), {"credential": "token"})

    assert response.status_code == 503


@pytest.mark.django_db
def test_unverified_email_is_refused() -> None:
    response, _ = post(email_verified=False)

    assert response.status_code == 400


@pytest.mark.django_db
def test_google_never_takes_over_a_team_or_password_account() -> None:
    User.objects.create_user("admin", "camille.martin@example.com", "a-strong-password")

    response, _ = post()

    assert response.status_code == 400
    assert not GoogleAccount.objects.exists()


@pytest.mark.django_db
def test_deactivated_account_cannot_sign_in() -> None:
    post()
    User.objects.update(is_active=False)

    response, _ = post()

    assert response.status_code == 400


@pytest.mark.django_db
def test_sign_in_is_disabled_without_client_id(settings: Settings) -> None:
    settings.GOOGLE_OAUTH_CLIENT_IDS = []

    response, verify = post()

    assert response.status_code == 400
    verify.assert_not_called()


def post_with(data: dict[str, Any]) -> Any:
    with mock.patch("apps.accounts.google.id_token.verify_oauth2_token", return_value=claims()):
        return APIClient().post(reverse("auth-google"), data, format="json")


@pytest.mark.django_db
def test_announcements_are_off_unless_the_box_was_ticked() -> None:
    body = post_with({"credential": "token"}).json()

    assert body["user"]["announcements"] is False
    user = User.objects.get()
    assert user.announcements is False


@pytest.mark.django_db
def test_ticked_box_records_the_agreement_and_its_date() -> None:
    body = post_with({"credential": "token", "announcements": True}).json()

    assert body["user"]["announcements"] is True
    assert User.objects.get().announcements_changed_at is not None


@pytest.mark.django_db
def test_signing_in_without_the_box_keeps_an_earlier_agreement() -> None:
    post_with({"credential": "token", "announcements": True})
    post_with({"credential": "token", "announcements": False})

    assert User.objects.get().announcements is True


@pytest.mark.django_db
def test_user_can_withdraw_and_give_the_agreement_from_the_account() -> None:
    token = post_with({"credential": "token", "announcements": True}).json()["token"]
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    response = client.patch(reverse("auth-me"), {"announcements": False}, format="json")

    assert response.status_code == 200
    assert response.json()["announcements"] is False
    assert User.objects.get().announcements is False
    assert client.patch(reverse("auth-me"), {}, format="json").status_code == 400
