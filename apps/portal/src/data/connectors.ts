/**
 * @file Connectors between the merchant planning and external tools
 * (calendars, planners, to-do lists, automation platforms).
 *
 * Google Agenda is synchronised natively (`native`, googleCalendar.ts), as
 * the project owner asked on 2026-10-25. For the other tools, three ways to
 * connect, from the most universal to the most specific (ADR-0009):
 * - `file` / `link`: work today, without a server — .ics export of the week
 *   and "add to calendar" links for one task (`calendarExport.ts`);
 * - `feed`: a private iCal subscription address, read by any calendar that
 *   can subscribe to a URL; the calendar then refreshes it on its own;
 * - `automation`: CityPal sends each planning change to a webhook; Zapier,
 *   Make or n8n receive it and create the card, task or row in the tool of
 *   the merchant's choice (Trello, Notion, Asana, Todoist…).
 *
 * DEMO: feed and webhook are simulated — the address is fictitious and
 * nothing is sent. PROD: both need API endpoints (ADR-0007) and the ADR
 * accepted first.
 */
import type { AgendaTask } from './agenda'

/** How a tool is connected. */
export type ConnectorMethod = 'native' | 'file' | 'link' | 'feed' | 'automation'

/**
 * `ready`: works in the demo (the Google sync needs the Google client ID to
 * be configured); `simulated`: shown, nothing is sent; `planned`: PROD.
 */
export type ConnectorStatus = 'ready' | 'simulated' | 'planned'

/** A way to bring the planning into one external tool. */
export interface Connector {
  /** Stable identifier, also the i18n key of its name and explanation. */
  id: string
  group: 'calendar' | 'planner' | 'automation'
  method: ConnectorMethod
  status: ConnectorStatus
}

/**
 * Tools shown to merchants. Calendars rely on standards (iCalendar import
 * and subscription); planners go through an automation platform, which
 * already maintains the integrations with each tool, rather than one
 * CityPal integration per tool.
 */
export const CONNECTORS: Connector[] = [
  { id: 'googleSync', group: 'calendar', method: 'native', status: 'ready' },
  { id: 'outlookLink', group: 'calendar', method: 'link', status: 'ready' },
  { id: 'icsFile', group: 'calendar', method: 'file', status: 'ready' },
  { id: 'icalFeed', group: 'calendar', method: 'feed', status: 'simulated' },
  { id: 'webhook', group: 'automation', method: 'automation', status: 'simulated' },
  { id: 'trello', group: 'planner', method: 'automation', status: 'planned' },
  { id: 'notion', group: 'planner', method: 'automation', status: 'planned' },
  { id: 'asana', group: 'planner', method: 'automation', status: 'planned' },
  { id: 'microsoftPlanner', group: 'planner', method: 'automation', status: 'planned' },
  { id: 'todoist', group: 'planner', method: 'automation', status: 'planned' },
  { id: 'sheets', group: 'planner', method: 'automation', status: 'planned' },
]

/** Fictitious subscription address of a merchant's planning (DEMO). */
export const demoFeedUrl = (merchant: string): string =>
  `https://demo.citypal.invalid/api/v1/merchants/${merchant}/agenda.ics?token=demo`

/** Event types a webhook would carry (ADR-0009, proposed). */
export type WebhookEventType = 'agenda.task.scheduled' | 'agenda.task.done'

/**
 * Body sent to the merchant's webhook for one task. Plain JSON with stable
 * field names, so that an automation can map them to a card or a row
 * without code. Amounts are strings in euros, as in the API.
 */
export function webhookPayload(
  merchant: string,
  task: AgendaTask,
  type: WebhookEventType,
  title: string,
): Record<string, unknown> {
  return {
    type,
    merchant,
    task: {
      id: task.id,
      kind: task.kind,
      at: task.at,
      title,
      orders: task.orders.map((o) => ({
        id: o.id,
        service: o.service,
        items: o.items,
        size: o.size,
        handover_at: o.returned_at,
        amount: o.price_total,
      })),
    },
  }
}
