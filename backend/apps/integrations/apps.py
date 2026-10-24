"""Integrations application: API keys for third-party tools (ADR-0007)."""

from django.apps import AppConfig


class IntegrationsConfig(AppConfig):
    """Configuration of the integrations application."""

    name = "apps.integrations"
    verbose_name = "Intégrations"
