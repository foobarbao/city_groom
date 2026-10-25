# ADR-0006 — Mobile app for merchants: partner portal built with Ionic

- **Status**: Accepted
- **Date**: 2026-10-24
- **Amends**: [ADR-0005](0005-partner-web-portal.md) (stack of the partner
  portal)

## Context

- The project owner requires a **mobile app version for merchants**: it is
  more intuitive for them and lets them follow their orders more easily
  (notifications, quick checks during the day, scanning items).
- Merchants also keep the **web** version (ADR-0005), as do courier partners
  and operators.
- ADR-0005 planned the partner portal as a plain Vue 3 web app.

## Options considered

1. **Merchant space inside the customer app** — one store app, but it mixes two
   very different audiences, complicates navigation and permissions, and
   exposes merchant features to every customer download.
2. **Separate merchant mobile app** — clear audience, but a third codebase
   duplicating the merchant space of the portal.
3. **Build the partner portal with Ionic Vue + Capacitor** — the same code is
   deployed as the **web portal** (all partner roles) and packaged as an
   **Android "pro" app** for merchants. Ionic adapts the layout to the screen
   (side menu on desktop, tabs on mobile).

## Decision

**Option 3.** The partner portal (`apps/portal/`) uses the same stack as the
customer app: **Vue 3 + TypeScript + Ionic Vue + Capacitor**, built with Vite.

| Deliverable | Audience |
|---|---|
| Web portal | Merchants, courier partners, operators |
| Android "pro" app | Merchants (courier partners later if needed) |

## Consequences

- Both frontends share the same stack, conventions and tooling; common pieces
  (map, locker drawing, API client) can move to a shared package.
- Screens must be designed **responsive**: desktop-first for operators and
  courier partners, mobile-first for the merchant space.
- Two Android apps will be published (customer, pro), each with its own
  application id and signing configuration.
