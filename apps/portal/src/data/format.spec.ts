/**
 * Tests of the formatting helpers: French formats, service time zone.
 */
import { describe, expect, it } from 'vitest'

import { clock, euros, percent, serviceDay, shortDay } from './format'

describe('format', () => {
  it('formats amounts and ratios in French', () => {
    // Intl uses narrow no-break spaces; compare without them.
    expect(euros(1250.5).replace(/\s/g, ' ')).toBe('1 250,50 €')
    expect(percent(0.1).replace(/\s/g, ' ')).toBe('10 %')
  })

  it('shows times and days in the Grenoble time zone, whatever the device zone', () => {
    // 18:00 UTC on 24 October 2026 is 20:00 in Grenoble (CEST, UTC+2).
    expect(clock('2026-10-24T18:00:00Z')).toBe('20:00')
    // 23:30 UTC is already the next day in Grenoble.
    expect(serviceDay(new Date('2026-10-24T23:30:00Z'))).toBe('2026-10-25')
    expect(shortDay('2026-10-24')).toBe('sam. 24')
  })
})
