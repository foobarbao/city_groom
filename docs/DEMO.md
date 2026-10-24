# Demo

> **Status**: in progress · **Last updated**: 2026-10-24

The project owner needs a **complete, hosted demo** to show to testers,
merchants, courier partners and funders. It runs without a backend: every app
uses bundled data.

## Data: real places, fictitious activity

| Data | Nature | Source |
|---|---|---|
| Map of Grenoble | Real | OpenStreetMap (OpenFreeMap tiles) |
| Businesses | **Real** (public data, "Partenariat non établi") | OpenStreetMap (`data/osm/merchants.json`) |
| Locker locations | Real tram stops, lockers **simulated** | OpenStreetMap (`data/osm/tram_stops.json`) + simulation |
| Lockers, compartments, occupancy | **Fictitious** | Backend simulation |
| Orders, rounds, revenue, forecasts | **Fictitious** | Demo activity generator (to build) |

Fictitious data is always labelled as such in the apps.

## Contents

| Part | Audience | Status |
|---|---|---|
| Customer app (map, lockers, businesses, locker view) | Residents | Done (fictitious lockers; real businesses once imported) |
| Merchant space (incoming items, forecasts, revenue, commission) | Businesses | To build (`apps/portal/`, ADR-0005/0006) |
| Courier space (expected volumes, rounds) | Cargo-bike partners | To build |
| Operator space (volumes, fill rates, locker view, live map) | City Groom team | To build |
| Demo home page linking every space | Everyone | To build |

## Builds

- **Hosted demo site** (`npm run build:demo-site -w apps/customer`): static
  site with the live map, deployed on Netlify (`netlify.toml`).
- **Single-page demo** (`npm run build:demo -w apps/customer`): one HTML file
  with an embedded offline map, published as a Claude artifact.

## Hosting (Netlify)

1. Create a free account at <https://www.netlify.com> with "Sign up with
   GitHub".
2. **Add new site → Import an existing project → GitHub**, authorise access to
   the `city_groom` repository, select it.
3. Choose the branch to deploy (`develop` once the pull request is merged).
   Build settings are read from `netlify.toml`; nothing else to fill in.
4. Deploy. Netlify gives a public URL (`https://<name>.netlify.app`), which
   can be renamed in the site settings.
