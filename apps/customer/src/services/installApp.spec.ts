/**
 * Tests of the home-screen installation (PWA): detection of the installed
 * app, instructions per platform, and the browser's install dialog.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type * as InstallModule from './installApp'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }))

/** A window stub with a chosen display mode and an event target. */
function fakeWindow(displayMode = 'browser', standalone?: boolean): Window {
  const target = new EventTarget()
  return Object.assign(target, {
    matchMedia: (query: string) => ({ matches: query === `(display-mode: ${displayMode})` }),
    navigator: { standalone },
  }) as unknown as Window
}

/** A `beforeinstallprompt` event whose dialog answers `outcome`. */
function installEvent(outcome: 'accepted' | 'dismissed') {
  const event = new Event('beforeinstallprompt', { cancelable: true })
  return Object.assign(event, { prompt: vi.fn(() => Promise.resolve({ outcome })) })
}

let install: typeof InstallModule

beforeEach(async () => {
  // Fresh module state for each test.
  vi.resetModules()
  install = await import('./installApp')
})

describe('isRunningInstalled', () => {
  it('is false in a browser tab', () => {
    expect(install.isRunningInstalled(fakeWindow())).toBe(false)
  })

  it('is true in a home-screen window', () => {
    expect(install.isRunningInstalled(fakeWindow('standalone'))).toBe(true)
    expect(install.isRunningInstalled(fakeWindow('minimal-ui'))).toBe(true)
  })

  it('is true on an iOS home screen', () => {
    expect(install.isRunningInstalled(fakeWindow('browser', true))).toBe(true)
  })
})

describe('installPlatform', () => {
  it('recognises iPhone, iPad and Android', () => {
    expect(install.installPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe(
      'ios',
    )
    expect(install.installPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(
      'ios',
    )
    expect(install.installPlatform('Mozilla/5.0 (Linux; Android 15; Pixel 9)')).toBe('android')
  })

  it('falls back to desktop', () => {
    expect(install.installPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(
      'desktop',
    )
    expect(install.installPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('desktop')
  })
})

describe('install dialog', () => {
  it('is unavailable until the browser offers it', async () => {
    install.listenForInstall(fakeWindow())
    expect(install.installState.canPrompt).toBe(false)
    expect(await install.promptInstall()).toBe('unavailable')
  })

  it('suppresses the browser banner and opens the dialog from the button only', async () => {
    const win = fakeWindow()
    install.listenForInstall(win)
    const event = installEvent('accepted')
    win.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(event.prompt).not.toHaveBeenCalled()
    expect(install.installState.canPrompt).toBe(true)

    expect(await install.promptInstall()).toBe('accepted')
    expect(event.prompt).toHaveBeenCalledOnce()
    // The kept event is used once.
    expect(install.installState.canPrompt).toBe(false)
    expect(await install.promptInstall()).toBe('unavailable')
  })

  it('reports a dismissed dialog', async () => {
    const win = fakeWindow()
    install.listenForInstall(win)
    win.dispatchEvent(installEvent('dismissed'))
    expect(await install.promptInstall()).toBe('dismissed')
  })

  it('counts the app as installed once the browser installs it', () => {
    const win = fakeWindow()
    install.listenForInstall(win)
    expect(install.installState.installed).toBe(false)
    win.dispatchEvent(new Event('appinstalled'))
    expect(install.installState.installed).toBe(true)
  })

  it('counts the app as installed when opened from the home screen', () => {
    install.listenForInstall(fakeWindow('standalone'))
    expect(install.installState.installed).toBe(true)
  })
})
