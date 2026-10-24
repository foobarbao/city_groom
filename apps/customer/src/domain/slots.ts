/**
 * @file Slots between rounds and consigne booking rules (docs/PRODUCT.md §4,
 * §4b).
 *
 * - Three rounds a day split the day into slots: morning, afternoon, evening
 *   (the evening slot ends the next morning).
 * - A slot can be booked at least `minNoticeHours` before it starts.
 * - An item can also be dropped off immediately, without booking.
 * - A stored item must be collected at most `maxHours` after drop-off.
 *
 * PROD: the backend enforces these rules; the app only previews them.
 */
import type { Slot } from '@city-groom/demo-data'

import { addDays, addHours, serviceDay, zonedTime } from './time'

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
