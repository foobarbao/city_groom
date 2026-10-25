/**
 * @file Navigation tree of the partner portal, shown in the side menu
 * (`PortalNav.vue`, docs/DESIGN.md "Partner portal navigation").
 *
 * Three levels at most: space (Commerce, Coursier, Exploitation) → item or
 * group → item. Groups fold and unfold; the groups leading to the current
 * page are unfolded automatically. Labels are i18n keys. Types and the
 * renderer are shared with the customer app (`@city-groom/ui`, NavTree).
 *
 * DEMO: every space is listed so that the demo can be toured. PROD: each
 * person sees only the space(s) of their role (merchant, courier, operator).
 */
import {
  barChartOutline,
  bicycleOutline,
  calendarOutline,
  chatbubbleEllipsesOutline,
  chatbubblesOutline,
  cubeOutline,
  extensionPuzzleOutline,
  fileTrayStackedOutline,
  gridOutline,
  homeOutline,
  layersOutline,
  leafOutline,
  mapOutline,
  notificationsOutline,
  pricetagsOutline,
  pulseOutline,
  receiptOutline,
  speedometerOutline,
  starOutline,
  storefrontOutline,
  trendingUpOutline,
} from 'ionicons/icons'

import { type NavNode, navGroup, navItem, navLabels, navTrail } from '@city-groom/ui'

const item = navItem
const group = navGroup

/** The whole menu, in display order. */
export const NAVIGATION: NavNode[] = [
  item('home', 'nav.home', homeOutline, 'home'),
  item('mission', 'nav.mission', leafOutline, 'mission'),
  group('merchant', 'nav.merchant', storefrontOutline, [
    item('merchant-dashboard', 'merchant.nav.dashboard', gridOutline, 'merchant', {
      paramKeys: ['code'],
    }),
    group('merchant-activity', 'nav.activity', layersOutline, [
      item('merchant-agenda', 'merchant.nav.agenda', calendarOutline, 'merchant-agenda', {
        paramKeys: ['code'],
      }),
      item('merchant-rounds', 'merchant.nav.rounds', bicycleOutline, 'merchant-rounds', {
        paramKeys: ['code'],
      }),
    ]),
    group('merchant-customers', 'nav.customers', chatbubblesOutline, [
      item(
        'merchant-messages',
        'merchant.nav.messages',
        chatbubbleEllipsesOutline,
        'merchant-messages',
        { paramKeys: ['code'], badge: 'messages' },
      ),
      item('merchant-reviews', 'merchant.nav.reviews', starOutline, 'merchant-reviews', {
        paramKeys: ['code'],
      }),
    ]),
    group('merchant-tools', 'nav.offersTools', pricetagsOutline, [
      item('merchant-services', 'merchant.nav.services', pricetagsOutline, 'merchant-services', {
        paramKeys: ['code'],
      }),
      item('merchant-connectors', 'nav.connectors', extensionPuzzleOutline, 'merchant-connectors', {
        paramKeys: ['code'],
      }),
    ]),
  ]),
  group('courier', 'nav.courier', bicycleOutline, [
    item('courier-overview', 'courier.nav.overview', barChartOutline, 'courier'),
    item('courier-round', 'courier.nav.sheet', mapOutline, 'courier-round'),
  ]),
  group('operator', 'nav.operator', speedometerOutline, [
    item('operator-overview', 'operator.nav.overview', gridOutline, 'operator'),
    item('operator-alerts', 'operator.nav.alerts', notificationsOutline, 'operator-alerts', {
      badge: 'alerts',
    }),
    group('operator-network', 'nav.network', cubeOutline, [
      item('operator-lockers', 'operator.nav.lockers', fileTrayStackedOutline, 'operator-lockers', {
        also: ['operator-locker'],
      }),
      item('operator-partners', 'operator.nav.partners', storefrontOutline, 'operator-partners'),
    ]),
    group('operator-activity', 'nav.activity', pulseOutline, [
      item('operator-orders', 'operator.nav.orders', receiptOutline, 'operator-orders'),
      item('operator-rounds', 'operator.nav.rounds', bicycleOutline, 'operator-rounds'),
    ]),
    item('operator-forecast', 'operator.nav.forecast', trendingUpOutline, 'operator-forecast'),
  ]),
]

/** Path from the top of the menu to the item of a route (see `navTrail`). */
export const trail = (route: string): NavNode[] => navTrail(NAVIGATION, route)

/** Every label key of the menu (checked against the French messages in tests). */
export const labels = (): string[] => navLabels(NAVIGATION)

export type { NavNode }
