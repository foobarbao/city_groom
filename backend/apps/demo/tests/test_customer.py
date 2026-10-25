"""Tests of the customer catalogue of the demo."""

from datetime import datetime
from zoneinfo import ZoneInfo

from apps.demo.catalogue import DEMO_MERCHANTS
from apps.demo.customer import build_customer_catalogue

NOW = datetime(2026, 10, 24, 18, 0, tzinfo=ZoneInfo("Europe/Paris"))


def test_catalogue_is_reproducible_and_fictitious() -> None:
    catalogue = build_customer_catalogue(NOW)

    assert catalogue == build_customer_catalogue(NOW)
    assert catalogue["fictitious"] is True
    assert len(catalogue["partners"]) == len(DEMO_MERCHANTS)
    assert all(p["name"].startswith("Démo · ") for p in catalogue["partners"])


def test_reviews_are_consistent() -> None:
    for partner in build_customer_catalogue(NOW)["partners"]:
        reviews = partner["reviews"]
        assert sum(reviews["distribution"].values()) == reviews["count"]
        assert 1 <= reviews["average"] <= 5
        assert all(r["verified_order"] for r in reviews["recent"])
        assert partner["services"], partner["code"]


def test_slots_follow_the_three_rounds() -> None:
    catalogue = build_customer_catalogue(NOW)

    assert [(s["starts"], s["ends"]) for s in catalogue["slots"]] == [
        ("07:00", "14:00"),
        ("14:00", "20:00"),
        ("20:00", "07:00"),
    ]
    assert catalogue["consigne"]["min_notice_hours"] == 4
    assert catalogue["consigne"]["max_hours"] == 24


def test_plans_include_transfers() -> None:
    catalogue = build_customer_catalogue(NOW)

    assert [p["transfers_included"] for p in catalogue["plans"]] == [0, 2, 6]
    assert catalogue["consigne"]["transfer_price"] == "2.00"


def test_services_have_search_keywords() -> None:
    services = {s["code"]: s for s in build_customer_catalogue(NOW)["services"]}

    assert "semelle" in services["sole_replacement"]["keywords"]
    assert all(s["keywords"] for s in services.values())
