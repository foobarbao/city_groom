"""Administration of merchants (French UI)."""

from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from apps.merchants.models import Merchant


@admin.register(Merchant)
class MerchantAdmin(GISModelAdmin):
    """Merchant administration with a map widget for the location."""

    list_display = ["name", "category", "brand", "address", "is_partner", "imported_at"]
    list_filter = ["category", "is_partner"]
    search_fields = ["name", "address"]
    readonly_fields = ["osm_type", "osm_id", "imported_at"]
    gis_widget_kwargs = {
        "attrs": {"default_lon": 5.7245, "default_lat": 45.1885, "default_zoom": 13}
    }
