#!/bin/sh
# Start command of the backend image on a hosting platform (ADR-0004,
# docs/BUILD_AND_RELEASE.md).
#
# 1. Apply database migrations: free hosting plans offer no separate
#    pre-deploy step, so it is done at start-up (safe to repeat).
# 2. Create the first administrator if DJANGO_SUPERUSER_USERNAME, _EMAIL and
#    _PASSWORD are set and the account does not exist yet: free plans offer
#    no shell to run `createsuperuser` by hand. Remove the variables once the
#    account exists.
# 3. Serve Django with Gunicorn on the port given by the platform ($PORT).
set -e

python manage.py migrate --noinput

if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  python manage.py createsuperuser --noinput 2>/dev/null \
    && echo "Administrator account created." \
    || echo "Administrator account not created (it probably exists already)."
fi

exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}"
