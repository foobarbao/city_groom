/**
 * @file Navigation tree of the customer app, shown in the side menu
 * (`AppNav.vue`, docs/DESIGN.md "Navigation"). Same system as the partner
 * portal (`@city-groom/ui`, NavTree): folding groups, two levels here.
 *
 * Requested by the project owner on 2026-10-25, replacing the bottom tab bar.
 */
import {
  addCircleOutline,
  barbellOutline,
  briefcaseOutline,
  chatbubblesOutline,
  fileTrayFullOutline,
  homeOutline,
  lockClosedOutline,
  mapOutline,
  navigateOutline,
  personCircleOutline,
  personOutline,
  receiptOutline,
  ribbonOutline,
  searchOutline,
  shirtOutline,
} from 'ionicons/icons'

import { type NavNode, navGroup, navItem, navLabels, navTrail } from '@city-groom/ui'

/** The whole menu, in display order. Badge keys: `quotes`, `bookings`. */
export const NAVIGATION: NavNode[] = [
  navItem('home', 'nav.home', homeOutline, 'home'),
  navGroup('services', 'nav.services', briefcaseOutline, [
    navItem('shops', 'nav.findService', searchOutline, 'shops', { also: ['shop', 'checkout'] }),
    navItem('pack', 'nav.pack', shirtOutline, 'pack'),
    navItem('exchange', 'nav.exchange', barbellOutline, 'exchange'),
    navItem('orders', 'nav.orders', receiptOutline, 'orders', { also: ['order', 'review'] }),
    navItem('messages', 'nav.messagesQuotes', chatbubblesOutline, 'messages', {
      also: ['chat'],
      badge: 'quotes',
    }),
  ]),
  navGroup('consigne', 'nav.consigne', lockClosedOutline, [
    navItem('nearby', 'nav.nearby', navigateOutline, 'nearby'),
    navItem('consigne-book', 'nav.book', addCircleOutline, 'consigne-book'),
    navItem('bookings', 'nav.myBookings', fileTrayFullOutline, 'consigne', {
      also: ['booking', 'transfer'],
      badge: 'bookings',
    }),
  ]),
  navItem('map', 'nav.map', mapOutline, 'map', { also: ['locker'] }),
  navGroup('account', 'nav.account', personCircleOutline, [
    navItem('profile', 'nav.profile', personOutline, 'account'),
    navItem('plans', 'nav.plans', ribbonOutline, 'plans'),
  ]),
]

/** Path from the top of the menu to the item of a route (see `navTrail`). */
export const trail = (route: string): NavNode[] => navTrail(NAVIGATION, route)

/** Every label key of the menu (checked against the French messages in tests). */
export const labels = (): string[] => navLabels(NAVIGATION)
