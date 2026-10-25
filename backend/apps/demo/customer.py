"""Customer catalogue of the hosted demo: partner shops, reviews, plans, rules.

Builds the data shown by the customer app besides the real lockers and
businesses: the **fictitious** partner shops ("Démo · …") with their services
and **fictitious** reviews, the placeholder subscription plans, and the
consigne and round rules of docs/PRODUCT.md. Labelled as fictitious in the
app (CODING_STANDARDS.md §10).

PROD: partner shops, offers and reviews come from the database (ADR-0008);
plans and prices from the operator's settings.
"""

import random
from datetime import datetime, timedelta
from typing import Any

from apps.demo.activity import ROUND_TIMES, TIMEZONE, merchant_position
from apps.demo.catalogue import (
    CONSIGNE_MAX_HOURS,
    CONSIGNE_MIN_NOTICE_HOURS,
    CONSIGNE_PRICES,
    CONSIGNE_TRANSFER_PRICE,
    DEMO_MERCHANTS,
    REVIEW_COMMENTS,
    SERVICES_BY_CATEGORY,
    SUBSCRIPTION_PLANS,
    DemoMerchant,
)

# French first names used as review authors (initial only is shown).
AUTHORS = ("Camille", "Léo", "Inès", "Hugo", "Manon", "Yanis", "Chloé", "Nora", "Théo", "Lucie")

# Slots between rounds (docs/PRODUCT.md §4), in round order: code, label.
SLOTS = (("morning", "Matinée"), ("afternoon", "Après-midi"), ("evening", "Soirée"))


def _reviews(merchant: DemoMerchant, now: datetime, rng: random.Random) -> dict[str, Any]:
    """Fictitious ratings of one shop: average, count, distribution, recent reviews."""
    count = rng.randint(6, 48)
    # Mostly good ratings, as expected from shops selected as partners.
    ratings = [rng.choices((5, 4, 3, 2, 1), (55, 30, 10, 3, 2))[0] for _ in range(count)]
    recent = []
    for days_ago in sorted(rng.sample(range(1, 60), k=min(4, count))):
        rating, comment = rng.choice(REVIEW_COMMENTS)
        recent.append(
            {
                "author": f"{rng.choice(AUTHORS)} {chr(rng.randint(65, 90))}.",
                "rating": rating,
                "comment": comment,
                "date": (now - timedelta(days=days_ago)).date().isoformat(),
                "verified_order": True,
            }
        )
    return {
        "average": round(sum(ratings) / count, 1),
        "count": count,
        "distribution": {str(star): ratings.count(star) for star in (5, 4, 3, 2, 1)},
        "recent": recent,
    }


def build_customer_catalogue(now: datetime, seed: int = 42) -> dict[str, Any]:
    """Build the customer catalogue of the demo.

    Args:
        now: Reference time (timezone-aware), used to date the reviews.
        seed: Random seed, for a reproducible demo.

    Returns:
        JSON-serialisable catalogue.
    """
    rng = random.Random(seed)  # noqa: S311 - demo data, not security-related
    now = now.astimezone(TIMEZONE)
    return {
        "fictitious": True,
        "partners": [
            {
                "code": m.code,
                "name": m.name,
                "category": m.category.value,
                "latitude": merchant_position(m)[0],
                "longitude": merchant_position(m)[1],
                "services": [s.code for s in SERVICES_BY_CATEGORY.get(m.category, [])],
                "reviews": _reviews(m, now, rng),
            }
            for m in DEMO_MERCHANTS
        ],
        "services": [
            {
                "code": s.code,
                "name": s.name,
                "category": s.category.value,
                "price": str(s.price),
                "size": s.size.value,
                "turnaround_rounds": s.turnaround_rounds,
                "keywords": list(s.keywords),
            }
            for services in SERVICES_BY_CATEGORY.values()
            for s in services
        ],
        "plans": [
            {
                "code": p.code,
                "name": p.name,
                "monthly_price": str(p.monthly_price),
                "consigne_discount": str(p.consigne_discount),
                "transfers_included": p.transfers_included,
                "perks": list(p.perks),
            }
            for p in SUBSCRIPTION_PLANS
        ],
        "consigne": {
            "max_hours": CONSIGNE_MAX_HOURS,
            "min_notice_hours": CONSIGNE_MIN_NOTICE_HOURS,
            "prices": {size.value: str(price) for size, price in CONSIGNE_PRICES.items()},
            "transfer_price": str(CONSIGNE_TRANSFER_PRICE),
        },
        "round_times": [t.strftime("%H:%M") for t in ROUND_TIMES],
        "slots": [
            {
                "code": code,
                "label": label,
                "starts": ROUND_TIMES[index].strftime("%H:%M"),
                "ends": ROUND_TIMES[(index + 1) % len(ROUND_TIMES)].strftime("%H:%M"),
            }
            for index, (code, label) in enumerate(SLOTS)
        ],
    }
