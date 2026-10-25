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
  toggleTask,
  isTaskDone,
  toggleStop,
  setWebhook,
  webhookOf,
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

  it('marks planning tasks done; a handover marks its items ready', () => {
    toggleTask('handover-x', ['D-1', 'D-2'])
    expect(isTaskDone('handover-x')).toBe(true)
    expect(partnerState.ready).toEqual(['D-1', 'D-2'])
    toggleTask('handover-x')
    expect(isTaskDone('handover-x')).toBe(false)
  })

  it('stores and clears a merchant webhook address', () => {
    setWebhook('m', 'https://hooks.example.com/abc')
    expect(webhookOf('m')).toBe('https://hooks.example.com/abc')
    setWebhook('m', '')
    expect(webhookOf('m')).toBe('')
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
