"""Fictitious service catalogue and demo merchants.

Everything here is **placeholder demo data** (CODING_STANDARDS.md §10):

- service names follow the categories requested by the project owner
  (laundry, ironing, shoe repair, tailoring, repairs);
- ASSUMPTION: prices are rough placeholders, not researched Grenoble prices
  (open question in docs/PRODUCT.md);
- demo merchants are fictitious businesses ("Démo · …"), so that no real
  business is shown with invented orders or revenue.

PROD: replace with the real catalogue and merchant accounts.
"""

from dataclasses import dataclass
from decimal import Decimal

from apps.lockers.sizes import CompartmentSize
from apps.merchants.categories import ServiceCategory

S, M, L, XL = (
    CompartmentSize.SMALL,
    CompartmentSize.MEDIUM,
    CompartmentSize.LARGE,
    CompartmentSize.GARMENT,
)


@dataclass(frozen=True)
class DemoService:
    """A standard service sold at a fixed price per item.

    Attributes:
        code: Stable identifier.
        name: Display name (French).
        category: Service category.
        price: Price per item, in euros (placeholder).
        size: Compartment size the item needs.
        turnaround_rounds: Rounds between collection and return (2 rounds = 1 day).
    """

    code: str
    name: str
    category: ServiceCategory
    price: Decimal
    size: CompartmentSize
    turnaround_rounds: int


SERVICES: tuple[DemoService, ...] = (
    DemoService(
        "shirt_ironing", "Repassage chemise", ServiceCategory.DRY_CLEANING, Decimal("3.50"), XL, 2
    ),
    DemoService(
        "suit_cleaning", "Nettoyage costume", ServiceCategory.DRY_CLEANING, Decimal("16.00"), XL, 4
    ),
    DemoService(
        "laundry_bag", "Sac de linge lavé-plié", ServiceCategory.LAUNDRY, Decimal("18.00"), L, 2
    ),
    DemoService(
        "duvet_cleaning", "Nettoyage couette", ServiceCategory.LAUNDRY, Decimal("22.00"), L, 4
    ),
    DemoService(
        "shoe_cleaning", "Nettoyage chaussures", ServiceCategory.SHOE_REPAIR, Decimal("12.00"), M, 2
    ),
    DemoService(
        "heel_repair", "Talons refaits", ServiceCategory.SHOE_REPAIR, Decimal("15.00"), M, 4
    ),
    DemoService(
        "hem_alteration", "Ourlet pantalon", ServiceCategory.TAILORING, Decimal("11.00"), M, 4
    ),
    DemoService(
        "watch_battery", "Pile de montre", ServiceCategory.WATCH_REPAIR, Decimal("9.00"), S, 2
    ),
    DemoService(
        "phone_screen",
        "Écran de téléphone",
        ServiceCategory.ELECTRONICS_REPAIR,
        Decimal("79.00"),
        S,
        4,
    ),
)

SERVICES_BY_CATEGORY: dict[ServiceCategory, list[DemoService]] = {}
for _service in SERVICES:
    SERVICES_BY_CATEGORY.setdefault(_service.category, []).append(_service)


@dataclass(frozen=True)
class DemoMerchant:
    """A fictitious merchant used for orders and the merchant space.

    Attributes:
        code: Stable identifier.
        name: Display name, always prefixed with "Démo ·".
        category: Service category.
        offset: (north, east) offset in degrees from the centre of Grenoble;
            positions are fictitious.
        weight: Relative share of orders.
    """

    code: str
    name: str
    category: ServiceCategory
    offset: tuple[float, float]
    weight: int


DEMO_MERCHANTS: tuple[DemoMerchant, ...] = (
    DemoMerchant(
        "demo-pressing",
        "Démo · Pressing du centre",
        ServiceCategory.DRY_CLEANING,
        (0.002, -0.004),
        5,
    ),
    DemoMerchant(
        "demo-blanchisserie", "Démo · Blanchisserie", ServiceCategory.LAUNDRY, (-0.006, 0.008), 4
    ),
    DemoMerchant(
        "demo-cordonnerie", "Démo · Cordonnerie", ServiceCategory.SHOE_REPAIR, (0.004, 0.006), 3
    ),
    DemoMerchant(
        "demo-retouches",
        "Démo · Atelier de retouches",
        ServiceCategory.TAILORING,
        (-0.003, -0.009),
        2,
    ),
    DemoMerchant(
        "demo-horlogerie", "Démo · Horlogerie", ServiceCategory.WATCH_REPAIR, (0.001, 0.002), 1
    ),
    DemoMerchant(
        "demo-reparation",
        "Démo · Réparation mobile",
        ServiceCategory.ELECTRONICS_REPAIR,
        (-0.008, -0.002),
        1,
    ),
)

# Platform commission charged to merchants (docs/PRODUCT.md, business model).
COMMISSION_RATE = Decimal("0.10")
