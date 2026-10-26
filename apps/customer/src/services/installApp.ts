/**
 * @file Installation of the customer app on the home screen (PWA).
 *
 * Until the app is published on the Play Store, customers can add the web
 * app to their home screen: it then opens in its own window, without the
 * browser's address bar, like a native app. Web parallel: a bookmark that
 * opens as a full-screen app.
 *
 * Owner's decision (2026-10-26): an "Installer l'application" button, and no
 * install pop-up when the app opens. Chromium browsers (Chrome, Edge, Samsung
 * Internet) fire `beforeinstallprompt` and may show their own install banner;
 * the event is cancelled to suppress that banner and kept so that the button
 * can open the browser's install dialog later. Safari and Firefox have no such
 * event: the button then shows how to install from the browser's menu.
 *
 * References: https://web.dev/articles/install-criteria and
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event
 */
import { Capacitor } from '@capacitor/core'
import { reactive, readonly } from 'vue'

/** Which manual install instructions to show when no install dialog is available. */
export type InstallPlatform = 'ios' | 'android' | 'desktop'

/** Result of a click on the install button. */
export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

/**
 * Non-standard event fired by Chromium browsers when the app can be installed
 * (not in the TypeScript DOM library).
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const state = reactive({
  /** True when running as an installed app (home screen or Android app). */
  installed: false,
  /** True when the browser's install dialog can be opened by the button. */
  canPrompt: false,
})

/** Read-only install state, for components. */
export const installState = readonly(state)

let deferredPrompt: BeforeInstallPromptEvent | null = null

/**
 * Whether the app is running installed rather than in a browser tab.
 *
 * @param win - Window to inspect (a stub in tests).
 * @returns True in a home-screen window (any app display mode, or iOS's
 *   non-standard `navigator.standalone`), false in a browser tab.
 */
export function isRunningInstalled(win: Window = window): boolean {
  const appModes = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay']
  if (appModes.some((mode) => win.matchMedia?.(`(display-mode: ${mode})`).matches)) return true
  return (win.navigator as Navigator & { standalone?: boolean }).standalone === true
}

/**
 * Platform of the manual install instructions.
 *
 * @param userAgent - The browser's user agent string.
 * @param maxTouchPoints - `navigator.maxTouchPoints`: iPads report a desktop
 *   Mac user agent, recognised by their touch screen.
 * @returns `ios` for iPhone and iPad, `android` for Android, else `desktop`.
 */
export function installPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios'
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return 'ios'
  if (/Android/.test(userAgent)) return 'android'
  return 'desktop'
}

/**
 * Starts listening for the install events; called once at startup, before
 * the first screen is shown, since the browser may fire the event early.
 *
 * Side effects: cancels the browser's own install banner and records the
 * install state. In the Android app and in the single-page demo the app
 * counts as installed, so no install button is shown.
 *
 * @param win - Window to listen on (a stub in tests).
 */
export function listenForInstall(win: Window = window): void {
  if (Capacitor.isNativePlatform() || import.meta.env.VITE_OFFLINE_MAP === 'true') {
    state.installed = true
    return
  }
  state.installed = isRunningInstalled(win)
  win.addEventListener('beforeinstallprompt', (event) => {
    // No pop-up when the app opens (owner's decision): only the button installs.
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    state.canPrompt = true
  })
  win.addEventListener('appinstalled', () => {
    deferredPrompt = null
    state.canPrompt = false
    state.installed = true
  })
}

/**
 * Opens the browser's install dialog when one is available.
 *
 * @returns `accepted` or `dismissed` from the dialog, or `unavailable` when
 *   the browser offers no dialog (Safari, Firefox, or Chromium before it
 *   considers the app installable): the caller then shows the instructions.
 */
export async function promptInstall(): Promise<InstallOutcome> {
  if (!deferredPrompt) return 'unavailable'
  const event = deferredPrompt
  // A kept event can open the dialog only once.
  deferredPrompt = null
  state.canPrompt = false
  const { outcome } = await event.prompt()
  return outcome
}
