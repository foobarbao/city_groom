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

/**
 * Sends a JSON request (POST by default) to the API and decodes the JSON
 * response, if any.
 *
 * @param path - Path relative to the API base URL, starting with `/`.
 * @param body - Request body, sent as JSON; omitted when undefined.
 * @param token - Token of the signed-in user, sent as `Authorization: Token …`.
 * @param method - HTTP method (POST by default, PATCH to change a resource,
 *   DELETE to remove one).
 * @returns The decoded JSON body, or `undefined` for an empty response (204).
 * @throws {ApiError} If the API responds with a status >= 400.
 * @throws {NetworkError} If the request cannot be sent or the connection fails.
 */
export async function sendJson<T>(
  path: string,
  body?: unknown,
  token?: string,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST',
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Token ${token}`
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    throw new NetworkError(path, error)
  }
  if (!response.ok) {
    throw new ApiError(response.status, path)
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}
