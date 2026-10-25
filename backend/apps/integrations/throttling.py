"""Rate limiting of integration API keys.

Each key gets its own budget, identified by the key prefix (the public part of
the key), independently of the caller's IP address.
"""

from typing import TYPE_CHECKING

from rest_framework.throttling import SimpleRateThrottle
from rest_framework_api_key.permissions import KeyParser

# Type-only imports: DRF imports this module while ``rest_framework.views`` is
# still loading (throttle classes are read from settings), so importing views
# here at runtime would be circular.
if TYPE_CHECKING:
    from rest_framework.request import Request
    from rest_framework.views import APIView


class APIKeyRateThrottle(SimpleRateThrottle):
    """Throttle requests carrying an API key, per key (rate: ``api_key`` in settings)."""

    scope = "api_key"
    key_parser = KeyParser()

    def get_cache_key(self, request: "Request", view: "APIView") -> str | None:
        """Return a cache key per API key prefix, or None (no throttling) without a key."""
        key = self.key_parser.get(request)
        if not key:
            return None
        prefix, _, _ = key.partition(".")
        return self.cache_format % {"scope": self.scope, "ident": prefix}
