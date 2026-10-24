# City Groom API — Integration guide

> **Status**: version 1, demo stage · **Last updated**: 2026-10-24
>
> This guide is for developers integrating a third-party tool with City Groom
> (dashboards, partner systems, scripts…). The exhaustive, always up-to-date
> reference is the OpenAPI schema generated from the code; this guide explains
> the rules around it. Data flagged `is_simulated` is fictitious demo data.

## Contents

1. [Quick start](#1-quick-start)
2. [Base URL and versioning](#2-base-url-and-versioning)
3. [Authentication and scopes](#3-authentication-and-scopes)
4. [Endpoints](#4-endpoints)
5. [Data conventions](#5-data-conventions)
6. [Pagination and filtering](#6-pagination-and-filtering)
7. [Errors](#7-errors)
8. [Rate limits](#8-rate-limits)
9. [Following events in near real time](#9-following-events-in-near-real-time)
10. [Change and deprecation policy](#10-change-and-deprecation-policy)
11. [Planned](#11-planned)
12. [Changelog](#12-changelog)

## 1. Quick start

```bash
# Public data: no key needed
curl https://<host>/api/v1/lockers/

# Operator data: integration API key with the operations:read scope
curl -H "Authorization: Api-Key <your-key>" https://<host>/api/v1/operator/lockers/stats/
```

| Resource | URL |
|---|---|
| OpenAPI schema (YAML; add `?format=json` for JSON) | `/api/v1/schema/` |
| Interactive documentation (Swagger UI, "Try it out") | `/api/v1/docs/` |
| Reference documentation (ReDoc) | `/api/v1/redoc/` |

Client code can be generated from the schema with any OpenAPI generator; the
City Groom frontends do so with `openapi-typescript`
(`packages/api-client`).

## 2. Base URL and versioning

- All endpoints live under **`/api/v1/`**. The host depends on the
  environment (local: `http://localhost:8000`).
- The **major version is in the URL**. Within `v1`, changes are
  backward-compatible only (see §10). A breaking change creates `/api/v2/`,
  and `v1` keeps running during a documented transition period.
- HTTPS only outside local development.

## 3. Authentication and scopes

Three kinds of callers exist:

| Caller | How | Access |
|---|---|---|
| Anyone (apps, guests, integrations) | No credentials | Public endpoints only |
| Integration (tool, partner, script) | `Authorization: Api-Key <key>` header | Public endpoints + endpoints allowed by the key's **scopes** |
| City Groom operator | Django admin session (browser) | Everything, including operator endpoints |

### Integration API keys

- Keys are created by a City Groom operator in the administration
  (**Intégrations → Clés d'API d'intégration**), one key per integration.
- The full key (`<prefix>.<secret>`) is **displayed once**, at creation. Only
  a hash is stored: a lost key cannot be recovered, only replaced.
- A key can have an **expiry date** and can be **revoked** at any time; a
  revoked key cannot be reactivated.
- Treat keys as passwords: never commit them, never put them in a mobile or
  web app bundle, rotate them when someone leaves the project.

### Scopes

| Scope | Grants |
|---|---|
| `operations:read` | Operator data: per-door occupancy, fill rates, network statistics, locker events |

Public endpoints need no scope. A key without the required scope gets
`403 Forbidden`. More scopes will be added with new features (e.g. writing
orders); existing scopes keep their meaning.

## 4. Endpoints

Summary; parameters and response schemas are in the OpenAPI reference.

### Public (`lockers` tag)

| Method & path | Description |
|---|---|
| `GET /api/v1/lockers/` | In-service lockers as GeoJSON, with free compartments per size. Filter around a point with `lng`, `lat`, `radius_km` (default 2, max 20), nearest first. |
| `GET /api/v1/lockers/{code}/` | Locker front: columns, doors (label, size, position), control panel, free compartments per size. **No per-door status.** |
| `GET /api/v1/lockers/sizes/` | Compartment size catalogue: dimensions (cm), layout height, examples of items. |

### Merchants (`merchants` tag, public)

| Method & path | Description |
|---|---|
| `GET /api/v1/merchants/` | Local businesses offering locker-compatible services, as GeoJSON. Public data from OpenStreetMap (attribution required); `is_partner` is false until a partnership is signed. Filters: `category`, and `lng`, `lat`, `radius_km`. |

### Operations (`operations` tag, scope `operations:read`)

| Method & path | Description |
|---|---|
| `GET /api/v1/operator/lockers/` | All lockers (any status) as GeoJSON, with fill rate, compartments in service and in use. Same distance filter as above. |
| `GET /api/v1/operator/lockers/{code}/` | Locker front with the **status of every door** and the fill rate. |
| `GET /api/v1/operator/lockers/stats/` | Network totals: lockers, compartments, in service, in use, fill rate, free and capacity per size. |
| `GET /api/v1/operator/locker-events/` | Events reported by lockers, newest first (see §9). Filters: `locker`, `kind`, `since`. |

### System (`system` tag)

| Method & path | Description |
|---|---|
| `GET /api/v1/health/` | `{"status": "ok"}`, or HTTP 503 if the database is unreachable. No authentication, for uptime monitors. |

## 5. Data conventions

- **Format**: JSON, UTF-8. Field names in `snake_case`.
- **Geography**: GeoJSON (RFC 7946) for map data; coordinates are WGS 84,
  **longitude first** (`[lng, lat]`). Detail endpoints also give `longitude`
  and `latitude` fields.
- **Dates**: ISO 8601 with time zone, e.g. `2026-10-24T08:00:00Z`. Stored in
  UTC; City Groom displays them in `Europe/Paris`.
- **Identifiers**: lockers are referenced by their stable `code` (slug);
  doors by their `label` within a locker (column letter + position from the
  top, e.g. `B3`).
- **Enumerations** (values are stable, labels are French display texts):

| Field | Values |
|---|---|
| Compartment `size` | `S`, `M`, `L`, `XL` |
| Compartment `status` | `free`, `reserved`, `occupied`, `out_of_service` |
| Locker `status` | `active`, `maintenance`, `offline` |
| `access_methods` / `access_method` | `bluetooth`, `nfc`, `qr_code` |
| Merchant `category` | `laundry`, `dry_cleaning`, `shoe_repair`, `tailoring`, `watch_repair`, `jewellery_repair`, `electronics_repair`, `key_cutting` |
| Event `kind` | `door_opened`, `door_closed`, `door_left_open`, `fault`, `connection_lost`, `connection_restored` |

- **Fill rate**: share of in-service compartments that are reserved or
  occupied, between 0 and 1.
- **Simulated data**: `is_simulated: true` marks fictitious lockers and events
  produced by the demo simulation.

## 6. Pagination and filtering

- Locker lists are small and returned in full (GeoJSON FeatureCollection).
- The event feed uses **cursor pagination**: responses contain `results`,
  `next` and `previous` (full URLs, or `null`). Follow `next` as is; do not
  build cursors yourself. `page_size` defaults to 100, maximum 500.
- Invalid filter values return `400 Bad Request`.

## 7. Errors

Errors use standard HTTP status codes with a JSON body. Messages are in French
(they may be shown to end users); rely on the status code, not on the text.

| Status | Meaning | Body example |
|---|---|---|
| 400 | Invalid parameter | `["lng, lat et radius_km doivent être des nombres."]` |
| 401 / 403 | Missing, invalid, revoked or expired key, or missing scope | `{"detail": "..."}` |
| 404 | Unknown resource (e.g. locker code) | `{"detail": "..."}` |
| 429 | Rate limit exceeded; see the `Retry-After` header (seconds) | `{"detail": "..."}` |
| 503 | Service unavailable (health check) | `{"status": "unavailable"}` |

## 8. Rate limits

| Caller | Default limit | Counted per |
|---|---|---|
| Anonymous | 120 requests / minute | IP address |
| Signed-in user | 600 requests / minute | User account |
| Integration API key | 600 requests / minute | API key |

Limits are configurable per environment. When exceeded, the API answers `429`
with a `Retry-After` header; wait that long before retrying, and use
exponential back-off for repeated failures. Need more? Ask City Groom rather
than spreading calls over several keys.

## 9. Following events in near real time

Until webhooks exist (§11), integrations follow locker activity by
**polling** the event feed:

1. First call: `GET /api/v1/operator/locker-events/?since=<start time>`.
2. Process `results` (newest first) and follow `next` until it is `null`.
3. Remember the most recent `occurred_at` you processed.
4. Every 30-60 seconds, call again with `since=<that time>`.

Events are ordered by `occurred_at` (time reported by the locker). Offline
lockers (e.g. Bluetooth lockers syncing through a phone) may deliver events
late, with an `occurred_at` older than the time they reach City Groom
(`received_at`); allow a safety margin on `since` and de-duplicate by `id`.

## 10. Change and deprecation policy

Within `v1`, City Groom may, without notice:

- add endpoints, optional parameters, response fields, enumeration values,
  scopes;
- change French display texts and error messages.

Clients must therefore **ignore unknown fields** and handle unknown enumeration
values gracefully.

Breaking changes (removing or renaming a field or endpoint, changing a type or
a meaning, making a parameter mandatory) only happen in a new major version.
Deprecated endpoints are announced in the changelog below and in the OpenAPI
schema (`deprecated: true`) before removal.

## 11. Planned

Not available yet; listed so integrators can plan:

- **Webhooks**: City Groom will push events (locker events, order status) to
  a registered HTTPS URL, signed with HMAC-SHA256 and retried on failure.
- **Orders, rounds, merchants** endpoints, with new scopes.
- **OAuth 2.0 client credentials** if partners require it.

## 12. Changelog

| Date | Change |
|---|---|
| 2026-10-24 | Added `GET /api/v1/merchants/`. |
| 2026-10-24 | `v1` published: lockers (public), operations (occupancy, statistics, events), health check; integration API keys with scopes; rate limits. |
