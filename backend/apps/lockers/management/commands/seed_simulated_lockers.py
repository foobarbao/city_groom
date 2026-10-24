"""Create simulated lockers at real tram stops of Grenoble-Alpes Métropole.

Examples::

    # Fetch tram stops from OpenStreetMap and create 15 simulated lockers
    python manage.py seed_simulated_lockers --count 15

    # Same, from a previously saved Overpass response (offline, reproducible)
    python manage.py seed_simulated_lockers --sites-file tram_stops.json

    # Replace all existing simulated lockers
    python manage.py seed_simulated_lockers --reset
"""

import json
import random
from argparse import ArgumentParser
from pathlib import Path
from typing import Any
from urllib.error import URLError

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from apps.lockers.models import Locker
from apps.lockers.osm import TRAM_STOPS_QUERY, fetch_overpass, parse_tram_stops
from apps.lockers.simulation import (
    HARDWARE_PROFILES,
    create_simulated_locker,
    simulate_occupancy,
    spread_sites,
)

DEFAULT_COUNT = 15
DEFAULT_SEED = 42

# Relative frequency of each locker model in the demo.
MODEL_WEIGHTS = {"compact": 3, "standard": 5, "large": 2}


class Command(BaseCommand):
    """Management command creating simulated lockers with random occupancy."""

    help = "Crée des casiers simulés aux arrêts de tram réels (OpenStreetMap)."

    def add_arguments(self, parser: ArgumentParser) -> None:
        """Declare command-line options."""
        parser.add_argument("--count", type=int, default=DEFAULT_COUNT)
        parser.add_argument(
            "--seed", type=int, default=DEFAULT_SEED, help="Graine aléatoire (reproductible)."
        )
        parser.add_argument(
            "--sites-file",
            type=Path,
            help="Réponse Overpass (JSON) enregistrée, à utiliser au lieu de l'API.",
        )
        parser.add_argument(
            "--save-sites",
            type=Path,
            help="Enregistre la réponse Overpass pour la réutiliser hors ligne.",
        )
        parser.add_argument(
            "--reset", action="store_true", help="Supprime d'abord les casiers simulés existants."
        )

    def handle(self, *args: Any, **options: Any) -> None:
        """Fetch candidate sites, create the lockers and simulate their occupancy."""
        payload = self._load_payload(options["sites_file"])
        if options["save_sites"]:
            options["save_sites"].write_text(json.dumps(payload), encoding="utf-8")

        sites = parse_tram_stops(payload)
        if not sites:
            raise CommandError("Aucun arrêt de tram trouvé dans les données.")

        if options["reset"]:
            deleted, _ = Locker.objects.filter(is_simulated=True).delete()
            self.stdout.write(f"{deleted} objets simulés supprimés.")

        rng = random.Random(options["seed"])  # noqa: S311 - demo data, not security-related
        models = list(MODEL_WEIGHTS)
        weights = [MODEL_WEIGHTS[m] for m in models]
        profiles = list(HARDWARE_PROFILES)
        profile_weights = [HARDWARE_PROFILES[p][2] for p in profiles]
        created = 0
        for site in spread_sites(sites, options["count"]):
            code = slugify(site.name)[:40]
            if Locker.objects.filter(code=code).exists():
                self.stdout.write(f"Ignoré (existe déjà) : {site.name}")
                continue
            model = rng.choices(models, weights)[0]
            access_methods, connectivity, _ = HARDWARE_PROFILES[
                rng.choices(profiles, profile_weights)[0]
            ]
            locker = create_simulated_locker(
                site,
                code=code,
                model=model,
                access_methods=access_methods,
                connectivity=connectivity,
            )
            simulate_occupancy(locker, rng)
            created += 1
        self.stdout.write(self.style.SUCCESS(f"{created} casiers simulés créés."))

    def _load_payload(self, sites_file: Path | None) -> dict[str, Any]:
        """Read the Overpass response from a file or from the Overpass API."""
        if sites_file:
            payload: dict[str, Any] = json.loads(sites_file.read_text(encoding="utf-8"))
            return payload
        try:
            return fetch_overpass(TRAM_STOPS_QUERY)
        except URLError as error:
            raise CommandError(
                f"Impossible de joindre l'API Overpass ({error}). "
                "Utilisez --sites-file avec une réponse enregistrée."
            ) from error
