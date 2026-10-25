/**
 * @file Pictograms of the customer app (docs/DESIGN.md "Icons, not emoji"):
 * line drawings for the service categories, and the icon of each list item
 * (order, consigne, quote), so every row of a list starts with an icon.
 */
import {
  barbellOutline,
  documentTextOutline,
  lockClosedOutline,
  shirtOutline,
} from 'ionicons/icons'

import type { CustomerOrder } from '../stores/account'
import { shopByCode } from '../services/catalogue'

/** Line pictograms (24×24 SVG paths) of the service categories. */
export const CATEGORY_ICONS: Record<string, string> = {
  dry_cleaning: 'M12 6a2 2 0 1 1 2 2c-1 .5-2 1-2 2l9 6H3l9-6',
  laundry: 'M5 3h14v18H5zM5 7h14M12 15m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
  tailoring:
    'M6 3l12 18M18 3L6 21M4 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0M16 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  shoe_repair: 'M3 16c0-3 1-6 2-8l4 3c2 1 5 2 8 2 2 0 4 1 4 3v2H3zM3 18h18',
  watch_repair: 'M9 3h6l1 4a5 5 0 0 1 0 10l-1 4H9l-1-4a5 5 0 0 1 0-10zM12 9v3l2 1',
  jewellery_repair: 'M6 9l3-5h6l3 5-6 11zM6 9h12',
  electronics_repair: 'M7 3h10v18H7zM11 18h2',
  key_cutting: 'M8 14a4 4 0 1 1 3-6.7L20 7v3h-2v2h-2v2h-4.3A4 4 0 0 1 8 14z',
}

/** Icon of a list item: an Ionicons icon or a category line path. */
export interface ItemIcon {
  /** Ionicons icon (SVG data URL), when not a category pictogram. */
  icon?: string
  /** 24×24 SVG path of a category pictogram. */
  path?: string
}

/** Icon of the consigne bookings. */
export const CONSIGNE_ICON: ItemIcon = { icon: lockClosedOutline }
/** Icon of the quotes waiting for the customer. */
export const QUOTE_ICON: ItemIcon = { icon: documentTextOutline }

/**
 * Icon of an order: the Swap Sport and weekly pack icons of the menu, else
 * the pictogram of the shop's category (shirt when the shop is unknown).
 */
export function orderIcon(order: Pick<CustomerOrder, 'kind' | 'packId' | 'shopCode'>): ItemIcon {
  if (order.kind === 'exchange') return { icon: barbellOutline }
  if (order.packId) return { icon: shirtOutline }
  const path = CATEGORY_ICONS[shopByCode(order.shopCode)?.category ?? '']
  return path ? { path } : { icon: shirtOutline }
}
