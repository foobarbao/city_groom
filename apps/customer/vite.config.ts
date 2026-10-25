/**
 * @file Vite configuration of the customer app (build, dev server, tests).
 *
 * Demo builds use bundled fictitious data (`src/demo/`), no backend:
 * - `vite build --mode demo` (npm run build:demo): one self-contained HTML file
 *   in `dist-demo/`, with an embedded offline map (`.env.demo`);
 * - `vite build --mode demo-site` (npm run build:demo-site): a regular static
 *   site in `dist-demo-site/` for hosting, with the live map (`.env.demo-site`),
 *   served under `/client/` next to the partner portal (docs/DEMO.md).
 */
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  plugins: mode === 'demo' ? [vue(), viteSingleFile()] : [vue()],
  base: mode === 'demo-site' ? '/client/' : '/',
  build:
    mode === 'demo'
      ? { outDir: 'dist-demo' }
      : mode === 'demo-site'
        ? { outDir: 'dist-demo-site' }
        : {},
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    // Shared logic is tested in packages/ui and packages/demo-data.
    passWithNoTests: true,
  },
}))
