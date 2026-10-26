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


@pytest.mark.django_db
def test_export_lists_only_active_accounts_that_agreed() -> None:
    admin = User.objects.create_superuser("ops", "ops@citypal.example", "a-strong-password")
    agreed = User.objects.create_user("a@example.com", "a@example.com", first_name="Ana")
    agreed.set_announcements(True)
    agreed.save()
    User.objects.create_user("b@example.com", "b@example.com")
    gone = User.objects.create_user("c@example.com", "c@example.com", is_active=False)
    gone.set_announcements(True)
    gone.save()
    client = Client()
    client.force_login(admin)

    response = client.post(
        reverse("admin:accounts_user_changelist"),
        {
            "action": "export_announcement_emails",
            "_selected_action": [u.pk for u in User.objects.all()],
        },
    )

    assert response.status_code == 200
    assert response["Content-Type"].startswith("text/csv")
    lines = response.content.decode().splitlines()
    assert lines[0] == "email,prenom,nom,accord_le"
    assert [line.split(",")[0] for line in lines[1:]] == ["a@example.com"]
