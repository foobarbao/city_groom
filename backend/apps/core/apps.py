"""Core application: cross-cutting, non-business features (health check)."""

from django.apps import AppConfig


class CoreConfig(AppConfig):
    """Configuration of the core application."""

    name = "apps.core"
    verbose_name = "Socle technique"
