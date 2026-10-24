# City Groom

Connected lockers linking residents of the Grenoble area with city-centre
service businesses (laundry, ironing, shoe repair, repairs…). Customers drop
items into a locker near them; local cargo-bike couriers carry them to the
merchant and back. See [`docs/PRODUCT.md`](docs/PRODUCT.md).

The project is **at the demo stage** (real map and real businesses, simulated
lockers and orders) and is designed to serve as the foundation for a future
production version.

> ⚠️ Early stage: the backend skeleton exists (no business features yet); the
> customer app and partner portal are not initialised yet.

## Applications

| Application | Users | Platform | UI language |
|---|---|---|---|
| Customer app | Residents | Android (APK) + installable web app (PWA) | French |
| Partner portal | Merchants, courier partners, operators (dashboards) | Web + Android "pro" app for merchants | French |
| Administration | City Groom operators (data management) | Web (Django admin) | French |

## Stack

| Layer | Technologies |
|---|---|
| Customer app | Vue 3, TypeScript, Ionic, Capacitor, Vite, Pinia |
| Partner portal | Vue 3, TypeScript, Ionic, Capacitor, Vite, Pinia |
| Map | MapLibre GL JS, OpenStreetMap-based vector tiles |
| Backend & admin | Django, Django REST Framework, GeoDjango |
| Database | PostgreSQL + PostGIS |

Details and rejected alternatives: [ADR-0002](docs/adr/0002-technical-stack.md),
repository layout: [ADR-0003](docs/adr/0003-monorepo-and-applications.md),
partner portal: [ADR-0005](docs/adr/0005-partner-web-portal.md) and
[ADR-0006](docs/adr/0006-mobile-app-for-merchants.md),
hosting: [ADR-0004](docs/adr/0004-hosting.md).

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.

## Documentation

| Document | Content |
|---|---|
| [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md) | Coding and documentation rules (**read first**) |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Vision, actors, flows, business model, open questions |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Iterations: done, in progress, next |
| [`docs/LOCKERS.md`](docs/LOCKERS.md) | Locker research, simulated sizes and layouts |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branches, commits, pull requests, versioning |
| [`docs/adr/`](docs/adr/) | Architecture decisions |
| [`CHANGELOG.md`](CHANGELOG.md) | Change history |
| [`CLAUDE.md`](CLAUDE.md) | Instructions for the AI assistant |

## Getting started

| Part | Guide |
|---|---|
| Backend (API + admin) | [`backend/README.md`](backend/README.md) |
| Customer app | _not initialised yet_ |
| Partner portal | _not initialised yet_ |

Local services (PostgreSQL + PostGIS, backend) are defined in
[`docker-compose.yml`](docker-compose.yml).
