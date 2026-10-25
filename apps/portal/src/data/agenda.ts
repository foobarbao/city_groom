/**
 * @file Merchant planning: what is scheduled, round by round, and the tasks
 * to do (receive items, do the work, hand items over to the courier).
 *
 * Tasks of an order, from its timeline:
 * - "arrival": the courier brings the items at a round;
 * - "work": the service to perform, due before the handover;
 * - "handover": the items to have ready for the courier at a later round.
 * Lockers are not part of the merchant's planning (docs/PRODUCT.md §5).
 *
 * PROD: tasks and their status come from the API.
 */
import type { DemoOrder } from '@city-groom/demo-data'

/** Kind of scheduled task. */
export type TaskKind = 'arrival' | 'work' | 'handover'

/** One entry of the planning. */
export interface AgendaTask {
  /** Stable id, used to mark the task done. */
  id: string
  kind: TaskKind
  /** When it happens (arrival, handover) or is due (work), ISO 8601. */
  at: string
  /** Orders concerned (one for "work", every order of the round otherwise). */
  orders: DemoOrder[]
}

/** Length of a calendar entry, in minutes (a courier visit is short). */
export const TASK_MINUTES: Record<TaskKind, number> = { arrival: 15, work: 30, handover: 15 }

/**
 * Builds the planning of a merchant between `from` and `to`.
 *
 * Arrivals and handovers are grouped per round; each order also gets a work
 * task due at its handover. Sorted by time, then arrival, work, handover.
 */
export function buildAgenda(orders: DemoOrder[], from: Date, to: Date): AgendaTask[] {
  const within = (iso: string | null): iso is string =>
    iso !== null && new Date(iso) >= from && new Date(iso) < to
  const grouped = new Map<string, AgendaTask>()
  const tasks: AgendaTask[] = []
  const add = (kind: 'arrival' | 'handover', at: string, order: DemoOrder): void => {
    const id = `${kind}-${new Date(at).toISOString()}`
    const task = grouped.get(id)
    if (task) task.orders.push(order)
    else {
      const created: AgendaTask = { id, kind, at, orders: [order] }
      grouped.set(id, created)
      tasks.push(created)
    }
  }
  for (const order of orders) {
    if (within(order.collected_at)) add('arrival', order.collected_at, order)
    if (within(order.returned_at)) {
      add('handover', order.returned_at, order)
      tasks.push({ id: `work-${order.id}`, kind: 'work', at: order.returned_at, orders: [order] })
    }
  }
  const rank: Record<TaskKind, number> = { arrival: 0, work: 1, handover: 2 }
  return tasks.sort((a, b) => a.at.localeCompare(b.at) || rank[a.kind] - rank[b.kind])
}

/** Tasks of one local day ("YYYY-MM-DD" in `timeZone`). */
export function tasksOfDay(tasks: AgendaTask[], day: string, timeZone: string): AgendaTask[] {
  return tasks.filter((t) => new Date(t.at).toLocaleDateString('sv-SE', { timeZone }) === day)
}
