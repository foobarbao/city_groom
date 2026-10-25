/**
 * Tests of the courier round sheet: phases, tasks and transfer order.
 */
import type { DemoOrder, DemoTransfer } from '@city-groom/demo-data'
import { describe, expect, it } from 'vitest'

import { buildRoundSheet } from './roundSheet'

const ROUND = '2026-10-24T14:00:00+02:00'

function order(overrides: Partial<DemoOrder>): DemoOrder {
  return {
    id: 'D-1',
    merchant: 'shop',
    service: 'shirt_ironing',
    items: 2,
    size: 'XL',
    price_total: '7.00',
    commission: '0.70',
    drop_locker: 'a',
    pickup_locker: 'a',
    created_at: '2026-10-24T09:00:00+02:00',
    deposited_at: '2026-10-24T10:00:00+02:00',
    collected_at: null,
    returned_at: null,
    picked_up_at: null,
    late_pickup: false,
    status: 'in_locker',
    ...overrides,
  }
}

const POSITIONS: Record<string, [number, number]> = {
  shop: [5.72, 45.19],
  a: [5.73, 45.19],
  b: [5.75, 45.19],
  c: [5.7, 45.19],
}

describe('buildRoundSheet', () => {
  it('picks returns at merchants first, then serves lockers, then drops at merchants', () => {
    const orders = [
      order({ id: 'D-1', collected_at: ROUND, drop_locker: 'a' }),
      order({ id: 'D-2', returned_at: ROUND, pickup_locker: 'b' }),
    ]
    const stops = buildRoundSheet(orders, [], ROUND, POSITIONS, [5.72, 45.19])

    expect(stops.map((s) => s.key)).toEqual(['M-pick-shop', 'L-a', 'L-b', 'M-drop-shop'])
    expect(stops[1]?.tasks).toMatchObject([{ kind: 'pickup', ref: 'D-1', other: 'shop' }])
    expect(stops[2]?.tasks).toMatchObject([{ kind: 'dropoff', ref: 'D-2' }])
  })

  it('visits the origin of a consigne transfer before its destination', () => {
    // From c (west) to a (next to the start): a must still come after c.
    const transfers: DemoTransfer[] = [
      { id: 'T-1', round_at: ROUND, from_locker: 'c', to_locker: 'a', size: 'L' },
    ]
    const stops = buildRoundSheet([], transfers, ROUND, POSITIONS, [5.73, 45.19])

    expect(stops.map((s) => s.code)).toEqual(['c', 'a'])
    expect(stops[0]?.tasks[0]).toMatchObject({ kind: 'pickup', what: 'consigne', other: 'a' })
  })

  it('ignores other rounds', () => {
    const orders = [order({ collected_at: '2026-10-24T20:00:00+02:00' })]
    expect(buildRoundSheet(orders, [], ROUND, POSITIONS, [5.72, 45.19])).toEqual([])
  })
})
