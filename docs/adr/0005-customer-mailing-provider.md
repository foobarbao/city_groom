# ADR-0005 — Customer mailing provider

- **Status**: Accepted
- **Date**: 2026-10-26

## Context

- The project owner wants to **simplify customer mailing**: build customer
  profiles and segments (e.g. by order recurrence), design reusable email
  templates and send campaigns, using the customer data held by the backend.
- The need is essentially **mailing**, not a full sales CRM. Customer
  statistics (recurrence, order frequency, last order, customer value) are
  computed from orders, which live in the backend database (ADR-0002).
- Free options are preferred for the demo (same constraint as ADR-0004).
- Customer data is personal data: an EU-based provider is preferred (GDPR), and
  marketing emails require prior consent and an unsubscribe link.
- The backend is Django REST + PostgreSQL (ADR-0002); every external system is
  accessed through an interface with a simulated implementation (ADR-0003).
- Prices and limits below were gathered on 2026-10-26 from third-party
  sources. Brevo's official pricing page could not be read automatically
  (dynamic page, help centre returned HTTP 403), so **every figure must be
  checked on the provider's official pages before signing up**.

## Options considered

1. **Brevo (ex-Sendinblue)**, hosted email marketing service.
   - Contacts and attributes, segments, drag-and-drop template editor,
     campaigns, basic automation, transactional emails; REST API, SMTP relay
     and webhooks (openings, clicks, unsubscribes).
   - Free plan, as reported: about **300 emails per day**, a single user, a
     Brevo logo in emails that cannot be removed, limited automation, no A/B
     testing. Third-party sources disagree on the contact limit (100,000 or
     unlimited). Sources report that the API is available on the free plan.
     Paid plans reportedly start at about 9 to 25 USD per month (sources
     disagree).
   - French company; EU data location (to be confirmed in its data processing
     agreement).
   - Pros: zero cost and zero hosting for the demo, matches the need
     (templates + campaigns), simple API. Cons: daily sending cap, vendor
     branding on the free plan, data copied to a third party.
2. **Odoo** (CRM + Email Marketing apps), ERP suite.
   - Odoo Online: "One App Free" plan (one app, unlimited users), Standard plan
     reported at about 25 to 31 EUR per user per month. Several sources report
     that **external API access is only included in the Custom plan** (about
     47 to 58 USD per user per month), which is needed to sync with our
     backend.
   - Odoo Community, self-hosted: free, with its XML-RPC / JSON-RPC API.
     Whether mass mailing is included in Community was not verified.
   - Pros: full CRM and ERP if the need grows. Cons: API is costly on the
     hosted offer; self-hosting adds a heavy service to run; far beyond the
     current need.
3. **Twenty**, open-source CRM (AGPL-3.0), self-hosted or hosted.
   - Auto-generated REST and GraphQL APIs, custom objects, pipelines,
     workflows.
   - Self-hosting requires PostgreSQL, Redis, file storage, a server and a
     worker.
   - Pros: modern, free when self-hosted, good API. Cons: a CRM, not an email
     marketing tool; extra infrastructure to run.
4. **Mautic**, open-source marketing automation, self-hosted.
   - Segments, scoring, campaigns, email templates; REST API.
   - Pros: free and powerful. Cons: heavy to administer; still needs an
     outgoing email service (SMTP) with a good sending reputation.
5. **In-house mailing in Django** (templates in the code, sending through an
   SMTP service).
   - Pros: no third party for the data. Cons: rebuilds template editing,
     unsubscribe handling, bounces and statistics; no editor for a
     non-developer.

Complementary tool, not exclusive with the options above: **Metabase**
(open source, self-hosted) for customer statistics dashboards plugged directly
into PostgreSQL.

## Decision

**Brevo, free plan**, for customer mailing in the demo.

- The backend remains the **source of truth** for customers, orders and
  statistics. It pushes contacts and the attributes needed for segmentation
  (e.g. number of orders, last order date, area) to Brevo.
- Templates, segments and campaigns are managed in Brevo's interface.
- Brevo webhooks report unsubscribes back to the backend, so consent stays
  consistent on both sides.
- Brevo is accessed through an **`EmailMarketingProvider`** interface in the
  backend, following ADR-0003, with a simulated implementation (logs only) used
  by default in development and tests. Brevo is selected by configuration; its
  API key is provided through an environment variable, never committed.

Main reason: it matches the need (mailing, templates, segments) at zero cost
and with no infrastructure to run, while keeping the data in our own database.

## Consequences

- Only contacts who **gave marketing consent** are synced to Brevo; the consent
  field and its timestamp must exist in the customer model (see
  `docs/PRODUCT.md` open questions).
- The 300 emails per day cap (as reported) is enough for testers; campaigns to
  larger lists require a paid plan (`PROD:` review the plan and remove the
  Brevo branding before production mailings).
- A data processing agreement with Brevo must be reviewed and the provider
  listed in the privacy notice (`PROD:`).
- Brevo's API and webhook payloads must be checked against its official
  developer documentation when the integration is implemented.
- Switching provider later (Odoo, Twenty, Mautic or another sender) only
  requires a new `EmailMarketingProvider` implementation and a contact export.
- Statistics dashboards are not covered by this decision; Metabase or the
  Django admin can be considered later in a separate ADR if needed.
