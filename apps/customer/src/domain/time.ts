/**
 * @file Dates and times in the service time zone (Grenoble).
 *
 * Rounds, slots and deadlines are defined in local time in Grenoble
 * (docs/PRODUCT.md §4), whatever the time zone of the customer's device.
 */

/** Time zone of the service area. */
export const SERVICE_TIME_ZONE = 'Europe/Paris'

const PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: SERVICE_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

/** Offset of Grenoble's local time from UTC at an instant, in minutes. */
function offsetMinutes(at: Date): number {
  const parts = PARTS.formatToParts(at)
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000)
}

/**
 * Instant of a local time in Grenoble.
 *
 * @param day - Local date, "YYYY-MM-DD".
 * @param time - Local time, "HH:MM".
 */
export function zonedTime(day: string, time: string): Date {
  const [year, month, date] = day.split('-').map(Number) as [number, number, number]
  const [hours, minutes] = time.split(':').map(Number) as [number, number]
  const guess = Date.UTC(year, month - 1, date, hours, minutes)
  // The offset depends on the instant itself (daylight saving): refine once.
  let result = new Date(guess - offsetMinutes(new Date(guess)) * 60000)
  result = new Date(guess - offsetMinutes(result) * 60000)
  return result
}

/** Local date in Grenoble of an instant, "YYYY-MM-DD". */
export function serviceDay(at: Date): string {
  return at.toLocaleDateString('sv-SE', { timeZone: SERVICE_TIME_ZONE })
}

/** Date `days` days after `day` ("YYYY-MM-DD"). */
export function addDays(day: string, days: number): string {
  const [year, month, date] = day.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(year, month - 1, date + days)).toISOString().slice(0, 10)
}

const HOUR_MS = 3600 * 1000

/** Instant `hours` hours after `at`. */
export const addHours = (at: Date, hours: number): Date => new Date(at.getTime() + hours * HOUR_MS)
