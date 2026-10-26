/**
 * Tests of the customer app navigation tree.
 */
import { navDepth } from '@city-groom/ui'
import { describe, expect, it } from 'vitest'

import fr from './i18n/fr'
import { NAVIGATION, labels, trail } from './navigation'

const has = (key: string): boolean =>
  key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], fr) !==
  undefined

describe('customer navigation', () => {
  it('highlights the list entry on detail screens', () => {
    expect(trail('booking').map((n) => n.id)).toEqual(['consigne', 'bookings'])
    expect(trail('chat').map((n) => n.id)).toEqual(['services', 'messages'])
    expect(trail('locker').map((n) => n.id)).toEqual(['map'])
    expect(trail('order').map((n) => n.id)).toEqual(['services', 'orders'])
    expect(trail('scooter-lockers').map((n) => n.id)).toEqual(['consigne', 'scooters'])
  })

  it('stays shallow and fully translated', () => {
    expect(navDepth(NAVIGATION)).toBeLessThanOrEqual(3)
    expect(labels().filter((key) => !has(key))).toEqual([])
  })
})
