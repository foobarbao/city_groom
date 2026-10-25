/**
 * Tests of the weekly pack rules.
 */
import type { DemoPack, Slot } from '@city-groom/demo-data'
import { describe, expect, it } from 'vitest'

import { addRounds, isoWeekday, lowestPlanWeeklyCents, packPrice, packSchedule } from './pack'

const pack: DemoPack = {
  code: 'weekly_shirts',
  name: 'Pack semaine',
  kind: 'weekly_pack',
  items: [
    { service: 'shirt_ironing', quantity: 5 },
    { service: 'trouser_ironing', quantity: 2 },
  ],
  weeks_per_purchase: 4,
  welcome_weekly_price: '10.00',
  weekly_prices: { premium: '15.00', plus: '20.00' },
  size: 'XL',
  turnaround_rounds: 3,
}
const ROUNDS = ['07:00', '14:00', '20:00']
const evening: Slot = { code: 'evening', label: 'Soirée', starts: '20:00', ends: '07:00' }
const morning: Slot = { code: 'morning', label: 'Matinée', starts: '07:00', ends: '14:00' }

describe('weekly pack price', () => {
  it('starts at the welcome price whatever the plan', () => {
    expect(packPrice(pack, 'free', false)).toEqual({
      available: true,
      weeklyCents: 1000,
      totalCents: 4000,
      welcome: true,
    })
  })

  it('then follows the plan, and needs a subscription', () => {
    expect(packPrice(pack, 'premium', true)).toMatchObject({ weeklyCents: 1500, totalCents: 6000 })
    expect(packPrice(pack, 'plus', true)).toMatchObject({ weeklyCents: 2000, totalCents: 8000 })
    expect(packPrice(pack, 'free', true)).toEqual({
      available: false,
      reason: 'subscription_required',
    })
  })
})

describe('offers without a welcome price (sport exchange)', () => {
  const exchange: DemoPack = {
    ...pack,
    code: 'sport_exchange',
    kind: 'exchange',
    weeks_per_purchase: 1,
    welcome_weekly_price: null,
    weekly_prices: { premium: '5.00', plus: '7.00' },
  }

  it('charges the plan price from the first purchase, subscribers only', () => {
    expect(packPrice(exchange, 'plus', false)).toEqual({
      available: true,
      weeklyCents: 700,
      totalCents: 700,
      welcome: false,
    })
    expect(packPrice(exchange, 'free', false)).toEqual({
      available: false,
      reason: 'subscription_required',
    })
    expect(lowestPlanWeeklyCents(exchange)).toBe(500)
  })
})

describe('weekly pack schedule', () => {
  it('knows the weekdays', () => {
    expect(isoWeekday('2026-10-30')).toBe(5) // Friday
    expect(isoWeekday('2026-11-01')).toBe(7) // Sunday
  })

  it('steps rounds across days', () => {
    const friday20 = new Date('2026-10-30T19:00:00Z') // 20:00 in Grenoble (UTC+1)
    expect(addRounds(friday20, 1, ROUNDS).toISOString()).toBe('2026-10-31T06:00:00.000Z')
    expect(addRounds(friday20, 3, ROUNDS).toISOString()).toBe('2026-10-31T19:00:00.000Z')
  })

  it('plans four weekly drop-offs from the next chosen slot, return computed', () => {
    const now = new Date('2026-10-25T17:00:00Z') // Sunday 18:00
    const weeks = packSchedule(pack, 5, evening, ROUNDS, now) // Friday evening
    expect(weeks).toHaveLength(4)
    // Friday 30 Oct 20:00 → collected Saturday 07:00 → back 3 rounds later.
    expect(weeks[0]?.dropFrom.toISOString()).toBe('2026-10-30T19:00:00.000Z')
    expect(weeks[0]?.dropBy.toISOString()).toBe('2026-10-31T06:00:00.000Z')
    expect(weeks[0]?.returnAt.toISOString()).toBe('2026-11-01T06:00:00.000Z')
    expect(weeks[3]?.dropFrom.toISOString()).toBe('2026-11-20T19:00:00.000Z')
  })

  it('skips today when the slot is already over', () => {
    const now = new Date('2026-10-26T13:30:00Z') // Monday 14:30, morning slot over
    const weeks = packSchedule(pack, 1, morning, ROUNDS, now)
    expect(weeks[0]?.dropFrom.toISOString()).toBe('2026-11-02T06:00:00.000Z')
  })
})

describe('pickup slots', () => {
  it('lists the slots from the return round, each ending at the next round', async () => {
    const { slotsFrom } = await import('./slots')
    const slots: Slot[] = [
      { code: 'morning', label: 'Matinée', starts: '07:00', ends: '14:00' },
      { code: 'afternoon', label: 'Après-midi', starts: '14:00', ends: '20:00' },
      evening,
    ]
    const back = new Date('2026-10-31T19:00:00Z') // Saturday 20:00
    const windows = slotsFrom(back, slots, 3)
    expect(windows.map((w) => [w.slot.code, w.start.toISOString(), w.end.toISOString()])).toEqual([
      ['evening', '2026-10-31T19:00:00.000Z', '2026-11-01T06:00:00.000Z'],
      ['morning', '2026-11-01T06:00:00.000Z', '2026-11-01T13:00:00.000Z'],
      ['afternoon', '2026-11-01T13:00:00.000Z', '2026-11-01T19:00:00.000Z'],
    ])
  })
})
