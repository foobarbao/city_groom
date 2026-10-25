/**
 * @file Access to the public locker endpoints of the API.
 *
 * In the standalone demo build (`VITE_DEMO=true`), calls are answered from
 * bundled fictitious data instead (`src/demo/`); the demo module is only
 * included in that build.
 */
import type { LockerFeatureCollection, LockerLayout, SizeSpec } from '@city-groom/api-client'

import { getJson } from './http'

const IS_DEMO = import.meta.env.VITE_DEMO === 'true'
const demo = IS_DEMO ? await import('../demo/demoApi') : null

/**
 * Fetches all in-service lockers as GeoJSON, with free compartments per size.
 *
 * @throws {ApiError | NetworkError} See {@link getJson}.
 */
export function fetchLockers(): Promise<LockerFeatureCollection> {
  if (demo) return demo.fetchLockers()
  return getJson<LockerFeatureCollection>('/lockers/')
}

/**
 * Fetches the front layout of one locker (columns, doors, sizes).
 *
 * @param code - Locker code, as found in the map features.
 * @throws {ApiError} With status 404 if the locker does not exist or is not in service.
 */
export function fetchLocker(code: string): Promise<LockerLayout> {
  if (demo) return demo.fetchLocker(code)
  return getJson<LockerLayout>(`/lockers/${encodeURIComponent(code)}/`)
}

/** Fetches the compartment size catalogue (dimensions and examples of items). */
export function fetchSizes(): Promise<SizeSpec[]> {
  if (demo) return demo.fetchSizes()
  return getJson<SizeSpec[]>('/lockers/sizes/')
}
