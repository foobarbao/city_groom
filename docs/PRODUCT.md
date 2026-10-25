# Product — CityPal

> **Status**: living document · **Last updated**: 2026-10-24
>
> This document records the product vision and the requirements as stated by
> the project owner. Anything not yet decided is listed under
> [Open questions](#open-questions) and must not be assumed in the code (see
> `CODING_STANDARDS.md` §2).

## 1. Vision

City centres are losing visitors, and many local businesses suffer from it,
under pressure from high rents. CityPal **reconnects residents with
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

CityPal is **a helper for city dwellers**, with two modes in the customer
app (2026-10-24):

1. **Services** — have an item serviced by a local business (laundry,
   repairs…), through the lockers and cargo-bike rounds (sections 2 and 4).
2. **Consigne** — store personal belongings in a locker for a few hours
   (helmet, jacket, bag…), see [section 4b](#4b-consigne-storage).

The service starts in **Grenoble**.

The app is called **CityPal** (decided by the project owner on 2026-10-24,
replacing the working names "City Groom" and "Reliance"; the repository
keeps the technical name `city_groom`). The provisional Android application
id is `fr.citypal.app` (see open questions). Whatever the name, the brand
must convey a strong **eco-social** message centred on the idea of
**reconnecting** people with their city and its local businesses.

### Mission statement

Requested on 2026-10-24: a "Notre mission" page (partner portal, `/mission`)
presenting the **double mission**: making everyday life simpler while being
green, with technology at the service of both, in an ambitious tone that
presents the project as close to a public-interest service.

The page only uses facts recorded in this document (lockers, cargo bikes,
grouped rounds, same price as in the shop, commission from 10 % to 1 %, public
funding). ASSUMPTION: the wording is a draft for the project owner to review.
Two points are worded with care until the open questions below are answered:

- "Public interest": the page says *intérêt général* and "presque un service
  public de proximité", never *reconnue d'utilité publique*, which in France
  is a legal status granted by decree to associations and foundations.
- "Organic" (*bio*): the page does not claim organic or eco-labelled
  products, since partner merchants' products are not known.

Background photos: real photos of Grenoble under free licences (Wikimedia
Commons), credited on the page. No image generation tool was available; the
photos can be replaced (`apps/portal/src/data/missionPhotos.ts`).

## 2. Scope

### In scope: services

Services performed by local businesses on items left by the customer, for
example:

- laundry, dry cleaning, ironing (first offers);
- shoe repair and shoe cleaning;
- more generally, **any service on an item that fits in a locker** and can be
  sold at a **standard price** or after a **short evaluation** (quote).

Locker dimensions will be defined later; until then, eligibility is judged on
the item category.

### Kinds of offers

1. **Standard services** — fixed price per item, ordered directly (e.g. ironing
   a shirt, cleaning a pair of shoes).
2. **Packs** — bundles of standard services at a pack price, offered with
   partner merchants. First one: the **weekly pack** (below).
3. **Special services (on quote)** — the customer opens a **direct chat** with
   the merchant, can upload **photos and videos**, the merchant sends a
   **quote**, and the customer accepts or declines it. Accepted quotes then
   follow the main flow.

The guiding principle on both sides is **maximum simplicity**: as few steps as
possible for the customer and for the merchant.

### Weekly pack

Decided by the project owner on 2026-10-25.

- **Content**: each week, **5 shirts + 2 trousers** washed, ironed and
  folded.
- **Bought by the month**: 4 weeks at once, paid at once, in a single order;
  **no automatic renewal** (the app offers to buy again during the last
  week).
- **Price per week**: **10 €** for a customer's first purchase (welcome
  offer, first month only, whatever their plan), then **15 €** with
  CityPal Premium and **20 €** with CityPal Plus (the first subscription).
  Without a subscription the pack is not offered after the welcome month.
- **Rhythm**: the customer chooses the weekly drop-off day and slot; the
  return is computed from the laundries' turnaround; the customer chooses a
  pickup slot (same rule as orders, below) and the pickup locker, kept for
  the four weeks.
- **Provider shown to the customer**: "CityPal". Pack orders are not rated
  (not tied to one shop).

**Internal — never shown or said to customers:** the pack is a traffic
builder, not a source of margin. It uses CityPal's network and logistics;
the weekly volume is dispatched to the partner laundries according to the
availability they declare, which gives each of them a predictable, constant
volume announced for the month (N shirts), and it builds the customer's
habit. Operator view: Exploitation › Activité › Packs semaine; each laundry
sees its announced volume and declares its availability on its dashboard.

ASSUMPTIONS (placeholders, to confirm): turnaround = the longest of the
included services; garment compartment for drop-off and return; unused
items of a week are not carried over; default laundry availability 40
shirts/week; 18 fictitious active packs in the demo.

### Out of scope: red lines

- **No parcel delivery** for e-commerce platforms (e.g. no Amazon parcels).
- **No perishable goods**, hence no meal or food delivery.

## 3. Actors

| Actor | Description | Interface |
|---|---|---|
| Customer | Resident who orders a service and uses the lockers. | Customer app (Android + PWA), French UI |
| Merchant | Local business performing the service. | Partner portal, merchant space: web + Android "pro" app (ADR-0006), French UI |
| Courier partner | Local cargo-bike delivery company collecting and returning items. Companies mentioned by the project owner as potential partners: Cargo Loco, City Sherpa (no partnership established yet). | Partner portal, courier space (web), French UI |
| Operator (administrator) | The CityPal team: manages lockers, merchants, courier partners, offers, orders, commission settings. | Django admin (data management) + partner portal, operator space (dashboards); both web, French UI |
| Locker | Connected locker with compartments, placed around the city. | Simulated in the demo, real hardware later |

**Platforms**: customers use the **mobile app**; merchants, courier partners
and operators use **web interfaces** (ADR-0005). Merchants also get a
**mobile app** (ADR-0006).

## 4. Main flow

1. The customer browses services and merchants on a map of Grenoble.
2. The customer orders a standard service or a pack, or accepts a quote for a
   special service. Ordering is possible **as a guest** (see Accounts).
3. The customer chooses a **drop-off locker**, and a **pickup locker** with a
   **pickup slot** (until the next round). The pickup locker may differ from the drop-off
   locker. Clarified on 2026-10-25: the pickup locker is always chosen
   explicitly (no default), and the slots offered start at the round that
   brings the item back; the customer collects during the chosen slot,
   before the following round, which frees the compartment, so each
   compartment can turn over three times a day.
   **Compartments are never booked** (stated 2026-10-25): the customer
   chooses a place (a locker station) for drop-off and one for pickup, and
   reserves a **size**; the compartment (door) is given when they arrive in
   front of the machine and open it. The same applies to the consigne and
   to transfers.
4. The app shows the customer a **visual of the locker front**, highlighting
   the door that will open and its size, then the customer drops the item in.
   The opening method depends on the locker vendor: **Bluetooth**, **NFC** or
   **QR code**.
   Guided drop-off (requested 2026-10-25): from "Mes commandes", "Déposer"
   opens the order with the locker drawn and its door open; the customer
   puts the item in, closes the door and confirms with "J'ai déposé mon
   article". The door is chosen at checkout and kept with the order.
5. A courier collects the item during a scheduled round and delivers it to the
   merchant.
6. The merchant performs the service.
7. A courier brings the item back to the pickup locker.
8. The customer is notified and collects the item.

Payment is **simulated** in the demo.

### Rounds and pickup slots

- **Three rounds per day** at fixed times: **07:00, 14:00 and 20:00**
  (decided 2026-10-24, replacing two rounds at 08:00 and 20:00; times stay
  configurable). Fixed times make the workload predictable for courier
  partners.
- The day is split into three **slots** between rounds: **morning
  07:00–14:00**, **afternoon 14:00–20:00**, **evening 20:00–07:00**.
- Pickup slots follow the rounds: an item returned by a round can be collected
  until the next round (e.g. returned at 14:00, collected by 20:00). This
  replaces the former 12-hour slot.

### Overdue pickups

- If the customer does not collect the item within the pickup slot, **the
  item stays in the locker** and the customer pays a **small late fee**.
- **The first forgotten pickup is free** (once per customer).
- Fee amount, how it accrues and the maximum time an item may stay are not
  defined yet (see open questions).

### Locker locations

Many more lockers than the first draft, at **strategic places** (decided
2026-10-24): tram stops, and for the consigne **tourist sites, stations,
campuses, shopping centres, hospitals, business areas, squares lined with
restaurants and cafés, parks and sports venues**. Consigne lockers are
**smaller but more numerous**. A locker standing near restaurants is only a
location: the red lines (no meal delivery) still apply. In the demo, places
come from OpenStreetMap (`docs/DATA_SOURCES.md`).

### Locker visualisation

The locker view must be **very user-friendly**: the customer sees a drawing of
the locker front with its compartments of several sizes, the door that will
open is highlighted, with its label (e.g. "B3") and the kind of items it
fits. The same view, with the status of every door, serves operators. See
`docs/LOCKERS.md`.

## 4b. Consigne (storage)

Decided by the project owner on 2026-10-24:

- The customer **drops an item** in a locker compartment and **collects it at
  most 24 hours after drop-off**. Typical items: helmets, jackets, bags,
  personal belongings. The red lines apply (no perishable goods).
- **Booking a slot**: the customer books the **morning, afternoon or evening**
  slot (between two rounds) of a given day, **at least 4 hours before the
  slot starts**. Booking ahead lets the team coordinate with the rounds
  (e.g. free compartments). Booking earlier, e.g. the day before, is allowed.
- **Immediate drop-off** without booking is also possible when a compartment
  of the right size is free.
- **Pickup slot** (decided 2026-10-25): the customer also chooses when they
  collect: the **same slot** as the drop-off (e.g. drop off and collect in
  the morning) or a **later slot** (afternoon, evening, next day). Storage
  is therefore not 24 hours by default: **24 hours is the maximum**. The
  items must be collected by the end of the pickup slot, and never later
  than 24 hours after drop-off.
- **At the locker**, the app guides the customer: the door opens, they put
  their things in (or take them out) and **close the door**, then the app
  confirms the result.
- **Price** depends on the customer's **subscription**: subscribers pay less.
  Plans and prices are not defined yet; the demo shows placeholder plans
  labelled as such (open question 8).
- The customer chooses the compartment size; the app shows the locker front
  and the door to open, as for services.
- **Transfer** (decided 2026-10-24): the customer can have the stored items
  **moved to another locker** to collect them there later. The transfer can
  be requested **at any time** (when booking or after drop-off); a courier
  moves the items at a **round** (07:00, 14:00 or 20:00) after the request,
  and the items must reach the new locker **within the 24 hours** after
  drop-off. The customer then collects them at the new locker, after that
  round and before the 24-hour deadline.
- **Transfer price**: each subscription **includes a number of transfers per
  month**; beyond it, or without a subscription, a **supplement** applies,
  reduced according to the plan. Amounts are not defined yet: placeholders
  in the demo (open question 11).

## 4c. Customer app experience

Requested on 2026-10-24: a **complete customer UX**, with menus to:

- **choose the mode** (Services or Consigne);
- **search by service first** (decided 2026-10-25): customers mostly look
  for a service (ironing, resoling…) rather than a given shop; the shops tab
  starts with the service types, one tap lists the partner shops offering
  it (rating, price, turnaround), and the search suggests services from
  their name and keywords ("semelle" finds "Ressemelage");
- **browse partner shops**, with a **clear classification**: shops grouped
  by category (not "all in bulk"), indexed and easy to **search** (name,
  category, service, street);
- see each shop's **rating out of 5** and reviews;
- **chat with a merchant**, send photos, and follow **quotes** (quote space);
- follow orders and consigne bookings, manage the account and subscription;
- see the **lockers around me** (requested 2026-10-25), especially to drop a
  consigne quickly: nearest lockers with walking distance and free
  compartments, one tap to drop off now or book a slot. The position is
  asked only when the customer opens this view (or "Près de moi" in a locker
  list), used on the device only, never stored nor sent.

### Ratings and reviews

- Customers rate a shop **out of 5**, **only if they ordered from it**:
  one rating per completed order (verified reviews), with an optional
  comment.
- Internal system for now; a certified third-party review provider may be
  connected later (ADR-0008).
- Real businesses that are not partners show **no rating**: no review is ever
  invented for a real business.

## 5. Merchant experience

The merchant space of the partner portal must be **attractive** and give merchants a clear view of
the value the platform brings:

- **Predictability**: upcoming items and when they will arrive ("you will
  receive these items at this time").
- Incoming and in-progress orders.
- **Totals**: number of orders, revenue generated through the platform.
- **Cost transparency**: exactly how much the platform commission costs them.
- How their commission rate can decrease over time (see business model), to
  encourage them to promote the platform.

The merchant also answers chat requests and sends quotes for special services,
with a deliberately minimal interface.

What matters to the merchant (stated 2026-10-25) is **when to hand items
over to the courier** (the time of the courier's visit), not which locker
the items come from or go to: merchant screens show the handover time and
never the lockers.

Merchant space contents confirmed on 2026-10-25: dashboard (above),
**rounds** (what arrives and what goes back at 07:00, 14:00 and 20:00, items
marked ready), **messages and quotes**, **reviews** (rating, verified
reviews, public reply) and **services** (on/off, price, turnaround).

### Planning and connectors

Requested on 2026-10-25: a **planning** view (agenda) of what is scheduled,
with the order details, a **"done" action on every task** from the planning,
and a link with Google Calendar; then "connectors to link as many external
tools as possible, such as planners".

- Tasks: courier arrival at a round (items brought), work to do on each order
  (due at the handover), handover to the courier at a round. Marking a
  handover done also marks its items ready for the courier.
- ASSUMPTION: task durations shown in calendars are 15 min (arrival,
  handover) and 30 min (work), placeholders until the project owner says
  otherwise.
- **Google Agenda is synchronised** (owner's request, 2026-10-25: "a sync,
  not an .ics"): the merchant connects once, a "CityPal" calendar is created
  in their Google Agenda with every task, kept up to date including the
  "done" check. Demo: the sync runs from the open planning (Google access
  lasts an hour, renewed by a click). PROD: server-side sync, also when the
  portal is closed.
- Other calendars: .ics export of the week (Apple Calendar, Outlook,
  Microsoft 365, Thunderbird…) and per-task "add to" links.
- Connectors (ADR-0009, **proposed**): private iCal subscription address for
  calendars, and outgoing webhooks for planners and to-do lists through
  Zapier, Make or n8n (Trello, Notion, Asana, Microsoft Planner / To Do,
  Todoist, Google Sheets, Excel…). Both are simulated in the demo. PROD: API
  endpoints once the ADR is accepted.

In the demo, the merchant's data (orders, forecasts) is **simulated**.

## 6. Courier partner experience

The project owner will **approach courier partners** (local cargo-bike
delivery companies) before any partnership exists. Their web space must let
the owner **present the expected activity and volume** in a convincing way.

Content stated by the project owner:

- the **activity and volume** CityPal expects to generate for them.

Content proposed, to be confirmed (see open questions):

- projected number of items per round and per day, with the two daily
  collection rounds;
- map of the lockers and merchants to serve, and the resulting rounds;
- upcoming rounds once the service runs.

Decided on 2026-10-25: the courier space serves **both** purposes, in two
tabs: **presenting the activity** to prospective courier partners, and a
**round sheet** used during a round (stops in order, what to pick up and drop
off at each locker and merchant, consigne transfers, stops ticked as done).

In the demo, all courier data is **simulated** and labelled as such.

## 7. Operator experience

- **Data management** (lockers, merchants, courier partners, offers,
  commission settings, orders) through the Django admin.
- **Dashboards** in the operator space of the partner portal, with first:
  - **volume** indicators (items, orders, rounds);
  - **fill rate** of the lockers (network, per locker, per size);
  - a user-friendly **view of each locker** with the status of every door.
- **Real-time tracking** on the map of Grenoble (lockers, rounds in progress),
  using real map data.
- **Flow forecasts** (expected items per locker, per round, per merchant).

Operator space contents (2026-10-25): overview, **alerts** (lockers almost
full or without a large free door, doors out of service, late pickups),
**lockers**, **orders**, **rounds**, **partner shops** and **forecasts** (per
day, per round, per locker). ASSUMPTION: the "almost full" threshold is 75 %
in the demo, to set with the project owner.

In the demo, all activity is **simulated** with modest figures, refined later
with the project owner.

## 8. Customer accounts

- **Guest checkout** is allowed: no account is required to order.
- Customers are **strongly encouraged to sign in**, in order to unlock
  **status levels** and **premium** benefits (details to be defined).
- **Sign in with Google** (requested 2026-10-25, ADR-0010): one tap, no
  password. Only the **basic Google profile** is collected (name, e-mail,
  picture): the project owner chose it after being told about GDPR data
  minimisation and Google's verification of extended data. Other data
  (e.g. phone number for locker notifications) would be asked in the app
  when needed, with its purpose.
- Operators see every account in the administration (**Comptes**): photo,
  name, e-mail, sign-in method, customer or team, sign-up and last sign-in
  dates, filters, search, key figures, deactivation.
- PROD: privacy notice before real sign-ups (draft:
  `docs/legal/privacy-policy.fr.md`, to complete and have validated); Google sign-in in the Android
  app (native plugin).

## 9. Business model

- The **customer pays the same price** as they would pay in the shop.
- City Groom takes a **commission on the merchant's share**.
- **Initial rate: 10 %. Long-term target: 1 %.**
- The commission is **degressive**: it decreases as the number of partner
  merchants grows and as the number of customers grows, which encourages
  merchants to talk about the platform around them. The thresholds between
  10 % and 1 % are not defined yet; the rate is therefore stored as
  configurable data, not hard-coded.
- Reaching such a low rate relies on **public funding**: the project is
  expected to be eligible for grants supporting the ecological transition and
  the digital transition.
- **Bundles** and special partnerships (notably with laundries) are planned;
  the strategy will be defined later.

## 10. Demo goals and data

- Use **as much real data as possible**: real map of Grenoble, real businesses.
- **Real businesses** (not yet contacted) are shown using **public data only**
  (name, address, category, from open sources such as OpenStreetMap), no
  logos, with a notice that no partnership is established yet.
- **Selection**: every business offering a service on items that fit in a
  locker, **excluding food businesses, large chains and self-service
  laundromats** (no merchant handles the items there; decided 2026-10-24).
- **Simulated**: lockers, orders, courier rounds, merchant activity, consigne
  bookings, reviews and conversations (fictitious "Démo · …" partner shops
  only).
- Locker locations will be defined later; lockers must not be too far from the
  customers they serve.
- Prepare a structure able to host the production version, including
  **connecting real lockers** later (see ADR-0003, integration boundaries).

## Glossary

| Term (code, English) | Meaning | UI label (French) |
|---|---|---|
| Locker | A connected locker unit at one location | Casier / consigne *(to confirm)* |
| Compartment | One lockable box inside a locker | Compartiment / casier *(to confirm)* |
| Merchant | Business performing a service | Commerçant |
| Service offer | A standard service sold by a merchant at a fixed price | Prestation |
| Pack | A bundle of service offers sold at a pack price | Pack / formule *(to confirm)* |
| Quote | A merchant's price proposal for a special service | Devis |
| Conversation | Chat between a customer and a merchant about a special service | Discussion |
| Pickup slot | Time window during which the customer collects the item | Créneau de retrait |
| Order | A customer's request for a service offer | Commande |
| Round | A courier trip collecting and returning items | Tournée |
| Slot | Period between two rounds (morning, afternoon, evening) | Créneau (matinée, après-midi, soirée) |
| Transfer | Moving stored items to another locker at a round | Transfert / déplacement |
| Storage booking | A customer's booking of a compartment to store personal belongings (up to 24 h) | Consigne |
| Subscription | Customer plan lowering consigne prices | Abonnement |
| Review | A customer's rating (out of 5) and comment on a shop after an order | Avis |
| Commission | Platform fee charged to the merchant | Commission |

## Reminders

Topics the project owner asked to be reminded of:

- **Packs with partners**: the first one, the weekly pack, is specified
  (§2 "Weekly pack"); other packs and partnerships to come. *(Requested on
  2026-10-24.)*
- **Making Google sign-in and the Google Agenda sync work for real** needs
  two things from the project owner: the Google OAuth client ID
  (docs/GOOGLE_SIGN_IN.md), and the Render + Neon backend
  (docs/BUILD_AND_RELEASE.md §6) for the customer sign-in. *(Asked on
  2026-10-25 to be reminded later.)*
- **Other interfaces** (merchant, courier, operator) will be reworked after
  the customer app, including the consigne and three rounds.
  *(Stated on 2026-10-24.)*

## Open questions

Questions to the project owner. Answers are moved into the sections above.

1. **Commission thresholds**: how the rate decreases from 10 % to 1 %
   (by number of merchants, customers, merchant volume…). For the demo, a
   flat 10 % is used until this is defined.
2. **Status levels and premium** for signed-in customers: what do they unlock?
3. **Service catalogue and prices**: the demo uses simulated standard prices;
   should they reflect typical Grenoble prices (researched from public
   sources) or placeholder values?
4. **Locker dimensions** and compartment sizes (to be defined later).
5. **Courier space**: which indicators matter most to convince courier
   partners (items per round, distance per round, revenue estimate, car trips
   avoided / CO₂ saved…)? Should the projection be adjustable live during a
   presentation (e.g. number of lockers, number of customers)?
6. **Late fee**: amount, flat or per additional slot / day, and what happens
   after a maximum delay (item returned to the merchant, kept at a depot…)?
   How is the free first occurrence tracked for guest customers (no account)?
7. **Domain and Android application id**: the app is now called CityPal.
   Which domain (e.g. `citypal.fr`)? The provisional Android ids are
   `fr.citypal.app` (customers) and `fr.citypal.pro` (merchants); they cannot
   be changed after publication on the Play Store. Have trademark (INPI) and
   domain checks been done for "CityPal"? A domain is required to open
   Google sign-in and the Google Agenda sync beyond test users (Google brand
   verification, docs/GOOGLE_SIGN_IN.md).
   **Legal entity** (2026-10-25): none yet, form not decided. Needed for
   the privacy policy (data controller) and the terms; until then the
   draft keeps placeholders.
8. **Subscriptions**: plans, prices, what they include (consigne discounts,
   service benefits, status levels of section 8?). The demo shows
   placeholder plans.
9. **Consigne details**: price per use without subscription; what happens
   after 24 hours (late fee as for services, item moved to a depot…)?
   Forbidden items (valuables, dangerous goods)? Maximum number of bookings
   per customer?
10. **Mission page wording** (see [Mission statement](#mission-statement)):
    should the page mention organic or eco-labelled products (e.g. eco-friendly
    laundry), which would require committing partner merchants to them? Is the
    project meant to seek a formal public-interest recognition, or is
    "intérêt général" only a mission statement?
11. **Transfer amounts**: supplement without subscription, number of
    transfers included per plan, reduction beyond the included ones. Can a
    stored item be transferred more than once?
12. **Planning connectors** (ADR-0009, proposed): accept the approach (iCal
    subscription + webhooks through Zapier / Make / n8n, native integrations
    only on demand)? Which tools do merchants use most, to be tested first?
    Should a task done in an external tool come back to CityPal (two-way
    sync)? Task durations in calendars (15 / 30 min placeholders)?
13. **Accounts**: technical choices of ADR-0010 (own Google token check,
    non-expiring app tokens, project user model) to validate. Should
    merchants and couriers also sign in with Google on the portal? How long
    are inactive customer accounts kept (GDPR retention)?
