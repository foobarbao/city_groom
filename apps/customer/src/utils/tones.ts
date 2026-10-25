/**
 * @file Colour tone of statuses and categories (docs/DESIGN.md): each state
 * of an order or booking gets its own tint, so the lists read at a glance.
 * Tones map to `.pill.<tone>` (styles.css) and the accent tokens.
 */

/** Pill tone of an order or consigne status. */
export function statusTone(status: string): string {
  switch (status) {
    case 'awaiting_drop_off':
    case 'booked':
    case 'pending':
      return 'warn' // something to do for the customer
    case 'in_locker':
    case 'stored':
      return 'info' // in a locker, waiting
    case 'at_merchant':
      return 'plum' // being processed
    case 'ready_for_pickup':
      return 'ready' // to collect now
    case 'picked_up':
    case 'collected':
    case 'cancelled':
    case 'declined':
      return 'off'
    default:
      return ''
  }
}

/** Accent tints cycled over the service categories (icon tiles). */
export const CATEGORY_TONES = ['leaf', 'sky', 'coral', 'plum', 'sun'] as const

/** Accent tint of the n-th category. */
export const categoryTone = (index: number): string =>
  CATEGORY_TONES[index % CATEGORY_TONES.length] as string
