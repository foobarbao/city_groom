"""API views for merchants.

Public endpoint: merchants are real businesses shown with public data only
(OpenStreetMap), with ``is_partner`` telling whether a partnership exists.
"""

from django.db.models import QuerySet
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny

from apps.lockers.views import NEAR_PARAMETERS, filter_near
from apps.merchants.categories import ServiceCategory
from apps.merchants.models import Merchant
from apps.merchants.serializers import MerchantFeatureSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List merchants",
        description=(
            "Local businesses offering services on items that fit in a locker, as a "
            "GeoJSON FeatureCollection. Public data from OpenStreetMap (© OpenStreetMap "
            "contributors, ODbL); `is_partner` is false until a partnership is signed. "
            "Optionally filtered by category and around a point."
        ),
        parameters=[
            OpenApiParameter(
                "category",
                OpenApiTypes.STR,
                enum=ServiceCategory.values,
                description="Catégorie de service.",
            ),
            *NEAR_PARAMETERS,
        ],
        tags=["merchants"],
        auth=[],
    ),
)
class MerchantViewSet(mixins.ListModelMixin, viewsets.GenericViewSet[Merchant]):
    """Merchants shown on the customer map and list."""

    permission_classes = [AllowAny]
    serializer_class = MerchantFeatureSerializer

    def get_queryset(self) -> QuerySet[Merchant]:
        """Return merchants, filtered by category and distance when asked."""
        queryset = Merchant.objects.all()
        if category := self.request.query_params.get("category"):
            queryset = queryset.filter(category=category)
        return filter_near(queryset, self.request)
