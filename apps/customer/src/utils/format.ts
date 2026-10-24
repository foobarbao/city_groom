/**
 * @file French formats for prices and dates. Dates are shown in Grenoble time
 * (`SERVICE_TIME_ZONE`), whatever the device's time zone.
 */
import { SERVICE_TIME_ZONE, addDays, serviceDay } from '../domain/time'

const EURO = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const DAY = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: SERVICE_TIME_ZONE,
})
const CLOCK = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: SERVICE_TIME_ZONE,
})

/** 1750 → "17,50 €" */
export const euros = (cents: number): string => EURO.format(cents / 100)

/** "14:00" */
export const clock = (at: Date | string): string => CLOCK.format(new Date(at))

/**
 * "Aujourd’hui", "Demain" or "sam. 25 oct." for a local date or an instant.
 *
 * @param labels - Translated words for today and tomorrow.
 */
export function dayLabel(
  at: Date | string,
  labels: { today: string; tomorrow: string },
  now: Date = new Date(),
): string {
  const day = typeof at === 'string' && at.length === 10 ? at : serviceDay(new Date(at))
  const today = serviceDay(now)
  if (day === today) return labels.today
  if (day === addDays(today, 1)) return labels.tomorrow
  // A bare date is read at noon UTC, which is the same day in Grenoble.
  return DAY.format(new Date(`${day}T12:00:00Z`))
}

/** "sam. 25 oct. à 14:00" */
export const dateTime = (at: Date | string, labels: { today: string; tomorrow: string }): string =>
  `${dayLabel(at, labels)} à ${clock(at)}`
