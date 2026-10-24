/**
 * @file Typed access to the demo dataset (see README.md).
 *
 * Public and operator data are snapshots of the real API, typed with the
 * generated API types. Activity data is fictitious and typed here, mirroring
 * the output of `apps.demo.activity` in the backend.
 */
import type {
  LockerFeatureCollection,
  LockerLayout,
  MerchantFeatureCollection,
  OperatorLockerLayout,
  SizeSpec,
  components,
} from '@city-groom/api-client'

import activityJson from '../data/activity.json'
import operatorJson from '../data/operator.json'
import publicJson from '../data/public.json'

/** Snapshot of the public API. */
export interface PublicData {
  lockers: LockerFeatureCollection
  details: Record<string, LockerLayout>
  sizes: SizeSpec[]
  merchants: MerchantFeatureCollection
}

/** Snapshot of the operator API. */
export interface OperatorData {
  lockers: components['schemas']['OperatorLockerFeatureList']
  details: Record<string, OperatorLockerLayout>
  stats: components['schemas']['NetworkStats']
}

/** Status of a fictitious order at the reference time. */
export type OrderStatus =
  | 'awaiting_drop_off'
  | 'in_locker'
  | 'at_merchant'
  | 'ready_for_pickup'
  | 'picked_up'

/** A fictitious order. Amounts are decimal strings in euros; dates are ISO 8601. */
export interface DemoOrder {
  id: string
  merchant: string
  service: string
  items: number
  size: string
  price_total: string
  commission: string
  drop_locker: string
  pickup_locker: string
  created_at: string
  deposited_at: string
  collected_at: string | null
  returned_at: string | null
  picked_up_at: string | null
  late_pickup: boolean
  status: OrderStatus
}

/** A fictitious courier round. */
export interface DemoRound {
  id: string
  starts_at: string
  status: 'done' | 'planned'
  items_collected: number
  items_returned: number
  locker_stops: string[]
  merchant_stops: string[]
  distance_km: number
}

/** Fictitious activity of the network. */
export interface ActivityData {
  fictitious: true
  generated_at: string
  timezone: string
  round_times: string[]
  commission_rate: string
  merchants: { code: string; name: string; category: string; latitude: number; longitude: number }[]
  services: { code: string; name: string; category: string; price: string; size: string }[]
  orders: DemoOrder[]
  rounds: DemoRound[]
  daily: { date: string; orders: number; items: number; revenue: string; commission: string }[]
  forecast: { date: string; orders: number; items: number }[]
}

export const publicData = publicJson as unknown as PublicData
export const operatorData = operatorJson as unknown as OperatorData

const DAY_MS = 24 * 60 * 60 * 1000

function shiftIso(value: string, days: number): string
function shiftIso(value: string | null, days: number): string | null
function shiftIso(value: string | null, days: number): string | null {
  if (value === null) return null
  return new Date(new Date(value).getTime() + days * DAY_MS).toISOString()
}

function shiftDate(value: string, days: number): string {
  return new Date(new Date(`${value}T12:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10)
}

/**
 * Returns the activity with every date moved by whole days so that its
 * reference day becomes `today`, keeping times of day (rounds stay at 08:00
 * and 20:00 local time, give or take a daylight-saving change).
 *
 * @param activity - Activity as generated.
 * @param today - Day the demo should look like (default: now).
 */
export function rebaseActivity(activity: ActivityData, today: Date = new Date()): ActivityData {
  const generated = new Date(activity.generated_at)
  const days = Math.round(
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
      Date.UTC(generated.getFullYear(), generated.getMonth(), generated.getDate())) /
      DAY_MS,
  )
  if (days === 0) return activity
  return {
    ...activity,
    generated_at: shiftIso(activity.generated_at, days),
    orders: activity.orders.map((o) => ({
      ...o,
      created_at: shiftIso(o.created_at, days),
      deposited_at: shiftIso(o.deposited_at, days),
      collected_at: shiftIso(o.collected_at, days),
      returned_at: shiftIso(o.returned_at, days),
      picked_up_at: shiftIso(o.picked_up_at, days),
    })),
    rounds: activity.rounds.map((r) => ({ ...r, starts_at: shiftIso(r.starts_at, days) })),
    daily: activity.daily.map((d) => ({ ...d, date: shiftDate(d.date, days) })),
    forecast: activity.forecast.map((f) => ({ ...f, date: shiftDate(f.date, days) })),
  }
}

/** Fictitious activity, rebased to today. */
export const activityData: ActivityData = rebaseActivity(activityJson as unknown as ActivityData)
