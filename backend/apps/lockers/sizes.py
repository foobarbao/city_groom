"""Compartment size catalogue used by simulated lockers.

The S, M and L footprints follow a common parcel-locker standard (InPost sizes
A, B and C: 38 x 64 cm opening and depth, heights of 8, 19 and 41 cm). The XL
"garment" compartment, tall enough to hang a suit or a dress, is a City Groom
assumption inspired by existing dry-cleaning locker concepts; it is not taken
from a vendor specification. See docs/LOCKERS.md for sources.

Real lockers will report their own compartment dimensions through their
``LockerDriver``; this catalogue only drives the simulation and the visual
layout of simulated lockers.
"""

from dataclasses import dataclass

from django.db import models


class CompartmentSize(models.TextChoices):
    """Size category of a locker compartment."""

    SMALL = "S", "Petit"
    MEDIUM = "M", "Moyen"
    LARGE = "L", "Grand"
    GARMENT = "XL", "Penderie"


@dataclass(frozen=True)
class SizeSpec:
    """Physical and visual characteristics of a compartment size.

    Attributes:
        height_cm: Inner height of the compartment.
        width_cm: Inner width of the compartment.
        depth_cm: Inner depth of the compartment.
        grid_units: Height in layout grid units (see ``COLUMN_GRID_UNITS``),
            used to draw the locker front proportionally.
        examples: Typical items fitting in the compartment, shown to users (French).
    """

    height_cm: int
    width_cm: int
    depth_cm: int
    grid_units: int
    examples: tuple[str, ...]


# Every column of a simulated locker is COLUMN_GRID_UNITS high; one unit is
# roughly 8 cm, the height of a small compartment.
COLUMN_GRID_UNITS = 20

# Height of the control panel (screen, NFC reader, QR scanner) in grid units.
CONTROL_PANEL_GRID_UNITS = 6

SIZE_SPECS: dict[CompartmentSize, SizeSpec] = {
    CompartmentSize.SMALL: SizeSpec(
        height_cm=8,
        width_cm=38,
        depth_cm=64,
        grid_units=1,
        examples=("Montre", "Bijou", "Téléphone", "Lunettes"),
    ),
    CompartmentSize.MEDIUM: SizeSpec(
        height_cm=19,
        width_cm=38,
        depth_cm=64,
        grid_units=2,
        examples=("Paire de chaussures", "Chemises pliées", "Sac à main"),
    ),
    CompartmentSize.LARGE: SizeSpec(
        height_cm=41,
        width_cm=38,
        depth_cm=64,
        grid_units=5,
        examples=("Sac de linge", "Couette pliée", "Petit appareil"),
    ),
    CompartmentSize.GARMENT: SizeSpec(
        height_cm=164,
        width_cm=38,
        depth_cm=64,
        grid_units=20,
        examples=("Costume sur cintre", "Robe", "Manteau"),
    ),
}
