"""Business logic about merchants."""

from collections.abc import Iterable

from django.contrib.gis.geos import Point
from django.db import transaction
from django.utils import timezone

from apps.merchants.models import Merchant
from apps.merchants.osm import MerchantCandidate


@transaction.atomic
def import_candidates(candidates: Iterable[MerchantCandidate]) -> tuple[int, int, int]:
    """Create, update and prune merchants from OpenStreetMap candidates.

    Merchants are matched on their OpenStreetMap object, so re-running an
    import updates names, addresses and hours without duplicates. Merchants
    imported earlier but absent from this import (closed, or excluded by a new
    selection rule) are deleted, except partners. The ``is_partner`` flag is
    never changed by an import.

    Returns:
        ``(created, updated, deleted)`` counts.
    """
    created = updated = 0
    seen: set[tuple[str, int]] = set()
    now = timezone.now()
    for candidate in candidates:
        seen.add((candidate.osm_type, candidate.osm_id))
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
    stale = [
        merchant.pk
        for merchant in Merchant.objects.filter(osm_id__isnull=False, is_partner=False)
        if (merchant.osm_type, merchant.osm_id) not in seen
    ]
    deleted, _ = Merchant.objects.filter(pk__in=stale).delete()
    return created, updated, deleted
