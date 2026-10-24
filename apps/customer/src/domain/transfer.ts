/**
 * @file Consigne transfers (docs/PRODUCT.md §4b): stored items can be moved
 * to another locker by a courier at a round, as long as they reach the new
 * locker within the 24 hours after drop-off.
 *
 * PROD: the backend schedules the transfer in a round and checks the rules.
 */
import type { SubscriptionPlan } from '@city-groom/demo-data'

import { toCents } from './pricing'
import { addDays, addHours, serviceDay, zonedTime } from './time'

/** Booking fields that decide when a transfer can happen. */
export interface TransferableBooking {
  mode: 'now' | 'slot'
  slotStart: string
  slotEnd: string
  droppedAt: string | null
}

/** Round instants strictly after `from` and at most `to`. */
export function roundsBetween(from: Date, to: Date, roundTimes: string[]): Date[] {
  const rounds: Date[] = []
  for (let day = serviceDay(from); zonedTime(day, '00:00') <= to; day = addDays(day, 1)) {
    for (const time of roundTimes) {
      const at = zonedTime(day, time)
      if (at > from && at <= to) rounds.push(at)
    }
  }
  return rounds.sort((a, b) => a.getTime() - b.getTime())
}

/**
 * Rounds at which a booking's items can be moved.
 *
 * The items must be in the locker before the round: after drop-off, or after
 * the booked slot if they are not dropped yet. They must arrive within
 * `maxHours` after drop-off; before drop-off, the earliest possible drop-off
 * (now, or the slot start) is used, so the chosen round stays valid.
 */
export function transferRounds(
  booking: TransferableBooking,
  now: Date,
  maxHours: number,
  roundTimes: string[],
): Date[] {
  const latest = (a: Date, b: Date): Date => (a > b ? a : b)
  const dropped = booking.droppedAt ? new Date(booking.droppedAt) : null
  // Not dropped yet: the drop-off cannot happen before now nor before the slot.
  const earliestDrop =
    dropped ?? (booking.mode === 'slot' ? latest(new Date(booking.slotStart), now) : now)
  const inLockerFrom =
    dropped ?? (booking.mode === 'slot' ? latest(new Date(booking.slotEnd), now) : now)
  return roundsBetween(latest(inLockerFrom, now), addHours(earliestDrop, maxHours), roundTimes)
}

/** Price of a transfer for a plan, given the included transfers already used this month. */
export function transferPrice(
  basePrice: string,
  plan: SubscriptionPlan,
  usedThisMonth: number,
): { cents: number; included: boolean } {
  if (usedThisMonth < plan.transfers_included) return { cents: 0, included: true }
  const discount = Number.parseFloat(plan.consigne_discount)
  return { cents: Math.round(toCents(basePrice) * (1 - discount)), included: false }
}
