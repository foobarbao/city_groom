/**
 * @file Customer sign-in endpoints of the API (ADR-0010).
 *
 * Unlike the rest of the demo, these calls always reach the real backend: the
 * sign-in with Google is real as soon as it is configured.
 */
import type { SignInResponse } from '@city-groom/api-client'

import { sendJson } from './http'

/**
 * Exchanges the ID token returned by Google for a CityPal token and profile.
 *
 * @param credential - Google ID token (JWT) from Google Identity Services.
 * @throws {ApiError} With status 400 if the token or the Google account is refused.
 */
export function signInWithGoogle(credential: string): Promise<SignInResponse> {
  return sendJson<SignInResponse>('/auth/google/', { credential })
}

/**
 * Ends the session on the server: the token stops working.
 *
 * @throws {ApiError | NetworkError} See {@link sendJson}.
 */
export function signOutFromApi(token: string): Promise<void> {
  return sendJson<void>('/auth/sign-out/', undefined, token)
}
