"""Accounts of the people using CityPal (ADR-0010).

- ``User``: one account per person, customer or CityPal team member. A
  project-specific user model from the start, as Django recommends: changing
  it once data exists is a heavy migration.
- ``GoogleAccount``: the Google identity linked to a user who signs in with
  Google. Only the basic profile is kept (choice of the project owner on
  2026-10-25, GDPR data minimisation).
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """A person with a CityPal account.

    Customers have no password when they sign in with Google; team members
    (``is_staff``) sign in to the administration with a password.
    """

    email = models.EmailField("adresse e-mail", unique=True)
    picture_url = models.URLField("photo de profil", max_length=500, blank=True)

    class Meta:
        verbose_name = "compte"
        verbose_name_plural = "comptes"

    def __str__(self) -> str:
        """Full name if known, else e-mail, else user name."""
        return self.get_full_name() or self.email or self.username


class GoogleAccount(models.Model):
    """Google identity of a user (basic profile only).

    ``sub`` is the identifier Google guarantees stable for a person; the
    e-mail address can change and is never used to find the account.
    """

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="google_account", verbose_name="compte"
    )
    sub = models.CharField("identifiant Google", max_length=255, unique=True)
    email = models.EmailField("e-mail Google")
    email_verified = models.BooleanField("e-mail vérifié par Google", default=False)
    linked_at = models.DateTimeField("lié le", auto_now_add=True)
    last_sign_in_at = models.DateTimeField("dernière connexion Google", null=True, blank=True)

    class Meta:
        verbose_name = "compte Google"
        verbose_name_plural = "comptes Google"

    def __str__(self) -> str:
        """The Google e-mail address."""
        return self.email
