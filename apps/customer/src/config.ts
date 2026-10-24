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

/** Initial map view: centre of Grenoble. */
export const GRENOBLE_CENTER: [lng: number, lat: number] = [5.7245, 45.1885]
export const DEFAULT_MAP_ZOOM = 12.5
