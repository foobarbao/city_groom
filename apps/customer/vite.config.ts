/**
 * @file Vite configuration of the customer app (build, dev server, tests).
 *
 * `vite build --mode demo` (npm run build:demo) produces the standalone demo:
 * one self-contained HTML file in `dist-demo/`, with bundled fictitious data
 * (`.env.demo`, `src/demo/`).
 */
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  plugins: mode === 'demo' ? [vue(), viteSingleFile()] : [vue()],
  build: mode === 'demo' ? { outDir: 'dist-demo' } : {},
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
  },
}))
