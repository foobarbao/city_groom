"""API views for lockers.

Public endpoints serve the customer app, guests included (docs/PRODUCT.md,
"Customer accounts"), and integrations; they expose no per-compartment status.
Operator endpoints add occupancy details, network statistics and locker
events; they are open to staff users and to integration API keys holding the
``operations:read`` scope (ADR-0007, docs/api/README.md).
"""

from collections import Counter

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Prefetch, QuerySet
from django.utils.dateparse import parse_datetime
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import CursorPagination
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer

from apps.integrations.permissions import HasScopedAPIKey
from apps.integrations.scopes import Scope
from apps.lockers.models import Compartment, Locker, LockerEvent
from apps.lockers.serializers import (
    LockerEventSerializer,
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


@extend_schema_view(
    retrieve=extend_schema(
        summary="Locker front",
        description=(
            "Layout of one in-service locker: columns, doors with their size and "
            "label, control panel position, and free compartments per size. "
            "Doors are listed without status."
        ),
        tags=["lockers"],
        auth=[],
    ),
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

    @extend_schema(
        summary="List lockers",
        description=(
            "In-service lockers as a GeoJSON FeatureCollection (coordinates in "
            "WGS 84, longitude first), with the number of free compartments per "
            "size. Optionally filtered around a point, nearest first."
        ),
        parameters=NEAR_PARAMETERS,
        tags=["lockers"],
        auth=[],
    )
    def list(self, request: Request, *args: object, **kwargs: object) -> Response:
        """List lockers as a GeoJSON FeatureCollection."""
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Compartment sizes",
        description="Size catalogue: dimensions in cm, layout height, examples of items.",
        responses=SizeSpecSerializer(many=True),
        tags=["lockers"],
        auth=[],
    )
    @action(detail=False, pagination_class=None)
    def sizes(self, request: Request) -> Response:
        """Return the compartment size catalogue (dimensions, examples of items)."""
        return Response(SizeSpecSerializer(size_catalogue(), many=True).data)


# Staff users (Django admin session) or integration keys with the scope.
# PROD: replace staff status by the operator role once user roles exist
# (ADR-0005).
OPERATOR_PERMISSIONS = [IsAdminUser | HasScopedAPIKey]


@extend_schema_view(
    retrieve=extend_schema(
        summary="Locker front with door status",
        description="Layout of one locker with the status of every door and its fill rate.",
        tags=["operations"],
    ),
)
class OperatorLockerViewSet(viewsets.ReadOnlyModelViewSet[Locker]):
    """Lockers for operators: occupancy of every compartment and network statistics."""

    permission_classes = OPERATOR_PERMISSIONS
    required_scope = Scope.OPERATIONS_READ
    lookup_field = "code"

    def get_queryset(self) -> QuerySet[Locker]:
        """Return all lockers, whatever their status, optionally filtered by distance."""
        return _filter_near(_lockers_with_compartments(), self.request)

    def get_serializer_class(self) -> type[BaseSerializer[Locker]]:
        """Use GeoJSON features for the list and the detailed layout for one locker."""
        if self.action == "retrieve":
            return OperatorLockerLayoutSerializer
        return OperatorLockerFeatureSerializer

    @extend_schema(
        summary="List lockers with occupancy",
        description="All lockers, whatever their status, with fill rates (GeoJSON).",
        parameters=NEAR_PARAMETERS,
        tags=["operations"],
    )
    def list(self, request: Request, *args: object, **kwargs: object) -> Response:
        """List lockers as a GeoJSON FeatureCollection with fill rates."""
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Network statistics",
        description="Occupancy of the whole locker network: totals, fill rate, per-size figures.",
        responses=NetworkStatsSerializer,
        tags=["operations"],
    )
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


class EventCursorPagination(CursorPagination):
    """Stable pagination over events, newest first, robust to concurrent inserts."""

    ordering = ("-occurred_at", "-id")
    page_size = 100
    max_page_size = 500
    page_size_query_param = "page_size"


@extend_schema_view(
    list=extend_schema(
        summary="Locker events",
        description=(
            "Events reported by lockers (door opened or closed, faults, connection "
            "changes), newest first, with cursor pagination. Poll with `since` to "
            "receive only new events."
        ),
        parameters=[
            OpenApiParameter("locker", OpenApiTypes.STR, description="Code du casier."),
            OpenApiParameter(
                "kind",
                OpenApiTypes.STR,
                enum=LockerEvent.Kind.values,
                description="Type d'événement.",
            ),
            OpenApiParameter(
                "since",
                OpenApiTypes.DATETIME,
                description="Seulement les événements survenus après cette date (ISO 8601).",
            ),
        ],
        tags=["operations"],
    ),
)
class OperatorLockerEventViewSet(mixins.ListModelMixin, viewsets.GenericViewSet[LockerEvent]):
    """Read-only feed of locker events for operators and integrations."""

    permission_classes = OPERATOR_PERMISSIONS
    required_scope = Scope.OPERATIONS_READ
    serializer_class = LockerEventSerializer
    pagination_class = EventCursorPagination

    def get_queryset(self) -> QuerySet[LockerEvent]:
        """Return events filtered by locker, kind and date.

        Raises:
            ValidationError: If ``since`` is not an ISO 8601 datetime.
        """
        queryset = LockerEvent.objects.select_related("locker", "compartment")
        params = self.request.query_params
        if code := params.get("locker"):
            queryset = queryset.filter(locker__code=code)
        if kind := params.get("kind"):
            queryset = queryset.filter(kind=kind)
        if since := params.get("since"):
            moment = parse_datetime(since)
            if moment is None:
                raise ValidationError("since doit être une date ISO 8601.")
            queryset = queryset.filter(occurred_at__gt=moment)
        return queryset
