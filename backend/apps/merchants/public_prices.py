"""Public prices of chain shops shown as non-partners (real data, not demo).

The project owner decided on 2026-10-26 to show the real 5àsec shops of the
area (OpenStreetMap) with the prices 5àsec publishes, rather than leaving
them out like other chains. No partnership exists: the apps show these
prices for information only, with their source and the date they were read,
and never offer to order them through CityPal (docs/PRODUCT.md §10).

Prices are copied by hand from the brand's public page and must be read
again before relying on them; amounts in euros, VAT included, as displayed.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class PublicPrice:
    """One offer as published by the brand.

    Attributes:
        name: Offer name, as published.
        section: Section of the brand's page it was read in.
        price: Current price.
        regular_price: Price before the brand's own discount (equal to
            ``price`` when there is none).
    """

    name: str
    section: str
    price: Decimal
    regular_price: Decimal


@dataclass(frozen=True)
class PublicPriceList:
    """Prices of one brand, with where and when they were read."""

    brand: str
    title: str
    source_url: str
    checked_on: date
    prices: tuple[PublicPrice, ...]


def _price(name: str, section: str, price: str, regular: str | None = None) -> PublicPrice:
    return PublicPrice(name, section, Decimal(price), Decimal(regular or price))


CLOTHES = "Vêtements"
HOUSEHOLD = "Linge de maison"

# Read on https://www.5asec.fr/fr/nos-offres-web/ (categories "vetements" and
# "literie"; "forfaits" repeats offers of both) on 2026-10-26.
FIVE_A_SEC = PublicPriceList(
    brand="5àsec",
    title="Offres web 5àsec",
    source_url="https://www.5asec.fr/fr/nos-offres-web/",
    checked_on=date(2026, 10, 26),
    prices=(
        _price("Pack 5 chemises", CLOTHES, "20.90", "24.00"),
        _price("Forfait 10 chemises", CLOTHES, "39.90", "48.00"),
        _price("Forfait 20 chemises", CLOTHES, "66.00", "94.00"),
        _price("Forfait 60 chemises", CLOTHES, "177.00", "282.00"),
        _price("Pack 2 blazers", CLOTHES, "14.50", "18.30"),
        _price("Pack business", CLOTHES, "20.50", "25.94"),
        _price("Pack 3 pour 2 : costumes", CLOTHES, "31.90", "48.30"),
        _price("Pack 3 pour 2 : manteaux, imperméables et trenchs", CLOTHES, "29.90", "46.20"),
        _price("Pack 3 pour 2 : doudounes, anoraks, parkas", CLOTHES, "39.90", "57.00"),
        _price("Pack rentrée 10 pièces", CLOTHES, "34.95", "39.00"),
        _price("Forfait Essentiel +", CLOTHES, "117.00"),
        _price("Nettoyage sneakers", CLOTHES, "52.95", "58.00"),
        _price("Parure de lit double lavée et pliée", HOUSEHOLD, "9.90", "12.90"),
        _price("Forfait 4 draps", HOUSEHOLD, "15.60", "19.60"),
        _price("Forfait 4 housses de couette", HOUSEHOLD, "30.00", "39.50"),
        _price("Offre couette + soin textile offert", HOUSEHOLD, "25.50", "30.95"),
        _price("Pack literie : Couette + parure de lit", HOUSEHOLD, "29.90", "38.40"),
        _price("Pack literie : couette et 2 oreillers", HOUSEHOLD, "44.90", "60.00"),
    ),
)

PUBLIC_PRICE_LISTS: tuple[PublicPriceList, ...] = (FIVE_A_SEC,)
