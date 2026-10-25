"""API representations of merchants (public data only)."""

from rest_framework_gis.serializers import GeoFeatureModelSerializer

from apps.merchants.models import Merchant


# djangorestframework-gis ships without type hints, hence the ignore.
class MerchantFeatureSerializer(GeoFeatureModelSerializer):  # type: ignore[misc]
    """Merchant as a GeoJSON feature for the map and the list of businesses."""

    class Meta:
        model = Merchant
        geo_field = "location"
        fields = ["id", "name", "category", "address", "opening_hours", "website", "is_partner"]
        read_only_fields = fields
