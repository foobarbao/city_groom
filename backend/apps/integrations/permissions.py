"""DRF permission checking integration API keys and their scopes.

Usage in a view::

    permission_classes = [IsAdminUser | HasScopedAPIKey]
    required_scope = Scope.OPERATIONS_READ
"""

from typing import Any, cast

from django.http import HttpRequest
from rest_framework_api_key.permissions import BaseHasAPIKey

from apps.integrations.models import IntegrationAPIKey


class HasScopedAPIKey(BaseHasAPIKey):
    """Grant access to requests carrying a valid key with the view's ``required_scope``.

    Keys are sent in the ``Authorization: Api-Key <key>`` header. A view
    without ``required_scope`` refuses every key, so forgetting to declare a
    scope fails closed.
    """

    model = IntegrationAPIKey

    def has_permission(self, request: HttpRequest, view: Any) -> bool:
        """Check that the key is valid (not revoked or expired) and has the scope."""
        required_scope = getattr(view, "required_scope", None)
        key = self.get_key(request)
        if not key or required_scope is None:
            return False
        try:
            # Checks the hash and excludes revoked keys.
            api_key = cast(IntegrationAPIKey, IntegrationAPIKey.objects.get_from_key(key))
        except IntegrationAPIKey.DoesNotExist:
            return False
        return not api_key.has_expired and api_key.has_scope(required_scope)
