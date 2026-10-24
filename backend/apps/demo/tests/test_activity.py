from datetime import datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

import pytest

from apps.demo.activity import LockerSite, generate_activity, round_slots
from apps.demo.catalogue import COMMISSION_RATE

PARIS = ZoneInfo("Europe/Paris")
NOW = datetime(2026, 10, 21, 18, 30, tzinfo=PARIS)
# Fake sites for tests (not real places).
LOCKERS = [
    LockerSite("a", "Fake A", 5.72, 45.19),
    LockerSite("b", "Fake B", 5.74, 45.18),
]


def test_generation_is_reproducible_with_a_seed() -> None:
    assert generate_activity(LOCKERS, NOW, seed=1) == generate_activity(LOCKERS, NOW, seed=1)


def test_orders_follow_the_round_timeline() -> None:
    activity = generate_activity(LOCKERS, NOW)
    rounds = {r["starts_at"] for r in activity["rounds"]}
    slots = {s.isoformat() for s in round_slots(NOW.date() - timedelta(days=14), 30)}

    for order in activity["orders"]:
        created = datetime.fromisoformat(order["created_at"])
        assert created <= NOW
        if order["collected_at"]:
            assert order["collected_at"] in slots
            assert order["collected_at"] in rounds
            assert datetime.fromisoformat(order["collected_at"]) > created
        if order["returned_at"]:
            assert datetime.fromisoformat(order["returned_at"]) > datetime.fromisoformat(
                order["collected_at"]
            )


def test_commission_is_ten_percent_of_the_price() -> None:
    for order in generate_activity(LOCKERS, NOW)["orders"]:
        expected = (Decimal(order["price_total"]) * COMMISSION_RATE).quantize(Decimal("0.01"))
        assert Decimal(order["commission"]) == expected


def test_statuses_reflect_the_reference_time() -> None:
    activity = generate_activity(LOCKERS, NOW)
    for order in activity["orders"]:
        if order["status"] == "picked_up":
            assert datetime.fromisoformat(order["picked_up_at"]) <= NOW
        if order["status"] == "awaiting_drop_off":
            assert datetime.fromisoformat(order["deposited_at"]) > NOW


def test_daily_totals_match_orders_and_forecast_covers_next_days() -> None:
    activity = generate_activity(LOCKERS, NOW, future_days=7)

    assert sum(d["orders"] for d in activity["daily"]) == len(activity["orders"])
    assert len(activity["forecast"]) == 7
    assert activity["fictitious"] is True


def test_rounds_are_planned_after_now_and_done_before() -> None:
    for round_ in generate_activity(LOCKERS, NOW)["rounds"]:
        starts = datetime.fromisoformat(round_["starts_at"])
        assert round_["status"] == ("done" if starts <= NOW else "planned")
        assert round_["distance_km"] > 0


def test_invalid_inputs_are_rejected() -> None:
    with pytest.raises(ValueError, match="locker"):
        generate_activity([], NOW)
    with pytest.raises(ValueError, match="timezone"):
        generate_activity(LOCKERS, NOW.replace(tzinfo=None))
