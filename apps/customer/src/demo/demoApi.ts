/**
 * @file Locker and merchant API answered from the bundled demo dataset, for
 * the demo builds (`VITE_DEMO=true`). Same signatures as `api/lockers.ts` and
 * `api/merchants.ts`.
 *
 * Data comes from `@city-groom/demo-data` (packages/demo-data/README.md):
 * simulated lockers at real tram stops, real businesses from OpenStreetMap.
 */
import type {
  LockerFeatureCollection,
  LockerLayout,
  MerchantFeatureCollection,
  SizeSpec,
} from '@city-groom/api-client'

import { ApiError } from '../api/http'
import { publicData } from '@city-groom/demo-data'

/** Short artificial delay so loading states are visible, as with a real network. */
const DEMO_LATENCY_MS = 250

function later<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DEMO_LATENCY_MS))
}

/** See `fetchLockers` in `api/lockers.ts`. */
export function fetchLockers(): Promise<LockerFeatureCollection> {
  return later(publicData.lockers)
}

/**
 * See `fetchLocker` in `api/lockers.ts`.
 *
 * @throws {ApiError} With status 404 for an unknown code, like the real API.
 */
export function fetchLocker(code: string): Promise<LockerLayout> {
  const locker = publicData.details[code]
  return locker ? later(locker) : Promise.reject(new ApiError(404, `/lockers/${code}/`))
}

/** See `fetchSizes` in `api/lockers.ts`. */
export function fetchSizes(): Promise<SizeSpec[]> {
  return later(publicData.sizes)
}

/** See `fetchMerchants` in `api/merchants.ts`. */
export function fetchMerchants(): Promise<MerchantFeatureCollection> {
  return later(publicData.merchants)
}
