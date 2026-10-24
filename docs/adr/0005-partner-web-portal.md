# ADR-0005 — Partner web portal for merchants, courier partners and operators

- **Status**: Accepted
- **Date**: 2026-10-24
- **Supersedes**: the `apps/merchant/` part of
  [ADR-0003](0003-monorepo-and-applications.md)

## Context

- The project owner confirmed the split between platforms:
  - **customers** use the **mobile app** (ADR-0002);
  - **merchants**, **courier partners** and **operators** need **web
    interfaces**.
- A new audience was added: **courier partners** (local cargo-bike delivery
  companies). The project owner wants to approach them with a web interface
  presenting the expected activity and volume, before any partnership exists.
- Operators manage data through the Django admin (ADR-0003), which is a web
  interface but is designed for data entry, not for presenting activity.
- Merchant and courier screens share most building blocks: authentication,
  layout, map of lockers, charts, forecasts, simulated data.

## Options considered

1. **One web app per audience** (`apps/merchant/`, `apps/courier/`, plus an
   operator dashboard) — strict separation, but authentication, layout, map and
   chart components are duplicated or must be extracted into shared packages
   from day one.
2. **One partner web portal with a space per role** — a single Vue app; the
   signed-in user's role decides which space and menus are available. Shared
   components are written once. Role checks must be enforced by the API, not
   only by the UI.
3. **Extend the Django admin for everything** — no extra app, but the admin is
   not suited to an attractive, presentation-quality interface for external
   partners.

## Decision

**Option 2: a single partner web portal, `apps/portal/`**, built with Vue 3 +
TypeScript + Vite (stack unchanged from ADR-0002), French UI, desktop-first and
usable on tablets.

| Space | Users | Purpose |
|---|---|---|
| Merchant | Partner businesses | Incoming orders, forecasts, revenue and commission, chat and quotes |
| Courier | Courier partners | Expected volumes, rounds, lockers and merchants served |
| Operator | City Groom team | Activity dashboards and forecasts across the platform |

The **Django admin remains the operator's data-management tool** (create and
edit lockers, merchants, offers, commission settings…). The operator space of
the portal is for dashboards and presentation, not data entry.

Updated layout:

```
apps/
├── customer/   Ionic + Capacitor customer app (PWA + Android)
└── portal/     Vue 3 partner web portal (merchant, courier, operator spaces)
```

## Consequences

- Authorisation is enforced by the backend: every endpoint checks the user's
  role and scope (a merchant only sees their own orders, a courier partner
  only its own rounds). Hiding menus in the UI is never a security measure.
- The user model must support roles (customer, merchant staff, courier staff,
  operator) and link merchant / courier staff to their organisation.
- A **demo mode** is needed so the owner can present a space to a prospect
  with realistic simulated data (e.g. a demo courier account showing projected
  volumes), clearly labelled as simulated.
- If one audience's needs diverge strongly later, its space can be split into
  a separate app; this would be a new ADR.
