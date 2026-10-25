"""URL routes of the core application, mounted under ``/api/v1/``."""

from django.urls import path

from apps.core.views import HealthView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
]
