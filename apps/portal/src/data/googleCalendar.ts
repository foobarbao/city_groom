/**
 * @file Synchronisation of the merchant planning with Google Agenda, through
 * the Google Calendar API (v3), called from the browser.
 *
 * The project owner asked on 2026-10-25 for a real sync with Google Agenda,
 * not an .ics import (ADR-0009, option 4 for Google). How it works:
 *
 * - the merchant connects once; Google asks for the narrowest permission that
 *   fits, `calendar.app.created`: CityPal may create its own calendars and
 *   manage their events, and sees nothing else in the merchant's agenda;
 * - CityPal creates a "CityPal" calendar in the merchant's Google Agenda and
 *   writes every task in it; tasks marked done show "✓";
 * - each task always has the same event ID (derived from the task), so a sync
 *   updates events instead of duplicating them: insert, and on 409 (ID
 *   already used) update.
 *
 * DEMO: the access token comes from Google Identity Services in the browser
 * (token model, no backend) and lasts about an hour; the sync runs when the
 * merchant opens the planning or ticks a task. PROD: sync from the backend
 * with a refresh token (offline access), so changes reach Google Agenda even
 * when the portal is closed; plus removal of cancelled tasks.
 */
import type { CalendarEvent } from './calendarExport'

/** Base URL of the Google Calendar API. */
export const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'
/** Narrowest scope allowing CityPal to create and fill its own calendar. */
export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created'

/** The Google Calendar API answered with an error status. */
export class GoogleCalendarError extends Error {
  constructor(readonly status: number) {
    super(`Google Calendar API error ${status}`)
    this.name = 'GoogleCalendarError'
  }
}

/**
 * Stable event ID of a task. Google accepts IDs made of base32hex characters
 * (a–v, 0–9), 5 to 1024 long: the hexadecimal UTF-8 encoding of
 * "<merchant>/<task>" uses only 0–9 and a–f, so it always fits.
 */
export function eventId(merchant: string, taskId: string): string {
  const bytes = new TextEncoder().encode(`${merchant}/${taskId}`)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Google event body of a planning task. */
export function toGoogleEvent(
  event: CalendarEvent,
  done: boolean,
  timeZone: string,
): Record<string, unknown> {
  return {
    summary: `${done ? '✓ ' : ''}${event.title}`,
    description: event.description,
    start: { dateTime: event.start.toISOString(), timeZone },
    end: { dateTime: event.end.toISOString(), timeZone },
  }
}

async function call(
  token: string,
  method: 'POST' | 'PUT',
  path: string,
  body: unknown,
): Promise<Response> {
  const response = await fetch(`${CALENDAR_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response
}

/**
 * Creates the "CityPal" calendar in the merchant's Google Agenda.
 *
 * @returns The ID of the new calendar.
 * @throws {GoogleCalendarError} If Google refuses the request.
 */
export async function createCalendar(
  token: string,
  summary: string,
  timeZone: string,
): Promise<string> {
  const response = await call(token, 'POST', '/calendars', { summary, timeZone })
  if (!response.ok) throw new GoogleCalendarError(response.status)
  return ((await response.json()) as { id: string }).id
}

/**
 * Creates or updates one event: insert with its stable ID, update if the ID
 * already exists (409).
 *
 * @throws {GoogleCalendarError} If Google refuses the request; status 404 or
 *   403 means the calendar is gone (deleted by the merchant) or not ours.
 */
export async function upsertEvent(
  token: string,
  calendarId: string,
  id: string,
  body: Record<string, unknown>,
): Promise<void> {
  const base = `/calendars/${encodeURIComponent(calendarId)}/events`
  let response = await call(token, 'POST', base, { ...body, id })
  if (response.status === 409) {
    response = await call(token, 'PUT', `${base}/${id}`, body)
  }
  if (!response.ok) throw new GoogleCalendarError(response.status)
}
