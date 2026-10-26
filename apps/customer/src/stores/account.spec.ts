/**
 * Tests of the customer state: bookings, orders, reviews, simulated replies.
 */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccountStore } from './account'

vi.mock('../api/auth', () => ({
  signOutFromApi: vi.fn(() => Promise.resolve()),
  updateAnnouncements: vi.fn(() => Promise.resolve()),
  registerInterest: vi.fn(() => Promise.resolve({ interests: ['scooter_lockers'] })),
  withdrawInterest: vi.fn(() => Promise.resolve({ interests: [] })),
}))

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('account store', () => {
  it('signs in with Google, then signs out on the server too', async () => {
    const { signOutFromApi } = await import('../api/auth')
    const store = useAccountStore()
    store.signInWithGoogle({
      token: 'tok',
      created: true,
      user: {
        id: 1,
        email: 'camille@example.com',
        first_name: 'Camille',
        last_name: 'Martin',
        picture_url: 'https://lh3.googleusercontent.com/a/x',
        date_joined: '2026-10-25T10:00:00Z',
        signed_in_with_google: true,
        announcements: true,
        interests: ['scooter_lockers'],
      },
    })
    expect(store.state.signedIn).toBe(true)
    expect(store.state.google?.announcements).toBe(true)
    expect(store.hasInterest('scooter_lockers')).toBe(true)
    expect(store.state.name).toBe('Camille')
    expect(store.state.google?.email).toBe('camille@example.com')

    store.signOut()
    expect(signOutFromApi).toHaveBeenCalledWith('tok')
    expect(store.state.signedIn).toBe(false)
    expect(store.state.google).toBeNull()
  })

  it('records the announcement choice on the server when signed in with Google', async () => {
    const { updateAnnouncements } = await import('../api/auth')
    const store = useAccountStore()
    store.signInWithGoogleDemo({ email: 'a@example.com', firstName: 'Ana', pictureUrl: '' })
    expect(store.state.google?.announcements).toBe(false)

    await store.setAnnouncements(true)
    // Demo session without a token: kept on the device only.
    expect(updateAnnouncements).not.toHaveBeenCalled()
    expect(store.state.google?.announcements).toBe(true)

    store.state.google = { ...store.state.google!, token: 'tok' }
    await store.setAnnouncements(false)
    expect(updateAnnouncements).toHaveBeenCalledWith('tok', false)
    expect(store.state.google?.announcements).toBe(false)
  })

  it('records "Ça m\'intéresse" on the server when signed in with Google, else on the device', async () => {
    const { registerInterest, withdrawInterest } = await import('../api/auth')
    const store = useAccountStore()
    await store.setInterest('scooter_lockers', true)
    // Guests cannot register an interest.
    expect(store.hasInterest('scooter_lockers')).toBe(false)

    store.signIn('Ana')
    await store.setInterest('scooter_lockers', true)
    expect(registerInterest).not.toHaveBeenCalled()
    expect(store.hasInterest('scooter_lockers')).toBe(true)

    store.signInWithGoogleDemo({ email: 'a@example.com', firstName: 'Ana', pictureUrl: '' })
    store.state.google = { ...store.state.google!, token: 'tok' }
    await store.setInterest('scooter_lockers', true)
    expect(registerInterest).toHaveBeenCalledWith('tok', 'scooter_lockers')
    await store.setInterest('scooter_lockers', false)
    expect(withdrawInterest).toHaveBeenCalledWith('tok', 'scooter_lockers')
    expect(store.hasInterest('scooter_lockers')).toBe(false)

    await store.setInterest('scooter_lockers', true)
    store.signOut()
    expect(store.hasInterest('scooter_lockers')).toBe(false)
  })

  it('starts from the demo seed with orders to review and a pending quote', () => {
    const store = useAccountStore()
    expect(store.state.orders.filter((o) => o.status === 'picked_up')).toHaveLength(2)
    expect(store.pendingQuotes).toHaveLength(1)
  })

  it('buys a weekly pack as one purchase and four weekly orders', () => {
    const store = useAccountStore()
    expect(store.hasBoughtPack('weekly_shirts')).toBe(false)
    const week = (n: number) => ({
      week: n,
      dropFrom: new Date(`2026-11-0${n}T19:00:00Z`),
      dropBy: new Date(`2026-11-0${n + 1}T06:00:00Z`),
      returnAt: new Date(`2026-11-0${n + 1}T19:00:00Z`),
    })
    const id = store.buyPack(
      {
        packCode: 'weekly_shirts',
        weeklyCents: 1000,
        totalCents: 4000,
        welcome: true,
        plan: 'free',
        dropLocker: 'l',
        pickupLocker: 'l',
        weekday: 5,
        slotCode: 'evening',
      },
      [week(1), week(2), week(3), week(4)],
      { label: 'Pack semaine', quantity: 7, size: 'XL', shopCode: 'citypal' },
    )
    const purchase = store.state.packs?.[0]
    expect(purchase?.id).toBe(id)
    expect(purchase?.orderIds).toHaveLength(4)
    const orders = store.state.orders.filter((o) => o.packId === id)
    expect(orders.map((o) => o.packWeek).sort()).toEqual([1, 2, 3, 4])
    expect(orders.every((o) => o.status === 'awaiting_drop_off' && o.priceCents === 1000)).toBe(
      true,
    )
    expect(store.hasBoughtPack('weekly_shirts')).toBe(true)
  })

  it('schedules sport exchanges: clean items to collect after a first drop-off', () => {
    const store = useAccountStore()
    const exchange = {
      label: 'Swap Sport',
      priceCents: 700,
      size: 'XL',
      shopCode: 'citypal',
      lockerCode: 'l',
      slotStart: new Date('2026-10-27T17:00:00Z'),
      slotEnd: new Date('2026-10-27T19:00:00Z'),
    }
    const first = store.addExchange(exchange)
    expect(store.state.orders.find((o) => o.id === first)?.collectsClean).toBe(false)
    store.markOrderDropped(first)
    const second = store.addExchange(exchange)
    const order = store.state.orders.find((o) => o.id === second)
    expect(order?.collectsClean).toBe(true)
    expect(order?.pickupLocker).toBe('l')
    expect(order?.pickupStart).toBe(order?.dropFrom)
  })

  it('records an order drop-off once, with its door and time', () => {
    const store = useAccountStore()
    const id = store.addOrder({
      shopCode: 'demo-pressing',
      label: 'Repassage chemise',
      quantity: 1,
      priceCents: 350,
      size: 'M',
      dropLocker: 'l',
      pickupLocker: 'l',
      door: 'B4',
    })
    store.markOrderDropped(id)
    const order = store.state.orders.find((o) => o.id === id)
    expect(order?.status).toBe('in_locker')
    expect(order?.door).toBe('B4')
    const droppedAt = order?.droppedAt
    expect(droppedAt).toBeTruthy()
    store.markOrderDropped(id) // a second confirmation changes nothing
    expect(order?.droppedAt).toBe(droppedAt)
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

  it('records one transfer per booking and counts the included ones', () => {
    const store = useAccountStore()
    const id = store.addBooking({
      lockerCode: 'a',
      size: 'L',
      mode: 'now',
      slotCode: null,
      slotStart: '',
      slotEnd: '',
      door: 'A1',
      priceCents: 400,
      droppedAt: null,
    })
    const transfer = { toLocker: 'b', roundAt: '', door: 'B1', priceCents: 0, included: true }
    store.requestTransfer(id, transfer)
    store.requestTransfer(id, { ...transfer, toLocker: 'c' })
    expect(store.state.bookings[0]?.transfer?.toLocker).toBe('b')
    expect(store.transfersUsedThisMonth).toBe(1)
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
