"""Permission scopes granted to integration API keys.

A scope is a coarse capability. Each protected API view declares the scope it
requires; a key without that scope is refused. Public endpoints need no scope.
Keep this list short and documented in docs/api/README.md.
"""

from django.db import models


class Scope(models.TextChoices):
    """Capabilities an integration API key can be granted."""

    OPERATIONS_READ = (
        "operations:read",
        ("Lecture des données d'exploitation (occupation, statistiques, événements)"),
    )
