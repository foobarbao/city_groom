"""Sign in with Google: verification of the ID token sent by the apps.

The apps obtain an ID token from Google (Google Identity Services on the web)
and send it to the API. The token is verified here with Google's official
library: signature against Google's public keys, expiry, issuer and audience
(one of our OAuth client IDs). Only then is the account found or created.

Basic profile only (ADR-0010): ``sub``, e-mail, e-mail verified, names,
picture.
"""

from dataclasses import dataclass
from typing import Any

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from google.auth import exceptions as google_exceptions
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from apps.accounts.models import GoogleAccount, User


class GoogleSignInError(Exception):
    """The token is invalid, or the Google account cannot be used here."""


class GoogleUnavailableError(Exception):
    """Google's public keys could not be fetched: the token cannot be checked now."""


@dataclass(frozen=True)
class GoogleProfile:
    """Basic profile read from a verified ID token."""

    sub: str
    email: str
    email_verified: bool
    first_name: str
    last_name: str
    picture_url: str


def verify_credential(credential: str) -> GoogleProfile:
    """Verify a Google ID token and return its basic profile.

    Raises:
        GoogleSignInError: Sign-in with Google is not configured, or the token
            is invalid (signature, expiry, issuer, audience), or its e-mail is
            not verified.
        GoogleUnavailableError: Google could not be reached to check the token.
    """
    client_ids: list[str] = settings.GOOGLE_OAUTH_CLIENT_IDS
    if not client_ids:
        raise GoogleSignInError("Connexion Google non configurée.")
    try:
        claims: dict[str, Any] = id_token.verify_oauth2_token(  # type: ignore[no-untyped-call]
            credential, google_requests.Request(), audience=client_ids
        )
    except google_exceptions.TransportError as error:
        raise GoogleUnavailableError from error
    except (ValueError, google_exceptions.GoogleAuthError) as error:
        raise GoogleSignInError("Jeton Google invalide.") from error
    if not claims.get("email") or not claims.get("email_verified"):
        raise GoogleSignInError("Adresse e-mail Google non vérifiée.")
    return GoogleProfile(
        sub=str(claims["sub"]),
        email=str(claims["email"]).lower(),
        email_verified=True,
        first_name=str(claims.get("given_name", "")),
        last_name=str(claims.get("family_name", "")),
        picture_url=str(claims.get("picture", "")),
    )


@transaction.atomic
def sign_in(profile: GoogleProfile, *, announcements: bool = False) -> tuple[User, bool]:
    """Find or create the account of a Google profile.

    ``announcements`` records an agreement to receive announcements; False
    never withdraws an earlier one (that is done from the account screen).

    Returns:
        The user and whether the account was just created.

    Raises:
        GoogleSignInError: The e-mail belongs to an account that must not be
            reached through Google (team member, or account with a password),
            or the account is deactivated.
    """
    now = timezone.now()
    link = GoogleAccount.objects.select_related("user").filter(sub=profile.sub).first()
    created = False
    if link is not None:
        user = link.user
    else:
        user_or_none = User.objects.filter(email__iexact=profile.email).first()
        if user_or_none is None:
            user = User(username=profile.email, email=profile.email)
            user.set_unusable_password()
            created = True
        elif user_or_none.is_staff or user_or_none.has_usable_password():
            # Never let a Google sign-in take over a team or password account.
            raise GoogleSignInError("Cette adresse e-mail est déjà utilisée par un autre compte.")
        else:
            user = user_or_none
        link = GoogleAccount(user=user, sub=profile.sub)
    if not user.is_active:
        raise GoogleSignInError("Ce compte est désactivé.")

    # The profile is refreshed at every sign-in, so the account follows the
    # Google profile (name, picture) without a separate settings screen.
    user.first_name = profile.first_name or user.first_name
    user.last_name = profile.last_name or user.last_name
    user.picture_url = profile.picture_url
    user.last_login = now
    if announcements:
        user.set_announcements(True)
    user.save()
    link.user = user
    link.email = profile.email
    link.email_verified = profile.email_verified
    link.last_sign_in_at = now
    link.save()
    return user, created
