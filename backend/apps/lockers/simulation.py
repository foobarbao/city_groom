"""Simulation of lockers for the demo.

Everything in this module produces **fictitious** data (CODING_STANDARDS.md
§10): simulated lockers are flagged ``is_simulated=True`` and their occupancy
is random. Real lockers will be managed through a ``LockerDriver`` instead.

Layouts are built from column templates. Every column is
``COLUMN_GRID_UNITS`` high, so lockers can be drawn as a regular grid.
"""

import math
import random
from collections.abc import Sequence
from dataclasses import dataclass

from django.contrib.gis.geos import Point
from django.db import transaction
from django.utils import timezone

from apps.lockers.models import AccessMethod, Compartment, Connectivity, Locker
from apps.lockers.sizes import (
    COLUMN_GRID_UNITS,
    CONTROL_PANEL_GRID_UNITS,
    SIZE_SPECS,
    CompartmentSize,
)

S, M, L, XL = (
    CompartmentSize.SMALL,
    CompartmentSize.MEDIUM,
    CompartmentSize.LARGE,
    CompartmentSize.GARMENT,
)

# Column templates, top to bottom. The control column reserves its top
# CONTROL_PANEL_GRID_UNITS for the screen and readers.
COLUMN_TEMPLATES: dict[str, tuple[CompartmentSize, ...]] = {
    "control": (S, S, S, S, M, M, M, L),
    "mixed": (S, S, S, S, M, M, M, M, L, L),
    "large": (M, M, L, L, L, L),
    "laundry": (L, L, L, L, L),
    "garment": (XL,),
}

# Locker models, as sequences of column templates, left to right. City Groom
# lockers favour large and hanging compartments: laundry bags and ironed
# shirts on hangers are the first services (docs/PRODUCT.md).
LOCKER_MODELS: dict[str, tuple[str, ...]] = {
    "compact": ("mixed", "control", "garment"),
    "standard": ("garment", "mixed", "control", "laundry", "garment"),
    "large": ("garment", "mixed", "large", "control", "laundry", "large", "garment"),
}

# Demo fill rates are kept modest on purpose: the service is new, and the
# project owner asked not to inflate figures.
DEFAULT_MIN_FILL_RATE = 0.15
DEFAULT_MAX_FILL_RATE = 0.45

# Share of in-use compartments that are reserved rather than occupied.
RESERVED_SHARE = 0.3

# Probability that a simulated compartment is out of service.
OUT_OF_SERVICE_PROBABILITY = 0.02


# Hardware profiles seen on the market (docs/LOCKERS.md): access methods and
# connectivity go together. Weights give their share among simulated lockers.
HARDWARE_PROFILES: dict[str, tuple[tuple[str, ...], str, int]] = {
    "connected_qr_nfc": ((AccessMethod.QR_CODE, AccessMethod.NFC), Connectivity.CELLULAR, 5),
    "connected_qr": ((AccessMethod.QR_CODE,), Connectivity.ETHERNET, 2),
    "offline_bluetooth": ((AccessMethod.BLUETOOTH,), Connectivity.BLUETOOTH_OFFLINE, 3),
}


def _check_templates() -> None:
    """Fail fast if a column template does not fill exactly one column."""
    for name, sizes in COLUMN_TEMPLATES.items():
        units = sum(SIZE_SPECS[size].grid_units for size in sizes)
        if name == "control":
            units += CONTROL_PANEL_GRID_UNITS
        if units != COLUMN_GRID_UNITS:
            raise ValueError(f"Column template {name!r} is {units} units high")


_check_templates()


@dataclass(frozen=True)
class SimulatedSite:
    """A place where a simulated locker is installed.

    Attributes:
        name: Display name (e.g. the tram stop name).
        longitude: WGS 84 longitude.
        latitude: WGS 84 latitude.
        source: Where the location comes from, stored in ``placement_source``.
    """

    name: str
    longitude: float
    latitude: float
    source: str


def column_letter(index: int) -> str:
    """Return the door label letter of a column (0 → "A", 1 → "B"…)."""
    return chr(ord("A") + index)


@transaction.atomic
def create_simulated_locker(
    site: SimulatedSite,
    code: str,
    model: str = "standard",
    access_methods: Sequence[str] = (AccessMethod.QR_CODE, AccessMethod.NFC),
    connectivity: str = Connectivity.CELLULAR,
) -> Locker:
    """Create a simulated locker and all its compartments, all free.

    Args:
        site: Where the locker is installed.
        code: Unique locker code.
        model: Key of ``LOCKER_MODELS``.
        access_methods: Opening methods offered by the locker.
        connectivity: How the locker communicates with the platform.

    Returns:
        The created locker.

    Raises:
        KeyError: If ``model`` is unknown.
    """
    columns = LOCKER_MODELS[model]
    locker = Locker.objects.create(
        name=site.name,
        code=code,
        location=Point(site.longitude, site.latitude, srid=4326),
        access_methods=list(access_methods),
        connectivity=connectivity,
        last_seen_at=timezone.now(),
        control_panel_column=columns.index("control"),
        is_simulated=True,
        placement_source=site.source,
    )
    Compartment.objects.bulk_create(
        Compartment(
            locker=locker,
            label=f"{column_letter(column_index)}{position + 1}",
            size=size,
            column=column_index,
            position=position,
        )
        for column_index, template in enumerate(columns)
        for position, size in enumerate(COLUMN_TEMPLATES[template])
    )
    return locker


def simulate_occupancy(
    locker: Locker,
    rng: random.Random,
    min_fill_rate: float = DEFAULT_MIN_FILL_RATE,
    max_fill_rate: float = DEFAULT_MAX_FILL_RATE,
) -> None:
    """Randomly set the status of every compartment of a simulated locker.

    Args:
        locker: A simulated locker.
        rng: Random generator; pass a seeded one for reproducible demos.
        min_fill_rate: Lower bound of the drawn target fill rate.
        max_fill_rate: Upper bound of the drawn target fill rate.

    Raises:
        ValueError: If the locker is not simulated, so real occupancy data can
            never be overwritten by the simulation.
    """
    if not locker.is_simulated:
        raise ValueError(f"Refusing to simulate occupancy of real locker {locker.code!r}")
    target = rng.uniform(min_fill_rate, max_fill_rate)
    compartments = list(locker.compartments.all())
    for compartment in compartments:
        if rng.random() < OUT_OF_SERVICE_PROBABILITY:
            compartment.status = Compartment.Status.OUT_OF_SERVICE
        elif rng.random() < target:
            compartment.status = (
                Compartment.Status.RESERVED
                if rng.random() < RESERVED_SHARE
                else Compartment.Status.OCCUPIED
            )
        else:
            compartment.status = Compartment.Status.FREE
    Compartment.objects.bulk_update(compartments, ["status"])


def _distance_m(a: SimulatedSite, b: SimulatedSite) -> float:
    """Approximate ground distance in metres (equirectangular, fine at city scale)."""
    mean_lat = math.radians((a.latitude + b.latitude) / 2)
    dx = math.radians(b.longitude - a.longitude) * math.cos(mean_lat)
    dy = math.radians(b.latitude - a.latitude)
    return 6_371_000 * math.hypot(dx, dy)


def spread_sites(sites: Sequence[SimulatedSite], count: int) -> list[SimulatedSite]:
    """Pick ``count`` sites spread as evenly as possible across the area.

    Uses deterministic farthest-point sampling: start from the site closest to
    the centroid, then repeatedly add the site farthest from those already
    chosen. This gives a city-wide coverage instead of a cluster.

    Args:
        sites: Candidate sites.
        count: Number of sites to keep.

    Returns:
        The selected sites, at most ``len(sites)``.
    """
    if count <= 0 or not sites:
        return []
    centroid = SimulatedSite(
        name="centroid",
        longitude=sum(s.longitude for s in sites) / len(sites),
        latitude=sum(s.latitude for s in sites) / len(sites),
        source="",
    )
    chosen = [min(sites, key=lambda s: _distance_m(s, centroid))]
    remaining = [s for s in sites if s is not chosen[0]]
    while remaining and len(chosen) < count:
        farthest = max(remaining, key=lambda s: min(_distance_m(s, c) for c in chosen))
        chosen.append(farthest)
        remaining.remove(farthest)
    return chosen
