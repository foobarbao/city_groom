/**
 * Tests of the partner demo state: seeded conversations, quotes, toggles.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  awaitsAnswer,
  partnerState,
  reply,
  resetPartnerDemo,
  seedThreads,
  threadsOf,
  toggleReady,
  toggleStop,
} from './partnerState'

beforeEach(() => resetPartnerDemo())

describe('partner state', () => {
  it('seeds two conversations per merchant, one waiting for an answer', () => {
    seedThreads('demo-cordonnerie', 'shoe_repair')
    seedThreads('demo-cordonnerie', 'shoe_repair') // only once
    const threads = threadsOf('demo-cordonnerie')
    expect(threads).toHaveLength(2)
    expect(threads.filter(awaitsAnswer).map((t) => t.customer)).toEqual(['Camille R.'])
    expect(threads[0]?.messages[0]?.text).toContain('talon')
  })

  it('sends a quote that the simulated customer accepts', () => {
    vi.useFakeTimers()
    seedThreads('demo-cordonnerie', 'shoe_repair')
    const thread = threadsOf('demo-cordonnerie')[0]!
    reply(thread, 'Voici notre devis.', { label: 'Talons', priceCents: 1800, size: 'M' })
    expect(awaitsAnswer(thread)).toBe(false)
    vi.runAllTimers()
    expect(thread.messages.at(-2)?.quote?.status).toBe('accepted')
    expect(thread.messages.at(-1)?.simulated).toBe(true)
    vi.useRealTimers()
  })

  it('toggles ready items and done stops', () => {
    toggleReady('D-1')
    toggleStop('R-1', 'L-a')
    expect(partnerState.ready).toEqual(['D-1'])
    expect(partnerState.stopsDone['R-1']).toEqual(['L-a'])
    toggleReady('D-1')
    toggleStop('R-1', 'L-a')
    expect(partnerState.ready).toEqual([])
    expect(partnerState.stopsDone['R-1']).toEqual([])
  })
})
