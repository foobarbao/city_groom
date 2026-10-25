/**
 * @file Google permission for the Google Agenda sync, with Google Identity
 * Services' token model (https://developers.google.com/identity/oauth2/web/guides/use-token-model).
 *
 * The token model gives the browser a short-lived access token (about an
 * hour) for the requested scope, after Google's consent screen. A new token
 * needs a user action (a click), so the token is kept in memory only and
 * the planning asks to reconnect when it has expired.
 */
const SCRIPT_URL = 'https://accounts.google.com/gsi/client'

/** OAuth web client ID, shared with the customer app's sign-in (ADR-0010). */
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
}

interface TokenClient {
  requestAccessToken(override?: { prompt?: string }): void
}

interface GoogleOAuth2 {
  initTokenClient(config: {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
    error_callback?: (error: { type: string }) => void
  }): TokenClient
  revoke(token: string, done?: () => void): void
}

declare global {
  interface Window {
    google?: { accounts: { oauth2?: GoogleOAuth2 } }
  }
}

let loading: Promise<GoogleOAuth2> | null = null
let current: { token: string; expiresAt: number } | null = null

function loadGis(): Promise<GoogleOAuth2> {
  loading ??= new Promise<GoogleOAuth2>((resolve, reject) => {
    const ready = (): void => {
      const oauth2 = window.google?.accounts.oauth2
      if (oauth2) resolve(oauth2)
      else reject(new Error('GIS missing'))
    }
    if (window.google?.accounts.oauth2) return ready()
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = ready
    script.onerror = () => {
      loading = null // allow a retry
      reject(new Error('GIS script failed to load'))
    }
    document.head.append(script)
  })
  return loading
}

/** Access token still valid (with a one-minute margin), if any. */
export function validToken(now: number = Date.now()): string | null {
  return current && current.expiresAt - 60_000 > now ? current.token : null
}

/**
 * Asks Google for an access token (consent screen the first time). Must be
 * called from a click.
 *
 * @throws {Error} If the script cannot load, or the merchant refuses.
 */
export async function requestToken(scope: string): Promise<string> {
  const oauth2 = await loadGis()
  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope,
      callback: (response) => {
        if (!response.access_token) return reject(new Error(response.error ?? 'no token'))
        current = {
          token: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
        }
        resolve(response.access_token)
      },
      error_callback: (error) => reject(new Error(error.type)),
    })
    client.requestAccessToken()
  })
}

/** Withdraws the permission given to CityPal and forgets the token. */
export function revokeToken(): void {
  const token = current?.token
  current = null
  if (token) window.google?.accounts.oauth2?.revoke(token)
}
