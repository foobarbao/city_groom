"""Export everything the demo builds need, as JSON files.

Reads the lockers and merchants currently in the database (after
``import_osm_merchants`` and ``seed_simulated_lockers``), snapshots the API
responses the apps use, and adds the fictitious activity of
``apps.demo.activity`` and the customer catalogue of ``apps.demo.customer``.
Files are written to ``packages/demo-data/data/`` (docs/DEMO.md)::

    python manage.py export_demo_data --output-dir ../packages/demo-data/data
"""

import json
from argparse import ArgumentParser
from datetime import datetime
from pathlib import Path
from typing import Any

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.demo.activity import LockerSite, generate_activity
from apps.demo.customer import build_customer_catalogue
from apps.lockers.models import Locker

#: Host name of the in-process API requests (never resolved on the network).
EXPORT_HOST = "localhost"


class Command(BaseCommand):
    """Management command exporting the demo dataset."""

    help = "Exporte les données de la démo (casiers, commerces, activité fictive) en JSON."

    def add_arguments(self, parser: ArgumentParser) -> None:
        """Declare command-line options."""
        parser.add_argument("--output-dir", type=Path, required=True)
        parser.add_argument("--seed", type=int, default=42)
        parser.add_argument(
            "--now",
            type=datetime.fromisoformat,
            help="Date de référence ISO 8601 (défaut : maintenant), pour une démo reproductible.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        """Snapshot the API and generate the activity."""
        lockers = list(Locker.objects.filter(status=Locker.Status.ACTIVE).order_by("code"))
        if not lockers:
            raise CommandError("Aucun casier : lancez d'abord seed_simulated_lockers.")
        output: Path = options["output_dir"]
        output.mkdir(parents=True, exist_ok=True)

        # The API is read in-process, never over the network: the host and HTTPS
        # settings of the environment (ALLOWED_HOSTS, SECURE_SSL_REDIRECT) must
        # not reject these requests, whatever the local `.env` contains.
        with override_settings(ALLOWED_HOSTS=[EXPORT_HOST], SECURE_SSL_REDIRECT=False):
            public_data, operator_data = self._snapshot_api(lockers)

        now = options["now"] or timezone.now()
        if now.tzinfo is None:
            raise CommandError("--now doit préciser un fuseau horaire (ex. +02:00).")
        activity = generate_activity(
            [
                LockerSite(locker.code, locker.name, locker.location.x, locker.location.y)
                for locker in lockers
            ],
            now=now,
            seed=options["seed"],
        )

        for name, data in (
            ("public", public_data),
            ("operator", operator_data),
            ("activity", activity),
            ("catalogue", build_customer_catalogue(now, seed=options["seed"])),
        ):
            (output / f"{name}.json").write_text(
                json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8"
            )
        self.stdout.write(
            self.style.SUCCESS(
                f"{len(lockers)} casiers, {len(public_data['merchants']['features'])} commerces, "
                f"{len(activity['orders'])} commandes fictives -> {output}"
            )
        )

    def _snapshot_api(self, lockers: list[Locker]) -> tuple[dict[str, Any], dict[str, Any]]:
        """Read the public and operator API responses that the demo apps replay."""
        public = APIClient(SERVER_NAME=EXPORT_HOST)
        public_data = {
            "lockers": self._get(public, "/api/v1/lockers/"),
            "details": {
                locker.code: self._get(public, f"/api/v1/lockers/{locker.code}/")
                for locker in lockers
            },
            "sizes": self._get(public, "/api/v1/lockers/sizes/"),
            "merchants": self._get(public, "/api/v1/merchants/"),
        }

        operator = APIClient(SERVER_NAME=EXPORT_HOST)
        # In-memory staff user, never saved: only used to read operator views.
        operator.force_authenticate(User(username="demo-export", is_staff=True))
        operator_data = {
            "lockers": self._get(operator, "/api/v1/operator/lockers/"),
            "details": {
                locker.code: self._get(operator, f"/api/v1/operator/lockers/{locker.code}/")
                for locker in lockers
            },
            "stats": self._get(operator, "/api/v1/operator/lockers/stats/"),
        }
        return public_data, operator_data

    @staticmethod
    def _get(client: APIClient, path: str) -> Any:
        """GET an API path and return its JSON, failing loudly on errors."""
        response = client.get(path)
        if response.status_code != 200:
            raise CommandError(f"{path} a répondu {response.status_code}")
        return response.json()
