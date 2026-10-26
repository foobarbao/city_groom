/**
 * @file Scooter lockers, an offer announced as "Bientôt disponible"
 * (docs/PRODUCT.md §4d, docs/LOCKERS.md §7): lockers of 2 to 5 places,
 * each holding one electric scooter, used like the consigne (24 hours at
 * most).
 *
 * Concept only (owner's decision of 2026-10-26): the scooter rolls in
 * front first, perpendicular to the locker front, so each place is as
 * narrow as a handlebar. The dimensions below are sized for the largest
 * common non-folding scooters and are to be checked with locker vendors.
 */

/** Dimensions in centimetres: length (or depth) × width × height. */
export interface Dimensions {
  lengthCm: number
  widthCm: number
  heightCm: number
}

/** A scooter model used to size the places, with its published dimensions. */
export interface ReferenceScooter {
  name: string
  /** Unfolded, ready to ride. */
  size: Dimensions
  /** Where the dimensions come from (read on 2026-10-26). */
  source: string
}

/**
 * Scooters the places are sized for, from common city models to large
 * non-folding ones. Dimensions as published, rounded to the centimetre.
 */
export const REFERENCE_SCOOTERS: readonly ReferenceScooter[] = [
  {
    name: 'Xiaomi Electric Scooter 4 Pro (2nd Gen)',
    size: { lengthCm: 115, widthCm: 57, heightCm: 122 },
    source: 'https://ldlc.com/en/product/PB00623042.html',
  },
  {
    name: 'Segway Ninebot Max G2',
    size: { lengthCm: 121, widthCm: 57, heightCm: 126 },
    source:
      'https://www.notebookcheck.net/Segway-Ninebot-KickScooter-Max-G2-E-Scooter-review-Great-handling-thanks-to-full-hydraulic-suspension.767517.0.html',
  },
  {
    name: 'Dualtron Thunder 3',
    size: { lengthCm: 127, widthCm: 70, heightCm: 136 },
    source: 'https://wheelyshop.se/cdn/shop/files/DUALTRON_THUNDER_3_MANUAL.pdf',
  },
  {
    // Folded, it keeps its 66 cm width: the handlebar does not fold, so
    // places are sized for unfolded scooters.
    name: 'Segway GT2',
    size: { lengthCm: 149, widthCm: 66, heightCm: 131 },
    source: 'https://joeybabcock.me/wiki/Ninebot_GT2',
  },
]

/**
 * Inner size of one place. ASSUMPTION: the largest reference scooter plus
 * a few centimetres to roll it in without touching the walls (width 70 →
 * 75, length 149 → 155, height 136 → 140). To check with vendors.
 */
export const SCOOTER_PLACE: Dimensions = { lengthCm: 155, widthCm: 75, heightCm: 140 }

/** Number of places per locker (owner's example, 2026-10-26). */
export const SCOOTER_PLACES = { min: 2, max: 5 } as const

/** ASSUMPTION: thickness of a partition or side wall between two places. */
export const PARTITION_CM = 5

/** Whether a scooter of this size fits in a place, unfolded. */
export function fitsScooterPlace(size: Dimensions, place: Dimensions = SCOOTER_PLACE): boolean {
  return (
    size.lengthCm <= place.lengthCm &&
    size.widthCm <= place.widthCm &&
    size.heightCm <= place.heightCm
  )
}

/**
 * Width of the locker front for a number of places side by side: the
 * places plus one partition between each and the two side walls.
 */
export function lockerFrontCm(places: number, place: Dimensions = SCOOTER_PLACE): number {
  return places * place.widthCm + (places + 1) * PARTITION_CM
}
