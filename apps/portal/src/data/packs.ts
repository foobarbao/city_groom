/**
 * @file Weekly pack, operator side (docs/PRODUCT.md "Weekly pack").
 *
 * INTERNAL, never shown to customers: the pack is a traffic builder sold at
 * cost or below; CityPal dispatches the weekly volume to its partner
 * laundries according to the availability they declare, and announces each
 * of them a predictable volume for the month.
 *
 * DEMO: the active packs are fictitious (`DEMO_ACTIVE_PACKS`) plus the packs
 * bought in the customer app on this device (same site, shared storage).
 * PROD: the backend holds the packs, the declared availability and the
 * dispatch; laundries confirm the announced volume.
 */
import type { DemoPack } from '@city-groom/demo-data'

/** Service categories whose partners can process the pack. */
export const PACK_CATEGORIES = ['laundry', 'dry_cleaning']

/**
 * ASSUMPTION: availability declared by default, in shirts per week, until a
 * laundry sets its own (placeholder, to agree with each partner).
 */
export const DEFAULT_CAPACITY_SHIRTS = 40

/** ASSUMPTION: fictitious number of active packs in the demo. */
export const DEMO_ACTIVE_PACKS = 18

/** Weekly quantities of one pack. */
export function packQuantities(pack: DemoPack): { shirts: number; trousers: number } {
  const qty = (service: string): number =>
    pack.items.find((i) => i.service === service)?.quantity ?? 0
  return { shirts: qty('shirt_ironing'), trousers: qty('trouser_ironing') }
}

/** A laundry and the weekly shirts it can take for the packs. */
export interface LaundryCapacity {
  code: string
  name: string
  capacityShirts: number
}

/** Weekly share of the packs given to one laundry. */
export interface PackAllocation extends LaundryCapacity {
  packs: number
  shirts: number
  trousers: number
}

/**
 * Dispatches whole packs to laundries by availability: each pack goes to the
 * laundry with the most free capacity left (ties: list order), so the load
 * stays balanced relative to what each declared. A pack is never split
 * between laundries (one customer, one laundry each week).
 *
 * @returns The share of each laundry and the packs no laundry could take.
 */
export function allocatePacks(
  activePacks: number,
  laundries: LaundryCapacity[],
  perPack: { shirts: number; trousers: number },
): { allocations: PackAllocation[]; unallocated: number } {
  const allocations = laundries.map((l) => ({ ...l, packs: 0, shirts: 0, trousers: 0 }))
  let unallocated = 0
  for (let i = 0; i < activePacks; i++) {
    let best: PackAllocation | undefined
    for (const a of allocations) {
      const free = a.capacityShirts - a.shirts
      if (free >= perPack.shirts && (!best || free > best.capacityShirts - best.shirts)) best = a
    }
    if (!best) {
      unallocated += 1
      continue
    }
    best.packs += 1
    best.shirts += perPack.shirts
    best.trousers += perPack.trousers
  }
  return { allocations, unallocated }
}

/**
 * Packs bought in the customer app on this device and still running (DEMO:
 * the two apps share the browser storage of the demo site).
 */
export function packsBoughtOnDevice(now: Date = new Date()): number {
  try {
    const raw = localStorage.getItem('citypal-demo-v1')
    if (!raw) return 0
    const state = JSON.parse(raw) as {
      packs?: { orderIds: string[] }[]
      orders?: { id: string; returnAt?: string }[]
    }
    return (state.packs ?? []).filter((p) => {
      const last = state.orders?.find((o) => o.id === p.orderIds[p.orderIds.length - 1])
      return last?.returnAt !== undefined && new Date(last.returnAt) > now
    }).length
  } catch {
    return 0 // storage unavailable or unreadable: count the fictitious packs only
  }
}
