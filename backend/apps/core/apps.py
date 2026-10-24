"""Core application: cross-cutting, non-business features (health check)."""

from django.apps import AppConfig


class CoreConfig(AppConfig):
    """Configuration of the core application."""

    name = "apps.core"
    verbose_name = "Socle technique"

    def ready(self) -> None:
        """Make DRF generic classes subscriptable at runtime for strict typing.

        Done here rather than in settings because DRF reads Django settings on
        import. API modules are imported after all apps are ready.
        """
        import django_stubs_ext
        from rest_framework import generics, serializers, viewsets

        django_stubs_ext.monkeypatch(
            extra_classes=[
                generics.GenericAPIView,
                serializers.BaseSerializer,
                viewsets.GenericViewSet,
                viewsets.ReadOnlyModelViewSet,
                viewsets.ModelViewSet,
            ]
        )
