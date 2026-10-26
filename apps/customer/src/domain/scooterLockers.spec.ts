/**
 * Tests of the scooter locker sizing (concept, docs/LOCKERS.md §7).
 */
import { describe, expect, it } from 'vitest'

import {
  REFERENCE_SCOOTERS,
  SCOOTER_PLACE,
  SCOOTER_PLACES,
  fitsScooterPlace,
  lockerFrontCm,
} from './scooterLockers'

describe('scooter lockers', () => {
  it('fits every reference scooter unfolded, including large non-folding ones', () => {
    for (const scooter of REFERENCE_SCOOTERS) {
      expect(fitsScooterPlace(scooter.size), scooter.name).toBe(true)
    }
  })

  it('refuses a scooter longer, wider or taller than a place', () => {
    const { lengthCm, widthCm, heightCm } = SCOOTER_PLACE
    expect(fitsScooterPlace({ lengthCm: lengthCm + 1, widthCm, heightCm })).toBe(false)
    expect(fitsScooterPlace({ lengthCm, widthCm: widthCm + 1, heightCm })).toBe(false)
    expect(fitsScooterPlace({ lengthCm, widthCm, heightCm: heightCm + 1 })).toBe(false)
  })

  it('computes the locker front from the places and partitions', () => {
    expect(lockerFrontCm(SCOOTER_PLACES.min)).toBe(165)
    expect(lockerFrontCm(SCOOTER_PLACES.max)).toBe(405)
  })
})
