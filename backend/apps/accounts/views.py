"""Customer sign-in endpoints (ADR-0010)."""

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from apps.accounts.google import (
    GoogleSignInError,
    GoogleUnavailableError,
    sign_in,
    verify_credential,
)
from apps.accounts.models import User
from apps.accounts.serializers import (
    GoogleSignInRequestSerializer,
    MeSerializer,
    MeUpdateSerializer,
    SignInResponseSerializer,
)


class GoogleSignInThrottle(AnonRateThrottle):
    """Stricter limit on sign-in attempts per IP address."""

    scope = "sign_in"


class GoogleSignInView(APIView):
    """Exchange a Google ID token for a CityPal session token."""

    permission_classes = [AllowAny]
    authentication_classes: list[type] = []
    throttle_classes = [GoogleSignInThrottle]

    @extend_schema(
        summary="Sign in with Google",
        description=(
            "The app sends the ID token it received from Google. The API verifies it "
            "(signature, expiry, issuer, audience), finds or creates the account from "
            "the basic Google profile, and returns a token for the next requests. "
            "Accounts of team members or with a password are never reached this way. "
            "`announcements: true` records the person's agreement to receive CityPal "
            "announcements (box unticked by default in the app)."
        ),
        tags=["accounts"],
        auth=[],
        request=GoogleSignInRequestSerializer,
        responses={
            200: SignInResponseSerializer,
            400: OpenApiResponse(description="Invalid token or unusable Google account."),
            503: OpenApiResponse(description="Google could not be reached; retry later."),
        },
    )
    def post(self, request: Request) -> Response:
        """Verify the token and return the session token and profile."""
        payload = GoogleSignInRequestSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        try:
            user, created = sign_in(
                verify_credential(payload.validated_data["credential"]),
                announcements=payload.validated_data["announcements"],
            )
        except GoogleSignInError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        except GoogleUnavailableError:
            return Response(
                {"detail": "Google est injoignable, réessayez dans un instant."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "created": created, "user": MeSerializer(user).data})


class MeView(APIView):
    """Profile of the signed-in user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Current user",
        description="Profile of the user the token belongs to.",
        tags=["accounts"],
        responses={200: MeSerializer},
    )
    def get(self, request: Request) -> Response:
        """Return the profile."""
        user = request.user
        assert isinstance(user, User)  # noqa: S101 - guaranteed by IsAuthenticated
        return Response(MeSerializer(user).data)

    @extend_schema(
        summary="Update current user settings",
        description=(
            "Changes the settings of the signed-in user: agreement to receive CityPal "
            "announcements. The date of the change is recorded."
        ),
        tags=["accounts"],
        request=MeUpdateSerializer,
        responses={200: MeSerializer},
    )
    def patch(self, request: Request) -> Response:
        """Record the new announcement choice and return the profile."""
        user = request.user
        assert isinstance(user, User)  # noqa: S101 - guaranteed by IsAuthenticated
        payload = MeUpdateSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        user.set_announcements(payload.validated_data["announcements"])
        user.save(update_fields=["announcements", "announcements_changed_at"])
        return Response(MeSerializer(user).data)


class SignOutView(APIView):
    """End the session of the app: the token stops working."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Sign out",
        description="Deletes the token used for this request.",
        tags=["accounts"],
        request=None,
        responses={204: None},
    )
    def post(self, request: Request) -> Response:
        """Delete the token."""
        Token.objects.filter(user=request.user).delete()  # type: ignore[misc]
        return Response(status=status.HTTP_204_NO_CONTENT)
