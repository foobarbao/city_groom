"""Driver for simulated lockers: reproduces what a real locker would report.

Opening a door produces a ``door_opened`` event and, after a realistic delay
for the user to drop or collect the item, a ``door_closed`` event. Events are
timestamped as a real locker would, so real-time features can be built and
tested before any hardware exists.
"""

import random
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.lockers.drivers.base import LockerDriverError
from apps.lockers.models import AccessMethod, Compartment, Locker, LockerEvent

# Time a user typically keeps a door open to drop or collect an item. These
# bounds are a City Groom assumption, to be replaced by measured data.
MIN_DOOR_OPEN_SECONDS = 8
MAX_DOOR_OPEN_SECONDS = 45


class SimulatedLockerDriver:
    """``LockerDriver`` implementation for lockers flagged ``is_simulated``."""

    def __init__(self, locker: Locker, rng: random.Random | None = None) -> None:
        """Bind the driver to a simulated locker.

        Args:
            locker: The simulated locker to control.
            rng: Random generator, seeded in tests for reproducibility.

        Raises:
            LockerDriverError: If the locker is a real one.
        """
        if not locker.is_simulated:
            raise LockerDriverError(f"Locker {locker.code!r} is not simulated")
        self.locker = locker
        self.rng = rng or random.Random()  # noqa: S311 - simulation only, not security-related

    @transaction.atomic
    def open_compartment(self, compartment: Compartment, access_method: str) -> None:
        """Record the door opening and closing a real locker would report.

        Raises:
            LockerDriverError: If the compartment belongs to another locker, is
                out of service, or the access method is not offered by the locker.
        """
        if compartment.locker_id != self.locker.pk:
            raise LockerDriverError("Compartment belongs to another locker")
        if compartment.status == Compartment.Status.OUT_OF_SERVICE:
            raise LockerDriverError(f"Compartment {compartment.label} is out of service")
        if access_method not in self.locker.access_methods:
            raise LockerDriverError(f"Access method {access_method!r} not offered by this locker")

        opened_at = timezone.now()
        open_for = timedelta(seconds=self.rng.uniform(MIN_DOOR_OPEN_SECONDS, MAX_DOOR_OPEN_SECONDS))
        LockerEvent.objects.bulk_create(
            [
                LockerEvent(
                    locker=self.locker,
                    compartment=compartment,
                    kind=LockerEvent.Kind.DOOR_OPENED,
                    access_method=AccessMethod(access_method),
                    occurred_at=opened_at,
                ),
                LockerEvent(
                    locker=self.locker,
                    compartment=compartment,
                    kind=LockerEvent.Kind.DOOR_CLOSED,
                    occurred_at=opened_at + open_for,
                ),
            ]
        )
        Locker.objects.filter(pk=self.locker.pk).update(last_seen_at=opened_at)
