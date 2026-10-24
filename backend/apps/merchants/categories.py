"""Service categories of merchants and how they map to OpenStreetMap tags.

Only businesses whose service applies to items that fit in a locker are in
scope; food businesses are excluded (red line, docs/PRODUCT.md). The tag list
is a first selection from documented OpenStreetMap tags; check it against the
real Grenoble data at the first import and adjust (docs/DATA_SOURCES.md).
"""

from django.db import models


class ServiceCategory(models.TextChoices):
    """Kind of service a merchant offers."""

    LAUNDRY = "laundry", "Blanchisserie / laverie"
    DRY_CLEANING = "dry_cleaning", "Pressing"
    SHOE_REPAIR = "shoe_repair", "Cordonnerie"
    TAILORING = "tailoring", "Retouches / couture"
    WATCH_REPAIR = "watch_repair", "Horlogerie"
    JEWELLERY_REPAIR = "jewellery_repair", "Bijouterie (réparation)"
    ELECTRONICS_REPAIR = "electronics_repair", "Réparation électronique"
    KEY_CUTTING = "key_cutting", "Clés / serrurerie"


# (OSM key, OSM value) -> category. Checked in this order; the first match wins.
OSM_TAG_CATEGORIES: list[tuple[str, str, ServiceCategory]] = [
    ("shop", "dry_cleaning", ServiceCategory.DRY_CLEANING),
    ("shop", "laundry", ServiceCategory.LAUNDRY),
    ("shop", "shoe_repair", ServiceCategory.SHOE_REPAIR),
    ("craft", "shoemaker", ServiceCategory.SHOE_REPAIR),
    ("shop", "tailor", ServiceCategory.TAILORING),
    ("craft", "tailor", ServiceCategory.TAILORING),
    ("craft", "dressmaker", ServiceCategory.TAILORING),
    ("craft", "watchmaker", ServiceCategory.WATCH_REPAIR),
    ("craft", "jeweller", ServiceCategory.JEWELLERY_REPAIR),
    ("craft", "electronics_repair", ServiceCategory.ELECTRONICS_REPAIR),
    ("craft", "key_cutter", ServiceCategory.KEY_CUTTING),
    ("shop", "locksmith", ServiceCategory.KEY_CUTTING),
]
