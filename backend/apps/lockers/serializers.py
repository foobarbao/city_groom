"""API representations of lockers.

Two levels of detail exist on purpose:

- **public** serializers (customer app, guests included) expose the layout and
  the number of free compartments per size, but never the status of individual
  compartments, which would reveal which doors hold items;
- **operator** serializers add per-compartment status and fill rates.
"""

from typing import Any

from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from apps.lockers.models import Compartment, Locker, LockerEvent
from apps.lockers.services import OccupancyStats, compute_occupancy
from apps.lockers.sizes import (
    COLUMN_GRID_UNITS,
    CONTROL_PANEL_GRID_UNITS,
    SIZE_SPECS,
)


def _occupancy(locker: Locker) -> OccupancyStats:
    """Compute occupancy from prefetched compartments (no extra query)."""
    return compute_occupancy((c.size, c.status) for c in locker.compartments.all())


class SizeSpecSerializer(serializers.Serializer[Any]):
    """Characteristics of a compartment size, for display."""

    code = serializers.CharField()
    # Not called "label": that name is reserved by DRF fields' own attributes.
    name = serializers.CharField(help_text="Nom affiché de la taille (français).")
    height_cm = serializers.IntegerField()
    width_cm = serializers.IntegerField()
    depth_cm = serializers.IntegerField()
    grid_units = serializers.IntegerField()
    examples = serializers.ListField(child=serializers.CharField())


def size_catalogue() -> list[dict[str, Any]]:
    """Return the compartment size catalogue as plain data."""
    return [
        {
            "code": size.value,
            "name": size.label,
            "height_cm": spec.height_cm,
            "width_cm": spec.width_cm,
            "depth_cm": spec.depth_cm,
            "grid_units": spec.grid_units,
            "examples": list(spec.examples),
        }
        for size, spec in SIZE_SPECS.items()
    ]


# djangorestframework-gis ships without type hints, hence the ignore.
class LockerFeatureSerializer(GeoFeatureModelSerializer):  # type: ignore[misc]
    """Locker as a GeoJSON feature for the map, with free compartments per size."""

    free_by_size = serializers.SerializerMethodField(
        help_text="Nombre de compartiments libres par code de taille."
    )

    class Meta:
        model = Locker
        geo_field = "location"
        fields = ["id", "code", "name", "address", "status", "access_methods", "free_by_size"]

    def get_free_by_size(self, locker: Locker) -> dict[str, int]:
        """Return the number of free compartments per size code."""
        return _occupancy(locker).free_by_size


class OperatorLockerFeatureSerializer(LockerFeatureSerializer):
    """Map feature for operators, adding the fill rate."""

    fill_rate = serializers.SerializerMethodField(help_text="Taux de remplissage, entre 0 et 1.")
    in_service = serializers.SerializerMethodField(help_text="Compartiments utilisables.")
    in_use = serializers.SerializerMethodField(help_text="Compartiments réservés ou occupés.")

    class Meta(LockerFeatureSerializer.Meta):
        fields = [*LockerFeatureSerializer.Meta.fields, "fill_rate", "in_service", "in_use"]

    def get_fill_rate(self, locker: Locker) -> float:
        """Return the share of in-service compartments in use."""
        return round(_occupancy(locker).fill_rate, 3)

    def get_in_service(self, locker: Locker) -> int:
        """Return the number of usable compartments."""
        return _occupancy(locker).in_service

    def get_in_use(self, locker: Locker) -> int:
        """Return the number of reserved or occupied compartments."""
        return _occupancy(locker).in_use


class PublicCompartmentSerializer(serializers.ModelSerializer[Compartment]):
    """Compartment position and size, without its status."""

    class Meta:
        model = Compartment
        fields = ["id", "label", "size", "column", "position"]
        read_only_fields = fields


class OperatorCompartmentSerializer(serializers.ModelSerializer[Compartment]):
    """Compartment with its current status."""

    class Meta:
        model = Compartment
        fields = ["id", "label", "size", "column", "position", "status"]
        read_only_fields = fields


class LockerLayoutSerializer(serializers.ModelSerializer[Locker]):
    """Full description of a locker front, to draw it in the apps."""

    longitude = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    column_grid_units = serializers.SerializerMethodField()
    control_panel_grid_units = serializers.SerializerMethodField()
    free_by_size = serializers.SerializerMethodField()
    compartments = PublicCompartmentSerializer(many=True, read_only=True)

    class Meta:
        model = Locker
        fields = [
            "id",
            "code",
            "name",
            "address",
            "status",
            "access_methods",
            "is_simulated",
            "longitude",
            "latitude",
            "control_panel_column",
            "column_grid_units",
            "control_panel_grid_units",
            "free_by_size",
            "compartments",
        ]
        # Read-only API: marking every field read-only also makes them required
        # in the OpenAPI schema, hence non-optional in frontend types.
        read_only_fields = fields

    def get_longitude(self, locker: Locker) -> float:
        """Return the WGS 84 longitude."""
        return float(locker.location.x)

    def get_latitude(self, locker: Locker) -> float:
        """Return the WGS 84 latitude."""
        return float(locker.location.y)

    def get_column_grid_units(self, locker: Locker) -> int:
        """Return the height of a column in grid units."""
        return COLUMN_GRID_UNITS

    def get_control_panel_grid_units(self, locker: Locker) -> int:
        """Return the height of the control panel in grid units."""
        return CONTROL_PANEL_GRID_UNITS

    def get_free_by_size(self, locker: Locker) -> dict[str, int]:
        """Return the number of free compartments per size code."""
        return _occupancy(locker).free_by_size


class OperatorLockerLayoutSerializer(LockerLayoutSerializer):
    """Locker front for operators, with the status of every compartment."""

    compartments = OperatorCompartmentSerializer(many=True, read_only=True)  # type: ignore[assignment]
    fill_rate = serializers.SerializerMethodField()

    class Meta(LockerLayoutSerializer.Meta):
        fields = [*LockerLayoutSerializer.Meta.fields, "fill_rate"]
        read_only_fields = fields

    def get_fill_rate(self, locker: Locker) -> float:
        """Return the share of in-service compartments in use."""
        return round(_occupancy(locker).fill_rate, 3)


class NetworkStatsSerializer(serializers.Serializer[Any]):
    """Occupancy of the whole locker network, for operator dashboards."""

    lockers = serializers.IntegerField(help_text="Nombre de casiers.")
    compartments = serializers.IntegerField(help_text="Nombre total de compartiments.")
    in_service = serializers.IntegerField()
    in_use = serializers.IntegerField()
    fill_rate = serializers.FloatField()
    free_by_size = serializers.DictField(child=serializers.IntegerField())
    capacity_by_size = serializers.DictField(child=serializers.IntegerField())


class LockerEventSerializer(serializers.ModelSerializer[LockerEvent]):
    """An event reported by a locker, for operators and integrations."""

    locker: serializers.SlugRelatedField[Locker] = serializers.SlugRelatedField(
        slug_field="code", read_only=True, help_text="Code du casier."
    )
    compartment: serializers.SlugRelatedField[Compartment] = serializers.SlugRelatedField(
        slug_field="label",
        read_only=True,
        allow_null=True,
        help_text="Étiquette du compartiment, nulle pour un événement du casier entier.",
    )

    class Meta:
        model = LockerEvent
        fields = [
            "id",
            "locker",
            "compartment",
            "kind",
            "access_method",
            "occurred_at",
            "received_at",
            "is_simulated",
            "details",
        ]
        read_only_fields = fields
