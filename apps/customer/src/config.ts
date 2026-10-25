/**
 * @file Runtime configuration read from Vite environment variables.
 *
 * Centralised here so that no URL is hard-coded elsewhere in the app
 * (CODING_STANDARDS.md §7). Variables are documented in `.env.example`.
 */

/** Base URL of the backend API, without trailing slash. */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

/** MapLibre style URL used by every map. */
export const MAP_STYLE_URL: string =
  import.meta.env.VITE_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty'

/** True in the standalone demo build (bundled data, embedded offline map). */
export const IS_DEMO = import.meta.env.VITE_DEMO === 'true'

/**
 * True in the single-page demo published as an artifact: map embedded (no
 * external requests allowed) and in-memory navigation (no URL paths).
 */
export const IS_SINGLE_PAGE_DEMO = import.meta.env.VITE_OFFLINE_MAP === 'true'

/** Whether a base map can be shown: a style URL, or the embedded offline map. */
export const HAS_MAP = MAP_STYLE_URL !== '' || IS_SINGLE_PAGE_DEMO

/**
 * OAuth web client ID used by "Continuer avec Google" (ADR-0010). Public
 * value. Empty: the app keeps the demo sign-in.
 */
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

/** Initial map view: centre of Grenoble. */
export const GRENOBLE_CENTER: [lng: number, lat: number] = [5.7245, 45.1885]
export const DEFAULT_MAP_ZOOM = 12.5
