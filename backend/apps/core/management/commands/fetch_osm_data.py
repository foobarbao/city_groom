"""Download the OpenStreetMap data used by City Groom and save it as JSON files.

Only fetches and saves raw Overpass responses: no database access. The files
are then loaded with ``seed_simulated_lockers --sites-file`` and
``import_osm_merchants --from-file``. Used by the ``osm-data`` GitHub Actions
workflow, whose runners have open internet access (docs/DATA_SOURCES.md).

Example::

    python manage.py fetch_osm_data --output-dir ../data/osm
"""

import json
from argparse import ArgumentParser
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand

from apps.core.osm import fetch_overpass
from apps.lockers.osm import TRAM_STOPS_QUERY
from apps.merchants.osm import build_query


class Command(BaseCommand):
    """Management command saving Overpass responses for tram stops and merchants."""

    help = "Télécharge les arrêts de tram et les commerces depuis OpenStreetMap (JSON)."

    def add_arguments(self, parser: ArgumentParser) -> None:
        """Declare command-line options."""
        parser.add_argument("--output-dir", type=Path, required=True)

    def handle(self, *args: Any, **options: Any) -> None:
        """Run both Overpass queries and write one file per dataset."""
        output: Path = options["output_dir"]
        output.mkdir(parents=True, exist_ok=True)
        for name, query in (("tram_stops", TRAM_STOPS_QUERY), ("merchants", build_query())):
            payload = fetch_overpass(query)
            path = output / f"{name}.json"
            path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
            count = len(payload.get("elements", []))
            self.stdout.write(self.style.SUCCESS(f"{name}: {count} objets -> {path}"))
