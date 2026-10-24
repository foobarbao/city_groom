/**
 * @file Locker API answered from bundled fictitious data, for the standalone
 * demo build (`VITE_DEMO=true`). Same signatures as `api/lockers.ts`.
 *
 * Data comes from `fixtures.json` (see `src/demo/README.md`).
 */
import type { LockerFeatureCollection, LockerLayout, SizeSpec } from '@city-groom/api-client'

import { ApiError } from '../api/http'
import fixtures from './fixtures.json'

/** Short artificial delay so loading states are visible, as with a real network. */
const DEMO_LATENCY_MS = 250

function later<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DEMO_LATENCY_MS))
}

/** See `fetchLockers` in `api/lockers.ts`. */
export function fetchLockers(): Promise<LockerFeatureCollection> {
  return later(fixtures.lockers as LockerFeatureCollection)
}

/**
 * See `fetchLocker` in `api/lockers.ts`.
 *
 * @throws {ApiError} With status 404 for an unknown code, like the real API.
 */
export function fetchLocker(code: string): Promise<LockerLayout> {
  const details = fixtures.details as Record<string, LockerLayout>
  const locker = details[code]
  return locker ? later(locker) : Promise.reject(new ApiError(404, `/lockers/${code}/`))
}

/** See `fetchSizes` in `api/lockers.ts`. */
export function fetchSizes(): Promise<SizeSpec[]> {
  return later(fixtures.sizes as SizeSpec[])
}
