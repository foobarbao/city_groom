"""Interface every locker integration must implement.

Business code (orders, rounds…) only calls a ``LockerDriver`` obtained from
``get_driver``; it never depends on a vendor. Adding a real vendor means adding
an implementation of this protocol and selecting it in ``get_driver``.

Real lockers on the market report door movements as events (pushed through
webhooks, a message broker or a phone sync for offline Bluetooth lockers), so
the interface is event-oriented: commands go out, ``LockerEvent`` rows come
back.
"""

from typing import Protocol

from apps.lockers.models import Compartment, Locker


class LockerDriverError(Exception):
    """A command could not be delivered to the locker or was refused by it."""


class LockerDriver(Protocol):
    """Commands City Groom can send to a locker."""

    def open_compartment(self, compartment: Compartment, access_method: str) -> None:
        """Ask the locker to unlock one compartment door.

        The result is reported asynchronously through ``LockerEvent`` rows
        (``door_opened`` then ``door_closed``).

        Args:
            compartment: Compartment to open; must belong to the driver's locker.
            access_method: How the user identified (``AccessMethod`` value).

        Raises:
            LockerDriverError: If the command cannot be delivered or is refused.
        """
        ...


def get_driver(locker: Locker) -> LockerDriver:
    """Return the driver able to control ``locker``.

    Raises:
        LockerDriverError: If no driver exists for this locker yet.
    """
    # Imported here to avoid a circular import between the driver modules.
    from apps.lockers.drivers.simulated import SimulatedLockerDriver

    if locker.is_simulated:
        return SimulatedLockerDriver(locker)
    # PROD: add vendor drivers once the locker partner is chosen.
    raise LockerDriverError(f"No driver available for real locker {locker.code!r}")
