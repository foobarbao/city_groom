"""Root URL configuration.

- ``/admin/``: administration interface for City Groom operators (ADR-0003).
- ``/api/``: REST API; the OpenAPI schema and its browsable documentation are
  published under ``/api/schema/``.
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.core.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="api-docs"),
]
