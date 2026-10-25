"""Serializers of the accounts API."""

from rest_framework import serializers

from apps.accounts.models import User


class GoogleSignInRequestSerializer(serializers.Serializer[None]):
    """ID token returned by Google to the app."""

    credential = serializers.CharField(
        help_text="Google ID token (JWT) obtained by the app from Google Identity Services."
    )


class MeSerializer(serializers.ModelSerializer[User]):
    """Profile of the signed-in user."""

    signed_in_with_google = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "picture_url",
            "date_joined",
            "signed_in_with_google",
        ]
        read_only_fields = fields

    def get_signed_in_with_google(self, user: User) -> bool:
        """Whether the account is linked to a Google identity."""
        return hasattr(user, "google_account")


class SignInResponseSerializer(serializers.Serializer[None]):
    """Result of a successful sign-in."""

    token = serializers.CharField(
        help_text="Send it as `Authorization: Token <token>` on the next requests."
    )
    created = serializers.BooleanField(help_text="True when the account was just created.")
    user = MeSerializer()
