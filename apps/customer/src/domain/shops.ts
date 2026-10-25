/**
 * @file Shop catalogue of the customer app: one list combining partner shops
 * and other local businesses, grouped by category and searchable.
 *
 * - **Partner shops** can be ordered from, rated and contacted; in the demo
 *   they are fictitious ("Démo · …").
 * - **Other businesses** are real (OpenStreetMap) but not partners: they are
 *   shown for information, never with a rating (ADR-0008).
 */

/** A shop as shown in the app. */
export interface Shop {
  code: string
  name: string
  category: string
  partner: boolean
  longitude: number
  latitude: number
  address: string
  openingHours: string
  website: string
  /** Service codes offered through CityPal (partners only). */
  services: string[]
  /** Average rating and number of ratings (partners only). */
  rating: { average: number; count: number } | null
}

/** Lower case, without accents or punctuation: "Cordonnerie Sainte-Claire" → "cordonnerie sainte claire". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** A shop with its search tokens. */
export interface IndexedShop {
  shop: Shop
  nameWords: string[]
  otherWords: string[]
}

/**
 * Builds the search index: words of the name, and words of the category,
 * services and address.
 *
 * @param categoryLabel - French label of a category code.
 * @param serviceName - French name of a service code.
 */
export function buildIndex(
  shops: Shop[],
  categoryLabel: (code: string) => string,
  serviceName: (code: string) => string,
): IndexedShop[] {
  return shops.map((shop) => ({
    shop,
    nameWords: normalize(shop.name).split(' ').filter(Boolean),
    otherWords: normalize(
      [categoryLabel(shop.category), ...shop.services.map(serviceName), shop.address].join(' '),
    )
      .split(' ')
      .filter(Boolean),
  }))
}

/** Partners first, then best rated, then by name. */
export function compareShops(a: Shop, b: Shop): number {
  if (a.partner !== b.partner) return a.partner ? -1 : 1
  const ratingA = a.rating?.average ?? 0
  const ratingB = b.rating?.average ?? 0
  if (ratingA !== ratingB) return ratingB - ratingA
  return a.name.localeCompare(b.name, 'fr')
}

/**
 * Shops matching a query: every word of the query must start a word of the
 * shop (name, category, service or address). Matches in the name rank first.
 */
export function searchShops(index: IndexedShop[], query: string): Shop[] {
  const words = normalize(query).split(' ').filter(Boolean)
  if (!words.length) return index.map((entry) => entry.shop).sort(compareShops)
  const scored: { shop: Shop; score: number }[] = []
  for (const entry of index) {
    let score = 0
    const matchesAll = words.every((word) => {
      if (entry.nameWords.some((w) => w.startsWith(word))) {
        score += 2
        return true
      }
      if (entry.otherWords.some((w) => w.startsWith(word))) {
        score += 1
        return true
      }
      return false
    })
    if (matchesAll) scored.push({ shop: entry.shop, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || compareShops(a.shop, b.shop))
    .map((entry) => entry.shop)
}

/** Shops grouped by category, groups in `categoryOrder`, shops sorted with `compareShops`. */
export function groupByCategory(
  shops: Shop[],
  categoryOrder: string[],
): { category: string; shops: Shop[] }[] {
  return categoryOrder
    .map((category) => ({
      category,
      shops: shops.filter((s) => s.category === category).sort(compareShops),
    }))
    .filter((group) => group.shops.length > 0)
}

/** A service type, as the customer searches it. */
export interface ServiceType {
  code: string
  name: string
  category: string
  /** Other words customers may search with ("semelle" for "Ressemelage"). */
  keywords?: string[]
}

/** Service types whose name or keywords match every word of the query (word prefix). */
export function matchServices(services: ServiceType[], query: string): ServiceType[] {
  const words = normalize(query).split(' ').filter(Boolean)
  if (!words.length) return []
  return services.filter((s) => {
    const known = normalize([s.name, ...(s.keywords ?? [])].join(' ')).split(' ')
    return words.every((w) => known.some((n) => n.startsWith(w)))
  })
}

/** An offer of a shop for a service type. */
export interface Provider<O> {
  shop: Shop
  offer: O
}

/** Best rated first, then cheapest. */
export function rankProviders<O extends { priceCents: number }>(
  providers: Provider<O>[],
): Provider<O>[] {
  return [...providers].sort(
    (a, b) =>
      (b.shop.rating?.average ?? 0) - (a.shop.rating?.average ?? 0) ||
      a.offer.priceCents - b.offer.priceCents,
  )
}
