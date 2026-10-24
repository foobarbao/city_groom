# Demo

> **Status**: first complete version · **Last updated**: 2026-10-24

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
| Orders, rounds, revenue, forecasts | **Fictitious** | `apps.demo.activity` → `packages/demo-data` |
| Merchants in the merchant space | **Fictitious** ("Démo · …") | So that no real business is shown with invented orders or revenue |

Fictitious data is always labelled as such in the apps.

## Contents

| Part | Audience | Status |
|---|---|---|
| Part | Audience | Path | Status |
|---|---|---|---|
| Demo home page linking every space | Everyone | `/pro/` (`/` redirects there) | Done |
| Customer app (map, lockers, businesses, locker view) | Residents | `/client/` | Done |
| Merchant space (incoming items, items being processed, revenue, commission, forecast) | Businesses | `/pro/commerce` | Done |
| Courier space (rounds per day, items and km per round, monthly projection, next rounds, route map) | Cargo-bike partners | `/pro/coursier` | Done; indicators to confirm (open question 5) |
| Operator space (volumes, fill rate per size and per locker, live map, orders and forecast, door statuses) | City Groom team | `/pro/exploitation` | Done |

Every portal page shows a permanent "fictitious" notice with the reference
time of the data. All times are shown in the Grenoble time zone
(Europe/Paris), whatever the visitor's device.

The demo dataset is generated on a reference date; the apps move every date
to the current day (`rebaseActivity` in `packages/demo-data`) and use the
generation time of day as "now", so that past and upcoming rounds stay
consistent at any hour.

ASSUMPTION: the courier route is drawn by visiting the nearest stop each time
(lockers, then merchants), with straight lines. It is labelled as indicative;
a real itinerary needs a routing engine (roadmap item 8).

## Builds

- **Hosted demo site** (`npm run build:demo-site`, from the repository root):
  builds the customer app (base `/client/`) and the portal (base `/pro/`),
  then `scripts/assemble-demo-site.mjs` combines them in `dist-demo-site/`
  with the Netlify redirect rules. Deployed on Netlify (`netlify.toml`) at
  <https://citygroom.netlify.app>; every pull request gets a deploy preview.
- **Single-page demo** (`npm run build:demo -w apps/customer`): one HTML file
  with an embedded offline map, published as a Claude artifact.

## Hosting (Netlify)

1. Create a free account at <https://www.netlify.com> with "Sign up with
   GitHub".
2. **Add new site → Import an existing project → GitHub**, authorise access to
   the `city_groom` repository, select it.
3. Choose the branch to deploy (`develop` once the pull request is merged;
   until then, pull request deploy previews show the latest version).
   Build settings are read from `netlify.toml`; nothing else to fill in.
4. Deploy. Netlify gives a public URL (`https://<name>.netlify.app`), which
   can be renamed in the site settings.

## Regenerating the dataset

See [`packages/demo-data/README.md`](../packages/demo-data/README.md#regenerating).
