from apps.lockers.models import Compartment
from apps.lockers.services import compute_occupancy

FREE = Compartment.Status.FREE
RESERVED = Compartment.Status.RESERVED
OCCUPIED = Compartment.Status.OCCUPIED
OUT = Compartment.Status.OUT_OF_SERVICE


def test_compute_occupancy_counts_reserved_and_occupied_as_in_use() -> None:
    stats = compute_occupancy([("S", FREE), ("S", RESERVED), ("M", OCCUPIED), ("L", OUT)])

    assert stats.total == 4
    assert stats.in_service == 3
    assert stats.in_use == 2
    assert stats.fill_rate == 2 / 3
    assert stats.free_by_size == {"S": 1, "M": 0, "L": 0, "XL": 0}


def test_fill_rate_is_zero_without_compartments_in_service() -> None:
    assert compute_occupancy([]).fill_rate == 0.0
    assert compute_occupancy([("S", OUT)]).fill_rate == 0.0
