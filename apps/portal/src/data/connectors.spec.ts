/**
 * Tests of the planning connectors.
 */
import type { DemoOrder } from '@city-groom/demo-data'
import { describe, expect, it } from 'vitest'

import type { AgendaTask } from './agenda'
import { CONNECTORS, demoFeedUrl, webhookPayload } from './connectors'

describe('connectors', () => {
  it('has unique ids and only marks methods working without a CityPal server as ready', () => {
    expect(new Set(CONNECTORS.map((c) => c.id)).size).toBe(CONNECTORS.length)
    for (const c of CONNECTORS.filter((x) => x.status === 'ready'))
      expect(['native', 'file', 'link']).toContain(c.method)
  })

  it('uses a reserved domain for the fictitious feed address', () => {
    // .invalid is reserved (RFC 2606): the demo address can never resolve.
    expect(new URL(demoFeedUrl('demo-pressing')).hostname.endsWith('.invalid')).toBe(true)
  })

  it('builds a flat webhook body with the order details', () => {
    const order = {
      id: 'D-7',
      service: 'shirt_ironing',
      items: 3,
      size: 'M',
      returned_at: '2026-10-26T14:00:00+01:00',
      price_total: '10.50',
    } as DemoOrder
    const task: AgendaTask = {
      id: 'work-D-7',
      kind: 'work',
      at: '2026-10-26T14:00:00+01:00',
      orders: [order],
    }
    expect(webhookPayload('m', task, 'agenda.task.done', '3 × Chemise')).toEqual({
      type: 'agenda.task.done',
      merchant: 'm',
      task: {
        id: 'work-D-7',
        kind: 'work',
        at: '2026-10-26T14:00:00+01:00',
        title: '3 × Chemise',
        orders: [
          {
            id: 'D-7',
            service: 'shirt_ironing',
            items: 3,
            size: 'M',
            handover_at: '2026-10-26T14:00:00+01:00',
            amount: '10.50',
          },
        ],
      },
    })
  })
})
