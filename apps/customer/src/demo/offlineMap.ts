/**
 * @file Offline map for the standalone demo build.
 *
 * The demo is published as a single page that cannot load external resources,
 * so map tiles, fonts and icons are embedded (``offline-map.json``, produced by
 * ``scripts/fetch_offline_map.py``) and served to MapLibre through a custom
 * ``offline://`` protocol. MapLibre's worker script is also embedded and
 * started from a blob URL, since the page has no separate files.
 *
 * Map data © OpenStreetMap contributors (ODbL), tiles © OpenMapTiles,
 * OpenFreeMap.
 */
import { addProtocol, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import workerSource from 'maplibre-gl/dist/maplibre-gl-worker.mjs?raw'

/** Content of ``offline-map.json``; binary items are gzipped then base64-encoded. */
interface OfflineBundle {
  style: StyleSpecification
  tiles: Record<string, string>
  glyphs: Record<string, string>
  sprite: { json: object; png: string }
}

// The extract is generated on demand and git-ignored: a glob tolerates its
// absence, in which case the demo falls back to the list of lockers.
const bundles = import.meta.glob<OfflineBundle>('./offline-map.json', { import: 'default' })

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Decode an embedded item: base64, then gunzip with the browser's native stream API. */
async function unpack(base64: string): Promise<ArrayBuffer> {
  const stream = new Blob([base64ToBytes(base64)])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).arrayBuffer()
}

/**
 * Prepares MapLibre to draw the embedded map and returns its style.
 *
 * @returns The offline style, or null when the extract was not generated.
 */
export async function loadOfflineStyle(): Promise<StyleSpecification | null> {
  const loader = Object.values(bundles)[0]
  if (!loader) return null
  const bundle = await loader()

  setWorkerUrl(URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' })))

  addProtocol('offline', async (params) => {
    const [kind, ...rest] = params.url.replace('offline://', '').split('/')
    const key = decodeURIComponent(rest.join('/'))
    if (kind === 'tiles') {
      const tile = bundle.tiles[key]
      // Outside the extract: an empty tile draws nothing instead of failing.
      return { data: tile ? await unpack(tile) : new ArrayBuffer(0) }
    }
    if (kind === 'glyphs') {
      const glyphs = bundle.glyphs[key]
      if (!glyphs) throw new Error(`Glyphs not embedded: ${key}`)
      return { data: await unpack(glyphs) }
    }
    if (kind === 'sprite') {
      // Only the high-resolution sprite is embedded; MapLibre scales it as needed.
      if (key.endsWith('.json')) return { data: bundle.sprite.json }
      return { data: base64ToBytes(bundle.sprite.png).buffer }
    }
    throw new Error(`Unknown offline resource: ${params.url}`)
  })

  return bundle.style
}
