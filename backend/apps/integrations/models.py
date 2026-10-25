"""API keys issued to third-party tools integrating with City Groom.

Keys are generated once and only their hash is stored (handled by
djangorestframework-api-key): the full key is shown a single time, at creation,
in the admin. Each key carries scopes limiting what it can access.
"""

from django.contrib.postgres.fields import ArrayField
from django.db import models
from rest_framework_api_key.models import AbstractAPIKey

from apps.integrations.scopes import Scope


class IntegrationAPIKey(AbstractAPIKey):
    """An API key for one integration (tool, partner, script)."""

    scopes = ArrayField(
        models.CharField(max_length=40, choices=Scope.choices),
        verbose_name="droits",
        default=list,
        help_text="Droits accordés à cette clé (voir docs/api/README.md).",
    )
    contact = models.CharField(
        "contact",
        max_length=255,
        blank=True,
        help_text=(
            "Personne ou équipe responsable de l'intégration, pour la prévenir en cas de souci."
        ),
    )

    class Meta(AbstractAPIKey.Meta):
        verbose_name = "clé d'API d'intégration"
        verbose_name_plural = "clés d'API d'intégration"

    def has_scope(self, scope: str) -> bool:
        """Return whether the key was granted ``scope``."""
        return scope in self.scopes
