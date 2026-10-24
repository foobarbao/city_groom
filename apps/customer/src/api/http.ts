/**
 * @file Minimal HTTP client for the backend API.
 *
 * Wraps `fetch` to turn failures into typed errors that views can translate
 * into French messages for the user.
 */
import { API_BASE_URL } from '../config'

/** The API answered with an error status (>= 400). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
  ) {
    super(`API error ${status} on ${path}`)
    this.name = 'ApiError'
  }
}

/** The API could not be reached (offline device, server down, CORS…). */
export class NetworkError extends Error {
  constructor(
    readonly path: string,
    cause: unknown,
  ) {
    super(`Network error on ${path}`, { cause })
    this.name = 'NetworkError'
  }
}

/**
 * Sends a GET request to the API and decodes the JSON response.
 *
 * @param path - Path relative to the API base URL, starting with `/`.
 * @param params - Optional query string parameters.
 * @returns The decoded JSON body.
 * @throws {ApiError} If the API responds with a status >= 400.
 * @throws {NetworkError} If the request cannot be sent or the connection fails.
 */
export async function getJson<T>(path: string, params?: Record<string, string>): Promise<T> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : ''
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}${query}`, {
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    throw new NetworkError(path, error)
  }
  if (!response.ok) {
    throw new ApiError(response.status, path)
  }
  return (await response.json()) as T
}
