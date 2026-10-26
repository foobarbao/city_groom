/**
 * @file Assembles the hosted demo site (docs/DEMO.md) from the demo-site
 * builds of the apps:
 *
 * - `/client/`: customer app (`apps/customer/dist-demo-site`);
 * - `/pro/`: partner portal, whose home page is the demo home
 *   (`apps/portal/dist-demo-site`);
 * - `/`: redirects to the customer app (owner, 2026-10-25: visitors land on
 *   CityPal itself, with the Google sign-in at hand);
 * - `pro.citypal.fr`: redirects to `/pro/` on the main domain, so partners
 *   get a short address (the domain must be added to the Netlify site).
 *
 * Output: `dist-demo-site/` at the repository root, published by Netlify
 * (`netlify.toml`). Run through `npm run build:demo-site`.
 */
import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist-demo-site')

const parts = [
  { from: 'apps/customer/dist-demo-site', to: 'client' },
  { from: 'apps/portal/dist-demo-site', to: 'pro' },
]

rmSync(out, { recursive: true, force: true })
for (const { from, to } of parts) {
  const source = join(root, from)
  if (!existsSync(source)) throw new Error(`Missing build: ${from} (build the app first)`)
  cpSync(source, join(out, to), { recursive: true })
}

// Netlify redirect rules (https://docs.netlify.com/routing/redirects/):
// the partner subdomain first (domain-level rules, one per scheme), then
// the home page; both apps use path-based routing, so unknown paths serve
// their index.html.
const rules = [
  'http://pro.citypal.fr/* https://citypal.fr/pro/:splat 301!',
  'https://pro.citypal.fr/* https://citypal.fr/pro/:splat 301!',
  '/ /client/ 302',
  // Short address of the privacy policy, given to Google's consent screen.
  '/confidentialite /client/confidentialite 301',
  '/client/* /client/index.html 200',
  '/pro/* /pro/index.html 200',
]
writeFileSync(join(out, '_redirects'), [...rules, ''].join('\n'))
console.log(`Demo site assembled in ${out}`)
