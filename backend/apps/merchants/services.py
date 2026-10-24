"""Business logic about merchants."""

from collections.abc import Iterable

from django.contrib.gis.geos import Point
from django.db import transaction
from django.utils import timezone

from apps.merchants.models import Merchant
from apps.merchants.osm import MerchantCandidate


@transaction.atomic
def import_candidates(candidates: Iterable[MerchantCandidate]) -> tuple[int, int]:
    """Create or update merchants from OpenStreetMap candidates.

    Merchants are matched on their OpenStreetMap object, so re-running an
    import updates names, addresses and hours without duplicates. The
    ``is_partner`` flag is never changed by an import.

    Returns:
        ``(created, updated)`` counts.
    """
    created = updated = 0
    now = timezone.now()
    for candidate in candidates:
        _, was_created = Merchant.objects.update_or_create(
            osm_type=candidate.osm_type,
            osm_id=candidate.osm_id,
            defaults={
                "name": candidate.name,
                "category": candidate.category,
                "location": Point(candidate.longitude, candidate.latitude, srid=4326),
                "address": candidate.address,
                "opening_hours": candidate.opening_hours,
                "website": candidate.website,
                "imported_at": now,
            },
        )
        if was_created:
            created += 1
        else:
            updated += 1
    return created, updated
