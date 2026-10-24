/**
 * @file Vite configuration of the partner portal (build, dev server, tests).
 *
 * `vite build --mode demo-site` builds the portal of the hosted demo, served
 * under `/pro/` with bundled data (`.env.demo-site`, docs/DEMO.md).
 */
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  base: mode === 'demo-site' ? '/pro/' : '/',
  build: mode === 'demo-site' ? { outDir: 'dist-demo-site' } : {},
  server: { port: 5174 },
  test: { environment: 'jsdom' },
}))
