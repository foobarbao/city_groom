# ADR-0007 — Backend API open to third-party integrations

- **Status**: Accepted
- **Date**: 2026-10-24

## Context

- The project owner wants backend API access so that other tools can be
  integrated in the future, with very thorough documentation.
- The API already serves the City Groom frontends; it is generated from the
  code as an OpenAPI schema (ADR-0002).
- Integrations are machine-to-machine callers (dashboards, partner systems,
  scripts): they cannot use a browser session, and must only reach what they
  need.
- Locker vendors and partners commonly expose REST APIs with event feeds or
  signed webhooks (see `docs/LOCKERS.md`).

## Options considered

### Authentication

1. **API keys with scopes** (djangorestframework-api-key, hashed storage,
   expiry and revocation, plus a City Groom scope field) — simple for
   integrators (one header), enough for server-to-server use, fine-grained
   through scopes.
2. **OAuth 2.0 client credentials** — standard and short-lived tokens, but an
   authorisation server to run and more work for every integrator; premature
   at this stage.
3. **User accounts for integrations** — mixes people and machines, no scopes.

### Versioning

1. **Major version in the URL** (`/api/v1/`) — explicit, cache- and
   log-friendly, easy to document.
2. Version in a header — cleaner URLs, but invisible in logs and links and
   easy to forget.

## Decision

- One API, **`/api/v1/`**, for City Groom apps and integrations alike: no
  private "internal" API diverging from the documented one.
- **Integration API keys** sent as `Authorization: Api-Key <key>`: only a hash
  is stored, keys can expire and be revoked, each key holds **scopes**. Views
  declare the scope they require; missing scope → 403 (fail closed).
- **Rate limits** per IP (anonymous), per user and per API key.
- Documentation in two layers: the generated **OpenAPI schema** (Swagger UI,
  ReDoc) for the reference, validated in CI with no warnings, and the
  **integration guide** `docs/api/README.md` for the rules (authentication,
  scopes, errors, pagination, rate limits, change policy).
- Real-time integration through a **polled event feed** with cursor
  pagination for now; **signed webhooks** are planned.

## Consequences

- Every new endpoint must have a summary, a description, a tag and, if
  protected, a `required_scope`; the guide's endpoint table and changelog are
  updated in the same pull request.
- Within `v1`, only backward-compatible changes are allowed; clients are told
  to ignore unknown fields.
- Rate limiting needs a shared cache in production (`PROD:` marker in the
  settings).
- Moving to OAuth 2.0 later remains possible alongside API keys (new ADR).
