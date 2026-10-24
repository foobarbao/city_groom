"""Administration of integration API keys (French UI).

The full key is displayed once, right after creation; only its hash is stored.
A revoked key cannot be edited or un-revoked: issue a new key instead.
"""

from typing import Any

from django.contrib import admin, messages
from django.http import HttpRequest
from rest_framework_api_key.models import APIKey

from apps.integrations.models import IntegrationAPIKey

# The library's generic, scope-less key model is not used: hide it.
admin.site.unregister(APIKey)


@admin.register(IntegrationAPIKey)
class IntegrationAPIKeyAdmin(admin.ModelAdmin[IntegrationAPIKey]):
    """Create, list and revoke integration API keys."""

    list_display = ["prefix", "name", "scopes", "contact", "created", "expiry_date", "revoked"]
    list_filter = ["revoked", "created"]
    search_fields = ["name", "prefix", "contact"]

    def get_readonly_fields(
        self, request: HttpRequest, obj: IntegrationAPIKey | None = None
    ) -> list[str]:
        """Freeze the prefix, and everything once the key is revoked."""
        if obj is not None and obj.revoked:
            return ["prefix", "name", "scopes", "contact", "expiry_date", "revoked"]
        return ["prefix"]

    def save_model(
        self,
        request: HttpRequest,
        obj: IntegrationAPIKey,
        form: Any = None,
        change: bool = False,
    ) -> None:
        """Generate the key on creation and show it once to the operator."""
        if change:
            obj.save()
            return
        key = IntegrationAPIKey.objects.assign_key(obj)
        obj.save()
        messages.warning(
            request,
            f"Clé d'API : {key} — copiez-la maintenant, elle ne sera plus jamais affichée.",
        )
