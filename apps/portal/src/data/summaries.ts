/**
 * @file Figures shown in the portal spaces, computed from the activity.
 *
 * Pure functions, unit-tested. In the demo they read the fictitious activity
 * of `@city-groom/demo-data`.
 * PROD: compute from real orders and rounds served by the API.
 */
import type { ActivityData, DemoOrder, DemoRound } from '@city-groom/demo-data'

import { serviceDay } from './format'

/** Statuses of items currently held by a merchant or waiting to reach them. */
const HELD_STATUSES = new Set(['at_merchant'])

const amount = (value: string): number => Number.parseFloat(value)
const dayOf = (iso: string): string => serviceDay(new Date(iso))

/** Items arriving at a merchant at one round. */
export interface IncomingRound {
  startsAt: string
  orders: number
  items: number
  byService: { service: string; items: number }[]
}

/** One day of revenue for a merchant. */
export interface MerchantDay {
  date: string
  items: number
  net: number
  commission: number
}

/** Everything the merchant space shows. */
export interface MerchantSummary {
  incoming: IncomingRound[]
  inProgress: DemoOrder[]
  totals: { orders: number; items: number; revenue: number; commission: number; net: number }
  days: MerchantDay[]
  forecastItems: { date: string; items: number }[]
  commissionRate: number
}

/**
 * Summarises the activity of one merchant at `now`.
 *
 * @param activity - Activity (fictitious in the demo).
 * @param merchant - Merchant code.
 * @param now - Reference time.
 */
export function merchantSummary(
  activity: ActivityData,
  merchant: string,
  now: Date,
): MerchantSummary {
  const orders = activity.orders.filter((o) => o.merchant === merchant)
  const upcoming = orders.filter((o) => o.collected_at !== null && new Date(o.collected_at) > now)
  const byRound = new Map<string, DemoOrder[]>()
  for (const order of upcoming) {
    const key = order.collected_at as string
    byRound.set(key, [...(byRound.get(key) ?? []), order])
  }
  const incoming = [...byRound.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([startsAt, list]) => {
      const services = new Map<string, number>()
      for (const o of list) services.set(o.service, (services.get(o.service) ?? 0) + o.items)
      return {
        startsAt,
        orders: list.length,
        items: list.reduce((sum, o) => sum + o.items, 0),
        byService: [...services.entries()].map(([service, items]) => ({ service, items })),
      }
    })

  const revenue = orders.reduce((sum, o) => sum + amount(o.price_total), 0)
  const commission = orders.reduce((sum, o) => sum + amount(o.commission), 0)
  const days = activity.daily.map(({ date }) => {
    const ofDay = orders.filter((o) => dayOf(o.created_at) === date)
    const dayCommission = ofDay.reduce((sum, o) => sum + amount(o.commission), 0)
    const dayRevenue = ofDay.reduce((sum, o) => sum + amount(o.price_total), 0)
    return {
      date,
      items: ofDay.reduce((sum, o) => sum + o.items, 0),
      net: dayRevenue - dayCommission,
      commission: dayCommission,
    }
  })

  // The merchant's share of the network forecast follows its share of past items.
  const networkItems = activity.orders.reduce((sum, o) => sum + o.items, 0)
  const merchantItems = orders.reduce((sum, o) => sum + o.items, 0)
  const share = networkItems ? merchantItems / networkItems : 0

  return {
    incoming,
    inProgress: orders.filter((o) => HELD_STATUSES.has(o.status)),
    totals: {
      orders: orders.length,
      items: merchantItems,
      revenue,
      commission,
      net: revenue - commission,
    },
    days,
    forecastItems: activity.forecast.map((f) => ({
      date: f.date,
      items: Math.round(f.items * share),
    })),
    commissionRate: amount(activity.commission_rate),
  }
}

/** Everything the courier space shows. */
export interface CourierSummary {
  nextRounds: DemoRound[]
  roundsPerDay: number
  averageItemsPerRound: number
  averageKmPerRound: number
  itemsLast7Days: number
  projectedItemsPerMonth: number
}

/**
 * Summarises the rounds for a courier partner at `now`.
 *
 * @param activity - Activity (fictitious in the demo).
 * @param now - Reference time.
 * @param upcoming - Number of next rounds to list.
 */
export function courierSummary(activity: ActivityData, now: Date, upcoming = 4): CourierSummary {
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
  const lastWeek = activity.rounds.filter((r) => {
    const t = new Date(r.starts_at)
    return t <= now && t > weekAgo
  })
  const items = (r: DemoRound): number => r.items_collected + r.items_returned
  const itemsLast7Days = lastWeek.reduce((sum, r) => sum + items(r), 0)
  const forecastPerDay = activity.forecast.length
    ? activity.forecast.reduce((sum, f) => sum + f.items, 0) / activity.forecast.length
    : 0
  return {
    nextRounds: activity.rounds
      .filter((r) => new Date(r.starts_at) > now)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .slice(0, upcoming),
    roundsPerDay: activity.round_times.length,
    averageItemsPerRound: lastWeek.length ? Math.round(itemsLast7Days / lastWeek.length) : 0,
    averageKmPerRound: lastWeek.length
      ? Math.round((lastWeek.reduce((sum, r) => sum + r.distance_km, 0) / lastWeek.length) * 10) /
        10
      : 0,
    itemsLast7Days,
    // Each item travels twice (to the merchant and back).
    projectedItemsPerMonth: Math.round(forecastPerDay * 2 * 30),
  }
}

/** Headline figures of the operator space. */
export interface OperatorKpis {
  ordersToday: number
  itemsInLockers: number
  itemsAtMerchants: number
}

/**
 * Computes the operator's headline figures at `now`.
 *
 * @param activity - Activity (fictitious in the demo).
 * @param now - Reference time.
 */
export function operatorKpis(activity: ActivityData, now: Date): OperatorKpis {
  const today = serviceDay(now)
  const sumItems = (statuses: string[]): number =>
    activity.orders.filter((o) => statuses.includes(o.status)).reduce((s, o) => s + o.items, 0)
  return {
    ordersToday: activity.orders.filter((o) => dayOf(o.created_at) === today).length,
    itemsInLockers: sumItems(['in_locker', 'ready_for_pickup']),
    itemsAtMerchants: sumItems(['at_merchant']),
  }
}

/** Squared distance between two [longitude, latitude] positions (enough to compare). */
function distance2(a: [number, number], b: [number, number]): number {
  // A degree of longitude is shorter than a degree of latitude at Grenoble's latitude.
  const dx = (a[0] - b[0]) * Math.cos((45.19 * Math.PI) / 180)
  const dy = a[1] - b[1]
  return dx * dx + dy * dy
}

/**
 * Orders positions for display, visiting each time the nearest one not yet
 * visited (nearest-neighbour heuristic). It gives a readable round on a map;
 * it is not an optimised itinerary.
 *
 * @param positions - Positions to visit.
 * @param start - Where the round starts.
 * @returns The same positions, in visiting order.
 */
export function nearestNeighbourOrder(
  positions: [number, number][],
  start: [number, number],
): [number, number][] {
  const left = [...positions]
  const ordered: [number, number][] = []
  let current = start
  while (left.length) {
    let best = 0
    left.forEach((p, i) => {
      if (distance2(p, current) < distance2(left[best] as [number, number], current)) best = i
    })
    current = left.splice(best, 1)[0] as [number, number]
    ordered.push(current)
  }
  return ordered
}
