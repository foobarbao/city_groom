"""URL routes of the accounts application, mounted under ``/api/v1/``."""

from django.urls import path

from apps.accounts.views import GoogleSignInView, MeView, SignOutView

urlpatterns = [
    path("auth/google/", GoogleSignInView.as_view(), name="auth-google"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/sign-out/", SignOutView.as_view(), name="auth-sign-out"),
]
