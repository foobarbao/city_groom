"""Shared pytest fixtures for the backend."""

from collections.abc import Iterator

import pytest
from django.core.cache import cache
from pytest_django.fixtures import Settings


@pytest.fixture(autouse=True)
def _clear_cache() -> Iterator[None]:
    """Start every test with an empty cache, so rate-limit counters never leak between tests."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture(autouse=True)
def _plain_http(settings: Settings) -> None:
    """Disable the HTTPS redirect: the test client speaks plain HTTP.

    Without a local ``.env`` (e.g. in CI), DEBUG is off and the production
    redirect to HTTPS would answer every request with a 301.
    """
    settings.SECURE_SSL_REDIRECT = False


@pytest.fixture(autouse=True)
def _plain_static_files(settings: Settings) -> None:
    """Serve static files without the manifest built by ``collectstatic``.

    Admin pages rendered in tests would otherwise fail on missing manifest
    entries, since tests never run ``collectstatic``.
    """
    settings.STORAGES = {
        **settings.STORAGES,
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
