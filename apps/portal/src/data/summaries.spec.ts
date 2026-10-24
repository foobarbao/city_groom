import type { ActivityData, DemoOrder, DemoRound } from '@city-groom/demo-data'
import { describe, expect, it } from 'vitest'

import { courierSummary, merchantSummary, nearestNeighbourOrder, operatorKpis } from './summaries'

const NOW = new Date('2026-10-21T18:30:00+02:00')

function order(overrides: Partial<DemoOrder>): DemoOrder {
  return {
    id: 'D-1',
    merchant: 'm1',
    service: 'shirt_ironing',
    items: 2,
    size: 'XL',
    price_total: '10.00',
    commission: '1.00',
    drop_locker: 'a',
    pickup_locker: 'a',
    created_at: '2026-10-21T09:00:00+02:00',
    deposited_at: '2026-10-21T10:00:00+02:00',
    collected_at: '2026-10-21T20:00:00+02:00',
    returned_at: null,
    picked_up_at: null,
    late_pickup: false,
    status: 'in_locker',
    ...overrides,
  }
}

function round(overrides: Partial<DemoRound>): DemoRound {
  return {
    id: 'R',
    starts_at: '2026-10-21T08:00:00+02:00',
    status: 'done',
    items_collected: 4,
    items_returned: 2,
    locker_stops: ['a'],
    merchant_stops: ['m1'],
    distance_km: 12,
    ...overrides,
  }
}

const activity = {
  fictitious: true,
  generated_at: NOW.toISOString(),
  timezone: 'Europe/Paris',
  round_times: ['08:00', '20:00'],
  commission_rate: '0.10',
  merchants: [],
  services: [],
  orders: [
    order({ id: 'D-1' }),
    order({ id: 'D-2', items: 1, price_total: '20.00', commission: '2.00', status: 'at_merchant' }),
    order({ id: 'D-3', merchant: 'm2', items: 3 }),
  ],
  rounds: [round({}), round({ starts_at: '2026-10-21T20:00:00+02:00', status: 'planned' })],
  daily: [{ date: '2026-10-21', orders: 3, items: 6, revenue: '40.00', commission: '4.00' }],
  forecast: [{ date: '2026-10-22', orders: 4, items: 10 }],
} as ActivityData

describe('merchantSummary', () => {
  const summary = merchantSummary(activity, 'm1', NOW)

  it('groups upcoming items by round', () => {
    expect(summary.incoming).toHaveLength(1)
    expect(summary.incoming[0]).toMatchObject({ orders: 2, items: 3 })
  })

  it('computes revenue, commission and net', () => {
    expect(summary.totals).toEqual({ orders: 2, items: 3, revenue: 30, commission: 3, net: 27 })
    expect(summary.days[0]).toEqual({ date: '2026-10-21', items: 3, net: 27, commission: 3 })
    expect(summary.commissionRate).toBe(0.1)
  })

  it('lists items being processed and shares the forecast', () => {
    expect(summary.inProgress.map((o) => o.id)).toEqual(['D-2'])
    // m1 holds 3 of the 6 items: half of the network forecast.
    expect(summary.forecastItems[0]?.items).toBe(5)
  })
})

describe('courierSummary', () => {
  it('lists next rounds and last-week averages', () => {
    const summary = courierSummary(activity, NOW)

    expect(summary.nextRounds.map((r) => r.status)).toEqual(['planned'])
    expect(summary.averageItemsPerRound).toBe(6)
    expect(summary.averageKmPerRound).toBe(12)
    expect(summary.projectedItemsPerMonth).toBe(600)
  })
})

describe('operatorKpis', () => {
  it('counts orders of the day and items by location', () => {
    expect(operatorKpis(activity, NOW)).toEqual({
      ordersToday: 3,
      itemsInLockers: 5,
      itemsAtMerchants: 1,
    })
  })
})

describe('nearestNeighbourOrder', () => {
  it('visits the nearest remaining position each time', () => {
    const order = nearestNeighbourOrder(
      [
        [3, 0],
        [1, 0],
        [2, 0],
      ],
      [0, 0],
    )
    expect(order).toEqual([
      [1, 0],
      [2, 0],
      [3, 0],
    ])
  })
})
