/**
 * @file Navigation tree of the partner portal, shown in the side menu
 * (`PortalNav.vue`, docs/DESIGN.md "Partner portal navigation").
 *
 * Three levels at most: space (Commerce, Coursier, Exploitation) → item or
 * group → item. Groups fold and unfold; the groups leading to the current
 * page are unfolded automatically. Labels are i18n keys.
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

/** Counter shown next to an item. */
export type NavBadge = 'messages' | 'alerts'

/** A link to a page. */
export interface NavItem {
  kind: 'item'
  id: string
  label: string
  icon: string
  /** Route name. */
  route: string
  /** The route takes the current shop code (merchant space). */
  shop?: boolean
  /** Other route names highlighting this item (e.g. a detail page). */
  also?: string[]
  badge?: NavBadge
}

/** A folding group of items. */
export interface NavGroup {
  kind: 'group'
  id: string
  label: string
  icon: string
  children: NavNode[]
}

export type NavNode = NavItem | NavGroup

const item = (
  id: string,
  label: string,
  icon: string,
  route: string,
  extra: Partial<NavItem> = {},
): NavItem => ({ kind: 'item', id, label, icon, route, ...extra })
const group = (id: string, label: string, icon: string, children: NavNode[]): NavGroup => ({
  kind: 'group',
  id,
  label,
  icon,
  children,
})

/** The whole menu, in display order. */
export const NAVIGATION: NavNode[] = [
  item('home', 'nav.home', homeOutline, 'home'),
  item('mission', 'nav.mission', leafOutline, 'mission'),
  group('merchant', 'nav.merchant', storefrontOutline, [
    item('merchant-dashboard', 'merchant.nav.dashboard', gridOutline, 'merchant', { shop: true }),
    group('merchant-activity', 'nav.activity', layersOutline, [
      item('merchant-agenda', 'merchant.nav.agenda', calendarOutline, 'merchant-agenda', {
        shop: true,
      }),
      item('merchant-rounds', 'merchant.nav.rounds', bicycleOutline, 'merchant-rounds', {
        shop: true,
      }),
    ]),
    group('merchant-customers', 'nav.customers', chatbubblesOutline, [
      item(
        'merchant-messages',
        'merchant.nav.messages',
        chatbubbleEllipsesOutline,
        'merchant-messages',
        { shop: true, badge: 'messages' },
      ),
      item('merchant-reviews', 'merchant.nav.reviews', starOutline, 'merchant-reviews', {
        shop: true,
      }),
    ]),
    group('merchant-tools', 'nav.offersTools', pricetagsOutline, [
      item('merchant-services', 'merchant.nav.services', pricetagsOutline, 'merchant-services', {
        shop: true,
      }),
      item('merchant-connectors', 'nav.connectors', extensionPuzzleOutline, 'merchant-connectors', {
        shop: true,
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

/** Whether an item stands for the given route. */
export const matches = (node: NavItem, route: string): boolean =>
  node.route === route || (node.also ?? []).includes(route)

/**
 * Path from the top of the menu to the item of a route (groups, then the
 * item), or an empty list when the route is not in the menu.
 */
export function trail(route: string, nodes: NavNode[] = NAVIGATION): NavNode[] {
  for (const node of nodes) {
    if (node.kind === 'item') {
      if (matches(node, route)) return [node]
    } else {
      const below = trail(route, node.children)
      if (below.length) return [node, ...below]
    }
  }
  return []
}

/** Every label key of the menu (checked against the French messages in tests). */
export function labels(nodes: NavNode[] = NAVIGATION): string[] {
  return nodes.flatMap((n) => [n.label, ...(n.kind === 'group' ? labels(n.children) : [])])
}
