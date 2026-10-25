"""Load the fictitious demo merchants into the database, or remove them.

The hosted backend shows the same shops as the demo site: the real
OpenStreetMap businesses (``import_osm_merchants``) plus the fictitious shops
of ``apps.demo.catalogue``, whose names all start with "Démo ·" so they can
never be mistaken for real businesses (CODING_STANDARDS.md §10). The project
owner asked for them on the hosted database on 2026-10-25 (docs/PRODUCT.md).

They are stored without an OpenStreetMap object, so OSM imports never prune
them, and ``is_partner`` stays false: no partnership exists (see the
``Merchant`` model). Positions are fictitious offsets from the centre of
Grenoble, as in the demo. Running the command again updates them without
duplicates::

    python manage.py load_demo_merchants
    python manage.py load_demo_merchants --remove

PROD: run with ``--remove`` once real partners are signed.
"""

from argparse import ArgumentParser
from typing import Any

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from apps.demo.activity import CENTRE
from apps.demo.catalogue import DEMO_MERCHANTS, DemoMerchant
from apps.merchants.models import Merchant

DEMO_PREFIX = "Démo · "


def demo_location(merchant: DemoMerchant) -> Point:
    """Return the fictitious position of a demo merchant (WGS 84)."""
    north, east = merchant.offset
    return Point(CENTRE[1] + east, CENTRE[0] + north, srid=4326)


class Command(BaseCommand):
    """Management command loading (or removing) the fictitious demo merchants."""

    help = "Charge les commerces fictifs « Démo · » de la démonstration (ou les supprime)."

    def add_arguments(self, parser: ArgumentParser) -> None:
        """Declare command-line options."""
        parser.add_argument(
            "--remove", action="store_true", help="Supprime les commerces « Démo · »."
        )

    def handle(self, *args: Any, **options: Any) -> None:
        """Create or update every demo merchant, or remove them all."""
        demo = Merchant.objects.filter(osm_id__isnull=True, name__startswith=DEMO_PREFIX)
        if options["remove"]:
            deleted, _ = demo.delete()
            self.stdout.write(self.style.SUCCESS(f"{deleted} commerces « Démo · » supprimés."))
            return
        created = 0
        for merchant in DEMO_MERCHANTS:
            _, was_created = Merchant.objects.update_or_create(
                name=merchant.name,
                osm_id__isnull=True,
                defaults={
                    "category": merchant.category,
                    "location": demo_location(merchant),
                    "is_partner": False,
                },
            )
            created += was_created
        self.stdout.write(
            self.style.SUCCESS(
                f"{created} commerces « Démo · » créés, {len(DEMO_MERCHANTS) - created} mis à jour."
            )
        )
