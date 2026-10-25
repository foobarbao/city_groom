/**
 * @file Data source of the portal.
 *
 * The portal only runs as a demo for now: every figure comes from the bundled
 * dataset of `@city-groom/demo-data` (snapshots of the real API for lockers,
 * fictitious activity for orders and rounds; docs/DEMO.md).
 * PROD: read the merchant, courier and operator endpoints of the API instead.
 */
import { activityData, catalogueData, operatorData, publicData } from '@city-groom/demo-data'

import type { MapPoint } from '../components/PortalMap.vue'

export { activityData as activity, catalogueData as catalogue, operatorData, publicData }

/**
 * Reference time of the demo: the moment the activity was generated, moved to
 * today. Using it instead of the wall clock keeps order statuses, past and
 * upcoming rounds consistent with each other at any time of day.
 */
export const demoNow = new Date(activityData.generated_at)

/** Names of the services, by code (the catalogue lists every service). */
export const serviceNames: Record<string, string> = Object.fromEntries(
  catalogueData.services.map((s) => [s.code, s.name]),
)

/** Fictitious partner shops ("Démo · …") of the merchant space, by name. */
export const partners = [...catalogueData.partners].sort((a, b) =>
  a.name.localeCompare(b.name, 'fr'),
)

/** Partner shop by code, falling back to the first one. */
export const partnerOrFirst = (code: string | undefined) =>
  partners.find((p) => p.code === code) ?? partners[0]

/** Every locker with its operator details (fill rate, doors), by name. */
export const lockers = Object.values(operatorData.details).sort((a, b) =>
  a.name.localeCompare(b.name, 'fr'),
)

/** Lockers as map points, coloured by fill rate. */
export const lockerPoints: MapPoint[] = lockers.map((l) => ({
  code: l.code,
  name: l.name,
  longitude: l.longitude,
  latitude: l.latitude,
  fillRate: l.fill_rate,
}))

/** Demo merchants as map points. */
export const merchantPoints: MapPoint[] = activityData.merchants.map((m) => ({
  code: m.code,
  name: m.name,
  longitude: m.longitude,
  latitude: m.latitude,
}))

/** Position of every locker and demo merchant, by code: [longitude, latitude]. */
export const positions: Record<string, [number, number]> = Object.fromEntries(
  [...lockerPoints, ...merchantPoints].map((p) => [p.code, [p.longitude, p.latitude]]),
)

/** Names of lockers and demo merchants, by code. */
export const placeNames: Record<string, string> = Object.fromEntries(
  [...lockerPoints, ...catalogueData.partners].map((p) => [p.code, p.name]),
)

/** Name of a service, falling back to its code. */
export const serviceName = (code: string): string => serviceNames[code] ?? code

/** Name of a locker or demo merchant, falling back to its code. */
export const placeName = (code: string): string => placeNames[code] ?? code
