"""API views for lockers.

Public endpoints serve the customer app, guests included (docs/PRODUCT.md,
"Customer accounts"); they expose no per-compartment status. Operator endpoints
add occupancy details and network statistics for dashboards.
"""

from collections import Counter

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Prefetch, QuerySet
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer

from apps.lockers.models import Compartment, Locker
from apps.lockers.serializers import (
    LockerFeatureSerializer,
    LockerLayoutSerializer,
    NetworkStatsSerializer,
    OperatorLockerFeatureSerializer,
    OperatorLockerLayoutSerializer,
    SizeSpecSerializer,
    size_catalogue,
)
from apps.lockers.services import compute_occupancy
from apps.lockers.sizes import CompartmentSize

MAX_RADIUS_KM = 20.0

NEAR_PARAMETERS = [
    OpenApiParameter("lng", OpenApiTypes.DOUBLE, description="Longitude du point de recherche."),
    OpenApiParameter("lat", OpenApiTypes.DOUBLE, description="Latitude du point de recherche."),
    OpenApiParameter(
        "radius_km",
        OpenApiTypes.DOUBLE,
        description=f"Rayon de recherche en km (défaut 2, max {MAX_RADIUS_KM:g}).",
    ),
]


def _lockers_with_compartments() -> QuerySet[Locker]:
    """Return lockers with their compartments prefetched in layout order."""
    return Locker.objects.prefetch_related(
        Prefetch("compartments", queryset=Compartment.objects.order_by("column", "position"))
    )


def _filter_near(queryset: QuerySet[Locker], request: Request) -> QuerySet[Locker]:
    """Keep lockers within ``radius_km`` of ``lng``/``lat`` if given, nearest first.

    Raises:
        ValidationError: If coordinates or radius are not valid numbers.
    """
    lng, lat = request.query_params.get("lng"), request.query_params.get("lat")
    if lng is None and lat is None:
        return queryset
    try:
        point = Point(float(lng or ""), float(lat or ""), srid=4326)
        radius_km = min(float(request.query_params.get("radius_km", 2)), MAX_RADIUS_KM)
    except ValueError as error:
        raise ValidationError("lng, lat et radius_km doivent être des nombres.") from error
    # On geographic (WGS 84) fields, PostGIS computes these distances in metres
    # on the sphere, which is accurate enough at city scale.
    return (
        queryset.filter(location__distance_lte=(point, D(km=radius_km)))
        .annotate(distance=Distance("location", point))
        .order_by("distance")
    )


class LockerViewSet(viewsets.ReadOnlyModelViewSet[Locker]):
    """Lockers visible to customers: map features and locker fronts."""

    permission_classes = [AllowAny]
    lookup_field = "code"

    def get_queryset(self) -> QuerySet[Locker]:
        """Return in-service lockers, optionally filtered by distance."""
        queryset = _lockers_with_compartments().filter(status=Locker.Status.ACTIVE)
        return _filter_near(queryset, self.request)

    def get_serializer_class(self) -> type[BaseSerializer[Locker]]:
        """Use GeoJSON features for the list and the full layout for one locker."""
        return LockerLayoutSerializer if self.action == "retrieve" else LockerFeatureSerializer

    @extend_schema(parameters=NEAR_PARAMETERS)
    def list(self, request: Request, *args: object, **kwargs: object) -> Response:
        """List lockers as a GeoJSON FeatureCollection."""
        return super().list(request, *args, **kwargs)

    @extend_schema(responses=SizeSpecSerializer(many=True))
    @action(detail=False, pagination_class=None)
    def sizes(self, request: Request) -> Response:
        """Return the compartment size catalogue (dimensions, examples of items)."""
        return Response(SizeSpecSerializer(size_catalogue(), many=True).data)


class OperatorLockerViewSet(viewsets.ReadOnlyModelViewSet[Locker]):
    """Lockers for operators: occupancy of every compartment and network statistics."""

    # PROD: replace staff status by the operator role once user roles exist
    # (ADR-0005).
    permission_classes = [IsAdminUser]
    lookup_field = "code"

    def get_queryset(self) -> QuerySet[Locker]:
        """Return all lockers, whatever their status, optionally filtered by distance."""
        return _filter_near(_lockers_with_compartments(), self.request)

    def get_serializer_class(self) -> type[BaseSerializer[Locker]]:
        """Use GeoJSON features for the list and the detailed layout for one locker."""
        if self.action == "retrieve":
            return OperatorLockerLayoutSerializer
        return OperatorLockerFeatureSerializer

    @extend_schema(parameters=NEAR_PARAMETERS)
    def list(self, request: Request, *args: object, **kwargs: object) -> Response:
        """List lockers as a GeoJSON FeatureCollection with fill rates."""
        return super().list(request, *args, **kwargs)

    @extend_schema(responses=NetworkStatsSerializer)
    @action(detail=False, pagination_class=None)
    def stats(self, request: Request) -> Response:
        """Return occupancy statistics for the whole locker network."""
        pairs = list(Compartment.objects.values_list("size", "status"))
        occupancy = compute_occupancy(pairs)
        capacity = Counter(size for size, _ in pairs)
        data = {
            "lockers": Locker.objects.count(),
            "compartments": occupancy.total,
            "in_service": occupancy.in_service,
            "in_use": occupancy.in_use,
            "fill_rate": round(occupancy.fill_rate, 3),
            "free_by_size": occupancy.free_by_size,
            "capacity_by_size": {size.value: capacity[size.value] for size in CompartmentSize},
        }
        return Response(NetworkStatsSerializer(data).data)
