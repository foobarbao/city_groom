"""Download the OpenStreetMap data used by City Groom and save it as JSON files.

Only fetches and saves raw Overpass responses: no database access. The files
are then loaded with ``seed_simulated_lockers --sites-file --strategic-file`` and
``import_osm_merchants --from-file``. Used by the ``osm-data`` GitHub Actions
workflow, whose runners have open internet access (docs/DATA_SOURCES.md).

Example::

    python manage.py fetch_osm_data --output-dir ../data/osm
"""

import json
from argparse import ArgumentParser
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandError

from apps.core.osm import fetch_overpass_with_retries
from apps.lockers.osm import STRATEGIC_SITES_QUERY, TRAM_STOPS_QUERY
from apps.merchants.osm import build_query


class Command(BaseCommand):
    """Management command saving Overpass responses for locker sites and merchants."""

    help = (
        "Télécharge les arrêts de tram, les lieux stratégiques et les commerces "
        "depuis OpenStreetMap (JSON)."
    )

    def add_arguments(self, parser: ArgumentParser) -> None:
        """Declare command-line options."""
        parser.add_argument("--output-dir", type=Path, required=True)

    def handle(self, *args: Any, **options: Any) -> None:
        """Run the Overpass queries and write one file per dataset."""
        output: Path = options["output_dir"]
        output.mkdir(parents=True, exist_ok=True)
        datasets = (
            ("tram_stops", TRAM_STOPS_QUERY),
            ("strategic_sites", STRATEGIC_SITES_QUERY),
            ("merchants", build_query()),
        )
        for name, query in datasets:
            payload = fetch_overpass_with_retries(query)
            if not payload.get("elements"):
                # An empty answer means a broken query, not an empty city: never
                # overwrite good data with it.
                raise CommandError(f"{name}: aucun objet renvoyé par Overpass, rien n'est écrit.")
            path = output / f"{name}.json"
            path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
            count = len(payload.get("elements", []))
            self.stdout.write(self.style.SUCCESS(f"{name}: {count} objets -> {path}"))
