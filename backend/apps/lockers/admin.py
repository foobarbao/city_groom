"""Administration of lockers for City Groom operators (French UI)."""

from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from django.db.models import QuerySet
from django.http import HttpRequest

from apps.lockers.models import Compartment, Locker
from apps.lockers.services import compute_occupancy


class CompartmentInline(admin.TabularInline[Compartment, Locker]):
    """Compartments edited from their locker's page."""

    model = Compartment
    extra = 0
    fields = ["label", "size", "column", "position", "status"]
    ordering = ["column", "position"]


@admin.register(Locker)
class LockerAdmin(GISModelAdmin):
    """Locker administration with a map widget for the location."""

    list_display = ["name", "code", "site_category", "status", "is_simulated", "fill_rate_display"]
    list_filter = ["status", "site_category", "is_simulated"]
    search_fields = ["name", "code", "address"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [CompartmentInline]
    # Centre the map widget on Grenoble.
    gis_widget_kwargs = {
        "attrs": {"default_lon": 5.7245, "default_lat": 45.1885, "default_zoom": 13}
    }

    def get_queryset(self, request: HttpRequest) -> QuerySet[Locker]:
        """Prefetch compartments to compute fill rates without extra queries."""
        return super().get_queryset(request).prefetch_related("compartments")

    @admin.display(description="taux de remplissage")
    def fill_rate_display(self, locker: Locker) -> str:
        """Return the fill rate as a percentage."""
        stats = compute_occupancy((c.size, c.status) for c in locker.compartments.all())
        return f"{stats.fill_rate:.0%}"
