"""Django settings for the City Groom backend.

All environment-specific values are read from environment variables (or a
local ``.env`` file in development), following the twelve-factor approach, so
the same code runs locally, in CI and on any host (see ADR-0004). Every
variable is documented in ``backend/.env.example``.
"""

from pathlib import Path

import environ

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
    # Third-party
    "corsheaders",
    "rest_framework",
    "rest_framework_gis",
    "drf_spectacular",
    # Project
    "apps.core",
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
}

SPECTACULAR_SETTINGS = {
    "TITLE": "City Groom API",
    "DESCRIPTION": "REST API consumed by the customer app and the merchant portal.",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
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
