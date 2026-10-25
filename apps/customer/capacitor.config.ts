/**
 * @file Capacitor configuration: packages the web app as an Android app.
 *
 * `appId` is the permanent Android application id. "fr.citypal.app" is
 * PROVISIONAL (product name "CityPal" chosen for now, domain not bought yet,
 * docs/PRODUCT.md). It can change freely until the first Play Store
 * publication, after which it is permanent.
 * PROD: confirm the application id before the first store publication.
 */
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'fr.citypal.app',
  appName: 'CityPal',
  webDir: 'dist',
}

export default config
