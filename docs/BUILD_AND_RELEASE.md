# Build and release

> **Status**: living document · **Last updated**: 2026-10-26
>
> How the customer app becomes an Android app. Written for web developers new
> to mobile: each step is compared with its web equivalent.

## 1. How it works

The customer app is a regular web app (Vue + Vite). **Capacitor** wraps the
built web files (`apps/customer/dist/`) in a native Android project
(`apps/customer/android/`), which shows them in a full-screen web view and
gives access to native features (GPS, Bluetooth, NFC…) through plugins.

| Web                                  | Android with Capacitor                                                |
| ------------------------------------ | --------------------------------------------------------------------- |
| `vite build` produces `dist/`        | Same, then `cap sync` copies `dist/` into the Android project         |
| The site is identified by its domain | The app is identified by its **application id** (`appId`)             |
| Deploy to a server                   | Build an **APK** (installable file) or an **AAB** (Play Store format) |
| HTTPS certificate                    | **Signing key** (keystore) proving the app comes from you             |

The Android project in `android/` is committed: it is the native source code
of the app, edited with Android Studio when needed (icons, permissions…).

## 2. Application id and name

Set in `apps/customer/capacitor.config.ts`:

- `appId`: **`fr.citypal.app` (provisional)**. A unique, permanent
  identifier written like a reversed domain name. It can change freely until
  the first Play Store publication; after that it can never change. The
  project owner named the app "CityPal" (2026-10-24); the domain is not bought yet
  (docs/PRODUCT.md).
- `appName`: "CityPal", the name shown under the app icon.

## 3. Build a test APK

Prerequisites, on your computer (not needed for web development):

- [Android Studio](https://developer.android.com/studio), which installs the
  Android SDK and a Java runtime;
- an Android phone with _developer options_ and _USB debugging_ enabled, or an
  emulator created in Android Studio (Device Manager).

Steps, from the repository root:

```bash
npm install
npm run android:sync -w apps/customer   # build the web app and copy it into android/
npm run android:open -w apps/customer   # open the Android project in Android Studio
```

Then in Android Studio:

- **Run ▶** to install and start the app on the connected phone or emulator;
- or **Build → Build Bundle(s) / APK(s) → Build APK(s)** to get a debug APK
  (`android/app/build/outputs/apk/debug/app-debug.apk`) that testers can
  install by hand (Android asks them to allow installing from unknown
  sources).

Re-run `android:sync` after every change to the web app.

### API address on a phone

The app calls the API at `VITE_API_BASE_URL`. On a phone, `localhost` is the
phone itself: use your computer's local network address (e.g.
`http://192.168.1.20:8000/api/v1`) in `apps/customer/.env.local`, add it to
`CORS_ALLOWED_ORIGINS` and `DJANGO_ALLOWED_HOSTS` in `backend/.env`, then
re-sync. Android blocks plain HTTP by default outside development; a deployed
HTTPS backend avoids the issue.

## 4. Signing and publication (later)

Not done yet; nothing is published on the Play Store for now. **On hold**
since 2026-10-26: the project owner keeps CityPal as a web app for the time
being (docs/PRODUCT.md). Still missing before a release, as reviewed that
day:

- **Google sign-in inside the app**: Google refuses its web sign-in in an
  app's web view, so the code turns it off on Android
  (`apps/customer/src/services/googleIdentity.ts`); a native Capacitor
  plugin and an "Android" OAuth client (declared with the SHA-1 of the
  signing key) are needed. The plugin choice deserves an ADR.
- **Launcher icons and splash screen**: still Capacitor's defaults; the
  CityPal mark exists (docs/DESIGN.md "Brand").
- **API address** of the Android build: `https://api.citypal.fr/api/v1`.
- **Release signing** and an **AAB build**, e.g. in a GitHub Actions
  workflow with the keystore kept as a repository secret.
- On the owner's side: a Google Play developer account (one-off fee,
  identity check), the store listing (texts, screenshots, 512 px icon,
  1024 × 500 banner), the data safety, content rating and target audience
  forms, the privacy policy URL (`https://citypal.fr/confidentialite`).
  ASSUMPTION (not verified against Google's current rules): new personal
  accounts must run a closed test with at least 12 testers for 14 days
  before production access; check in the Play Console.

- A **release keystore** must be created once and **backed up outside the
  repository**: losing it makes updates of the published app impossible.
- The Play Store expects an **AAB** signed with that key, a developer account,
  a privacy policy and store listing assets.
- The Android `versionCode` is incremented for every distributed build
  (CONTRIBUTING.md §4).

## 5. Known limitations

- The AI assistant's development environment cannot download the Android SDK
  (`dl.google.com` is blocked), so APKs are built on a developer machine for
  now.
- `npm audit` reports 3 moderate advisories in `@capacitor/cli` dependencies
  (`uuid` via `xcode`, used for iOS projects only). The CLI is a build tool,
  not shipped in the app; the suggested fix downgrades the CLI and is not
  applied.

## 6. Deploy the backend (Render + Neon)

Chosen on 2026-10-25 for the first hosted backend (ADR-0004, option A):
**Neon** for PostgreSQL + PostGIS, **Render** (free web service) for Django.
Web parallel: the same Docker image as `docker compose`, with configuration
in environment variables instead of `backend/.env`.

Free-tier limits (third-party figures, to check on the providers' pages):
the Render service sleeps after 15 minutes without traffic and takes about a
minute to wake up; Neon's free plan stores about 1 GB.

### Database (Neon)

1. Sign up at <https://neon.tech/>, create a project `citypal` in an **EU
   region** (e.g. Frankfurt). Done on 2026-10-25: project `citypal`,
   `aws-eu-central-1`, PostgreSQL 18.6, branch `production`, database
   `neondb` (Django 5.2 supports PostgreSQL 14 and later).
2. Copy the **direct** connection string (Neon console → Connect, pooling
   **off**: the host has no `-pooler` suffix; `postgresql://…?sslmode=require`).
   Direct, because `start.sh` runs `migrate` with the same URL and
   migrations can fail through the pooler (transaction-mode PgBouncer). It
   is a secret: it goes only into Render's environment variables.
3. Nothing else: `migrate` creates the PostGIS extension itself (GeoDjango
   runs `CREATE EXTENSION IF NOT EXISTS postgis`). Checked on 2026-10-25:
   PostGIS 3.6.4 is available on the project (`pg_available_extensions`);
   creating it through `migrate` is not verified yet. If `migrate` fails on
   it, run `CREATE EXTENSION postgis;` in Neon's SQL editor.

### Web service (Render)

1. Sign up at <https://render.com/> with GitHub and allow access to
   `foobarbao/city_groom`.
2. **New → Web Service**, repository `city_groom`, branch **`develop`**.
3. Language **Docker**; root directory / Docker build context **`backend`**
   (Dockerfile `backend/Dockerfile`); region **Frankfurt**; instance **Free**.
4. Health check path: `/api/v1/health/`.
5. Environment variables:

| Variable                                                                           | Value                                                                             |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `DJANGO_SECRET_KEY`                                                                | long random value: `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DJANGO_ALLOWED_HOSTS`                                                             | `<service>.onrender.com`                                                          |
| `DJANGO_CSRF_TRUSTED_ORIGINS`                                                      | `https://<service>.onrender.com` (admin sign-in form)                             |
| `DATABASE_URL`                                                                     | Neon connection string                                                            |
| `CORS_ALLOWED_ORIGINS`                                                             | `https://citygroom.netlify.app`                                                   |
| `GOOGLE_OAUTH_CLIENT_IDS`                                                          | Google client ID (`docs/GOOGLE_SIGN_IN.md`)                                       |
| `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD` | first administrator; remove them after the first deploy                           |

The image's start command (`backend/scripts/start.sh`) applies migrations,
creates the first administrator from the variables above if missing, then
starts Gunicorn on Render's `$PORT`. Free plans have no shell and no
pre-deploy step, hence this script.

6. Deploy, then open `https://<service>.onrender.com/admin/` and sign in
   with the administrator account.

### Fill the database

The workflow **Seed hosted database** (`.github/workflows/seed-hosted-db.yml`,
Actions tab → Run workflow) applies the migrations, then loads the
`data/osm/` files: the simulated network of the demo site (155 lockers:
tram stops, strategic places, Inovallée, lycées and higher education,
validated companies; large units in Grenoble; tick "Rebuild every simulated
locker" when the placement rules change), the real OpenStreetMap merchants and, unless
unticked, the fictitious "Démo ·" shops. Safe to run again.

One-time setup: add the repository secret **`HOSTED_DATABASE_URL`**
(Settings → Secrets and variables → Actions) with the same Neon direct
connection string as `DATABASE_URL` on Render.

### Connect the customer app

Done on 2026-10-25: service `https://citypal.onrender.com` (admin at
`/admin/`); `VITE_API_BASE_URL=https://citypal.onrender.com/api/v1` is set
in `apps/customer/.env.demo-site` (public value). Checked: health endpoint
200, CORS preflight from `https://citygroom.netlify.app` allowed, the Google
endpoint rejects an invalid token (400) as expected.

On Netlify, set `VITE_API_BASE_URL=https://<service>.onrender.com/api/v1`
and `VITE_GOOGLE_CLIENT_ID`, then trigger a deploy (`docs/GOOGLE_SIGN_IN.md`
§4). Only the sign-in uses the backend; the rest of the hosted demo keeps
its bundled fictitious data.

### Custom domain (citypal.fr)

Bought by the project owner on 2026-10-25 at OVHcloud (DNS zone at OVH).
Addresses (owner's decision, 2026-10-25):

| Address                          | Serves                                          |
| -------------------------------- | ----------------------------------------------- |
| `https://citypal.fr` (and `www`) | customer app (`/` redirects to `/client/`)      |
| `https://pro.citypal.fr`         | redirects to `https://citypal.fr/pro/` (portal) |
| `https://api.citypal.fr`         | backend and admin (Render)                      |

1. Add the domains to the services first: Netlify → Domain management →
   `citypal.fr` (with `www`) and `pro.citypal.fr`; Render → Custom Domains →
   `api.citypal.fr`.
2. OVH DNS zone (values from Netlify's documentation, checked 2026-10-25):
   - `citypal.fr` **A** → `75.2.60.5` (Netlify load balancer; OVH has no
     ALIAS record at the apex); delete the OVH welcome `AAAA` and `TXT`
     records of `citypal.fr` and `www`;
   - `www` **CNAME** → `citygroom.netlify.app.` (after deleting the `www`
     A, AAAA and TXT records: a CNAME cannot sit next to other records);
   - `pro` **CNAME** → `citygroom.netlify.app.`;
   - `api` **CNAME** → the target Render shows (expected
     `citypal.onrender.com.`);
   - keep NS, MX and SPF (e-mail).
3. Done on 2026-10-26 (Render variables updated by the owner, checked:
   health 200, CORS from `https://citypal.fr` allowed). Once verified (HTTPS issued by both services): point
   `VITE_API_BASE_URL` to `https://api.citypal.fr/api/v1`, add
   `api.citypal.fr` to `DJANGO_ALLOWED_HOSTS` and
   `https://api.citypal.fr` to `DJANGO_CSRF_TRUSTED_ORIGINS`, add
   `https://citypal.fr` to `CORS_ALLOWED_ORIGINS` (Render), and
   `https://citypal.fr` to the OAuth client's JavaScript origins
   (`docs/GOOGLE_SIGN_IN.md`).

PROD: database backups (limited on free plans), a custom domain, HSTS, and
moving to an always-on plan before showing the demo to partners (ADR-0004).
