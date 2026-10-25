/**
 * @file "Continuer avec Google" button, with Google Identity Services (GIS).
 *
 * GIS is Google's library for "Sign in with Google" on the web
 * (https://developers.google.com/identity/gsi/web). It renders Google's
 * button and returns an ID token (JWT) signed by Google; the app sends it to
 * the API, which verifies it (backend `apps/accounts/google.py`). The app
 * itself never trusts the token's content.
 *
 * Only the types used here are declared. The script is loaded on demand,
 * from Google, when the account screen needs the button.
 *
 * PROD: Google does not allow this web sign-in inside the Android app's web
 * view (ASSUMPTION based on Google's policy against sign-in in embedded web
 * views, to be confirmed on a device). The native app will need a Capacitor
 * plugin using Android's Credential Manager; the button is hidden there.
 */
import { Capacitor } from '@capacitor/core'

import { GOOGLE_CLIENT_ID } from '../config'

const SCRIPT_URL = 'https://accounts.google.com/gsi/client'

interface CredentialResponse {
  credential: string
}

interface GoogleIdentity {
  initialize(config: {
    client_id: string
    callback: (response: CredentialResponse) => void
    auto_select?: boolean
  }): void
  renderButton(
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      locale?: string
      width?: number
    },
  ): void
  disableAutoSelect(): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } }
  }
}

/** Whether "Continuer avec Google" can be offered on this device. */
export const googleSignInAvailable = (): boolean =>
  GOOGLE_CLIENT_ID !== '' && !Capacitor.isNativePlatform()

let loading: Promise<GoogleIdentity> | null = null

/** Loads the GIS script once. */
function loadGis(): Promise<GoogleIdentity> {
  loading ??= new Promise<GoogleIdentity>((resolve, reject) => {
    if (window.google) return resolve(window.google.accounts.id)
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () =>
      window.google ? resolve(window.google.accounts.id) : reject(new Error('GIS missing'))
    script.onerror = () => {
      loading = null // allow a retry, e.g. after going back online
      reject(new Error('GIS script failed to load'))
    }
    document.head.append(script)
  })
  return loading
}

/**
 * Renders Google's button in `parent`; `onCredential` receives the ID token
 * when the person has chosen their Google account.
 *
 * @throws {Error} If the Google script cannot be loaded (offline, blocked).
 */
export async function renderGoogleButton(
  parent: HTMLElement,
  onCredential: (credential: string) => void,
): Promise<void> {
  const gis = await loadGis()
  gis.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => onCredential(response.credential),
  })
  gis.renderButton(parent, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    locale: 'fr',
  })
}

/** After signing out, stops Google from signing the person in again automatically. */
export function forgetGoogleSession(): void {
  window.google?.accounts.id.disableAutoSelect()
}
