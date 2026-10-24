"""Compartment size catalogue used by simulated lockers.

Sizes follow what is deployed in France and Europe (sources in
docs/LOCKERS.md):

- S, M and L use the common parcel-locker footprint (38 x 64 cm opening and
  depth) with heights of 8, 19 and 38 cm, as published by Mondial Relay for
  its French lockers (InPost uses the same footprint, with 41 cm for size C).
- XL "garment" is a full-height hanging compartment, as offered by
  dry-cleaning locker manufacturers. Its clear height of 183 cm fits a gown
  (about 1,830 mm recommended) and a suit in a garment bag (about 1,370 mm);
  its 64 cm depth exceeds the 55-60 cm needed for hangers. These figures come
  from manufacturer guidance, not from a single vendor's specification.

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


# Every column of a simulated locker is COLUMN_GRID_UNITS high. One unit is
# 9.5 cm of door height (compartment plus frame), so a column offers about
# 190 cm of doors, in line with locker towers of about 2 m including the base.
COLUMN_GRID_UNITS = 20
GRID_UNIT_CM = 9.5

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
        height_cm=38,
        width_cm=39,
        depth_cm=64,
        grid_units=4,
        examples=("Sac de linge", "Couette pliée", "Petit appareil"),
    ),
    CompartmentSize.GARMENT: SizeSpec(
        height_cm=183,
        width_cm=38,
        depth_cm=64,
        grid_units=20,
        examples=("Chemises sur cintre", "Costume", "Robe", "Manteau"),
    ),
}
