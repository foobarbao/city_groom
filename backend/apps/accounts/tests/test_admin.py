import pytest
from django.test import Client
from django.urls import reverse

from apps.accounts.models import GoogleAccount, User


@pytest.mark.django_db
def test_accounts_list_shows_summary_and_sign_in_method() -> None:
    admin = User.objects.create_superuser("ops", "ops@citypal.example", "a-strong-password")
    customer = User.objects.create_user("c@example.com", "c@example.com", first_name="Camille")
    GoogleAccount.objects.create(user=customer, sub="1", email="c@example.com")
    client = Client()
    client.force_login(admin)

    response = client.get(reverse("admin:accounts_user_changelist"))

    assert response.status_code == 200
    page = response.content.decode()
    assert "Inscrits ces 7 derniers jours" in page
    assert "Google" in page
    assert "Camille" in page
    filtered = client.get(reverse("admin:accounts_user_changelist"), {"type": "customer"})
    assert "ops@citypal.example" not in filtered.content.decode()


@pytest.mark.django_db
def test_account_page_opens() -> None:
    admin = User.objects.create_superuser("ops", "ops@citypal.example", "a-strong-password")
    client = Client()
    client.force_login(admin)

    response = client.get(reverse("admin:accounts_user_change", args=[admin.pk]))

    assert response.status_code == 200
