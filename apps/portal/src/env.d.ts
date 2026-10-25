/// <reference types="vite/client" />

/** Environment variables of the portal. */
interface ImportMetaEnv {
  /** "true" in the demo builds: bundled data (`@city-groom/demo-data`), no backend. */
  readonly VITE_DEMO?: string
  /** MapLibre style URL; defaults to OpenFreeMap (ADR-0002). */
  readonly VITE_MAP_STYLE_URL?: string
  /** URL of the customer app, linked from the home page. */
  readonly VITE_CUSTOMER_URL?: string
  /** OAuth web client ID (same as the customer app) for Google Agenda sync; empty: off. */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
