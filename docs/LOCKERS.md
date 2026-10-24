# Lockers — research and simulation model

> **Status**: living document · **Last updated**: 2026-10-24
>
> Real locker hardware has not been chosen yet. This document records what was
> learned about existing lockers and how the demo simulates them. Everything
> marked *assumption* is a City Groom choice, not a vendor specification.

## 1. What exists

Findings from public sources (2026-10-24):

- **Parcel lockers** are built from **modular columns** of stacked
  compartments of several sizes; one column usually holds the control unit
  (screen, readers). Turnkey units often start with about four columns, and
  expansion columns add capacity
  ([Pitney Bowes](https://pitneybowes.com/us/blog/smart-locker-sizes-turnkey-and-modular-system-designs.html)).
- **Common size standard** (InPost, widely deployed in Europe): opening
  38 × 64 cm (width × depth) and three heights — **A: 8 cm, B: 19 cm,
  C: 41 cm**
  ([InPost developer documentation](https://dokumentacja-inpost.atlassian.net/wiki/x/IwAVAQ),
  [InPost UK](https://inpost.co.uk/blog/compartment-sizes-explained)). Some
  sources give 39 cm for size C; not every locker offers every size.
- **Access**: QR code scanning is the most common (e.g.
  [Cleveron 301](https://cleveron.com/contact/cleveron-301)); NFC and other
  methods exist on some models
  ([overview](https://ecommercegermany.com/blog/top-15-locker-technologies-in-eu-supporting/)).
  Vendor-specific Bluetooth / NFC specifications were not found.
- **Dry-cleaning lockers** have been tried in France: e.g. Tÿkaz in Rennes
  (24/7 drop-off and pickup in lockers ordered through an app,
  [Le Journal des Entreprises](https://www.lejournaldesentreprises.com/article/rennes-avec-tykaz-le-pressing-devient-enfin-connecte-106672))
  and Box'n Services in Nantes, whose lockers were tall enough to hang a suit
  or a dress
  ([brochure](https://www.nantes-amenagement.fr/wp-content/uploads/2016/12/box-n-services-plaquette-entreprise.pdf)).
  Their current status is unknown.

## 2. Simulated compartment sizes

Defined in `backend/apps/lockers/sizes.py`.

| Code | French label | Inner size (H × W × D, cm) | Source | Typical items |
|---|---|---|---|---|
| S | Petit | 8 × 38 × 64 | InPost A | Watch, jewellery, phone, glasses |
| M | Moyen | 19 × 38 × 64 | InPost B | Pair of shoes, folded shirts, handbag |
| L | Grand | 41 × 38 × 64 | InPost C | Laundry bag, folded duvet, small appliance |
| XL | Penderie | 164 × 38 × 64 | *Assumption*, inspired by dry-cleaning lockers | Suit on a hanger, dress, coat |

## 3. Simulated locker layout

- Every column is **20 grid units** high (1 unit ≈ 8 cm, the height of an S
  compartment), so a locker front can be drawn as a regular grid.
- The **control column** reserves its top 6 units for the control panel
  (screen, NFC reader, QR scanner).
- Column templates (top to bottom):

| Template | Content |
|---|---|
| control | panel + 4 × S + 5 × M |
| mixed | 4 × S + 3 × M + 2 × L |
| large | 5 × M + 2 × L |
| garment | 1 × XL |

- Locker models (columns left to right):

| Model | Columns | Compartments |
|---|---|---|
| compact | mixed, control, large | 25 |
| standard | mixed, control, mixed, large, garment | 35 |
| large | garment, mixed, large, control, mixed, large, garment | 45 |

- Each door has a **label**: column letter + position from the top (e.g.
  `B3`), so the app can say "open door B3" and highlight it on the drawing.

## 4. Simulated placement and occupancy

- **Placement**: locker locations are not decided yet. For the demo, lockers
  are placed at **real tram stops** of Grenoble-Alpes Métropole, retrieved
  from OpenStreetMap (© OpenStreetMap contributors, ODbL) and spread across the
  area by farthest-point sampling (`seed_simulated_lockers` command). The
  origin of every location is stored in `Locker.placement_source`.
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

## 6. Open points

- Locker vendor, real dimensions and access methods (Bluetooth, NFC, QR code
  depending on the partner).
- Final locker locations.
- Whether lockers need refrigeration or ventilation for some items (e.g. damp
  laundry) — to be checked with partners.
