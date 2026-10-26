# Product — City Groom

> **Status**: living document · **Last updated**: 2026-10-26
>
> This document records the product vision and the requirements as stated by
> the project owner. Anything not yet decided is listed under
> [Open questions](#open-questions) and must not be assumed in the code (see
> `CODING_STANDARDS.md` §2).

## 1. Vision

The company behind the project is **CityPal**. ("City Groom" is the working
product name; see open question 10.)


City centres are losing visitors, and many local businesses suffer from it,
under pressure from high rents. City Groom **reconnects residents with
city-centre businesses, craftspeople and local know-how**, without requiring
them to travel there.

Residents drop items into a **connected locker** near them (including in the
outskirts). The items are carried to a city-centre business by **cargo-bike
couriers**, serviced, and brought back to a locker where the customer collects
them.

The project rests on three pillars, which also support applications for public
funding and grants:

1. **Practical convenience** for residents: no trip to the shop.
2. **Survival of local businesses**: a new customer base and predictable
   workload for merchants.
3. **Sustainable development**: fewer cars in the city centre, deliveries by
   local cargo-bike companies.

The service starts in **Grenoble**.

## 2. Scope

### In scope: services

Services performed by local businesses on items left by the customer, for
example:

- laundry, dry cleaning, ironing (first offers);
- shoe repair;
- more generally, any **repair-type service**.

### Out of scope: red lines

- **No parcel delivery** for e-commerce platforms (e.g. no Amazon parcels).
- **No perishable goods**, hence no meal or food delivery.

## 3. Actors

| Actor | Description | Interface |
|---|---|---|
| Customer | Resident who orders a service and uses the lockers. | Customer app (Android + PWA), French UI |
| Merchant | Local business performing the service. | Merchant portal (web), French UI |
| Courier partner | Local cargo-bike delivery company collecting and returning items. Companies mentioned by the project owner as potential partners: Cargo Loco, City Sherpa (no partnership established yet). | None in the demo (simulated) |
| Operator (administrator) | The City Groom team: manages lockers, merchants, offers, orders, commission settings. | Administration (Django admin, web) |
| Locker | Connected locker with compartments, placed around the city. | Simulated in the demo, real hardware later |

## 4. Main flow

Flow as currently understood — steps marked *(to confirm)* depend on open
questions.

1. The customer browses services and merchants on a map of Grenoble.
2. The customer orders a service from a merchant and chooses a **drop-off
   locker**.
3. The customer drops the item into a locker compartment (opened with a code
   or QR code *(to confirm)*).
4. A courier collects the item during a scheduled round and delivers it to the
   merchant.
5. The merchant performs the service.
6. A courier brings the item back to a **pickup locker**, which may be
   different from the drop-off locker.
7. The customer is notified and collects the item.

## 5. Merchant experience

The merchant portal must be **attractive** and give merchants a clear view of
the value the platform brings:

- **Predictability**: upcoming items and when they will arrive ("you will
  receive these items at this time").
- Incoming and in-progress orders.
- **Totals**: number of orders, revenue generated through the platform.
- **Cost transparency**: exactly how much the platform commission costs them.
- How their commission rate can decrease over time (see business model), to
  encourage them to promote the platform.

In the demo, the merchant's data (orders, forecasts) is **simulated**.

## 6. Business model

- The **customer pays the same price** as they would pay in the shop.
- City Groom takes a **commission on the merchant's share**.
- The commission is **degressive**: it decreases as the number of partner
  merchants grows and as the number of customers grows, which encourages
  merchants to talk about the platform around them.
- **Bundles** and special partnerships (notably with laundries) are planned;
  the strategy will be defined later.

## 7. Demo goals and data

- Use **as much real data as possible**: real map of Grenoble, real businesses
  (not yet contacted — see open questions on how they are presented).
- **Simulated**: lockers, orders, courier rounds, merchant activity.
- Locker locations will be defined later; lockers must not be too far from the
  customers they serve.
- Prepare a structure able to host the production version, including
  **connecting real lockers** later (see ADR-0003, integration boundaries).

## 8. Customer mailing

- Goal stated by the project owner: **simplify customer mailing** — customer
  profiles and segments (e.g. by order recurrence), reusable email templates
  and campaigns.
- Decision: **Brevo** (free plan) for the demo; the backend stays the source
  of truth for customers, orders and statistics. Alternatives considered
  (Odoo, Twenty, Mautic, in-house): see
  [ADR-0005](adr/0005-customer-mailing-provider.md).
- **Sender**: only the company, **CityPal**, sends campaigns. Merchants do not
  email customers through the platform.
- **Consent**: only customers who ticked the marketing consent checkbox are
  synced to Brevo (see open question 11 on where the checkbox lives).
- **First statistics**: aggregate counts — number of users, number of orders
  (further metrics to be specified).
- **Transactional notifications** (order confirmation, item ready for pickup)
  are sent as **push notifications** in the app, not through Brevo.

## Glossary

| Term (code, English) | Meaning | UI label (French) |
|---|---|---|
| Locker | A connected locker unit at one location | Casier / consigne *(to confirm)* |
| Compartment | One lockable box inside a locker | Compartiment / casier *(to confirm)* |
| Merchant | Business performing a service | Commerçant |
| Service offer | A service sold by a merchant, with a price | Prestation |
| Order | A customer's request for a service offer | Commande |
| Round | A courier trip collecting and returning items | Tournée |
| Commission | Platform fee charged to the merchant | Commission |

## Open questions

Questions to the project owner. Answers are moved into the sections above.

1. **Payment**: real in-app payment, or simulated for the demo? When is the
   customer charged?
2. **Price of repairs**: for services whose price depends on a diagnosis (e.g.
   shoe repair), how is the final price set and accepted by the customer?
3. **Commission**: initial rate and degressive formula (thresholds by number of
   merchants / customers) to use in the demo?
4. **Real businesses not yet contacted**: may their real names be displayed?
   Proposal: public data only (name, address, category, from OpenStreetMap),
   no logos, with a "demo — no partnership established" notice.
5. **Locker opening**: code, QR code scanned by the app, or both?
6. **Customer accounts**: mandatory sign-up before ordering?
7. **Pickup locker**: chosen at order time, or later? Default to the drop-off
   locker?
8. **Turnaround and rounds**: expected delays and round frequency to simulate?
9. **Service categories** for the demo beyond laundry / ironing and shoe repair
   (tailoring, small appliance repair, bicycle repair…)?
10. **Product name and wording**: is "City Groom" the final name? Preferred
    French term for the lockers in the UI?
11. **Marketing consent checkbox**: the project owner states that a consent
    checkbox already exists "at login". It is not in this repository yet:
    where is it (mock-up, other repository)? Is it at sign-up or at each
    sign-in, and is it unchecked by default?
12. **Play Store publisher account**: will the app be published under a
    personal Google Play developer account or an organisation account for
    CityPal? (Reported, to be checked on Google's pages: new personal accounts
    must run a closed test with 12 testers for 14 days before production;
    organisation accounts, which need a D-U-N-S number, are exempt.)
