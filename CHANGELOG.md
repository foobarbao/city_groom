# Changelog

All notable changes to this project are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) ·
Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added

- Coding and documentation standards (`docs/CODING_STANDARDS.md`), including
  the "never invent, ask when in doubt" rule.
- Product document: vision, actors, main flow, business model, red lines and
  open questions (`docs/PRODUCT.md`).
- Git workflow, commit and pull request conventions (`CONTRIBUTING.md`).
- Instructions for the AI assistant (`CLAUDE.md`).
- ADR-0001 (adopt ADRs), ADR-0002 (technical stack: Vue 3 + Ionic + Capacitor,
  MapLibre, Django REST + GeoDjango + PostGIS), ADR-0003 (monorepo layout,
  Django admin, integration boundaries), ADR-0004 (hosting, proposed).
- Product requirements clarified: offer types (standard, packs, quotes with
  chat), guest checkout, simulated payment, 10 % initial commission, two
  collection rounds per day, business selection rules.
- Backend skeleton: Django 5.2 LTS + DRF + GeoDjango project with
  environment-based settings, French admin, OpenAPI schema and docs, public
  health check endpoint, tests, Ruff and strict mypy configuration.
- Docker setup: backend `Dockerfile` and `docker-compose.yml` (PostGIS).
- Backend CI workflow (lint, format, type check, migrations, tests).
- ADR-0005: single partner web portal (`apps/portal/`) with merchant, courier
  and operator spaces; courier partner and operator experiences added to
  `docs/PRODUCT.md`.
- ADR-0006: partner portal built with Ionic + Capacitor, also shipped as an
  Android "pro" app for merchants.
- Product: 12-hour pickup slots aligned with two daily rounds, NFC confirmed,
  locker visualisation, operator dashboards (volume, fill rate), real-time
  tracking and flow forecasts.
- Lockers backend: models, simulated sizes and layouts, simulated occupancy,
  `seed_simulated_lockers` command (real tram stops from OpenStreetMap),
  public and operator APIs, admin (`docs/LOCKERS.md`).
- Product: overdue pickups (item stays, small late fee, first occurrence
  free); domain based on "city reconnect".
- Roadmap (`docs/ROADMAP.md`).
- Customer app (`apps/customer/`): Ionic + Vue 3 + TypeScript, map of the
  lockers (MapLibre, OpenStreetMap tiles), locker page with size picker and
  drawing of the locker front highlighting the door that opens, French i18n,
  ESLint, Prettier, Vitest.
- `packages/api-client`: TypeScript types generated from the OpenAPI schema.
- Frontend CI workflow.
- Realistic lockers: sizes aligned with Mondial Relay lockers (S/M/L) and
  dry-cleaning lockers (183 cm hanging compartment), laundry-oriented column
  templates, hardware profiles (access methods and connectivity), locker
  events (`LockerEvent`), `LockerDriver` interface with a simulated driver.
- Integration API: versioned under `/api/v1/` (breaking change for earlier
  `/api/` paths), integration API keys with scopes, rate limits, locker event
  feed, ReDoc, OpenAPI validation in CI, integration guide
  (`docs/api/README.md`), ADR-0007.
- Soft redesign of the customer app (`docs/DESIGN.md`): rounded type and
  shapes, green palette with dark theme, size cards with pictograms, locker
  drawing whose door swings open, locker cards in a bottom sheet with a list
  fallback when the map cannot load.
- Standalone demo build with fictitious data (`npm run build:demo`).
- Merchants: model, `import_osm_merchants` command (OpenStreetMap, services
  only, no food, no chains), `GET /api/v1/merchants/`, admin, map markers and
  "Commerces" tab in the customer app (`docs/DATA_SOURCES.md`).
- Android project (Capacitor) with the provisional application id
  `fr.reliance.app`; working name "Reliance" in the app; build guide
  (`docs/BUILD_AND_RELEASE.md`).

### Fixed

- Backend tests no longer depend on a local `.env` (HTTPS redirect disabled in
  tests), so CI passes.
- Pull request template, `.editorconfig`, `.gitignore`.
