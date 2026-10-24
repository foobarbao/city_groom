"""Business logic about lockers: availability and fill-rate statistics."""

from collections import Counter
from collections.abc import Iterable
from dataclasses import dataclass, field

from apps.lockers.models import Compartment
from apps.lockers.sizes import CompartmentSize

# Statuses counting as "in use" for the fill rate: a reserved compartment is
# already unavailable to other customers.
IN_USE_STATUSES = frozenset({Compartment.Status.RESERVED, Compartment.Status.OCCUPIED})


@dataclass
class OccupancyStats:
    """Occupancy figures for a set of compartments.

    Attributes:
        total: Number of compartments, including out-of-service ones.
        in_service: Compartments that can be used (total minus out of service).
        in_use: Reserved or occupied compartments.
        free_by_size: Number of free compartments per size code.
    """

    total: int = 0
    in_service: int = 0
    in_use: int = 0
    free_by_size: dict[str, int] = field(default_factory=dict)

    @property
    def fill_rate(self) -> float:
        """Share of in-service compartments in use, between 0 and 1 (0 if none in service)."""
        if self.in_service == 0:
            return 0.0
        return self.in_use / self.in_service


def compute_occupancy(statuses: Iterable[tuple[str, str]]) -> OccupancyStats:
    """Compute occupancy statistics from ``(size, status)`` pairs.

    Taking plain pairs rather than querysets lets callers compute statistics
    from prefetched data without extra queries.

    Args:
        statuses: One ``(size, status)`` pair per compartment.

    Returns:
        The aggregated statistics. ``free_by_size`` always contains every size
        code, with 0 when no compartment of that size is free.
    """
    stats = OccupancyStats(free_by_size={size.value: 0 for size in CompartmentSize})
    free_counter: Counter[str] = Counter()
    for size, status in statuses:
        stats.total += 1
        if status == Compartment.Status.OUT_OF_SERVICE:
            continue
        stats.in_service += 1
        if status in IN_USE_STATUSES:
            stats.in_use += 1
        elif status == Compartment.Status.FREE:
            free_counter[size] += 1
    stats.free_by_size.update(free_counter)
    return stats
