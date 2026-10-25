# City Groom — Backend

Django project providing the REST API (customer app, partner web portal), the
administration interface for operators, and, later, the simulators for
lockers, couriers and payment (ADR-0003).

## Layout

```
backend/
├── config/          Project settings, root URLs, WSGI entry point
├── apps/
│   ├── core/          Technical features (health check)
│   ├── accounts/      User model, sign-in with Google, accounts administration
│   ├── lockers/       Lockers, compartments, events, drivers, simulation
│   ├── merchants/     Local businesses imported from OpenStreetMap
│   └── integrations/  API keys and scopes for third-party integrations
├── manage.py
├── pyproject.toml   Dependencies and tool configuration (Ruff, mypy, pytest)
├── uv.lock          Locked dependency versions (committed)
├── Dockerfile
├── scripts/start.sh Start command on a host: migrate, first admin, Gunicorn
└── .env.example     Documented environment variables
```

Business applications (lockers, merchants, catalogue, orders…) are added under
`apps/` as features are implemented.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python package and project manager; it
  installs the right Python version if needed)
- Python 3.13
- GDAL and GEOS native libraries, required by GeoDjango
  (Debian/Ubuntu: `sudo apt install gdal-bin`; macOS: `brew install gdal`)
- PostgreSQL with PostGIS: the easiest way is the `db` service of the root
  `docker-compose.yml`

## Running locally

```bash
# From the repository root: start the database
docker compose up -d db

# From backend/
cp .env.example .env            # then set DJANGO_SECRET_KEY
uv sync                         # create .venv and install dependencies
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver
```

| URL | Content |
|---|---|
| http://localhost:8000/admin/ | Administration (French UI) |
| http://localhost:8000/api/v1/health/ | Health check |
| http://localhost:8000/api/v1/docs/ | Interactive API documentation (Swagger UI) |
| http://localhost:8000/api/v1/redoc/ | API reference (ReDoc) |

Integration guide (authentication, scopes, rate limits, errors, versioning):
[`docs/api/README.md`](../docs/api/README.md).

Alternatively, `docker compose up --build` from the root runs both the database
and the backend in containers.

The project has its own user model (`accounts.User`, ADR-0010). A database
created before it must be recreated: `docker compose down -v`, then
`docker compose up -d db` and `migrate`.

Sign in with Google: set `GOOGLE_OAUTH_CLIENT_IDS` (`docs/GOOGLE_SIGN_IN.md`).
Hosting on Render + Neon: `docs/BUILD_AND_RELEASE.md` §6.

## Quality checks

The same checks run in CI (`.github/workflows/backend.yml`) and must pass
before pushing:

```bash
uv run ruff check .                                   # lint (incl. docstrings, security)
uv run ruff format --check .                          # formatting
uv run mypy .                                         # strict type checking
uv run python manage.py makemigrations --check --dry-run
uv run pytest                                         # tests (needs the database)
```

The database role used by tests must be allowed to create databases and the
PostGIS extension; the `db` Compose service satisfies this.

## Versions

| Component | Version | Note |
|---|---|---|
| Python | 3.13 | |
| Django | 5.2 LTS | Long-term support release. The latest 6.x release was not chosen because several dependencies (drf-spectacular, django-cors-headers, WhiteNoise, django-environ) did not yet declare support for it when the project was initialised (2026-10-24). To be revisited with the next LTS. |
| Django REST Framework | 3.18 | |
| PostgreSQL / PostGIS | 17 / 3.5 | Docker image `postgis/postgis:17-3.5` |

Exact versions of every package are pinned in `uv.lock`.
