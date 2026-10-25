# ADR-0009 — Connectors between the merchant planning and external tools

- **Status**: Proposed
- **Date**: 2026-10-25

## Context

The project owner asked on 2026-10-25 for a merchant planning linked to
Google Calendar, then for "connectors to link as many external tools as
possible, such as planners" (docs/PRODUCT.md §5).

Constraints:

- Merchants are small local businesses using very different tools: Google
  or Microsoft calendars, Apple Calendar, Trello, Notion, paper… No single
  tool covers them.
- One versioned API for apps and integrations (ADR-0007): any connector is
  served by `/api/v1/` and protected by scoped credentials.
- The demo has no server: anything beyond a file or a link can only be
  simulated.
- Every native integration (OAuth app, provider review, API changes) is
  ongoing maintenance for a small team.

Verified facts:

- iCalendar (RFC 5545) is imported by the common calendars, and most can
  subscribe to an iCalendar URL and refresh it on their own. The refresh
  delay is set by each calendar and is not under CityPal's control (to be
  measured per calendar before launch; not verified here).
- Zapier ("Catch Hook"), Make and n8n all provide a webhook trigger followed
  by actions in thousands of tools, including Trello, Notion, Google Calendar
  and Google Sheets.
- The "add to Google Agenda / Outlook.com" links used in the demo are not
  officially documented; they follow community documentation
  (InteractionDesignFoundation/add-event-to-calendar-docs).

## Options considered

1. **Files and links only** (current demo) — no server, works today. Cons:
   a one-off copy; the merchant must re-export after each change.
2. **Private iCal subscription feed per merchant** — read-only URL with a
   revocable secret token, e.g. under `/api/v1/merchants/<code>/agenda.ics`
   (path to be set when implemented). Universal for calendars, little code.
   Cons: one-way, refresh delay chosen by the calendar, the URL is a secret
   to protect.
3. **Outgoing signed webhooks** (`agenda.task.scheduled`,
   `agenda.task.done`, and later order events) sent to an address the
   merchant enters; Zapier / Make / n8n turn them into cards, tasks or rows
   in any planner. One mechanism for the long tail of tools; also useful for
   other integrations (ADR-0007). Cons: the merchant needs an automation
   account (free tiers have limits); retries and signatures to build.
4. **Native integrations per provider** (Google Calendar API, Microsoft
   Graph, Trello, Notion…) — best experience, two-way possible. Cons: an OAuth
   app and a review per provider, tokens to store, maintenance multiplied by
   the number of tools.

## Decision

Proposed, to be accepted by the project owner:

- keep option 1 (already in the demo);
- build options 2 and 3 with the backend, as the default connectors;
- add a native integration (option 4) only for a tool that many merchants
  ask for, each in its own ADR.

## Consequences

- Backend (later): feed endpoint with token rotation, webhook subscriptions
  per merchant (address, secret, events), signed deliveries with retries and
  a delivery log; documented in `docs/api/README.md` and the OpenAPI schema.
- Two-way sync (a task ticked in Trello marked done in CityPal) is not
  covered; it needs incoming webhooks or native integrations and is an open
  question.
- The demo shows the feed and webhook as simulated: a fictitious address on
  a reserved `.invalid` domain, nothing sent.
