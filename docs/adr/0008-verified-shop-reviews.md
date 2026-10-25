# ADR-0008 — Verified shop reviews, internal first

- **Status**: Accepted
- **Date**: 2026-10-24

## Context

The project owner wants customers to rate partner shops **out of 5**, and only
customers who **ordered** from the shop (docs/PRODUCT.md §4c). They mentioned
that a partner could be used if needed. The choice was put to them on
2026-10-24; they chose "internal, partner later".

Constraints:

- Reviews must be trustworthy: merchants are local businesses whose
  reputation matters, and the platform must not be suspected of inventing or
  filtering reviews.
- French consumer law regulates online consumer reviews (Code de la
  consommation, article L111-7-2 and its implementing decree): a site
  publishing reviews must inform users clearly about how reviews are
  collected, checked and published. The exact obligations must be checked
  with a legal adviser before launch (not verified here).
- The demo has no backend for orders yet; reviews are fictitious.

## Options considered

1. **Internal verified reviews** — a review is tied to a completed order (one
   per order), so only real customers can rate. Free, fully under control,
   fits the "order first" rule exactly. Cons: the platform must itself
   publish its review policy and handle moderation and disputes.
2. **Third-party certified provider** (e.g. review platforms certified
   against the French standard NF Z74-501) — independent credibility,
   moderation handled by the provider. Cons: subscription cost, integration
   work, dependency, and it is not needed before real orders exist.
3. **Public reviews from map services** (e.g. imported ratings) — not tied to
   CityPal orders, licensing restrictions, and would show ratings on
   businesses that are not partners. Rejected.

## Decision

Option 1 now: **internal reviews tied to completed orders**, rating from 1 to
5 with an optional comment. The data model keeps the order reference so that
reviews can be exported to a certified provider later (option 2) without
losing the "verified" link.

Real businesses that are not partners never show a rating.

## Consequences

- Backend (later): a `Review` model linked to an order and a merchant, unique
  per order; average and count per merchant exposed by the API.
- A public **review policy** page (how reviews are collected and checked) is
  required before launch. PROD: write it with a legal adviser.
- In the demo, reviews are fictitious, on fictitious "Démo · …" shops only,
  and labelled as such; reviews written in the app stay on the device.
- Moving to a certified provider later is a new ADR.
