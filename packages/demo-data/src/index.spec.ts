import { describe, expect, it } from 'vitest'

import { activityData, rebaseActivity, type ActivityData } from './index'

const sample = {
  generated_at: '2026-10-24T18:00:00+02:00',
  orders: [
    {
      created_at: '2026-10-24T09:00:00+02:00',
      deposited_at: '2026-10-24T10:00:00+02:00',
      collected_at: null,
      returned_at: null,
      picked_up_at: null,
    },
  ],
  rounds: [{ starts_at: '2026-10-24T20:00:00+02:00' }],
  daily: [{ date: '2026-10-24' }],
  forecast: [{ date: '2026-10-25' }],
} as unknown as ActivityData

describe('rebaseActivity', () => {
  it('moves every date by whole days to today', () => {
    const rebased = rebaseActivity(sample, new Date(2026, 10, 3, 9))

    expect(rebased.daily[0]?.date).toBe('2026-11-03')
    expect(rebased.forecast[0]?.date).toBe('2026-11-04')
    expect(new Date(rebased.orders[0]!.created_at).getTime()).toBe(
      new Date('2026-11-03T09:00:00+02:00').getTime(),
    )
    expect(rebased.orders[0]?.collected_at).toBeNull()
  })

  it('returns the activity unchanged on its reference day', () => {
    expect(rebaseActivity(sample, new Date(2026, 9, 24, 23))).toBe(sample)
  })
})

describe('activityData', () => {
  it('is flagged as fictitious', () => {
    expect(activityData.fictitious).toBe(true)
  })
})
