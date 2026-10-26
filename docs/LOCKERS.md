# Lockers — research and simulation model

> **Status**: living document · **Last updated**: 2026-10-26
>
> Real locker hardware has not been chosen yet. This document records what was
> learned about existing lockers and how the demo simulates them. Everything
> marked *assumption* is a City Groom choice, not a vendor specification.

## 1. What exists

Findings from public sources (2026-10-24). Vendor marketing claims are marked
as such.

### Parcel lockers

- Built from **modular columns** of stacked compartments of several sizes;
  one column usually holds the control unit (screen, readers). Turnkey units
  often start with about four columns, and expansion columns add capacity
  ([Pitney Bowes](https://pitneybowes.com/us/blog/smart-locker-sizes-turnkey-and-modular-system-designs.html)).
- **Sizes used in France** — Mondial Relay publishes for its lockers: XS
  4 × 23 × 40 cm, S 8 × 38 × 64 cm, M 19 × 38 × 64 cm, L 38 × 39 × 64 cm,
  25 kg maximum
  ([Mondial Relay FAQ](https://www.mondialrelay.fr/faq/envoyer-un-colis/quelle-est-la-taille-maximale-des-colis/),
  [lockers FAQ](https://www.mondialrelay.fr/faq-pro/installer-un-locker/quelle-est-la-taille-maximum-des-colis-dans-un-locker-mondial-relay/)).
  InPost uses the same footprint with heights 8 / 19 / 41 cm
  ([InPost developer documentation](https://dokumentacja-inpost.atlassian.net/wiki/x/IwAVAQ)).
  Mondial Relay also shows **real-time availability per size** to the public
  ([availability page](https://www.mondialrelay.fr/disponibilite-des-casiers-par-taille/)),
  which matches the public API choice in §5.

### Dry-cleaning and laundry lockers

- Towers about **39 cm wide, 59 cm deep and 2 m high**, assembled in banks of
  3 to 10 towers ([Laundrywise](https://laundrywise.com/products/multi-purpose-locker));
  other units are 61 cm wide per three-door tower, powered by a standard
  outlet, with Ethernet or cellular connectivity and up to 24 lockers per
  controller ([Laundry Lockers](https://laundry-lockers.com/locker/dry-cleaning/)).
- **Hanging compartments**: a full-height 26 × 200 cm compartment in a
  60 × 60 × 210 cm cabinet ([Lockerclean](https://lockerclean.com/en/smart-lockers/));
  a two-compartment tower with a hanging bar in the upper one
  ([Breezy](https://www.breezyll.com/lockers)).
- **Hanging clearances** recommended: about 1,370 mm for a suit in a garment
  bag, 1,830 mm for a gown, 550–600 mm of depth for hangers
  ([Kioskforce](https://kioskforce.com/laundry-lockers/dry-cleaning-lockers/)).
- Ventilation specifications were not found; to ask manufacturers.
- French precedents: Tÿkaz in Rennes (24/7 drop-off and pickup ordered
  through an app,
  [Le Journal des Entreprises](https://www.lejournaldesentreprises.com/article/rennes-avec-tykaz-le-pressing-devient-enfin-connecte-106672))
  and Box'n Services in Nantes, tall enough to hang a suit or a dress
  ([brochure](https://www.nantes-amenagement.fr/wp-content/uploads/2016/12/box-n-services-plaquette-entreprise.pdf)).
  Their current status is unknown.

### Access and connectivity

- **QR code** scanning is the most common access method (e.g.
  [Cleveron 301](https://cleveron.com/contact/cleveron-301)); NFC exists on
  some models
  ([overview](https://ecommercegermany.com/blog/top-15-locker-technologies-in-eu-supporting/)).
- **Offline Bluetooth lockers** (vendor claims): battery-powered, no network,
  opened over Bluetooth by the user's phone, which also syncs access codes and
  events ([DC Locker](https://www.dclocker.com/product/bluetooth-parcel-locker/),
  [Zhilai brochure](https://www.smartelocker.com/uploads/file/20260722/bluetooth-parcel-locker-brochure.pdf)).
  Solar or battery autonomous lockers exist too
  ([ARKA SunCharge](https://www.arka-parcel-lockers.com/products/suncharge-locker),
  [Direct4Smart](https://www.direct4.me/parcel-spaces/direct4smart)); a 4G
  locker can keep data locally and resync when the connection returns.
- **Integration APIs**: vendors expose REST APIs to check availability and
  reserve compartments, and push events through webhooks signed with
  HMAC-SHA256 ([ONARKEN](https://api.onarken.com/),
  [Lockex](https://www.lockex.io/blog/locker-network-setup)); smart-lock
  platforms report open / close events with the method used
  ([Seam](https://docs.seam.co/latest/capability-guides/smart-locks/lock-and-unlock)).
  No vendor documentation combining door events and reservation PINs was
  found: the City Groom driver interface stays event-oriented and generic.

## 2. Simulated compartment sizes

Defined in `backend/apps/lockers/sizes.py`.

| Code | French label | Inner size (H × W × D, cm) | Source | Typical items |
|---|---|---|---|---|
| S | Petit | 8 × 38 × 64 | Mondial Relay S / InPost A | Watch, jewellery, phone, glasses |
| M | Moyen | 19 × 38 × 64 | Mondial Relay M / InPost B | Pair of shoes, folded shirts, handbag |
| L | Grand | 38 × 39 × 64 | Mondial Relay L | Laundry bag, folded duvet, small appliance |
| XL | Penderie | 183 × 38 × 64 | Hanging clearance for a gown (Kioskforce); depth above the 55–60 cm needed for hangers | Shirts on hangers, suit, dress, coat |

The XS size (4 × 23 × 40 cm) is not simulated: no City Groom service needs it
so far.

## 3. Simulated locker layout

- Every column is **20 grid units** high; one unit is 9.5 cm of door height
  (compartment plus frame), i.e. about 190 cm of doors, consistent with towers
  of about 2 m including the base.
- Grid heights: S = 1, M = 2, L = 4, XL = 20 units. The **control column**
  reserves its top 6 units for the control panel (screen, NFC reader, QR
  scanner).
- Column templates (top to bottom):

| Template | Content |
|---|---|
| control | panel + 4 × S + 3 × M + 1 × L |
| mixed | 4 × S + 4 × M + 2 × L |
| large | 2 × M + 4 × L |
| laundry | 5 × L |
| garment | 1 × XL |
| storage | 2 × S + 3 × M + 3 × L (consigne: phone and keys, small bags, helmets and jackets) |

- Locker models (columns left to right). City Groom favours large and hanging
  compartments, since laundry and ironed shirts are the first services:

| Model | Columns | Compartments |
|---|---|---|
| compact | mixed, control, garment | 19 |
| standard | garment, mixed, control, laundry, garment | 25 |
| large | garment, mixed, large, control, laundry, large, garment | 37 |
| consigne_compact | storage, control | 16 |
| consigne | storage, control, large | 22 |

- Consigne lockers, at strategic places, are smaller and have no hanging
  compartment (docs/PRODUCT.md §4).

- Each door has a **label**: column letter + position from the top (e.g.
  `B3`), so the app can say "open door B3" and highlight it on the drawing.

### Hardware profiles

Simulated lockers get one of these profiles, reflecting §1:

| Profile | Access methods | Connectivity | Share |
|---|---|---|---|
| connected_qr_nfc | QR code, NFC | 4G | 50 % |
| connected_qr | QR code | Ethernet | 20 % |
| offline_bluetooth | Bluetooth | offline, synced through the phone | 30 % |

### Events and drivers

- Lockers report **events** (`LockerEvent`): door opened (with the access
  method), door closed, door left open, fault, connection lost / restored.
  Each event has the time reported by the locker (`occurred_at`) and the time
  City Groom received it (`received_at`), which differ for offline lockers.
- All hardware access goes through a **`LockerDriver`**
  (`backend/apps/lockers/drivers/`). The simulated driver records a
  `door_opened` event, then `door_closed` 8 to 45 seconds later (assumption,
  to be replaced by measured data), and refuses out-of-service compartments
  and access methods the locker does not offer.

## 4. Simulated placement and occupancy

- **Placement**: locker locations are not decided yet. For the demo,
  service lockers are placed at **real tram stops** of Grenoble-Alpes
  Métropole, spread across the area by farthest-point sampling, and consigne
  lockers at **strategic places** (tourist sites, stations, campuses…),
  central places first (`seed_simulated_lockers` command, rules in
  `docs/DATA_SOURCES.md`). Places come from OpenStreetMap (© OpenStreetMap
  contributors, ODbL). Each locker has a `site_category` (`tram_stop`,
  `tourism`, `transport`, `campus`, `shopping`, `health`, `business`,
  `square`, `leisure`, `other`); the origin of every location is stored in
  `Locker.placement_source`.
- **Occupancy**: each simulated locker gets a random target fill rate between
  **15 % and 45 %** (kept modest on purpose); about 30 % of used compartments
  are *reserved* (order placed, item not yet dropped) and the rest *occupied*;
  about 2 % of compartments are *out of service*.
- Simulation code refuses to modify a locker flagged as real.

## 5. Privacy and security choices

- The **public API** shows how many compartments of each size are free, but
  never the status of individual doors, which would reveal where items are
  stored.
- Per-door status is available to operators only.

## 6. Scooter lockers (concept)

Offer announced as "Bientôt disponible" (docs/PRODUCT.md §4d). Concept only:
nothing is simulated, the vendor options will be studied later by the
project owner. Code: `apps/customer/src/domain/scooterLockers.ts`.

### Scooter sizes

Unfolded dimensions of common city scooters and of large ones, read on
2026-10-26 from manufacturers' manuals and retailer or review pages
(L × W × H, cm; W is the handlebar width):

| Model | L × W × H | Weight | Handlebar folds | Source |
|---|---|---|---|---|
| Xiaomi Electric Scooter 4 Pro (2nd Gen) | 115 × 57 × 122 | 19 kg | not checked | [LDLC](https://ldlc.com/en/product/PB00623042.html), weight from [mi.com](https://www.mi.com/global/xiaomi-electric-scooter-4-pro-2nd-gen/specs) |
| Segway Ninebot Max G2 | 121 × 57 × 126 | — | not checked | [Notebookcheck](https://www.notebookcheck.net/Segway-Ninebot-KickScooter-Max-G2-E-Scooter-review-Great-handling-thanks-to-full-hydraulic-suspension.767517.0.html) (manufacturer table) |
| Dualtron Thunder 3 | 127 × 70 × 136 (folded 127 × 32 × 59) | 51 kg | yes | [Dualtron manual](https://wheelyshop.se/cdn/shop/files/DUALTRON_THUNDER_3_MANUAL.pdf) |
| Segway GT2 | 149 × 66 × 131 (folded 149 × 66 × 86) | — | no (width unchanged when folded) | [Joey's wiki](https://joeybabcock.me/wiki/Ninebot_GT2), reseller listings |

Sources disagree by a few centimetres for some models (e.g. Max G2 height
120 or 126 cm); the larger figure is kept. Large scooters reach about
**150 cm long, 70 cm wide and 136 cm high**; folding barely helps the
largest ones (the Segway GT2 handlebar does not fold), so places are sized for
**unfolded** scooters.

### Place and locker size

- **Perpendicular storage** (owner's choice, 2026-10-26; parallel storage,
  narrower but harder to use, was set aside): the scooter rolls in front
  first, so the locker front only needs the handlebar width per place.
- **One place**: 155 × 75 × 140 cm (depth × width × height), *assumption*:
  the largest reference scooter plus a few centimetres to roll it in.
- **2 to 5 places** per locker (owner's example). With 5 cm partitions and
  side walls (*assumption*), the front is 1.65 m wide for 2 places and
  4.05 m for 5, for about 1.6 m of depth.
- For comparison, an open 4-place scooter station sold to French public
  buyers (TROT-E-PARK, [UGAP sheet](https://www.ugap.fr/images/media-wp/2025/03/rfart_4216456_4216384_ft-support-trottinettes-trot-e-park.pdf.avif))
  measures 187 × 51 × 68 cm with 4 waterproof sockets.

### Open points

- Vendor, real dimensions, door type (side-hinged doors 75 cm wide need
  clearance in front; roller shutters do not).
- Charging (a socket per place): not decided (docs/PRODUCT.md §4d); if
  chosen, the fire-safety rules for charging batteries in a closed box are
  to be checked.
- Height of the deck above the ground and ramp, weight of large scooters
  (up to about 50 kg) when rolling them in.

## 7. Open points

- Locker vendor, real dimensions and access methods (Bluetooth, NFC, QR code
  depending on the partner), and its integration API (webhooks, reservation,
  offline sync).
- Final locker locations.
- Whether lockers need refrigeration or ventilation for some items (e.g. damp
  laundry) — to be checked with partners.
