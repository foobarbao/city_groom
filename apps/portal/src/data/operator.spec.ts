/**
 * Tests of the operator figures: alerts, partner shops, forecasts.
 */
import type { ActivityData, DemoOrder } from '@city-groom/demo-data'
import { describe, expect, it } from 'vitest'

import {
  forecastByLocker,
  forecastByRound,
  operatorAlerts,
  partnerStats,
  roundShares,
} from './operator'

function order(overrides: Partial<DemoOrder>): DemoOrder {
  return {
    id: 'D-1',
    merchant: 'm1',
    service: 's',
    items: 2,
    size: 'M',
    price_total: '10.00',
    commission: '1.00',
    drop_locker: 'a',
    pickup_locker: 'a',
    created_at: '2026-10-24T09:00:00+02:00',
    deposited_at: '2026-10-24T10:00:00+02:00',
    collected_at: null,
    returned_at: null,
    picked_up_at: null,
    late_pickup: false,
    status: 'picked_up',
    ...overrides,
  }
}

const activity = {
  timezone: 'Europe/Paris',
  round_times: ['07:00', '14:00', '20:00'],
  orders: [
    order({ id: 'D-1', drop_locker: 'a', items: 3 }),
    order({ id: 'D-2', merchant: 'm2', drop_locker: 'b', items: 1, status: 'at_merchant' }),
  ],
  rounds: [
    { starts_at: '2026-10-24T07:00:00+02:00', status: 'done', items_collected: 1 },
    { starts_at: '2026-10-24T14:00:00+02:00', status: 'done', items_collected: 3 },
    { starts_at: '2026-10-25T14:00:00+01:00', status: 'planned', items_collected: 9 },
  ],
  forecast: [{ date: '2026-10-25', orders: 4, items: 8 }],
} as unknown as ActivityData

describe('operatorAlerts', () => {
  it('flags full lockers first, then doors out of service, no large door and late pickups', () => {
    const lockers = [
      { code: 'a', name: 'A', fill_rate: 0.8, free_by_size: { L: 2 }, compartments: [] },
      {
        code: 'b',
        name: 'B',
        fill_rate: 0.2,
        free_by_size: { L: 0 },
        compartments: [{ status: 'out_of_service' }],
      },
    ]
    const orders = [order({ id: 'D-9', late_pickup: true, status: 'ready_for_pickup' })]
    expect(operatorAlerts(lockers, orders).map((a) => `${a.kind}:${a.ref}`)).toEqual([
      'almost_full:a',
      'late_pickup:D-9',
      'out_of_service:b',
      'no_large:b',
    ])
  })
})

describe('partnerStats', () => {
  it('sums orders, revenue and commission per shop, best revenue first', () => {
    const stats = partnerStats(activity, ['m2', 'm1', 'm3'])
    expect(stats.map((s) => [s.code, s.orders, s.revenue, s.inProgress])).toEqual([
      ['m1', 1, 10, 0],
      ['m2', 1, 10, 1],
      ['m3', 0, 0, 0],
    ])
  })
})

describe('forecasts', () => {
  it('splits the forecast by round time from past rounds', () => {
    expect(roundShares(activity)).toEqual({ '07:00': 0.25, '14:00': 0.75, '20:00': 0 })
    expect(forecastByRound(activity).map((r) => r.items)).toEqual([2, 6, 0])
  })

  it('spreads the forecast over lockers from past drop-offs', () => {
    expect(forecastByLocker(activity)).toEqual([
      { code: 'a', items: 6 },
      { code: 'b', items: 2 },
    ])
  })
})
