/**
 * Tests of consigne transfers: rounds within the 24 hours, prices by plan.
 */
import type { SubscriptionPlan } from '@city-groom/demo-data'
import { describe, expect, it } from 'vitest'

import { roundsBetween, transferPrice, transferRounds } from './transfer'

const ROUNDS = ['07:00', '14:00', '20:00']
const iso = (dates: Date[]): string[] => dates.map((d) => d.toISOString())

describe('transfer rounds', () => {
  it('lists the rounds between two instants, in Grenoble time', () => {
    // 2026-10-20 is in summer time (UTC+2).
    const rounds = roundsBetween(
      new Date('2026-10-20T08:00:00Z'), // 10:00
      new Date('2026-10-21T08:00:00Z'), // next day 10:00
      ROUNDS,
    )
    expect(iso(rounds)).toEqual([
      '2026-10-20T12:00:00.000Z', // 14:00
      '2026-10-20T18:00:00.000Z', // 20:00
      '2026-10-21T05:00:00.000Z', // 07:00
    ])
  })

  it('moves stored items at a round within 24 hours after drop-off', () => {
    const booking = {
      mode: 'now' as const,
      slotStart: '2026-10-20T08:00:00Z',
      slotEnd: '2026-10-20T12:00:00Z',
      droppedAt: '2026-10-20T08:00:00Z',
    }
    const later = new Date('2026-10-20T13:00:00Z') // 15:00, the 14:00 round is gone
    expect(iso(transferRounds(booking, later, 24, ROUNDS))).toEqual([
      '2026-10-20T18:00:00.000Z',
      '2026-10-21T05:00:00.000Z',
    ])
  })

  it('waits for the end of a booked slot before moving items not dropped yet', () => {
    const booking = {
      mode: 'slot' as const,
      slotStart: '2026-10-20T12:00:00Z', // afternoon slot, 14:00
      slotEnd: '2026-10-20T18:00:00Z', // 20:00
      droppedAt: null,
    }
    const rounds = transferRounds(booking, new Date('2026-10-20T06:00:00Z'), 24, ROUNDS)
    // The item may be dropped until 20:00, so the 20:00 round is too early:
    // from 07:00 to 14:00 the next day (slot start + 24 h).
    expect(iso(rounds)).toEqual(['2026-10-21T05:00:00.000Z', '2026-10-21T12:00:00.000Z'])
  })
})

describe('transfer price', () => {
  const plan = (included: number, discount: string): SubscriptionPlan => ({
    code: 'p',
    name: 'P',
    monthly_price: '0',
    consigne_discount: discount,
    transfers_included: included,
    perks: [],
  })

  it('is included up to the monthly allowance, then reduced by the plan', () => {
    expect(transferPrice('2.00', plan(0, '0'), 0)).toEqual({ cents: 200, included: false })
    expect(transferPrice('2.00', plan(2, '0.5'), 1)).toEqual({ cents: 0, included: true })
    expect(transferPrice('2.00', plan(2, '0.5'), 2)).toEqual({ cents: 100, included: false })
  })
})
