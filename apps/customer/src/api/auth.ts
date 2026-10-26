/**
 * @file Customer sign-in endpoints of the API (ADR-0010).
 *
 * Unlike the rest of the demo, these calls always reach the real backend: the
 * sign-in with Google is real as soon as it is configured.
 */
import type { Me, SignInResponse, UpcomingOffer } from '@city-groom/api-client'

import { sendJson } from './http'

/**
 * Exchanges the ID token returned by Google for a CityPal token and profile.
 *
 * @param credential - Google ID token (JWT) from Google Identity Services.
 * @param announcements - The person ticked the box to receive announcements
 *   (false never withdraws an earlier agreement).
 * @throws {ApiError} With status 400 if the token or the Google account is refused.
 */
export function signInWithGoogle(
  credential: string,
  announcements = false,
): Promise<SignInResponse> {
  return sendJson<SignInResponse>('/auth/google/', { credential, announcements })
}

/**
 * Records the user's agreement to receive CityPal announcements, or its
 * withdrawal.
 *
 * @throws {ApiError | NetworkError} See {@link sendJson}.
 */
export function updateAnnouncements(token: string, announcements: boolean): Promise<Me> {
  return sendJson<Me>('/auth/me/', { announcements }, token, 'PATCH')
}

/**
 * Records that the user is interested in an offer announced as coming soon
 * ("Ça m'intéresse"); registering twice keeps one record.
 *
 * @throws {ApiError | NetworkError} See {@link sendJson}.
 */
export function registerInterest(token: string, offer: UpcomingOffer): Promise<Me> {
  return sendJson<Me>('/auth/me/interests/', { offer }, token)
}

/**
 * Withdraws the user's interest in an upcoming offer.
 *
 * @throws {ApiError | NetworkError} See {@link sendJson}.
 */
export function withdrawInterest(token: string, offer: UpcomingOffer): Promise<Me> {
  return sendJson<Me>(`/auth/me/interests/${offer}/`, undefined, token, 'DELETE')
}

/**
 * Ends the session on the server: the token stops working.
 *
 * @throws {ApiError | NetworkError} See {@link sendJson}.
 */
export function signOutFromApi(token: string): Promise<void> {
  return sendJson<void>('/auth/sign-out/', undefined, token)
}
