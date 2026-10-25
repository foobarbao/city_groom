/**
 * @file Access to the public merchant endpoint of the API.
 *
 * In the standalone demo build (`VITE_DEMO=true`), the bundled data is used
 * instead (`src/demo/`).
 */
import type { MerchantFeatureCollection } from '@city-groom/api-client'

import { getJson } from './http'

const IS_DEMO = import.meta.env.VITE_DEMO === 'true'
const demo = IS_DEMO ? await import('../demo/demoApi') : null

/**
 * Fetches local businesses offering locker-compatible services, as GeoJSON.
 *
 * @throws {ApiError | NetworkError} See {@link getJson}.
 */
export function fetchMerchants(): Promise<MerchantFeatureCollection> {
  if (demo) return demo.fetchMerchants()
  return getJson<MerchantFeatureCollection>('/merchants/')
}
