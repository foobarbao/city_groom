# Backend image: Django served by Gunicorn.
# Used by docker-compose.yml locally and by the hosting platform (ADR-0004).

FROM python:3.13-slim

# GeoDjango needs the GDAL and GEOS native libraries.
RUN apt-get update \
    && apt-get install -y --no-install-recommends gdal-bin \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.11.32 /uv /usr/local/bin/uv

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Install dependencies first so this layer is cached between code changes.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

# Static files are collected at build time; a throwaway key is enough for that
# step and is never used at runtime.
RUN DJANGO_SECRET_KEY=collectstatic-only DATABASE_URL=postgis://x@localhost/x \
    python manage.py collectstatic --noinput

# Run as an unprivileged user.
RUN useradd --system --no-create-home app
USER app

EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
