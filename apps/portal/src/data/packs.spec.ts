/**
 * Tests of the weekly pack dispatch.
 */
import { describe, expect, it } from 'vitest'

import { allocatePacks, packsBoughtOnDevice } from './packs'

const perPack = { shirts: 5, trousers: 2 }

describe('weekly pack dispatch', () => {
  it('balances packs by free capacity and never splits a pack', () => {
    const { allocations, unallocated } = allocatePacks(
      6,
      [
        { code: 'a', name: 'A', capacityShirts: 40 },
        { code: 'b', name: 'B', capacityShirts: 20 },
      ],
      perPack,
    )
    expect(unallocated).toBe(0)
    expect(allocations.map((a) => a.packs)).toEqual([5, 1])
    expect(allocations.every((a) => a.shirts === a.packs * 5 && a.trousers === a.packs * 2)).toBe(
      true,
    )
  })

  it('reports what no laundry can take', () => {
    const { allocations, unallocated } = allocatePacks(
      3,
      [{ code: 'a', name: 'A', capacityShirts: 12 }],
      perPack,
    )
    expect(allocations[0]?.packs).toBe(2)
    expect(unallocated).toBe(1)
  })

  it('counts running packs bought on this device', () => {
    localStorage.setItem(
      'citypal-demo-v1',
      JSON.stringify({
        packs: [{ orderIds: ['c1', 'c2'] }, { orderIds: ['c3'] }],
        orders: [
          { id: 'c2', returnAt: '2026-11-20T06:00:00Z' },
          { id: 'c3', returnAt: '2026-10-01T06:00:00Z' },
        ],
      }),
    )
    expect(packsBoughtOnDevice(new Date('2026-10-25T12:00:00Z'))).toBe(1)
    localStorage.removeItem('citypal-demo-v1')
  })
})
