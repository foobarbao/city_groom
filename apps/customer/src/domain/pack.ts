/**
 * @file Rules of the weekly offers (docs/PRODUCT.md "Weekly pack", "Sport
 * exchange"), decided by the project owner on 2026-10-25. The price rules
 * apply to both; the schedule below is the weekly pack's.
 *
 * - Each week: 5 shirts + 2 trousers washed, ironed and folded.
 * - Bought four weeks at a time, paid at once, in a single order.
 * - Weekly price: the welcome price for a customer's first purchase, whatever
 *   their plan; then the price of their plan (Premium, Plus). Without a
 *   subscription, the pack is not offered after the welcome purchase.
 * - The customer chooses the weekly drop-off day and slot; the return is
 *   computed: the round closing the slot collects the items, they come back
 *   `turnaround_rounds` rounds later.
 * - No automatic renewal: the customer buys again.
 *
 * PROD: the backend enforces these rules and charges the payment.
 */
import type { DemoPack, Slot } from '@city-groom/demo-data'

import { toCents } from './pricing'
import { addRounds, slotWindow } from './slots'
import { addDays, serviceDay } from './time'

/** Price a customer would pay, or why they cannot buy. */
export type PackPrice =
  | { available: true; weeklyCents: number; totalCents: number; welcome: boolean }
  | { available: false; reason: 'subscription_required' }

/**
 * Weekly and total price of a purchase.
 *
 * @param plan - Code of the customer's plan ("free", "plus", "premium").
 * @param hasBoughtBefore - Whether the customer already bought this pack.
 */
export function packPrice(pack: DemoPack, plan: string, hasBoughtBefore: boolean): PackPrice {
  const welcome = !hasBoughtBefore && pack.welcome_weekly_price !== null
  const weekly = welcome ? pack.welcome_weekly_price : pack.weekly_prices[plan]
  if (weekly === undefined || weekly === null) {
    return { available: false, reason: 'subscription_required' }
  }
  const weeklyCents = toCents(weekly)
  return {
    available: true,
    weeklyCents,
    totalCents: weeklyCents * pack.weeks_per_purchase,
    welcome,
  }
}

/** Lowest weekly price with a subscription ("dès … avec un abonnement"). */
export function lowestPlanWeeklyCents(pack: DemoPack): number | null {
  const prices = Object.values(pack.weekly_prices).map(toCents)
  return prices.length ? Math.min(...prices) : null
}

export { addRounds }

/** One week of a pack: drop-off before `dropBy`, items back at `returnAt`. */
export interface PackWeek {
  week: number
  /** Start of the chosen drop-off slot. */
  dropFrom: Date
  /** Round closing the slot: the courier collects the items then. */
  dropBy: Date
  returnAt: Date
}

/** ISO weekday (1 = Monday … 7 = Sunday) of a local date "YYYY-MM-DD". */
export const isoWeekday = (day: string): number => {
  const sunday0 = new Date(`${day}T12:00:00Z`).getUTCDay()
  return sunday0 === 0 ? 7 : sunday0
}

/**
 * The weeks of a purchase: the first chosen slot ending after `now`, then
 * every 7 days.
 *
 * @param weekday - ISO weekday the drop-off slot starts on.
 */
export function packSchedule(
  pack: DemoPack,
  weekday: number,
  slot: Slot,
  roundTimes: string[],
  now: Date,
): PackWeek[] {
  let day = serviceDay(now)
  while (isoWeekday(day) !== weekday || slotWindow(day, slot).end <= now) day = addDays(day, 1)
  return Array.from({ length: pack.weeks_per_purchase }, (_, i) => {
    const window = slotWindow(addDays(day, 7 * i), slot)
    return {
      week: i + 1,
      dropFrom: window.start,
      dropBy: window.end,
      returnAt: addRounds(window.end, pack.turnaround_rounds, roundTimes),
    }
  })
}
