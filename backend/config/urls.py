"""Root URL configuration.

- ``/admin/``: administration interface for City Groom operators (ADR-0003).
- ``/api/v1/``: REST API, version 1 (ADR-0007). The OpenAPI schema is at
  ``/api/v1/schema/``, with interactive documentation at ``/api/v1/docs/``
  (Swagger UI) and ``/api/v1/redoc/`` (ReDoc).
"""

from django.contrib import admin
from django.urls import URLPattern, URLResolver, include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

api_v1: list[URLPattern | URLResolver] = [
    path("", include("apps.core.urls")),
    path("", include("apps.lockers.urls")),
    path("", include("apps.merchants.urls")),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="api-docs"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="api-redoc"),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1)),
]
