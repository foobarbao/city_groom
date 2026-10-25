/**
 * Tests of the slot and consigne booking rules, in the Grenoble time zone.
 */
import type { Slot } from '@city-groom/demo-data'
import { describe, expect, it } from 'vitest'

import {
  bookingStatus,
  collectBy,
  currentSlot,
  pickupDeadline,
  pickupWindows,
  slotWindow,
  upcomingWindows,
} from './slots'
import { serviceDay, zonedTime } from './time'

const SLOTS: Slot[] = [
  { code: 'morning', label: 'Matinée', starts: '07:00', ends: '14:00' },
  { code: 'afternoon', label: 'Après-midi', starts: '14:00', ends: '20:00' },
  { code: 'evening', label: 'Soirée', starts: '20:00', ends: '07:00' },
]
const [MORNING, AFTERNOON, EVENING] = SLOTS as [Slot, Slot, Slot]

describe('time', () => {
  it('reads local times in Grenoble, summer and winter', () => {
    expect(zonedTime('2026-07-01', '14:00').toISOString()).toBe('2026-07-01T12:00:00.000Z')
    expect(zonedTime('2026-12-01', '14:00').toISOString()).toBe('2026-12-01T13:00:00.000Z')
    expect(serviceDay(new Date('2026-10-24T22:30:00Z'))).toBe('2026-10-25')
  })
})

describe('slots', () => {
  it('ends the evening slot the next morning, across a daylight-saving change', () => {
    // Winter time starts on 25 October 2026: 20:00 is UTC+2, 07:00 is UTC+1.
    const evening = slotWindow('2026-10-24', EVENING)
    expect(evening.start.toISOString()).toBe('2026-10-24T18:00:00.000Z')
    expect(evening.end.toISOString()).toBe('2026-10-25T06:00:00.000Z')
  })

  it('finds the current slot, including the evening started the day before', () => {
    expect(currentSlot(new Date('2026-10-24T10:00:00Z'), SLOTS)?.slot.code).toBe('morning') // 12:00
    expect(currentSlot(new Date('2026-10-24T13:00:00Z'), SLOTS)?.slot.code).toBe('afternoon')
    const night = currentSlot(new Date('2026-10-25T02:00:00Z'), SLOTS)
    expect(night?.slot.code).toBe('evening')
    expect(night?.day).toBe('2026-10-24')
  })

  it('needs at least 4 hours of notice to book', () => {
    const now = new Date('2026-10-24T08:00:00Z') // 10:00 in Grenoble
    expect(bookingStatus(now, slotWindow('2026-10-24', AFTERNOON), 4)).toBe('bookable') // in 4 h
    expect(bookingStatus(now, slotWindow('2026-10-24', MORNING), 4)).toBe('too_late') // started
    expect(bookingStatus(now, slotWindow('2026-10-23', EVENING), 4)).toBe('past')
    const later = new Date('2026-10-24T08:01:00Z')
    expect(bookingStatus(later, slotWindow('2026-10-24', AFTERNOON), 4)).toBe('too_late')
  })

  it('lists the next days with their status', () => {
    const windows = upcomingWindows(new Date('2026-10-24T08:00:00Z'), SLOTS, 4, 2)
    expect(windows).toHaveLength(6)
    expect(windows.map((w) => w.status)).toEqual([
      'too_late',
      'bookable',
      'bookable',
      'bookable',
      'bookable',
      'bookable',
    ])
  })

  it('offers the drop-off slot and the next ones within 24 hours for pickup', () => {
    // Morning slot of 20 October (summer time): 07:00 local = 05:00 UTC.
    const morning = slotWindow('2026-10-20', MORNING)
    const windows = pickupWindows(morning.start, SLOTS, 24)
    expect(windows.map((w) => `${w.day} ${w.slot.code}`)).toEqual([
      '2026-10-20 morning',
      '2026-10-20 afternoon',
      '2026-10-20 evening',
    ])
    // Immediate drop-off at 15:00: afternoon, evening, then the next morning and afternoon.
    const now = new Date('2026-10-20T13:00:00Z')
    expect(pickupWindows(now, SLOTS, 24).map((w) => w.slot.code)).toEqual([
      'afternoon',
      'evening',
      'morning',
      'afternoon',
    ])
  })

  it('collects by the end of the pickup slot, never later than 24 hours', () => {
    const dropOff = new Date('2026-10-20T13:00:00Z')
    const sameSlotEnd = new Date('2026-10-20T18:00:00Z')
    expect(collectBy(dropOff, sameSlotEnd, 24)).toEqual(sameSlotEnd)
    const nextAfternoonEnd = new Date('2026-10-21T18:00:00Z')
    expect(collectBy(dropOff, nextAfternoonEnd, 24).toISOString()).toBe('2026-10-21T13:00:00.000Z')
  })

  it('gives 24 hours to collect a stored item', () => {
    const dropOff = new Date('2026-10-24T08:00:00Z')
    expect(pickupDeadline(dropOff, 24).toISOString()).toBe('2026-10-25T08:00:00.000Z')
  })
})

describe('format', async () => {
  const { dayLabel, euros, clock } = await import('../utils/format')
  const labels = { today: 'Aujourd’hui', tomorrow: 'Demain' }

  it('formats prices and Grenoble times', () => {
    expect(euros(1750).replace(/\s/g, ' ')).toBe('17,50 €')
    expect(clock('2026-10-24T18:00:00Z')).toBe('20:00')
  })

  it('names today and tomorrow in Grenoble', () => {
    const now = new Date('2026-10-24T21:30:00Z') // 23:30 in Grenoble
    expect(dayLabel('2026-10-24', labels, now)).toBe('Aujourd’hui')
    expect(dayLabel(new Date('2026-10-24T22:30:00Z'), labels, now)).toBe('Demain')
    expect(dayLabel('2026-10-27', labels, now)).toBe('mar. 27 oct.')
  })
})
