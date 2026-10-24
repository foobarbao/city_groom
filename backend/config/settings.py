"""Django settings for the City Groom backend.

All environment-specific values are read from environment variables (or a
local ``.env`` file in development), following the twelve-factor approach, so
the same code runs locally, in CI and on any host (see ADR-0004). Every
variable is documented in ``backend/.env.example``.
"""

from pathlib import Path

import django_stubs_ext
import environ

# Make Django generic classes subscriptable at runtime (e.g.
# ``admin.TabularInline[Compartment, Locker]``), as required by strict typing.
# DRF classes are patched in ``apps.core.apps`` instead: importing DRF here,
# while settings are loading, would break its own settings.
django_stubs_ext.monkeypatch()

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
# A .env file is a development convenience only; real deployments set
# environment variables directly.
environ.Env.read_env(BASE_DIR / ".env")

# --- Core -------------------------------------------------------------------

SECRET_KEY = env.str("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS: list[str] = env.list("DJANGO_ALLOWED_HOSTS", default=[])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    "django.contrib.postgres",
    # Third-party
    "corsheaders",
    "rest_framework",
    "rest_framework_gis",
    "drf_spectacular",
    "rest_framework_api_key",
    # Project
    "apps.core",
    "apps.lockers",
    "apps.integrations",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# --- Database ---------------------------------------------------------------

# PostGIS is required: the product relies on spatial queries (ADR-0002).
DATABASES = {
    "default": env.db_url(
        "DATABASE_URL",
        engine="django.contrib.gis.db.backends.postgis",
    ),
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Authentication ---------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- Internationalisation ---------------------------------------------------

# User interfaces, including the admin, are in French (CODING_STANDARDS.md §5).
LANGUAGE_CODE = "fr"
LANGUAGES = [("fr", "Français")]
# Datetimes are stored in UTC and displayed in the local time of Grenoble.
TIME_ZONE = "Europe/Paris"
USE_I18N = True
USE_TZ = True

# --- Static files -----------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# --- API --------------------------------------------------------------------

REST_FRAMEWORK = {
    # Access is denied by default; each view opens what it needs explicitly
    # (CODING_STANDARDS.md §9).
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # Rate limits protect the service from abusive or buggy clients; values
    # are documented in docs/api/README.md.
    # PROD: use a shared cache (e.g. Redis) so limits hold across processes.
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "apps.integrations.throttling.APIKeyRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": env.str("API_THROTTLE_ANON", default="120/min"),
        "user": env.str("API_THROTTLE_USER", default="600/min"),
        "api_key": env.str("API_THROTTLE_API_KEY", default="600/min"),
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "City Groom API",
    "DESCRIPTION": (
        "REST API of City Groom, used by the City Groom apps and open to third-party "
        "integrations. Authentication, scopes, rate limits, errors and versioning "
        "are described in the integration guide (docs/api/README.md in the "
        "repository). Data marked as simulated is fictitious demo data."
    ),
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
    # Separate request and response components, so response fields that are
    # always present are marked required in generated frontend types.
    "COMPONENT_SPLIT_REQUEST": True,
    "APPEND_COMPONENTS": {
        "securitySchemes": {
            "ApiKeyAuth": {
                "type": "apiKey",
                "in": "header",
                "name": "Authorization",
                "description": "Integration API key, sent as `Authorization: Api-Key <key>`.",
            },
        },
    },
    "SECURITY": [{"ApiKeyAuth": []}],
    # Stable, explicit names for shared choice sets in the generated schema
    # and frontend types.
    "ENUM_NAME_OVERRIDES": {
        "LockerStatusEnum": "apps.lockers.models.Locker.Status",
        "CompartmentStatusEnum": "apps.lockers.models.Compartment.Status",
        "AccessMethodEnum": "apps.lockers.models.AccessMethod",
    },
    "TAGS": [
        {"name": "lockers", "description": "Public locker data (map, locker fronts, sizes)."},
        {"name": "operations", "description": "Operator data: occupancy, statistics, events."},
        {"name": "system", "description": "Technical endpoints."},
    ],
}

# Origins of the customer app and merchant portal allowed to call the API.
CORS_ALLOWED_ORIGINS: list[str] = env.list("CORS_ALLOWED_ORIGINS", default=[])

# --- Security ---------------------------------------------------------------

# Behind a TLS-terminating proxy in deployment; disabled locally via .env.
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=not DEBUG)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
CSRF_TRUSTED_ORIGINS: list[str] = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])
# PROD: enable HSTS (SECURE_HSTS_SECONDS) once the production domain and its
# HTTPS setup are final; enabling it too early can lock browsers out.
