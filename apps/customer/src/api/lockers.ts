/**
 * @file Access to the public locker endpoints of the API.
 */
import type { LockerFeatureCollection, LockerLayout, SizeSpec } from '@city-groom/api-client'

import { getJson } from './http'

/**
 * Fetches all in-service lockers as GeoJSON, with free compartments per size.
 *
 * @throws {ApiError | NetworkError} See {@link getJson}.
 */
export function fetchLockers(): Promise<LockerFeatureCollection> {
  return getJson<LockerFeatureCollection>('/lockers/')
}

/**
 * Fetches the front layout of one locker (columns, doors, sizes).
 *
 * @param code - Locker code, as found in the map features.
 * @throws {ApiError} With status 404 if the locker does not exist or is not in service.
 */
export function fetchLocker(code: string): Promise<LockerLayout> {
  return getJson<LockerLayout>(`/lockers/${encodeURIComponent(code)}/`)
}

/** Fetches the compartment size catalogue (dimensions and examples of items). */
export function fetchSizes(): Promise<SizeSpec[]> {
  return getJson<SizeSpec[]>('/lockers/sizes/')
}
