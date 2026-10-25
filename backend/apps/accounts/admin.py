"""Administration of accounts (French UI).

The list answers the operator's usual questions at a glance: who signed up,
when, how (Google or password), whether they are customers or team members,
and when they last came. A summary above the list counts customers, recent
sign-ups and Google accounts.
"""

from datetime import timedelta
from typing import Any

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.db.models import QuerySet
from django.http import HttpRequest
from django.template.response import TemplateResponse
from django.utils import timezone
from django.utils.html import format_html
from rest_framework.authtoken.models import TokenProxy

from apps.accounts.models import GoogleAccount, User

# Token keys are secrets: they are not listed in the administration. Signing
# a customer out is done by deactivating the account.
admin.site.unregister(TokenProxy)


class AccountTypeFilter(admin.SimpleListFilter):
    """Customers or CityPal team."""

    title = "type de compte"
    parameter_name = "type"

    def lookups(self, request: HttpRequest, model_admin: Any) -> list[tuple[str, str]]:
        """Available choices."""
        return [("customer", "Clients"), ("team", "Équipe CityPal")]

    def queryset(self, request: HttpRequest, queryset: QuerySet[User]) -> QuerySet[User]:
        """Filter on ``is_staff``."""
        if self.value() == "customer":
            return queryset.filter(is_staff=False)
        if self.value() == "team":
            return queryset.filter(is_staff=True)
        return queryset


class SignInMethodFilter(admin.SimpleListFilter):
    """How the person signs in."""

    title = "connexion"
    parameter_name = "connexion"

    def lookups(self, request: HttpRequest, model_admin: Any) -> list[tuple[str, str]]:
        """Available choices."""
        return [("google", "Google"), ("password", "Mot de passe")]

    def queryset(self, request: HttpRequest, queryset: QuerySet[User]) -> QuerySet[User]:
        """Filter on the presence of a linked Google identity."""
        if self.value() == "google":
            return queryset.filter(google_account__isnull=False)
        if self.value() == "password":
            return queryset.filter(google_account__isnull=True)
        return queryset


class GoogleAccountInline(admin.StackedInline[GoogleAccount, User]):
    """Linked Google identity, read-only: it comes from Google."""

    model = GoogleAccount
    can_delete = False
    extra = 0
    max_num = 0
    fields = ["email", "email_verified", "sub", "linked_at", "last_sign_in_at"]
    readonly_fields = ["email", "email_verified", "sub", "linked_at", "last_sign_in_at"]


@admin.register(User)
class UserAdmin(DjangoUserAdmin[User]):
    """Accounts list with photo, sign-in method, type and activity."""

    list_display = [
        "photo",
        "display_name",
        "email",
        "sign_in_method",
        "account_type",
        "date_joined",
        "last_login",
        "is_active",
    ]
    list_display_links = ["photo", "display_name"]
    list_filter = [
        AccountTypeFilter,
        SignInMethodFilter,
        "is_active",
        "date_joined",
        "last_login",
    ]
    search_fields = ["email", "first_name", "last_name", "username"]
    ordering = ["-date_joined"]
    date_hierarchy = "date_joined"
    list_per_page = 50
    inlines = [GoogleAccountInline]
    readonly_fields = ["photo_large", "date_joined", "last_login"]
    fieldsets = [
        (None, {"fields": ["photo_large", "first_name", "last_name", "email", "picture_url"]}),
        ("Activité", {"fields": ["date_joined", "last_login", "is_active"]}),
        (
            "Accès à l'administration",
            {
                "classes": ["collapse"],
                "fields": [
                    "username",
                    "password",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ],
            },
        ),
    ]
    actions = ["deactivate"]

    def get_queryset(self, request: HttpRequest) -> QuerySet[User]:
        """Fetch the Google identity with each account (sign-in column)."""
        return super().get_queryset(request).select_related("google_account")

    @admin.display(description="")
    def photo(self, user: User) -> str:
        """Small round profile picture, or initials."""
        if user.picture_url:
            return format_html(
                '<img src="{}" alt="" width="32" height="32" style="border-radius:50%" '
                'referrerpolicy="no-referrer">',
                user.picture_url,
            )
        initials = (user.first_name[:1] + user.last_name[:1]).upper() or "?"
        return format_html(
            '<span style="display:inline-grid;place-items:center;width:32px;height:32px;'
            'border-radius:50%;background:#d3efdc;color:#0e4d37;font-weight:700">{}</span>',
            initials,
        )

    @admin.display(description="photo")
    def photo_large(self, user: User) -> str:
        """Profile picture on the detail page."""
        if not user.picture_url:
            return "—"
        return format_html(
            '<img src="{}" alt="" width="96" height="96" style="border-radius:50%" '
            'referrerpolicy="no-referrer">',
            user.picture_url,
        )

    @admin.display(description="nom", ordering="last_name")
    def display_name(self, user: User) -> str:
        """Full name, or the user name when unknown."""
        return user.get_full_name() or user.username

    @admin.display(description="connexion")
    def sign_in_method(self, user: User) -> str:
        """Google, password, or none yet (account created by hand without password)."""
        if hasattr(user, "google_account"):
            return "Google"
        return "Mot de passe" if user.has_usable_password() else "—"

    @admin.display(description="type", ordering="is_staff")
    def account_type(self, user: User) -> str:
        """Customer or team member."""
        return "Équipe" if user.is_staff else "Client"

    @admin.action(description="Désactiver les comptes sélectionnés")
    def deactivate(self, request: HttpRequest, queryset: QuerySet[User]) -> None:
        """Deactivate accounts (they can no longer sign in); the current user is kept."""
        current = request.user.pk
        others = queryset if current is None else queryset.exclude(pk=current)
        count = others.update(is_active=False)
        self.message_user(request, f"{count} compte(s) désactivé(s).")

    def changelist_view(
        self, request: HttpRequest, extra_context: dict[str, Any] | None = None
    ) -> TemplateResponse:
        """Add the summary shown above the list."""
        customers = User.objects.filter(is_staff=False)
        week_ago = timezone.now() - timedelta(days=7)
        summary = [
            ("Clients", customers.count()),
            ("Inscrits ces 7 derniers jours", customers.filter(date_joined__gte=week_ago).count()),
            ("Actifs ces 7 derniers jours", customers.filter(last_login__gte=week_ago).count()),
            ("Connexion Google", customers.filter(google_account__isnull=False).count()),
            ("Équipe CityPal", User.objects.filter(is_staff=True).count()),
        ]
        context = {**(extra_context or {}), "accounts_summary": summary}
        response = super().changelist_view(request, extra_context=context)
        assert isinstance(response, TemplateResponse)  # noqa: S101 - admin list view
        return response
