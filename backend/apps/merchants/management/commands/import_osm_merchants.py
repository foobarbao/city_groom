"""Import real Grenoble businesses offering locker-compatible services from OpenStreetMap.

Examples::

    python manage.py import_osm_merchants
    python manage.py import_osm_merchants --save-response merchants.json
    python manage.py import_osm_merchants --from-file merchants.json
"""

import json
from argparse import ArgumentParser
from pathlib import Path
from typing import Any
from urllib.error import URLError

from django.core.management.base import BaseCommand, CommandError

from apps.core.osm import fetch_overpass
from apps.merchants.osm import build_query, parse_merchants
from apps.merchants.services import import_candidates


class Command(BaseCommand):
    """Management command importing merchants from OpenStreetMap."""

    help = "Importe les commerces de services (hors alimentaire et chaînes) depuis OpenStreetMap."

    def add_arguments(self, parser: ArgumentParser) -> None:
        """Declare command-line options."""
        parser.add_argument(
            "--from-file", type=Path, help="Réponse Overpass (JSON) enregistrée, au lieu de l'API."
        )
        parser.add_argument(
            "--save-response", type=Path, help="Enregistre la réponse Overpass dans ce fichier."
        )

    def handle(self, *args: Any, **options: Any) -> None:
        """Fetch, filter and store the merchants."""
        if options["from_file"]:
            payload = json.loads(options["from_file"].read_text(encoding="utf-8"))
        else:
            try:
                payload = fetch_overpass(build_query())
            except URLError as error:
                raise CommandError(
                    f"Impossible de joindre l'API Overpass ({error}). "
                    "Utilisez --from-file avec une réponse enregistrée."
                ) from error
        if options["save_response"]:
            options["save_response"].write_text(json.dumps(payload), encoding="utf-8")
        created, updated = import_candidates(parse_merchants(payload))
        self.stdout.write(self.style.SUCCESS(f"{created} commerces créés, {updated} mis à jour."))
