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
        turnaround_rounds: Rounds between collection and return (3 rounds = 1 day).
    """

    code: str
    name: str
    category: ServiceCategory
    price: Decimal
    size: CompartmentSize
    turnaround_rounds: int


SERVICES: tuple[DemoService, ...] = (
    DemoService(
        "shirt_ironing", "Repassage chemise", ServiceCategory.DRY_CLEANING, Decimal("3.50"), XL, 3
    ),
    DemoService(
        "suit_cleaning", "Nettoyage costume", ServiceCategory.DRY_CLEANING, Decimal("16.00"), XL, 6
    ),
    DemoService(
        "laundry_bag", "Sac de linge lavé-plié", ServiceCategory.LAUNDRY, Decimal("18.00"), L, 3
    ),
    DemoService(
        "duvet_cleaning", "Nettoyage couette", ServiceCategory.LAUNDRY, Decimal("22.00"), L, 6
    ),
    DemoService(
        "shoe_cleaning", "Nettoyage chaussures", ServiceCategory.SHOE_REPAIR, Decimal("12.00"), M, 3
    ),
    DemoService(
        "heel_repair", "Talons refaits", ServiceCategory.SHOE_REPAIR, Decimal("15.00"), M, 6
    ),
    DemoService(
        "hem_alteration", "Ourlet pantalon", ServiceCategory.TAILORING, Decimal("11.00"), M, 6
    ),
    DemoService(
        "watch_battery", "Pile de montre", ServiceCategory.WATCH_REPAIR, Decimal("9.00"), S, 3
    ),
    DemoService(
        "phone_screen",
        "Écran de téléphone",
        ServiceCategory.ELECTRONICS_REPAIR,
        Decimal("79.00"),
        S,
        6,
    ),
    DemoService(
        "watch_strap", "Bracelet de montre", ServiceCategory.WATCH_REPAIR, Decimal("25.00"), S, 6
    ),
    DemoService(
        "zip_repair", "Fermeture éclair", ServiceCategory.TAILORING, Decimal("14.00"), M, 6
    ),
    DemoService(
        "chain_repair",
        "Réparation de chaîne",
        ServiceCategory.JEWELLERY_REPAIR,
        Decimal("20.00"),
        S,
        6,
    ),
    DemoService("key_copy", "Double de clé", ServiceCategory.KEY_CUTTING, Decimal("6.00"), S, 3),
    DemoService(
        "laptop_cleaning",
        "Nettoyage ordinateur portable",
        ServiceCategory.ELECTRONICS_REPAIR,
        Decimal("39.00"),
        L,
        6,
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

# More fictitious partner shops for the customer app (catalogue, search,
# ratings). They take no part in the generated orders (weight 0), so the
# merchant space figures stay those of the six shops above.
DEMO_MERCHANTS += (
    DemoMerchant(
        "demo-pressing-gare",
        "Démo · Pressing de la gare",
        ServiceCategory.DRY_CLEANING,
        (0.003, -0.012),
        0,
    ),
    DemoMerchant(
        "demo-pressing-ile-verte",
        "Démo · Pressing Île Verte",
        ServiceCategory.DRY_CLEANING,
        (0.007, 0.012),
        0,
    ),
    DemoMerchant(
        "demo-linge-express",
        "Démo · Linge express",
        ServiceCategory.LAUNDRY,
        (-0.010, 0.003),
        0,
    ),
    DemoMerchant(
        "demo-cordonnier-halles",
        "Démo · Cordonnier des halles",
        ServiceCategory.SHOE_REPAIR,
        (0.000, -0.006),
        0,
    ),
    DemoMerchant(
        "demo-couture-atelier",
        "Démo · Couture & ajustements",
        ServiceCategory.TAILORING,
        (0.005, 0.000),
        0,
    ),
    DemoMerchant(
        "demo-bijoux",
        "Démo · Atelier bijoux",
        ServiceCategory.JEWELLERY_REPAIR,
        (0.002, 0.004),
        0,
    ),
    DemoMerchant(
        "demo-cles",
        "Démo · Clés minute",
        ServiceCategory.KEY_CUTTING,
        (-0.004, 0.002),
        0,
    ),
    DemoMerchant(
        "demo-repar-info",
        "Démo · Répar'info",
        ServiceCategory.ELECTRONICS_REPAIR,
        (-0.002, 0.011),
        0,
    ),
)

# Platform commission charged to merchants (docs/PRODUCT.md, business model).
COMMISSION_RATE = Decimal("0.10")


# Placeholder comments for fictitious reviews (French, generic on purpose).
REVIEW_COMMENTS: tuple[tuple[int, str], ...] = (
    (5, "Travail impeccable, récupéré le lendemain au casier."),
    (5, "Très pratique, je n'ai plus besoin de traverser la ville."),
    (4, "Bon résultat, délai respecté."),
    (4, "Service soigné, un peu plus long que prévu."),
    (5, "Accueil sympathique par messagerie, devis rapide."),
    (3, "Correct, mais j'aurais aimé être prévenu plus tôt."),
    (4, "Rien à redire, je recommande."),
    (5, "Parfait du début à la fin."),
)


@dataclass(frozen=True)
class SubscriptionPlan:
    """A customer subscription plan (placeholder).

    Attributes:
        code: Stable identifier.
        name: Display name (French).
        monthly_price: Price per month in euros (0 for no subscription).
        consigne_discount: Share taken off consigne prices (0 to 1).
        perks: Benefits shown to customers (French).
    """

    code: str
    name: str
    monthly_price: Decimal
    consigne_discount: Decimal
    perks: tuple[str, ...]


# ASSUMPTION: plans, prices and discounts are demo placeholders, labelled
# "à définir" in the app; the project owner will define the real ones
# (docs/PRODUCT.md, open question 8).
SUBSCRIPTION_PLANS: tuple[SubscriptionPlan, ...] = (
    SubscriptionPlan(
        "free",
        "Sans abonnement",
        Decimal("0.00"),
        Decimal("0"),
        ("Consigne au prix normal", "Commande de services"),
    ),
    SubscriptionPlan(
        "plus",
        "CityPal Plus",
        Decimal("4.90"),
        Decimal("0.5"),
        ("Consigne à -50 %", "Réservation prioritaire"),
    ),
    SubscriptionPlan(
        "premium",
        "CityPal Premium",
        Decimal("9.90"),
        Decimal("0.8"),
        ("Consigne à -80 %", "Réservation prioritaire", "Premier retard offert chaque mois"),
    ),
)

# ASSUMPTION: consigne price per booking without subscription, by compartment
# size (placeholders, open question 9). Hanging compartments are not offered
# for the consigne.
CONSIGNE_PRICES: dict[CompartmentSize, Decimal] = {
    S: Decimal("2.00"),
    M: Decimal("3.00"),
    L: Decimal("4.00"),
}

# Maximum storage time after drop-off (docs/PRODUCT.md §4b).
CONSIGNE_MAX_HOURS = 24
# Minimum notice to book a slot (docs/PRODUCT.md §4b).
CONSIGNE_MIN_NOTICE_HOURS = 4
