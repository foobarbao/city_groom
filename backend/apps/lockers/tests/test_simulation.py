import random

import pytest

from apps.lockers.models import Compartment, Locker
from apps.lockers.osm import fetch_overpass, parse_strategic_sites, parse_tram_stops
from apps.lockers.simulation import (
    COLUMN_TEMPLATES,
    LOCKER_MODELS,
    create_simulated_locker,
    simulate_occupancy,
    spread_by_category,
    spread_sites,
)
from apps.lockers.tests.factories import (
    FAKE_SITES,
    fake_overpass_payload,
    fake_strategic_payload,
)


@pytest.mark.django_db
def test_create_simulated_locker_builds_the_model_layout() -> None:
    locker = create_simulated_locker(FAKE_SITES[0], code="fake-centre", model="compact")

    expected = sum(len(COLUMN_TEMPLATES[t]) for t in LOCKER_MODELS["compact"])
    compartments = list(locker.compartments.all())
    assert len(compartments) == expected
    assert locker.is_simulated
    assert locker.control_panel_column == LOCKER_MODELS["compact"].index("control")
    assert {c.status for c in compartments} == {Compartment.Status.FREE}
    first = locker.compartments.get(column=0, position=0)
    assert first.label == "A1"


@pytest.mark.django_db
def test_simulate_occupancy_is_reproducible_with_a_seed() -> None:
    lockers = [
        create_simulated_locker(FAKE_SITES[i], code=f"fake-{i}", model="standard") for i in (0, 1)
    ]
    for locker in lockers:
        simulate_occupancy(locker, random.Random(7))

    statuses = [list(locker.compartments.values_list("status", flat=True)) for locker in lockers]
    assert statuses[0] == statuses[1]
    assert Compartment.Status.FREE in statuses[0]


@pytest.mark.django_db
def test_simulate_occupancy_refuses_real_lockers() -> None:
    locker = create_simulated_locker(FAKE_SITES[0], code="real", model="compact")
    Locker.objects.filter(pk=locker.pk).update(is_simulated=False)
    locker.refresh_from_db()

    with pytest.raises(ValueError, match="real locker"):
        simulate_occupancy(locker, random.Random(1))


def test_spread_sites_avoids_clustering() -> None:
    chosen = spread_sites(FAKE_SITES, 4)

    names = {site.name for site in chosen}
    assert len(chosen) == 4
    # The two central sites are 60 m apart: only one of them is kept.
    assert len(names & {"Fake Centre", "Fake Centre Bis"}) == 1


def test_spread_sites_handles_edge_cases() -> None:
    assert spread_sites(FAKE_SITES, 0) == []
    assert spread_sites([], 3) == []
    assert len(spread_sites(FAKE_SITES, 50)) == len(FAKE_SITES)


def test_parse_tram_stops_merges_nodes_by_name_and_skips_unnamed() -> None:
    sites = parse_tram_stops(fake_overpass_payload())

    assert [s.name for s in sites] == ["Fake Stop", "Other Stop"]
    assert sites[0].latitude == pytest.approx(45.11)
    assert sites[0].longitude == pytest.approx(5.71)
    assert "1, 2" in sites[0].source


def test_fetch_overpass_rejects_non_https_urls() -> None:
    with pytest.raises(ValueError, match="HTTPS"):
        fetch_overpass("query", url="file:///etc/passwd")


def test_parse_strategic_sites_keeps_named_places_with_a_category() -> None:
    pairs = parse_strategic_sites(fake_strategic_payload())

    assert [(category, site.name) for category, site in pairs] == [
        ("campus", "Fake Campus"),
        ("tourism", "Fake Museum"),
        ("transport", "Fake Station"),
    ]
    # Ways are placed at their centre.
    assert pairs[0][1].latitude == 45.21


def test_spread_by_category_takes_categories_in_turn() -> None:
    candidates = [("a", site) for site in FAKE_SITES[:3]] + [("b", FAKE_SITES[3])]

    chosen = spread_by_category(candidates, 2)

    assert sorted(category for category, _ in chosen) == ["a", "b"]
    assert len(spread_by_category(candidates, 10)) == 4
