/**
 * @file Slots between rounds and consigne booking rules (docs/PRODUCT.md §4,
 * §4b).
 *
 * - Three rounds a day split the day into slots: morning, afternoon, evening
 *   (the evening slot ends the next morning).
 * - A slot can be booked at least `minNoticeHours` before it starts.
 * - An item can also be dropped off immediately, without booking.
 * - A stored item must be collected at most `maxHours` after drop-off; the
 *   customer picks the pickup slot: the drop-off slot itself or a later one,
 *   so a booking can last a few hours or up to 24 hours.
 *
 * PROD: the backend enforces these rules; the app only previews them.
 */
import type { Slot } from '@city-groom/demo-data'

import { SERVICE_TIME_ZONE, addDays, addHours, serviceDay, zonedTime } from './time'

/** One occurrence of a slot on a given day. */
export interface SlotWindow {
  /** Local date the slot starts on, "YYYY-MM-DD". */
  day: string
  slot: Slot
  start: Date
  end: Date
}

/** Whether a slot can still be booked. */
export type BookingStatus = 'bookable' | 'too_late' | 'past'

/** Occurrence of `slot` starting on `day`. */
export function slotWindow(day: string, slot: Slot): SlotWindow {
  const endsNextDay = slot.ends <= slot.starts
  return {
    day,
    slot,
    start: zonedTime(day, slot.starts),
    end: zonedTime(endsNextDay ? addDays(day, 1) : day, slot.ends),
  }
}

/** Slot occurrence containing `now` (the evening slot may have started the day before). */
export function currentSlot(now: Date, slots: Slot[]): SlotWindow | null {
  const today = serviceDay(now)
  for (const day of [addDays(today, -1), today]) {
    for (const slot of slots) {
      const window = slotWindow(day, slot)
      if (window.start <= now && now < window.end) return window
    }
  }
  return null
}

/**
 * Booking status of a slot occurrence at `now`.
 *
 * @param minNoticeHours - Minimum time between booking and slot start.
 */
export function bookingStatus(
  now: Date,
  window: SlotWindow,
  minNoticeHours: number,
): BookingStatus {
  if (window.end <= now) return 'past'
  if (window.start < addHours(now, minNoticeHours)) return 'too_late'
  return 'bookable'
}

/** Slot occurrences of the next `days` days with their booking status. */
export function upcomingWindows(
  now: Date,
  slots: Slot[],
  minNoticeHours: number,
  days = 7,
): { window: SlotWindow; status: BookingStatus }[] {
  const today = serviceDay(now)
  return Array.from({ length: days }, (_, i) => addDays(today, i)).flatMap((day) =>
    slots.map((slot) => {
      const window = slotWindow(day, slot)
      return { window, status: bookingStatus(now, window, minNoticeHours) }
    }),
  )
}

/** Latest time to collect an item stored at `dropOff`. */
export const pickupDeadline = (dropOff: Date, maxHours: number): Date => addHours(dropOff, maxHours)

/**
 * Slots in which items dropped off during `drop` can be collected: the same
 * slot, then the following ones that start less than `maxHours` after the
 * drop-off slot starts (or after `now`, for an immediate drop-off).
 *
 * @param dropStart - Start of the drop-off: slot start, or now.
 */
export function pickupWindows(dropStart: Date, slots: Slot[], maxHours: number): SlotWindow[] {
  const limit = addHours(dropStart, maxHours)
  const first = currentSlot(dropStart, slots)
  if (!first) return []
  const windows: SlotWindow[] = []
  let day = first.day
  let index = slots.findIndex((s) => s.code === first.slot.code)
  for (;;) {
    const window = slotWindow(day, slots[index] as Slot)
    if (window.start >= limit) break
    windows.push(window)
    index += 1
    if (index === slots.length) {
      index = 0
      day = addDays(day, 1)
    }
  }
  return windows
}

/** Latest collection time: end of the pickup slot, within `maxHours` after drop-off. */
export function collectBy(dropOff: Date, pickupEnd: Date, maxHours: number): Date {
  const limit = pickupDeadline(dropOff, maxHours)
  return pickupEnd < limit ? pickupEnd : limit
}

const LOCAL_CLOCK = new Intl.DateTimeFormat('en-GB', {
  timeZone: SERVICE_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** The round `count` rounds after the round at `round` (local round times "HH:MM"). */
export function addRounds(round: Date, count: number, roundTimes: string[]): Date {
  const times = [...roundTimes].sort()
  let day = serviceDay(round)
  let index = times.indexOf(LOCAL_CLOCK.format(round))
  if (index === -1) throw new Error(`Not a round time: ${round.toISOString()}`)
  for (let i = 0; i < count; i++) {
    index += 1
    if (index === times.length) {
      index = 0
      day = addDays(day, 1)
    }
  }
  return zonedTime(day, times[index] as string)
}

/**
 * The `count` slot occurrences starting at or after `at`, in time order.
 * Used for pickup: items are back at a round, the customer picks one of the
 * following slots and collects before it ends (the next round), so each
 * compartment can turn over three times a day.
 */
export function slotsFrom(at: Date, slots: Slot[], count: number): SlotWindow[] {
  const result: SlotWindow[] = []
  let day = addDays(serviceDay(at), -1)
  while (result.length < count) {
    const windows = slots
      .map((slot) => slotWindow(day, slot))
      .filter((w) => w.start >= at)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
    result.push(...windows)
    day = addDays(day, 1)
  }
  return result.sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, count)
}
