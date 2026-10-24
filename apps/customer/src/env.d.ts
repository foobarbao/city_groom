/// <reference types="vite/client" />

/** Environment variables of the customer app, documented in `.env.example`. */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_MAP_STYLE_URL: string
  /** "true" in the standalone demo build: bundled fictitious data, no backend. */
  readonly VITE_DEMO?: string
  /** "true" in the single-page demo: embedded offline map, in-memory navigation. */
  readonly VITE_OFFLINE_MAP?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
