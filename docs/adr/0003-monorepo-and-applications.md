# ADR-0003 — Monorepo layout, applications and integration boundaries

- **Status**: Accepted
- **Date**: 2026-10-24

## Context

The platform has one backend and three user interfaces (customer app, merchant
portal, administration). They share the same domain model and API contract,
and will evolve together. Real lockers and real courier partners must be
pluggable later without rewriting business code.

## Options considered

1. **Monorepo** — backend and frontends in one repository. One place for
   documentation, issues and pull requests; a feature touching the API and a
   frontend is a single pull request; shared types live next to their source.
2. **One repository per application** — independent release cycles, but
   cross-cutting changes need coordinated pull requests and the documentation
   is scattered. Unnecessary overhead for a small team.

For administration:

1. **Django admin (customised)** — available immediately, fully backed by the
   real models and permissions, no extra frontend to maintain.
2. **Dedicated Vue admin** — more freedom on UX, but a full extra application
   to build before the demo has any data to manage.

## Decision

**Monorepo**, with the following layout:

```
city_groom/
├── backend/            Django project (API, admin, simulators)
├── apps/
│   ├── customer/       Ionic + Capacitor customer app (PWA + Android)
│   └── merchant/       Vue 3 merchant portal (web)
├── packages/
│   └── api-client/     TypeScript types and client generated from the OpenAPI schema
├── docs/               Documentation (product, architecture, ADRs, data sources…)
└── docker-compose.yml  Local environment
```

- Frontends are managed as an npm workspace so `packages/api-client` is shared
  without publishing it.
- **Administration uses the Django admin** for the demo. A dedicated admin UI
  may replace it later if needs outgrow it (new ADR).
- **Integration boundaries**: every external system is accessed through an
  interface in the backend, with a **simulated implementation** for the demo:
  - `LockerDriver` — open a compartment, read status, receive events;
  - `CourierProvider` — schedule pickups and rounds with a delivery partner;
  - `PaymentProvider` — payment and merchant payouts (simulated for the demo,
    see `docs/PRODUCT.md` open questions).

  Real vendors are added as new implementations selected by configuration;
  business code depends only on the interfaces.

## Consequences

- One pull request can change the API and its consumers consistently; CI runs
  only the jobs relevant to the changed paths.
- Frontend API types are generated, never hand-written, so a backend change
  that breaks a frontend is caught at type-check time.
- The Django admin must be customised carefully (list filters, map widgets for
  locations, read-only fields for simulated events) and secured (staff-only,
  strong authentication) since it is the operator's main tool.
- Simulators must behave like real integrations (same interface, asynchronous
  events, failures) so that switching to real hardware does not reveal hidden
  assumptions.
