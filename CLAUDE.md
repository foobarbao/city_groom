# Instructions for Claude

This file is read automatically by Claude Code. It summarises the project rules;
the reference documents prevail in case of doubt.

## Mandatory references

- Coding standards: `docs/CODING_STANDARDS.md`
- Product requirements and open questions: `docs/PRODUCT.md`
- Git workflow: `CONTRIBUTING.md`
- Architecture decisions: `docs/adr/`

## Essential rules

1. **Document systematically, in the same pull request as the code**:
   docstrings / TSDoc on everything public, file headers, comments on the
   *why*, updates to the README, docs and `CHANGELOG.md`. Undocumented work is
   not done.
2. **Never invent. At the slightest doubt, ask before acting.** No API, option,
   version, endpoint, business rule or result is asserted without checking the
   source (official documentation, repository code, actual execution).
   Functional requirements are never guessed: ask, and record the answer in
   `docs/PRODUCT.md`. Flag every assumption explicitly (`ASSUMPTION:`) and
   report faithfully what failed or was not verified. See
   `CODING_STANDARDS.md` §2.
3. **Every structural decision → an ADR** in `docs/adr/` (template:
   `docs/adr/TEMPLATE.md`). Do not settle alone a structural decision that is
   not covered by an accepted ADR: propose it.
4. **Languages**: code, comments, commits, pull requests and **all repository
   documentation strictly in English**. **User interfaces in French**, always
   through i18n. Conversations with the project owner are in French.
5. **Platforms**: customers use the mobile app; merchants, courier partners
   and operators use web interfaces (partner portal + Django admin);
   merchants also get the portal as an Android "pro" app (ADR-0006).
6. **Product red lines**: no e-commerce parcels, no perishable goods / meal
   delivery. Services only (laundry, ironing, repairs…).
7. **Git**: never push to `main` or `develop`; work on a dedicated branch,
   Conventional Commits, pull request to `develop`.
8. **Demo shortcuts**: allowed only when marked `PROD: <required action>`.
   Simulated data and integrations are clearly labelled and isolated.
9. **No secrets** in the repository (keys, keystore, `.env`).
10. Before pushing: lint, format, type check and tests must pass.

## Reminders

`docs/PRODUCT.md` has a **Reminders** section listing topics the project owner
asked to be reminded of. Bring them up when relevant (e.g. when working on the
related feature) and at the start of a new work session.

## Project owner context

The project owner is an expert in Django REST and Vue.js and new to mobile
development: explain mobile-specific notions (Android lifecycle, permissions,
Capacitor, APK signing…) by drawing parallels with web development when useful.
