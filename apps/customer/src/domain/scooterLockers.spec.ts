/**
 * Tests of the scooter locker sizing (concept, docs/LOCKERS.md §7).
 */
import { describe, expect, it } from 'vitest'

import {
  EXAMPLE_STATION,
  REFERENCE_SCOOTERS,
  SCOOTER_LOCKERS,
  SCOOTER_PLACE,
  fitsScooterPlace,
  stationFrontCm,
  stationScooters,
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

  it('holds one scooter per single locker and two in a double one', () => {
    expect(SCOOTER_LOCKERS.single.scooters).toBe(1)
    expect(SCOOTER_LOCKERS.double.scooters).toBe(2)
    expect(fitsScooterPlace(REFERENCE_SCOOTERS[3]!.size, SCOOTER_LOCKERS.double.size)).toBe(true)
  })

  it('computes a station front from its lockers and partitions', () => {
    expect(stationFrontCm(['single'])).toBe(85)
    expect(stationFrontCm(['single', 'double'])).toBe(240)
    // 3 × 75 + 150 + 5 × 5
    expect(stationFrontCm(EXAMPLE_STATION)).toBe(400)
    expect(stationScooters(EXAMPLE_STATION)).toBe(5)
  })
})
