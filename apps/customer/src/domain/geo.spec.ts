/**
 * Tests of distances and walking times.
 */
import { describe, expect, it } from 'vitest'

import { byDistance, distanceMeters, formatDistance, walkingMinutes } from './geo'

// Place Grenette and the Grenoble railway station (approximate positions).
const GRENETTE: [number, number] = [5.7275, 45.1902]
const STATION: [number, number] = [5.7146, 45.1914]

describe('geo', () => {
  it('measures distances in metres', () => {
    expect(distanceMeters(GRENETTE, GRENETTE)).toBe(0)
    const d = distanceMeters(GRENETTE, STATION)
    expect(d).toBeGreaterThan(950)
    expect(d).toBeLessThan(1100)
  })

  it('gives walking minutes and readable distances', () => {
    expect(walkingMinutes(20)).toBe(1)
    expect(walkingMinutes(800)).toBe(10)
    expect(formatDistance(347)).toBe('350 m')
    expect(formatDistance(1234)).toBe('1,2 km')
  })

  it('sorts by distance', () => {
    const items = [
      { code: 'station', longitude: STATION[0], latitude: STATION[1] },
      { code: 'grenette', longitude: GRENETTE[0], latitude: GRENETTE[1] },
    ]
    expect(byDistance(items, GRENETTE).map((i) => i.code)).toEqual(['grenette', 'station'])
  })
})
