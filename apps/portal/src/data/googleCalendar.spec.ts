/**
 * Tests of the Google Agenda sync helpers (the Google API is mocked).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { eventId, toGoogleEvent, upsertEvent } from './googleCalendar'

afterEach(() => vi.unstubAllGlobals())

const event = {
  uid: 'u',
  start: new Date('2026-10-26T13:00:00Z'),
  end: new Date('2026-10-26T13:15:00Z'),
  title: 'CityPal · À remettre au coursier : 3 articles',
  description: 'D-1 · 3 × Repassage chemise (M)',
}

describe('google calendar sync', () => {
  it('derives stable event ids that Google accepts (base32hex, 5 to 1024 chars)', () => {
    const id = eventId('demo-pressing', 'handover-2026-10-26T13:00:00.000Z')
    expect(id).toMatch(/^[a-v0-9]{5,1024}$/)
    expect(eventId('demo-pressing', 'handover-2026-10-26T13:00:00.000Z')).toBe(id)
    expect(eventId('demo-pressing', 'work-D-1')).not.toBe(id)
  })

  it('marks done tasks with a check in the event title', () => {
    const body = toGoogleEvent(event, true, 'Europe/Paris')
    expect(body.summary).toBe('✓ CityPal · À remettre au coursier : 3 articles')
    expect(body.start).toEqual({ dateTime: '2026-10-26T13:00:00.000Z', timeZone: 'Europe/Paris' })
  })

  it('inserts, and updates when the event already exists', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 409 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await upsertEvent('tok', 'cal@group', 'abc12', { summary: 'x' })

    const [insertUrl, insert] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(insertUrl).toBe('https://www.googleapis.com/calendar/v3/calendars/cal%40group/events')
    expect(insert.method).toBe('POST')
    expect(JSON.parse(insert.body as string)).toEqual({ summary: 'x', id: 'abc12' })
    const [updateUrl, update] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(updateUrl).toMatch(/\/events\/abc12$/)
    expect(update.method).toBe('PUT')
    expect((update.headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })

  it('reports a deleted calendar as an error with its status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))
    await expect(upsertEvent('tok', 'gone', 'abc12', {})).rejects.toMatchObject({ status: 404 })
  })
})
