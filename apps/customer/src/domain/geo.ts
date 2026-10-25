/**
 * @file Distances between the customer and the lockers.
 */

/** [longitude, latitude] in degrees (WGS 84), as in GeoJSON. */
export type LngLat = [number, number]

const EARTH_RADIUS_M = 6_371_000

/** Great-circle distance in metres (haversine formula). */
export function distanceMeters(a: LngLat, b: LngLat): number {
  const rad = (deg: number): number => (deg * Math.PI) / 180
  const dLat = rad(b[1] - a[1])
  const dLng = rad(b[0] - a[0])
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/**
 * ASSUMPTION: walking speed of 80 m per minute (about 4.8 km/h), applied to
 * the straight-line distance; real walking times are a little longer.
 */
export const WALKING_METERS_PER_MINUTE = 80

/** Walking time in whole minutes, at least 1. */
export const walkingMinutes = (meters: number): number =>
  Math.max(1, Math.round(meters / WALKING_METERS_PER_MINUTE))

/** "350 m" or "1,2 km". */
export function formatDistance(meters: number): string {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`
  return `${(meters / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`
}

/** Items sorted by distance from `origin`, with their distance in metres. */
export function byDistance<T extends { longitude: number; latitude: number }>(
  items: T[],
  origin: LngLat,
): (T & { distance: number })[] {
  return items
    .map((item) => ({ ...item, distance: distanceMeters(origin, [item.longitude, item.latitude]) }))
    .sort((a, b) => a.distance - b.distance)
}
