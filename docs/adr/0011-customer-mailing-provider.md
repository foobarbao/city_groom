# ADR-0011 — Customer mailing provider

- **Status**: Accepted
- **Date**: 2026-10-26

## Context

- The project owner wants to **simplify customer mailing**: customer segments,
  reusable e-mail templates and campaigns (announcements: launch, offers),
  using the customer data held by the backend. The need is essentially
  **mailing**, not a full sales CRM.
- Consent already exists: the opt-in box, unticked by default, at the Google
  sign-in and on the account screen stores `User.announcements` and its date
  (`announcements_changed_at`); the admin exports the agreeing addresses as a
  CSV (`docs/PRODUCT.md` open question 14, ADR-0010).
- Owner's answers of 2026-10-26: **only CityPal sends campaigns** (merchants do
  not e-mail customers through the platform); transactional messages (order
  confirmation, item ready for pickup) are **push notifications** in the app,
  not e-mails; the first statistics wanted are aggregate counts (number of
  users, number of orders).
- The domain `citypal.fr` is owned, with its DNS zone at OVHcloud
  (`docs/BUILD_AND_RELEASE.md`); the backend runs on Render with a Neon
  database (ADR-0004).
- Free options are preferred for the demo. Customer data is personal data: an
  EU-based provider is preferred (GDPR).
- Prices and limits below were gathered on 2026-10-26 from third-party
  sources. Brevo's official pricing page could not be read automatically
  (dynamic page; the help centre returned HTTP 403), so **every figure must be
  checked on the provider's official pages**.

## Options considered

1. **Brevo (ex-Sendinblue)**, hosted e-mail marketing service.
   - Contacts and attributes, segments, drag-and-drop template editor,
     campaigns, basic automation; REST API, SMTP relay and webhooks
     (openings, clicks, unsubscribes); contact import from CSV.
   - Free plan, as reported: about **300 e-mails per day**, a single user, a
     Brevo logo in e-mails that cannot be removed, limited automation, no A/B
     testing. Sources disagree on the contact limit (100,000 or unlimited).
     The API is reported to be available on the free plan. Paid plans
     reportedly start at about 9 to 25 USD per month (sources disagree).
   - French company; EU data location to be confirmed in its data processing
     agreement.
   - Pros: zero cost and zero hosting, matches the need (templates +
     campaigns), the existing CSV export can be imported as is, simple API.
     Cons: daily sending cap, vendor branding on the free plan, data copied
     to a third party.
2. **Odoo** (CRM + Email Marketing apps), ERP suite.
   - Odoo Online: "One App Free" plan (one app, unlimited users); Standard
     plan reported at about 25 to 31 EUR per user per month. Several sources
     report that **external API access is only included in the Custom plan**
     (about 47 to 58 USD per user per month), which a sync with our backend
     needs.
   - Odoo Community, self-hosted: free, XML-RPC / JSON-RPC API. Whether mass
     mailing is included in Community was not verified.
   - Pros: full CRM and ERP if the need grows. Cons: the API is costly on the
     hosted offer; self-hosting adds a heavy service; far beyond the need.
3. **Twenty**, open-source CRM (AGPL-3.0), self-hosted or hosted.
   - Auto-generated REST and GraphQL APIs, custom objects, pipelines,
     workflows. Self-hosting requires PostgreSQL, Redis, file storage, a
     server and a worker.
   - Pros: modern, free when self-hosted, good API. Cons: a CRM, not an
     e-mail marketing tool; extra infrastructure.
4. **Mautic**, open-source marketing automation, self-hosted.
   - Segments, scoring, campaigns, templates; REST API.
   - Pros: free and powerful. Cons: heavy to administer; still needs an
     outgoing e-mail service with a good sending reputation.
5. **In-house mailing in Django** (templates in the code, sending through an
   SMTP service).
   - Pros: no third party for the data. Cons: rebuilds template editing,
     unsubscribe handling, bounces and statistics; no editor for a
     non-developer.

Complementary tool, not exclusive with the options above: **Metabase** (open
source, self-hosted) for statistics dashboards plugged into PostgreSQL. The
first statistics wanted (counts of users and orders) are already within reach
of the Django admin.

## Decision

**Brevo, free plan**, for customer announcements. The account was created by
the project owner on 2026-10-26.

- The backend remains the **source of truth** for customers, consent, orders
  and statistics.
- **Step 1 (now, no code)**: the operator exports the agreeing addresses from
  the admin (existing CSV action) and imports them into a Brevo list.
  Templates and campaigns are built in Brevo's editor. Sender: CityPal, from
  an address on `citypal.fr` once the domain is authenticated in Brevo.
- **Step 2 (later)**: automatic sync through Brevo's API, behind an
  **`EmailMarketingProvider`** interface in the backend (ADR-0003 integration
  boundaries), with a simulated implementation (logs only) used by default in
  development and tests. Only users with `announcements=True` are pushed,
  with the attributes needed for segmentation. Brevo's unsubscribe webhook
  calls `User.set_announcements(False)`, so consent stays consistent. The API
  key is an environment variable on Render, never committed.

Main reason: it matches the need (templates, segments, campaigns) at zero
cost, with no infrastructure to run, and works today with the existing CSV
export while keeping the data in our own database.

## Consequences

- **Before the first import into Brevo**, the privacy policy
  (`docs/legal/privacy-policy.fr.md` and the `/confidentialite` page) must
  name Brevo as a processor of announcement e-mails, and Brevo's data
  processing agreement must be accepted.
- Until step 2, unsubscribes made in Brevo are not reflected in the admin:
  before each new import, the operator removes from the CSV the addresses
  Brevo lists as unsubscribed (or Brevo keeps them blocked; to be checked in
  Brevo's documentation). `PROD:` implement step 2.
- Authenticating `citypal.fr` in Brevo adds DNS records at OVH. The domain
  already has an SPF record (e-mail); a domain may publish only one SPF
  record, so any change Brevo asks for must be merged into it, not added as a
  second one.
- The reported 300 e-mails per day cap is enough for testers; larger lists
  need a paid plan (`PROD:` review the plan and the Brevo branding before
  production campaigns).
- Brevo's API and webhook payloads must be checked against its official
  developer documentation when step 2 is implemented.
- Switching provider later (Odoo, Twenty, Mautic or another sender) only
  requires a new `EmailMarketingProvider` implementation and a contact
  export.
- Push notifications for transactional messages need their own decision
  (provider, Android permission); a separate ADR will cover them.
