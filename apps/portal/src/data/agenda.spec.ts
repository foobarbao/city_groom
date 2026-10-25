/**
 * Tests of the merchant planning and its calendar export.
 */
import type { DemoOrder } from '@city-groom/demo-data'
import { describe, expect, it } from 'vitest'

import { buildAgenda, tasksOfDay } from './agenda'
import { googleCalendarUrl, icsDate, outlookCalendarUrl, toIcs } from './calendarExport'

function order(overrides: Partial<DemoOrder>): DemoOrder {
  return {
    id: 'D-1',
    merchant: 'm',
    service: 'shirt_ironing',
    items: 2,
    size: 'XL',
    price_total: '7.00',
    commission: '0.70',
    drop_locker: 'a',
    pickup_locker: 'a',
    created_at: '2026-10-25T09:00:00+01:00',
    deposited_at: '2026-10-25T10:00:00+01:00',
    collected_at: '2026-10-25T14:00:00+01:00',
    returned_at: '2026-10-26T14:00:00+01:00',
    picked_up_at: null,
    late_pickup: false,
    status: 'at_merchant',
    ...overrides,
  }
}

const FROM = new Date('2026-10-25T00:00:00+01:00')
const TO = new Date('2026-10-28T00:00:00+01:00')

describe('buildAgenda', () => {
  it('groups arrivals and handovers per round and adds one work task per order', () => {
    const tasks = buildAgenda([order({ id: 'D-1' }), order({ id: 'D-2', items: 1 })], FROM, TO)
    expect(tasks.map((t) => `${t.kind}:${t.orders.length}`)).toEqual([
      'arrival:2',
      'work:1',
      'work:1',
      'handover:2',
    ])
    expect(tasksOfDay(tasks, '2026-10-26', 'Europe/Paris').map((t) => t.kind)).toEqual([
      'work',
      'work',
      'handover',
    ])
  })

  it('leaves out what happens outside the period', () => {
    const tasks = buildAgenda([order({ collected_at: '2026-10-20T14:00:00+02:00' })], FROM, TO)
    expect(tasks.map((t) => t.kind)).toEqual(['work', 'handover'])
  })
})

describe('calendar export', () => {
  const event = {
    uid: 'handover-1',
    start: new Date('2026-10-26T13:00:00Z'),
    end: new Date('2026-10-26T13:15:00Z'),
    title: 'Remise au coursier, 3 articles',
    description: 'D-1; D-2\nPréparer sur cintre',
  }

  it('writes a valid iCalendar document', () => {
    const ics = toIcs([event], new Date('2026-10-25T08:00:00Z'))
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(ics).toContain('DTSTART:20261026T130000Z\r\nDTEND:20261026T131500Z')
    expect(ics).toContain('SUMMARY:Remise au coursier\\, 3 articles')
    expect(ics).toContain('DESCRIPTION:D-1\\; D-2\\nPréparer sur cintre')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('builds a Google Agenda link in UTC', () => {
    expect(icsDate(event.start)).toBe('20261026T130000Z')
    const url = new URL(googleCalendarUrl(event))
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
    expect(url.searchParams.get('dates')).toBe('20261026T130000Z/20261026T131500Z')
  })

  it('builds an Outlook link in UTC', () => {
    const url = new URL(outlookCalendarUrl(event))
    expect(url.host).toBe('outlook.live.com')
    expect(url.searchParams.get('rru')).toBe('addevent')
    expect(url.searchParams.get('startdt')).toBe('2026-10-26T13:00:00Z')
    expect(url.searchParams.get('enddt')).toBe('2026-10-26T13:15:00Z')
    expect(url.searchParams.get('subject')).toBe(event.title)
  })
})
