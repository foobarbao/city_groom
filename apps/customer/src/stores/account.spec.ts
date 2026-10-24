/**
 * Tests of the customer state: bookings, orders, reviews, simulated replies.
 */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccountStore } from './account'

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('account store', () => {
  it('starts from the demo seed with orders to review and a pending quote', () => {
    const store = useAccountStore()
    expect(store.state.orders.filter((o) => o.status === 'picked_up')).toHaveLength(2)
    expect(store.pendingQuotes).toHaveLength(1)
  })

  it('follows a consigne booking from booked to collected', () => {
    const store = useAccountStore()
    const id = store.addBooking({
      lockerCode: 'l',
      size: 'L',
      mode: 'now',
      slotCode: null,
      slotStart: '',
      slotEnd: '',
      door: 'A1',
      priceCents: 400,
      droppedAt: null,
    })
    store.markDropped(id)
    expect(store.state.bookings[0]?.droppedAt).not.toBeNull()
    store.markCollected(id)
    expect(store.state.bookings[0]?.status).toBe('collected')
    expect(store.activeBookings).toHaveLength(0)
  })

  it('accepts one review per order', () => {
    const store = useAccountStore()
    store.addReview({ orderId: 'C-1001', shopCode: 'demo-pressing', rating: 5, comment: '' })
    store.addReview({ orderId: 'C-1001', shopCode: 'demo-pressing', rating: 1, comment: '' })
    expect(store.state.reviews).toHaveLength(1)
    expect(store.reviewedOrderIds.has('C-1001')).toBe(true)
  })

  it('subscribes only when signed in', () => {
    const store = useAccountStore()
    store.choosePlan('plus')
    expect(store.state.plan).toBe('free')
    store.signIn('Léa')
    store.choosePlan('plus')
    expect(store.state.plan).toBe('plus')
  })

  it('simulates a merchant quote when a price is asked', () => {
    vi.useFakeTimers()
    const store = useAccountStore()
    store.sendMessage('demo-cordonnerie', 'Quel est le prix pour ressemeler ?', null)
    vi.runAllTimers()
    const messages = store.state.conversations['demo-cordonnerie'] ?? []
    expect(messages.map((m) => m.from)).toEqual(['customer', 'merchant'])
    expect(messages[1]?.simulated).toBe(true)
    expect(store.pendingQuotes).toHaveLength(2)
    vi.useRealTimers()
  })
})
