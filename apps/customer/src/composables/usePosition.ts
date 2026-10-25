/**
 * @file The customer's position, from the browser's geolocation.
 *
 * The position is only requested when the customer asks for it (opening
 * "Casiers autour de moi" or tapping "Près de moi"); the browser, or the
 * phone, then asks for permission. Shared by every screen, kept in memory
 * only (never stored nor sent anywhere).
 *
 * PROD: in the Android app, use the Capacitor geolocation plugin, which
 * handles the Android location permission (docs/BUILD_AND_RELEASE.md).
 */
import { computed, ref } from 'vue'

import { GRENOBLE_CENTER } from '../config'
import type { LngLat } from '../domain/geo'

export type PositionStatus = 'idle' | 'locating' | 'located' | 'denied' | 'unavailable'

const status = ref<PositionStatus>('idle')
const position = ref<LngLat | null>(null)

/** Gives up after this delay, e.g. indoors without GPS. */
const TIMEOUT_MS = 10_000
/** A position up to one minute old is fine to find nearby lockers. */
const MAX_AGE_MS = 60_000

/** Asks the device for the current position. */
function locate(): void {
  if (!('geolocation' in navigator)) {
    status.value = 'unavailable'
    return
  }
  status.value = 'locating'
  navigator.geolocation.getCurrentPosition(
    (p) => {
      position.value = [p.coords.longitude, p.coords.latitude]
      status.value = 'located'
    },
    (error) => {
      status.value = error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'
    },
    { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: MAX_AGE_MS },
  )
}

/**
 * Position of the customer, or the centre of Grenoble until it is known.
 *
 * @example
 * const { origin, status, locate } = usePosition()
 * onMounted(locate)
 */
export function usePosition() {
  return {
    status,
    position,
    /** Where distances are measured from: the customer, or the city centre. */
    origin: computed<LngLat>(() => position.value ?? GRENOBLE_CENTER),
    locate,
  }
}
