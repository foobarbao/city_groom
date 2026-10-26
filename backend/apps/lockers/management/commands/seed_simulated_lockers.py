"""Create simulated lockers at real places of Grenoble-Alpes Métropole.

Service lockers go to tram stops; with ``--strategic-file``, smaller consigne
lockers are also placed at strategic places (tourist sites, stations,
campuses…, see ``apps.lockers.osm``), and service lockers at the places the
project owner required (``REQUIRED_SITES``: Inovallée business parks in
Meylan and Montbonnot), on top of the counts. With ``--education-file``, a
small mixed locker stands in front of every lycée and higher-education site;
with ``--boundary-file``, lockers in the town of Grenoble get larger models
(owner's decisions of 2026-10-26).

Examples::

    # Fetch tram stops from OpenStreetMap and create 15 simulated lockers
    python manage.py seed_simulated_lockers --count 15

    # Same, from a previously saved Overpass response (offline, reproducible)
    python manage.py seed_simulated_lockers --sites-file tram_stops.json

    # Replace all existing simulated lockers
    python manage.py seed_simulated_lockers --reset

    # Demo network: 25 tram stop lockers, 45 consigne lockers, the required
    # business parks, every lycée and higher-education site, large units in
    # the town of Grenoble
    python manage.py seed_simulated_lockers --reset --count 25 \
        --sites-file ../data/osm/tram_stops.json \
        --strategic-file ../data/osm/strategic_sites.json --strategic-count 45 \
        --education-file ../data/osm/education.json \
        --boundary-file ../data/osm/grenoble_boundary.json
"""

import json
import random
from argparse import ArgumentParser
from pathlib import Path
from typing import Any
from urllib.error import URLError

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from apps.lockers.models import Locker, SiteCategory
from apps.lockers.osm import (
    TRAM_STOPS_QUERY,
    fetch_overpass,
    parse_education_sites,
    parse_required_sites,
    parse_strategic_sites,
    parse_town_boundary,
    parse_tram_stops,
    point_in_rings,
)
from apps.lockers.simulation import (
    HARDWARE_PROFILES,
    SimulatedSite,
    create_simulated_locker,
    distance_m,
    simulate_occupancy,
    spread_by_category,
    spread_sites,
)

DEFAULT_COUNT = 15
DEFAULT_SEED = 42

# Relative frequency of each locker model in the demo.
MODEL_WEIGHTS = {"compact": 3, "standard": 5, "large": 2}
CONSIGNE_MODEL_WEIGHTS = {"consigne_compact": 3, "consigne": 2}
# Education lockers closer than this to another locker are not added: the
# place is already served. ASSUMPTION, to review.
EDUCATION_NEAR_EXISTING_M = 100


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
            "--strategic-file",
            type=Path,
            help="Réponse Overpass (JSON) des lieux stratégiques, pour des casiers de consigne.",
        )
        parser.add_argument(
            "--strategic-count",
            type=int,
            default=0,
            help="Nombre de casiers de consigne aux lieux stratégiques.",
        )
        parser.add_argument(
            "--education-file",
            type=Path,
            help="Réponse Overpass (JSON) des lycées et du supérieur : un petit casier chacun.",
        )
        parser.add_argument(
            "--boundary-file",
            type=Path,
            help="Limite de Grenoble (Overpass, out geom) : gros casiers à l'intérieur.",
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

        self.town_rings: list[list[tuple[float, float]]] = []
        if options["boundary_file"]:
            self.town_rings = parse_town_boundary(
                json.loads(options["boundary_file"].read_text(encoding="utf-8"))
            )
            if not self.town_rings:
                raise CommandError("Limite de Grenoble illisible dans le fichier fourni.")
        rng = random.Random(options["seed"])  # noqa: S311 - demo data, not security-related
        tram_sites = spread_sites(sites, options["count"])
        placements = [(SiteCategory.TRAM_STOP.value, site) for site in tram_sites]
        required: list[tuple[str, SimulatedSite]] = []
        if options["strategic_file"]:
            strategic_payload = json.loads(options["strategic_file"].read_text(encoding="utf-8"))
            strategic = parse_strategic_sites(strategic_payload)
            placements += spread_by_category(
                strategic, options["strategic_count"], taken=tram_sites
            )
            required = parse_required_sites(strategic_payload)
        created = sum(self._create(category, site, rng) for category, site in placements)
        # Owner-required business parks last, so the lockers above keep the
        # same random draws; service models, for the people working there.
        # ASSUMPTION: service (laundry) lockers rather than consigne ones.
        created += sum(
            self._create(category, site, rng, kind="service") for category, site in required
        )
        if options["education_file"]:
            placed = [site for _, site in placements + required]
            education = [
                (category, site)
                for category, site in parse_education_sites(
                    json.loads(options["education_file"].read_text(encoding="utf-8"))
                )
                if all(distance_m(site, other) >= EDUCATION_NEAR_EXISTING_M for other in placed)
            ]
            created += sum(
                self._create(category, site, rng, kind="school") for category, site in education
            )
        self.stdout.write(self.style.SUCCESS(f"{created} casiers simulés créés."))

    def _create(
        self, category: str, site: SimulatedSite, rng: random.Random, *, kind: str = ""
    ) -> bool:
        """Create one simulated locker at a site; return False if it already exists.

        ``kind``: "school" (small mixed unit), "service" (laundry models), or
        empty (by category: service at tram stops, consigne elsewhere). Inside
        the town of Grenoble, service and consigne lockers get the large
        models; school lockers stay small (the more specific rule wins).
        """
        code = slugify(site.name)[:40]
        if Locker.objects.filter(code=code).exists():
            self.stdout.write(f"Ignoré (existe déjà) : {site.name}")
            return False
        service = kind == "service" or (not kind and category == SiteCategory.TRAM_STOP)
        in_town = bool(self.town_rings) and point_in_rings(
            site.longitude, site.latitude, self.town_rings
        )
        if kind == "school":
            model = "school"
        elif in_town:
            model = "large" if service else "consigne_large"
        else:
            weights_by_model = MODEL_WEIGHTS if service else CONSIGNE_MODEL_WEIGHTS
            models = list(weights_by_model)
            model = rng.choices(models, [weights_by_model[m] for m in models])[0]
        profiles = list(HARDWARE_PROFILES)
        profile = rng.choices(profiles, [HARDWARE_PROFILES[p][2] for p in profiles])[0]
        access_methods, connectivity, _ = HARDWARE_PROFILES[profile]
        locker = create_simulated_locker(
            site,
            code=code,
            model=model,
            access_methods=access_methods,
            connectivity=connectivity,
            site_category=category,
        )
        simulate_occupancy(locker, rng)
        return True

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
