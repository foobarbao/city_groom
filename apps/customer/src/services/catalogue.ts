/**
 * @file Customer catalogue: shops, services, plans, consigne rules, lockers.
 *
 * The demo reads the bundled dataset (`@city-groom/demo-data`): fictitious
 * partner shops with fictitious reviews, real businesses from OpenStreetMap
 * (not partners), placeholder plans and prices.
 * PROD: read the catalogue, offers, reviews and plans from the API.
 */
import { type Offer, catalogueData, loadOffers, offersOf, publicData } from '@city-groom/demo-data'
import type { DemoPartner, DemoService, SubscriptionPlan } from '@city-groom/demo-data'

import type { Shop } from '../domain/shops'

/** Order in which shop categories are listed (first offers first, docs/PRODUCT.md §2). */
export const CATEGORY_ORDER = [
  'dry_cleaning',
  'laundry',
  'tailoring',
  'shoe_repair',
  'watch_repair',
  'jewellery_repair',
  'electronics_repair',
  'key_cutting',
]

export const catalogue = catalogueData

/**
 * Offers saved by merchants in the portal on this device (demo), read when
 * the app starts; reload the app to see a change made in the portal.
 */
const savedOffers = loadOffers()

/** Visible offers of a partner shop (merchant's offers, or the catalogue defaults). */
export const shopOffers = (code: string): Offer[] => {
  const partner = catalogueData.partners.find((p) => p.code === code)
  return partner
    ? offersOf(partner, catalogueData.services, savedOffers).filter((o) => o.active)
    : []
}

const partners: Shop[] = catalogueData.partners.map((p: DemoPartner) => ({
  code: p.code,
  name: p.name,
  category: p.category,
  partner: true,
  longitude: p.longitude,
  latitude: p.latitude,
  address: '',
  openingHours: '',
  website: '',
  // Service types of the shop's visible offers, for the search.
  services: [...new Set(shopOffers(p.code).map((o) => o.service))],
  rating: { average: p.reviews.average, count: p.reviews.count },
}))

const businesses: Shop[] = (publicData.merchants.features ?? []).flatMap((f, i) => {
  const props = f.properties
  const coordinates = f.geometry?.coordinates
  if (!props?.name || !props.category || !coordinates) return []
  return [
    {
      code: `osm-${i}`,
      name: props.name,
      category: props.category,
      partner: false,
      longitude: coordinates[0] as number,
      latitude: coordinates[1] as number,
      address: props.address ?? '',
      openingHours: props.opening_hours ?? '',
      website: props.website ?? '',
      services: [],
      rating: null,
    },
  ]
})

/** Every shop: partners and other local businesses. */
export const shops: Shop[] = [...partners, ...businesses]

/** Shop by code. */
export const shopByCode = (code: string): Shop | undefined => shops.find((s) => s.code === code)

/** Partner details (reviews), for partner shops. */
export const partnerByCode = (code: string): DemoPartner | undefined =>
  catalogueData.partners.find((p) => p.code === code)

/** Service by code. */
export const serviceByCode = (code: string): DemoService | undefined =>
  catalogueData.services.find((s) => s.code === code)

/** Plan by code, falling back to "no subscription". */
export const planByCode = (code: string): SubscriptionPlan =>
  catalogueData.plans.find((p) => p.code === code) ?? (catalogueData.plans[0] as SubscriptionPlan)

/** Lockers with their position and free compartments (snapshot in the demo). */
export const lockers = (publicData.lockers.features ?? []).flatMap((f) => {
  const p = f.properties
  const coordinates = f.geometry?.coordinates
  if (!p?.code || !p.name || !coordinates) return []
  return [
    {
      code: p.code,
      name: p.name,
      siteCategory: p.site_category ?? 'other',
      freeBySize: (p.free_by_size ?? {}) as Record<string, number>,
      longitude: coordinates[0] as number,
      latitude: coordinates[1] as number,
    },
  ]
})

export type LockerSummary = (typeof lockers)[number]

/** Lockers as GeoJSON, for the maps. */
export const lockerFeatures = publicData.lockers

/** Locker layout (doors) by code, for the locker drawing. */
export const lockerLayout = (code: string) => publicData.details[code]

/** Compartment size catalogue (dimensions). */
export const sizes = publicData.sizes

/** Partner shops offering a service type, with their offer (unranked). */
export function providersOf(service: string) {
  return partners.flatMap((shop) =>
    shopOffers(shop.code)
      .filter((o) => o.service === service)
      .map((offer) => ({ shop, offer })),
  )
}

/** Service types offered by at least one partner shop, in category order. */
export const offeredServices = CATEGORY_ORDER.flatMap((category) =>
  catalogueData.services.filter(
    (s) => s.category === category && partners.some((p) => p.services.includes(s.code)),
  ),
)
