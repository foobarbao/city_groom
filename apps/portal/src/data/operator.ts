/**
 * @file Figures of the operator space: alerts, partner shops, forecasts.
 *
 * Pure functions, unit-tested. In the demo they read the fictitious activity
 * and the simulated lockers.
 * PROD: compute from the API (or serve from it), with thresholds set by the
 * operator.
 */
import type { ActivityData, DemoOrder } from '@city-groom/demo-data'

/** Locker fields used by the alerts. */
export interface LockerState {
  code: string
  name: string
  fill_rate: number
  free_by_size: Record<string, number>
  compartments: { status: string }[]
}

/** Something the operator should look at. */
export interface Alert {
  level: 'high' | 'medium'
  kind: 'almost_full' | 'no_large' | 'out_of_service' | 'late_pickup'
  /** Locker or order concerned. */
  ref: string
  /** Count behind the alert (fill percentage, doors, items). */
  value: number
}

/**
 * ASSUMPTION: alert thresholds for the demo, to set with the project owner.
 * A locker at least 75 % full may refuse drop-offs at the next round.
 */
export const ALMOST_FULL = 0.75

/** Alerts at `now`, most urgent first. */
export function operatorAlerts(lockers: LockerState[], orders: DemoOrder[]): Alert[] {
  const alerts: Alert[] = []
  for (const l of lockers) {
    if (l.fill_rate >= ALMOST_FULL)
      alerts.push({
        level: 'high',
        kind: 'almost_full',
        ref: l.code,
        value: Math.round(l.fill_rate * 100),
      })
    const outOfService = l.compartments.filter((c) => c.status === 'out_of_service').length
    if (outOfService)
      alerts.push({ level: 'medium', kind: 'out_of_service', ref: l.code, value: outOfService })
    if ((l.free_by_size.L ?? 0) === 0 && 'L' in l.free_by_size)
      alerts.push({ level: 'medium', kind: 'no_large', ref: l.code, value: 0 })
  }
  for (const o of orders) {
    if (o.late_pickup && o.status === 'ready_for_pickup')
      alerts.push({ level: 'medium', kind: 'late_pickup', ref: o.id, value: o.items })
  }
  const rank = { high: 0, medium: 1 }
  return alerts.sort((a, b) => rank[a.level] - rank[b.level] || b.value - a.value)
}

/** Activity of one partner shop over the activity window. */
export interface PartnerStats {
  code: string
  orders: number
  items: number
  revenue: number
  commission: number
  inProgress: number
}

/** Figures per merchant, best revenue first. */
export function partnerStats(activity: ActivityData, merchants: string[]): PartnerStats[] {
  return merchants
    .map((code) => {
      const mine = activity.orders.filter((o) => o.merchant === code)
      return {
        code,
        orders: mine.length,
        items: mine.reduce((s, o) => s + o.items, 0),
        revenue: mine.reduce((s, o) => s + Number.parseFloat(o.price_total), 0),
        commission: mine.reduce((s, o) => s + Number.parseFloat(o.commission), 0),
        inProgress: mine.filter((o) => o.status === 'at_merchant' || o.status === 'in_locker')
          .length,
      }
    })
    .sort((a, b) => b.revenue - a.revenue || a.code.localeCompare(b.code))
}

/** Share of past collected items per round time ("07:00" → 0.3…). */
export function roundShares(activity: ActivityData): Record<string, number> {
  const byTime: Record<string, number> = Object.fromEntries(activity.round_times.map((t) => [t, 0]))
  let total = 0
  for (const r of activity.rounds) {
    if (r.status !== 'done') continue
    const time = new Date(r.starts_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: activity.timezone,
    })
    if (time in byTime) {
      byTime[time] = (byTime[time] ?? 0) + r.items_collected
      total += r.items_collected
    }
  }
  const even = 1 / activity.round_times.length
  return Object.fromEntries(
    Object.entries(byTime).map(([time, items]) => [time, total ? items / total : even]),
  )
}

/** Expected items per round over the forecast days, from past shares by round time. */
export function forecastByRound(
  activity: ActivityData,
): { date: string; time: string; items: number }[] {
  const shares = roundShares(activity)
  return activity.forecast.flatMap((f) =>
    activity.round_times.map((time) => ({
      date: f.date,
      time,
      items: Math.round(f.items * (shares[time] ?? 0)),
    })),
  )
}

/** Expected items per locker over the forecast days, from past drop-offs; busiest first. */
export function forecastByLocker(
  activity: ActivityData,
  top = 10,
): { code: string; items: number }[] {
  const past = new Map<string, number>()
  let total = 0
  for (const o of activity.orders) {
    past.set(o.drop_locker, (past.get(o.drop_locker) ?? 0) + o.items)
    total += o.items
  }
  const coming = activity.forecast.reduce((s, f) => s + f.items, 0)
  return [...past.entries()]
    .map(([code, items]) => ({ code, items: total ? Math.round((items / total) * coming) : 0 }))
    .sort((a, b) => b.items - a.items || a.code.localeCompare(b.code))
    .slice(0, top)
}
