/// <reference types="vite/client" />

/** Environment variables of the customer app, documented in `.env.example`. */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_MAP_STYLE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
