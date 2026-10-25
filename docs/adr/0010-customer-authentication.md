# ADR-0010 — Customer accounts and sign-in with Google

- **Status**: Proposed (the owner's choices of 2026-10-25 are recorded below;
  the technical choices await their review)
- **Date**: 2026-10-25

## Context

The project owner asked on 2026-10-25 for sign-in with Google, "to get as
much information as possible about the customer and make sign-in easier",
working right away if possible, with a clear administration view of the
users. Answers given the same day:

- **basic Google profile only** (name, e-mail, picture), after being told
  that the GDPR requires data minimisation and that extended data (phone,
  birthday, gender, address) needs a Google verification;
- backend hosted on the **free option A of ADR-0004** (Render + Neon);
- the owner creates the Google OAuth client, with a guide
  (`docs/GOOGLE_SIGN_IN.md`).

Constraints:

- Guest checkout stays possible (docs/PRODUCT.md §8).
- One API for apps and integrations (ADR-0007). The customer app (Netlify)
  and the API (Render) are on different domains, so cross-site cookies are
  not reliable: the app needs a token sent in a header.
- No user data existed yet: the user model can still be changed freely.

Verified facts (Google documentation and library source, 2026-10-25):

- Google Identity Services gives the web app an **ID token** (JWT). Google
  asks servers to verify it with a Google library: signature against Google's
  public keys, expiry, issuer, and audience = one of the app's client IDs;
  only `sub` identifies the person.
- `google-auth` (official Python library, 2.62) does this in
  `id_token.verify_oauth2_token(token, request, audience)`, where `audience`
  may be a list; with `audience=None` the audience is **not** checked.

## Options considered

### Sign-in flow

1. **ID token verified by our API** (`POST /api/v1/auth/google/`) with
   `google-auth` — small, every step verifiable, no client secret needed.
   Cons: any other provider (Apple, e-mail links) is our code too.
2. **django-allauth (headless)** — many providers, e-mail flows, account
   pages. Cons: larger surface and settings; its documentation could not be
   reached from the development environment to check the headless details
   on 2026-10-25.
3. **Hosted identity service** (e.g. Firebase Auth) — fast, but another
   provider holding customer data, and accounts outside Django's admin.

### Session of the apps

1. **DRF token** (`rest_framework.authtoken`): one token per user, in
   `Authorization: Token …` — built in, simple. Cons: no expiry; one token per
   user, so signing out ends every device's session.
2. **Expiring tokens** (e.g. django-rest-knox, JWT) — better hygiene, more
   moving parts.

### User model

1. **Project user model now** (`accounts.User`, Django's recommendation for
   new projects), with a `GoogleAccount` linked to it.
2. Keep `auth.User` — changing it later, with data, is a heavy migration.

## Decision (proposed)

- Flow option 1, session option 1, user model option 1.
- Only verified e-mails are accepted. A Google sign-in **never** takes over
  an account of a team member or an account with a password (refused with a
  message); otherwise the account is found by `sub`, else by e-mail, else
  created without a password.
- The profile (names, picture) is refreshed at each sign-in.
- Administration: "Comptes" list with photo, name, e-mail, sign-in method,
  customer/team, sign-up and last sign-in dates, filters, search, a summary
  of key figures and a "deactivate" action. Token keys are not shown.

## Consequences

- Local databases created before this change must be recreated (no real
  data existed): `docker compose down -v`, then `migrate`.
- The Android app cannot use the web button inside its web view (ASSUMPTION:
  Google's policy against embedded web views, to confirm on a device): it
  will need a Capacitor plugin using Android's Credential Manager and an
  Android OAuth client; its ID token is accepted by adding that client ID to
  `GOOGLE_OAUTH_CLIENT_IDS`. Until then the Android app keeps the demo
  sign-in.
- PROD: privacy notice (what is collected, why, how long, rights) before
  real customers sign up; retention and deletion of accounts; expiring
  tokens; secure token storage on Android.
- Apple's App Store rules on third-party sign-in matter only if an iOS app
  is built (not planned; not checked).
