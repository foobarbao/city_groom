"""Generation of fictitious activity for the hosted demo.

Produces orders, courier rounds, daily figures and a forecast from the real
locker network (simulated lockers at real tram stops) and the fictitious demo
merchants of ``catalogue.py``. Everything produced here is **fictitious** and
is labelled as such in the apps (CODING_STANDARDS.md §10).

Model, following docs/PRODUCT.md:

- three rounds per day at 07:00, 14:00 and 20:00 (Europe/Paris); an item
  dropped in a locker is collected at the next round and brought to the
  merchant;
- after the service's turnaround (a number of rounds), the item is returned to
  the pickup locker at a round, then collected by the customer before the
  next round (a few customers are late and pay a small fee);
- ASSUMPTION: volumes are deliberately modest (about 25 orders a day at the
  start of the window, +1.5 % a day, lower at weekends), as requested by the
  project owner; to be refined together.

PROD: replace with real orders, rounds and forecasts computed from them.
"""

import math
import random
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any
from zoneinfo import ZoneInfo

from apps.demo.catalogue import (
    COMMISSION_RATE,
    DEMO_MERCHANTS,
    SERVICES_BY_CATEGORY,
    DemoMerchant,
    DemoService,
)

TIMEZONE = ZoneInfo("Europe/Paris")
ROUND_TIMES = (time(7, 0), time(14, 0), time(20, 0))

# Centre of Grenoble, origin of the fictitious merchant positions and depot.
CENTRE = (45.1885, 5.7245)

BASE_DAILY_ORDERS = 25.0
DAILY_GROWTH = 0.015
WEEKDAY_FACTORS = (1.0, 1.0, 1.0, 1.05, 1.1, 0.8, 0.5)  # Monday … Sunday
LATE_PICKUP_PROBABILITY = 0.04
SAME_LOCKER_PROBABILITY = 0.7

# Rounds are estimated as a nearest-neighbour tour from a depot in the centre;
# real streets are longer than straight lines. ASSUMPTION: detour factor 1.3.
DETOUR_FACTOR = 1.3


@dataclass(frozen=True)
class LockerSite:
    """A locker of the network, as used by the generator."""

    code: str
    name: str
    longitude: float
    latitude: float


def _distance_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Great-circle distance between two (latitude, longitude) points, in km."""
    lat1, lon1, lat2, lon2 = map(math.radians, (*a, *b))
    h = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    )
    return 2 * 6371 * math.asin(math.sqrt(h))


def _tour_km(points: Sequence[tuple[float, float]]) -> float:
    """Length of a nearest-neighbour tour from the centre and back, with detours."""
    remaining = list(points)
    current = CENTRE
    total = 0.0
    while remaining:
        nearest = min(remaining, key=lambda p: _distance_km(current, p))
        total += _distance_km(current, nearest)
        remaining.remove(nearest)
        current = nearest
    total += _distance_km(current, CENTRE)
    return round(total * DETOUR_FACTOR, 1)


def merchant_position(merchant: DemoMerchant) -> tuple[float, float]:
    """Return the fictitious (latitude, longitude) of a demo merchant."""
    return CENTRE[0] + merchant.offset[0], CENTRE[1] + merchant.offset[1]


def expected_orders(day_index: int, weekday: int) -> float:
    """Mean number of orders on a day, ``day_index`` days after the window start."""
    return BASE_DAILY_ORDERS * (1 + DAILY_GROWTH) ** day_index * WEEKDAY_FACTORS[weekday]


def round_slots(start: date, days: int) -> list[datetime]:
    """Return every round time from ``start`` for ``days`` days, in order."""
    return [
        datetime.combine(start + timedelta(days=d), t, tzinfo=TIMEZONE)
        for d in range(days)
        for t in ROUND_TIMES
    ]


def _next_round(moment: datetime, slots: Sequence[datetime]) -> datetime | None:
    """First round strictly after ``moment``, or None beyond the window."""
    return next((slot for slot in slots if slot > moment), None)


def _items_for(service: DemoService, rng: random.Random) -> int:
    """Number of items in one order (shirts come in batches)."""
    if service.code == "shirt_ironing":
        return rng.randint(2, 6)
    return rng.choice((1, 1, 1, 2))


def generate_activity(
    lockers: Sequence[LockerSite],
    now: datetime,
    past_days: int = 14,
    future_days: int = 7,
    seed: int = 42,
) -> dict[str, Any]:
    """Generate the fictitious activity of the network around ``now``.

    Args:
        lockers: Lockers of the network (at least one).
        now: Reference time; orders are generated up to it and their status
            computed at it. Must be timezone-aware.
        past_days: Days of history before today.
        future_days: Days of planned rounds and forecast after today.
        seed: Random seed, for reproducible demos.

    Returns:
        JSON-serialisable activity (orders, rounds, daily figures, forecast).

    Raises:
        ValueError: If ``lockers`` is empty or ``now`` is naive.
    """
    if not lockers:
        raise ValueError("At least one locker is needed")
    if now.tzinfo is None:
        raise ValueError("now must be timezone-aware")
    rng = random.Random(seed)  # noqa: S311 - demo data, not security-related
    now = now.astimezone(TIMEZONE)
    today = now.date()
    start = today - timedelta(days=past_days)
    slots = round_slots(start, past_days + future_days + 2)
    # Shops with no order weight only appear in the customer catalogue.
    merchants = [m for m in DEMO_MERCHANTS if m.weight > 0]
    weights = [m.weight for m in merchants]

    orders: list[dict[str, Any]] = []
    for day_index in range(past_days + 1):
        day = start + timedelta(days=day_index)
        count = max(0, round(rng.gauss(expected_orders(day_index, day.weekday()), 3)))
        for _ in range(count):
            created = datetime.combine(day, time(7), tzinfo=TIMEZONE) + timedelta(
                minutes=rng.randint(0, 15 * 60)
            )
            if created > now:
                continue
            orders.append(_order(len(orders) + 1, created, merchants, weights, lockers, slots, rng))

    for order in orders:
        order["status"] = _status(order, now)

    return {
        "fictitious": True,
        "generated_at": now.isoformat(),
        "timezone": str(TIMEZONE),
        "round_times": [t.strftime("%H:%M") for t in ROUND_TIMES],
        "commission_rate": str(COMMISSION_RATE),
        "merchants": [
            {
                "code": m.code,
                "name": m.name,
                "category": m.category.value,
                "latitude": merchant_position(m)[0],
                "longitude": merchant_position(m)[1],
            }
            for m in merchants
        ],
        "services": [
            {
                "code": s.code,
                "name": s.name,
                "category": s.category.value,
                "price": str(s.price),
                "size": s.size.value,
            }
            for services in SERVICES_BY_CATEGORY.values()
            for s in services
        ],
        "orders": orders,
        "rounds": _rounds(orders, lockers, merchants, slots, now, today, future_days),
        "daily": _daily(orders, start, past_days),
        "forecast": _forecast(orders, today, past_days, future_days),
    }


def _order(
    number: int,
    created: datetime,
    merchants: list[DemoMerchant],
    weights: list[int],
    lockers: Sequence[LockerSite],
    slots: Sequence[datetime],
    rng: random.Random,
) -> dict[str, Any]:
    """Build one order and its timeline (None for steps beyond the window)."""
    merchant = rng.choices(merchants, weights)[0]
    service = rng.choice(SERVICES_BY_CATEGORY[merchant.category])
    items = _items_for(service, rng)
    drop = rng.choice(lockers)
    pickup = drop if rng.random() < SAME_LOCKER_PROBABILITY else rng.choice(lockers)
    deposited = created + timedelta(minutes=rng.randint(10, 150))
    collected = _next_round(deposited, slots)
    returned: datetime | None = None
    if collected is not None:
        index = list(slots).index(collected) + service.turnaround_rounds
        returned = slots[index] if index < len(slots) else None
    late = rng.random() < LATE_PICKUP_PROBABILITY
    picked_up = None
    deadline = _next_round(returned, slots) if returned is not None else None
    if returned is not None and deadline is not None:
        # The pickup slot runs until the next round (docs/PRODUCT.md §4).
        slot_minutes = int((deadline - returned).total_seconds() // 60)
        delay = (
            deadline - returned + timedelta(hours=rng.randint(1, 10))
            if late
            else timedelta(minutes=rng.randint(30, max(31, slot_minutes - 15)))
        )
        picked_up = returned + delay
    total = service.price * items
    return {
        "id": f"D-{number:05d}",
        "merchant": merchant.code,
        "service": service.code,
        "items": items,
        "size": service.size.value,
        "price_total": str(total),
        "commission": str((total * COMMISSION_RATE).quantize(Decimal("0.01"))),
        "drop_locker": drop.code,
        "pickup_locker": pickup.code,
        "created_at": created.isoformat(),
        "deposited_at": deposited.isoformat(),
        "collected_at": collected.isoformat() if collected else None,
        "returned_at": returned.isoformat() if returned else None,
        "picked_up_at": picked_up.isoformat() if picked_up else None,
        "late_pickup": late,
    }


def _at(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None


def _status(order: dict[str, Any], now: datetime) -> str:
    """Status of an order at ``now``, from its timeline."""
    steps = [
        ("picked_up", order["picked_up_at"]),
        ("ready_for_pickup", order["returned_at"]),
        ("at_merchant", order["collected_at"]),
        ("in_locker", order["deposited_at"]),
    ]
    for status, moment in steps:
        when = _at(moment)
        if when is not None and when <= now:
            return status
    return "awaiting_drop_off"


def _rounds(
    orders: list[dict[str, Any]],
    lockers: Sequence[LockerSite],
    merchants: list[DemoMerchant],
    slots: Sequence[datetime],
    now: datetime,
    today: date,
    future_days: int,
) -> list[dict[str, Any]]:
    """Courier rounds: items collected from lockers and returned to them."""
    lockers_by_code = {locker.code: locker for locker in lockers}
    merchants_by_code = {m.code: m for m in merchants}
    last_day = today + timedelta(days=future_days)
    rounds = []
    for slot in slots:
        if slot.date() > last_day:
            break
        iso = slot.isoformat()
        collected = [o for o in orders if o["collected_at"] == iso]
        returned = [o for o in orders if o["returned_at"] == iso]
        if not collected and not returned:
            continue
        locker_codes = sorted(
            {o["drop_locker"] for o in collected} | {o["pickup_locker"] for o in returned}
        )
        merchant_codes = sorted({o["merchant"] for o in collected + returned})
        points = [
            (lockers_by_code[c].latitude, lockers_by_code[c].longitude) for c in locker_codes
        ] + [merchant_position(merchants_by_code[c]) for c in merchant_codes]
        rounds.append(
            {
                "id": f"R-{slot:%Y%m%d-%H%M}",
                "starts_at": iso,
                "status": "done" if slot <= now else "planned",
                "items_collected": sum(o["items"] for o in collected),
                "items_returned": sum(o["items"] for o in returned),
                "locker_stops": locker_codes,
                "merchant_stops": merchant_codes,
                "distance_km": _tour_km(points),
            }
        )
    return rounds


def _daily(orders: list[dict[str, Any]], start: date, past_days: int) -> list[dict[str, Any]]:
    """Orders, items, revenue and commission per day of the history."""
    daily = []
    for d in range(past_days + 1):
        day = start + timedelta(days=d)
        of_day = [o for o in orders if datetime.fromisoformat(o["created_at"]).date() == day]
        daily.append(
            {
                "date": day.isoformat(),
                "orders": len(of_day),
                "items": sum(o["items"] for o in of_day),
                "revenue": str(sum((Decimal(o["price_total"]) for o in of_day), Decimal(0))),
                "commission": str(sum((Decimal(o["commission"]) for o in of_day), Decimal(0))),
            }
        )
    return daily


def _forecast(
    orders: list[dict[str, Any]], today: date, past_days: int, future_days: int
) -> list[dict[str, Any]]:
    """Expected orders and items for the next days, from the demo growth model."""
    items_per_order = sum(o["items"] for o in orders) / len(orders) if orders else 1.0
    forecast = []
    for d in range(1, future_days + 1):
        day = today + timedelta(days=d)
        mean = expected_orders(past_days + d, day.weekday())
        forecast.append(
            {
                "date": day.isoformat(),
                "orders": round(mean),
                "items": round(mean * items_per_order),
            }
        )
    return forecast
