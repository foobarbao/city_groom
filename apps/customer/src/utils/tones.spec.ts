/**
 * Tests of status and category tones.
 */
import { describe, expect, it } from 'vitest'

import { categoryTone, statusTone } from './tones'

describe('tones', () => {
  it('gives each step of an order its own tone', () => {
    const steps = ['awaiting_drop_off', 'in_locker', 'at_merchant', 'ready_for_pickup', 'picked_up']
    expect(new Set(steps.map(statusTone)).size).toBe(steps.length)
  })

  it('cycles category tones', () => {
    expect(categoryTone(0)).toBe('leaf')
    expect(categoryTone(5)).toBe('leaf')
  })
})
