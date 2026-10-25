/**
 * @file Round sheet of a courier: the stops of one round in visiting order,
 * with what to pick up and drop off at each one.
 *
 * Order of a round (cargo bike from the city centre):
 * 1. merchants with items ready to go back to customers (pick up);
 * 2. lockers: deliver returned items, collect new items, move consigne
 *    items (a transfer's origin is visited before its destination);
 * 3. merchants receiving the collected items (drop off).
 * Within each phase, the next stop is the nearest one (heuristic, not an
 * optimised itinerary).
 *
 * PROD: rounds and stops come from the API (route planning on real streets).
 */
import type { DemoOrder, DemoTransfer } from '@city-groom/demo-data'

/** One thing to do at a stop. */
export interface Task {
  kind: 'pickup' | 'dropoff'
  /** Order or transfer id. */
  ref: string
  /** Number of items (1 for a consigne transfer). */
  items: number
  size: string
  /** Order service code, or "consigne" for a transfer. */
  what: string
  /** Where the items go next, or come from (locker or merchant code). */
  other: string
}

/** One stop of the round. */
export interface Stop {
  key: string
  type: 'locker' | 'merchant'
  code: string
  tasks: Task[]
}

type Position = [number, number]

function distance2(a: Position, b: Position): number {
  const dx = (a[0] - b[0]) * Math.cos((45.19 * Math.PI) / 180)
  const dy = a[1] - b[1]
  return dx * dx + dy * dy
}

/** Nearest-neighbour order; a stop waits until `ready(stop, visited)` is true when possible. */
function orderStops(
  stops: Stop[],
  start: Position,
  position: (stop: Stop) => Position,
  ready: (stop: Stop, visited: Set<string>) => boolean = () => true,
): Stop[] {
  const left = [...stops]
  const ordered: Stop[] = []
  const visited = new Set<string>()
  let current = start
  while (left.length) {
    const candidates = left.filter((s) => ready(s, visited))
    // A cycle of transfers cannot be satisfied: fall back to the nearest stop.
    const pool = candidates.length ? candidates : left
    const next = pool.reduce((best, s) =>
      distance2(position(s), current) < distance2(position(best), current) ? s : best,
    )
    left.splice(left.indexOf(next), 1)
    ordered.push(next)
    visited.add(next.code)
    current = position(next)
  }
  return ordered
}

/**
 * Builds the round sheet of the round starting at `roundAt`.
 *
 * @param orders - Orders of the activity (collected or returned at rounds).
 * @param transfers - Consigne transfers of the activity.
 * @param roundAt - ISO start of the round.
 * @param positions - [longitude, latitude] of every locker and merchant.
 * @param start - Where the round starts (city centre).
 */
export function buildRoundSheet(
  orders: DemoOrder[],
  transfers: DemoTransfer[],
  roundAt: string,
  positions: Record<string, Position>,
  start: Position,
): Stop[] {
  const at = (iso: string | null): boolean =>
    iso !== null && new Date(iso).getTime() === new Date(roundAt).getTime()
  const collected = orders.filter((o) => at(o.collected_at))
  const returned = orders.filter((o) => at(o.returned_at))
  const moved = transfers.filter((t) => at(t.round_at))

  const lockers = new Map<string, Stop>()
  const locker = (code: string): Stop => {
    if (!lockers.has(code)) lockers.set(code, { key: `L-${code}`, type: 'locker', code, tasks: [] })
    return lockers.get(code) as Stop
  }
  const pickups = new Map<string, Stop>()
  const dropoffs = new Map<string, Stop>()
  const merchant = (map: Map<string, Stop>, code: string, phase: string): Stop => {
    if (!map.has(code))
      map.set(code, { key: `M-${phase}-${code}`, type: 'merchant', code, tasks: [] })
    return map.get(code) as Stop
  }

  for (const o of returned) {
    const task = { ref: o.id, items: o.items, size: o.size, what: o.service }
    merchant(pickups, o.merchant, 'pick').tasks.push({
      ...task,
      kind: 'pickup',
      other: o.pickup_locker,
    })
    locker(o.pickup_locker).tasks.push({ ...task, kind: 'dropoff', other: o.merchant })
  }
  for (const o of collected) {
    const task = { ref: o.id, items: o.items, size: o.size, what: o.service }
    locker(o.drop_locker).tasks.push({ ...task, kind: 'pickup', other: o.merchant })
    merchant(dropoffs, o.merchant, 'drop').tasks.push({
      ...task,
      kind: 'dropoff',
      other: o.drop_locker,
    })
  }
  const transferOrigin = new Map<string, string[]>()
  for (const t of moved) {
    const task = { ref: t.id, items: 1, size: t.size, what: 'consigne' }
    locker(t.from_locker).tasks.push({ ...task, kind: 'pickup', other: t.to_locker })
    locker(t.to_locker).tasks.push({ ...task, kind: 'dropoff', other: t.from_locker })
    transferOrigin.set(t.to_locker, [...(transferOrigin.get(t.to_locker) ?? []), t.from_locker])
  }

  const position = (stop: Stop): Position => positions[stop.code] ?? start
  const phase1 = orderStops([...pickups.values()], start, position)
  const lockerStart = phase1.length ? position(phase1[phase1.length - 1] as Stop) : start
  const phase2 = orderStops([...lockers.values()], lockerStart, position, (stop, visited) =>
    (transferOrigin.get(stop.code) ?? []).every(
      (origin) => visited.has(origin) || origin === stop.code,
    ),
  )
  const merchantStart = phase2.length ? position(phase2[phase2.length - 1] as Stop) : lockerStart
  const phase3 = orderStops([...dropoffs.values()], merchantStart, position)
  return [...phase1, ...phase2, ...phase3]
}
