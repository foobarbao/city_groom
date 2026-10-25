# Sign in with Google — setup guide

> **Status**: living document · **Last updated**: 2026-10-25
>
> How to create the Google OAuth client used by "Continuer avec Google" in the
> customer app (ADR-0010) and by the Google Agenda sync of the merchant
> planning (ADR-0009). About 10 minutes, with a Google account you own.
> Google renames console menus from time to time: if a label differs, look
> for the closest one.

## What it is, in web terms

Signing in with Google works like any OAuth/OpenID login: Google shows its
account picker, then hands the app a signed **ID token** (a JWT). The app
sends that token to the CityPal API, which checks the signature and that the
token was issued **for our client ID**, then creates or finds the account.

The **client ID** is public: it is in the app bundle, like a site key. The
**client secret** Google also shows is **not needed** for this flow: do not
copy it anywhere.

## 1. Create a Google Cloud project

1. Open <https://console.cloud.google.com/> and sign in.
2. Project selector (top bar) → **New project** → name it `CityPal` → Create.

## 2. Configure the consent screen (Google Auth Platform)

1. Menu → **APIs & Services** → **OAuth consent screen** (shown as **Google
   Auth Platform** → *Branding*, *Audience*, *Clients* in recent consoles).
2. App information: name **CityPal**, user support e-mail (yours), developer
   contact e-mail.
3. Audience: **External**.
4. Data access (scopes): add
   `https://www.googleapis.com/auth/calendar.app.created` (Google Agenda
   sync: CityPal may create its own calendar and manage only that one). The
   customer sign-in asks only for the basic profile (`openid`, `email`,
   `profile`), as decided on 2026-10-25.
5. **Enable the Google Calendar API**: menu → *APIs & Services* → *Library*
   → "Google Calendar API" → *Enable*.
6. While the app is in **Testing**, only the **test users** you add (your
   Google address and the testers') can sign in. To open it to everyone,
   **publish** the app (*Audience* → *Publish app*). ASSUMPTION, to confirm
   in the console: the basic scopes need no Google verification; if the
   console marks the calendar scope as *sensitive*, Google must verify the
   app before merchants other than test users can sync (a logo, if added,
   may also require a brand verification). Publishing requires a domain you
   own (verified in Google Search Console) with a public home page and a
   privacy policy on it (draft: `docs/legal/privacy-policy.fr.md`).

## 3. Create the OAuth client ID

1. **Credentials** (or *Clients*) → **Create credentials** → **OAuth client
   ID**.
2. Application type: **Web application**, name `CityPal web`.
3. **Authorized JavaScript origins** (exact addresses, no trailing slash):
   - `https://citygroom.netlify.app` (hosted demo);
   - `http://localhost` and `http://localhost:5173` (local development).
4. Authorized redirect URIs: **none** (the button uses a popup).
5. Create, then copy the **client ID** (`…apps.googleusercontent.com`).

Netlify deploy previews (`deploy-preview-N--citygroom.netlify.app`) are other
origins: the button does not work there unless they are added too.

## 4. Give the client ID to CityPal

The same value goes to two places:

| Where | Variable | Value |
|---|---|---|
| Backend (Render → service → *Environment*) | `GOOGLE_OAUTH_CLIENT_IDS` | the client ID |
| Customer app and portal (Netlify → *Site configuration* → *Environment variables*) | `VITE_GOOGLE_CLIENT_ID` | the client ID |
| Customer app (Netlify, same place) | `VITE_API_BASE_URL` | `https://<render-service>.onrender.com/api/v1` |

Then redeploy both (on Netlify: *Deploys* → *Trigger deploy*).

Shortcut: the client ID and the API address are public values, so they can
also be committed in `apps/customer/.env.demo-site` and
`apps/portal/.env.demo-site` instead of Netlify's variables (Netlify's
variables take precedence when both are set). Give them to the assistant
and the next deploy carries them. Vite writes
`VITE_*` values into the bundle at build time, so a rebuild is required.

Locally: `GOOGLE_OAUTH_CLIENT_IDS` in `backend/.env`, `VITE_GOOGLE_CLIENT_ID`
in `apps/customer/.env.local`.

## 5. Check

1. Open <https://citygroom.netlify.app/client/compte>: the **Continuer avec
   Google** button replaces the demo form.
2. Sign in. The first request may take up to a minute: the free Render
   service sleeps after 15 minutes without traffic.
3. Portal → merchant space → **Planning** → **Connecter Google Agenda**:
   after Google's consent screen, a "CityPal · …" calendar appears in Google
   Agenda with the week's tasks; "Marquer fait" adds "✓" to the event.
4. In the administration (`https://<render-service>.onrender.com/admin/`) →
   **Comptes**: the new account appears with its photo and "Google".

If the button does not appear: the variable is missing or the site was not
rebuilt. "Connexion Google refusée": the backend does not list the client ID,
or the test user is not added while the app is in Testing.
