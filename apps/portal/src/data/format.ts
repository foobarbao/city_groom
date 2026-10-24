/**
 * @file French formatting helpers for amounts, numbers and dates.
 *
 * Dates and times are shown in the time zone of the service (Grenoble), not
 * the device's: a round at 20:00 is at 20:00 for every partner.
 */

/** Time zone of the service area (Grenoble). */
export const SERVICE_TIME_ZONE = 'Europe/Paris'

const EURO = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const EURO_ROUND = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const NUMBER = new Intl.NumberFormat('fr-FR')
const PERCENT = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 })
const DAY = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  timeZone: SERVICE_TIME_ZONE,
})
const DAY_LONG = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const TIME = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: SERVICE_TIME_ZONE,
})

/** "2026-10-24": calendar day of an instant in the service time zone. */
export const serviceDay = (date: Date): string =>
  date.toLocaleDateString('sv-SE', { timeZone: SERVICE_TIME_ZONE })

/** "12,50 €" */
export const euros = (value: number): string => EURO.format(value)
/** "1 250 €" (no cents, for totals and chart axes) */
export const eurosRounded = (value: number): string => EURO_ROUND.format(value)
/** "1 250" */
export const number = (value: number): string => NUMBER.format(value)
/** "42 %" from a ratio between 0 and 1 */
export const percent = (ratio: number): string => PERCENT.format(ratio)
/** "ven. 24" from an ISO date or datetime */
export const shortDay = (iso: string): string =>
  // A bare date is read at noon UTC, which is the same day in the service zone.
  DAY.format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso))
/** "vendredi 24 octobre" */
export const longDay = (iso: string): string => DAY_LONG.format(new Date(iso))
/** "08:00" */
export const clock = (iso: string): string => TIME.format(new Date(iso))
