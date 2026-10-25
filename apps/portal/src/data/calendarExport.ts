/**
 * @file Calendar export of the merchant planning.
 *
 * - `.ics` file (iCalendar, RFC 5545): imported by Google Agenda, Apple
 *   Calendar, Outlook… (one-off import of the shown period).
 * - "Ajouter à Google Agenda" link for one entry. This URL format is not
 *   officially documented by Google; it follows community documentation
 *   (InteractionDesignFoundation/add-event-to-calendar-docs). Times are
 *   given in UTC ("Z") to avoid any time-zone ambiguity.
 *
 * PROD: a live subscription (iCal feed served by the API, or the Google
 * Calendar API with the merchant's consent) keeps the agenda in sync; it
 * needs a backend endpoint and a decision record.
 */

/** A calendar entry. */
export interface CalendarEvent {
  uid: string
  start: Date
  end: Date
  title: string
  description: string
}

/** 2026-10-25T13:00:00.000Z → 20261025T130000Z */
export const icsDate = (d: Date): string =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

/** Escapes text values (RFC 5545 §3.3.11). */
const escapeText = (text: string): string =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** Folds lines longer than 75 octets (RFC 5545 §3.1), here by characters. */
function fold(line: string): string {
  const parts: string[] = []
  for (let i = 0; i < line.length; i += 73) parts.push((i ? ' ' : '') + line.slice(i, i + 73))
  return parts.join('\r\n')
}

/** iCalendar document with one VEVENT per entry, CRLF line endings. */
export function toIcs(events: CalendarEvent[], now: Date = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CityPal//Planning commerçant//FR',
    'CALSCALE:GREGORIAN',
  ]
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@citypal`,
      `DTSTAMP:${icsDate(now)}`,
      `DTSTART:${icsDate(e.start)}`,
      `DTEND:${icsDate(e.end)}`,
      fold(`SUMMARY:${escapeText(e.title)}`),
      fold(`DESCRIPTION:${escapeText(e.description)}`),
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return `${lines.join('\r\n')}\r\n`
}

/** "Ajouter à Google Agenda" link for one entry (see the file comment). */
export function googleCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${icsDate(e.start)}/${icsDate(e.end)}`,
    details: e.description,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** 2026-10-25T13:00:00.000Z → 2026-10-25T13:00:00Z */
const isoSeconds = (d: Date): string => d.toISOString().replace(/\.\d{3}/, '')

/**
 * "Ajouter à Outlook" link (Outlook.com) for one entry. Not officially
 * documented by Microsoft either; same community documentation as above,
 * re-tested there on Outlook.com in August 2026. ASSUMPTION: the Microsoft 365
 * host (outlook.office.com) accepts the same query but was not re-tested, so
 * it is not offered; Microsoft 365 users import the .ics file instead.
 */
export function outlookCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    startdt: isoSeconds(e.start),
    enddt: isoSeconds(e.end),
    subject: e.title,
    body: e.description,
  })
  return `https://outlook.live.com/calendar/deeplink/compose?${params.toString()}`
}
