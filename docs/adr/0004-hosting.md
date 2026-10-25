# ADR-0004 — Hosting for the demo

- **Status**: Proposed (awaiting the project owner's choice)
- **Date**: 2026-10-24

## Context

- No server is available yet; free options are preferred for the demo.
- To host: a Django backend (API + admin), a PostgreSQL database **with
  PostGIS**, two static frontends (customer PWA, partner web portal), and a
  periodic job for the locker / order simulator.
- The demo will be shown to testers, potential partners and funders: response
  time and availability matter for the impression it gives.
- Personal data of testers may be stored: hosting in the EU is preferred
  (GDPR).
- Free tiers change often and without notice. The figures below were gathered
  on 2026-10-24 from third-party sources and must be checked against each
  provider's official pages before signing up.

## Options considered

### A. Free managed services

- Backend: **Render** free web service. Reported limits: spins down after
  15 minutes without traffic, about one minute to wake up, 512 MB RAM,
  750 instance hours per month, no persistent disk. Render's free Postgres
  expires after 30 days, so it is not used.
- Database: **Neon** free plan (PostgreSQL with PostGIS among supported
  extensions). Reported limit: 1 GB per project.
- Frontends: **Cloudflare Pages** (or an equivalent static host) free plan.
- Simulator: no background worker on the free tier; run it on demand or from a
  scheduled CI job.
- Pros: zero cost, zero server administration. Cons: the cold start is
  noticeable during a demo; several providers to configure; limits may change.

### B. Free virtual machine

- **Oracle Cloud Always Free** Ampere A1 VM (reportedly reduced in June 2026
  from 4 OCPU / 24 GB to 2 OCPU / 12 GB for free-tier accounts), running the
  same Docker Compose stack as in development (Django, PostGIS, reverse proxy
  with automatic HTTPS, simulator).
- Pros: zero cost, always on, closest to a production setup. Cons: server
  administration (updates, backups, security), sign-up friction and capacity
  issues are commonly reported, and the free allowance changed without public
  announcement.

### C. Low-cost EU virtual private server

- A small VPS from an EU provider (for example Hetzner, OVHcloud, Scaleway),
  typically a few euros per month (exact prices to be checked), running the
  same Docker Compose stack as option B.
- Pros: reliable, always on, EU data location, same setup as production.
  Cons: not free; server administration as in option B.

## Proposed decision

1. **Now**: develop locally with Docker Compose; no hosting is needed until the
   first version is ready for testers.
2. **First testers**: **option A** (free), choosing EU regions where offered.
3. **Before showing the demo to partners or funders**: move to **option C**
   (or B), so the demo is always on and responsive.

The backend is packaged as a Docker image from the start, so moving between
options requires configuration changes only.

## Consequences

- The code must not depend on any provider-specific feature: configuration via
  environment variables, database URL, static files served by the app or a
  CDN, media files on S3-compatible storage when needed.
- A `docs/BUILD_AND_RELEASE.md` guide will describe the deployment for the
  chosen option.
- Database backups must be set up as soon as real tester data exists (`PROD:`
  for the free tiers, which offer limited or no backups).
