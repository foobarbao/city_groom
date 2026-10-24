/**
 * @file Public entry point of the API client package.
 *
 * `schema.d.ts` is generated from the backend OpenAPI schema with
 * `npm run generate -w packages/api-client`; never edit it by hand. This file
 * only re-exports convenient aliases of the generated types.
 */

import type { components } from './schema'

type Schemas = components['schemas']

/** GeoJSON collection of lockers, as returned by `GET /api/lockers/`. */
export type LockerFeatureCollection = Schemas['LockerFeatureList']
/** One locker on the map. */
export type LockerFeature = Schemas['LockerFeature']
/** Full description of a locker front, from `GET /api/lockers/{code}/`. */
export type LockerLayout = Schemas['LockerLayout']
/** Compartment position and size, without status (public). */
export type PublicCompartment = Schemas['PublicCompartment']
/** Locker front with per-door status (operators only). */
export type OperatorLockerLayout = Schemas['OperatorLockerLayout']
/** Compartment size characteristics, from `GET /api/lockers/sizes/`. */
export type SizeSpec = Schemas['SizeSpec']
/** Compartment size codes. */
export type CompartmentSize = Schemas['SizeEnum']
/** Opening methods of a locker. */
export type AccessMethod = Schemas['AccessMethodEnum']

export type { components, paths } from './schema'
