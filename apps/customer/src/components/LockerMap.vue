<script setup lang="ts">
/**
 * Map of Grenoble showing lockers, coloured by availability, and local
 * businesses as smaller markers.
 *
 * Rendered with MapLibre GL JS and OpenStreetMap-based vector tiles
 * (ADR-0002); the style's attribution control keeps the mandatory
 * OpenStreetMap credit visible.
 *
 * Props:
 * - `lockers`: GeoJSON collection from `GET /api/v1/lockers/`.
 * - `merchants`: GeoJSON collection from `GET /api/v1/merchants/` (optional).
 *
 * Emits:
 * - `select(code)`: when the user taps a locker.
 * - `unavailable`: when the map style or tiles cannot be loaded (offline,
 *   blocked network), so the page can fall back to the list of lockers.
 */
import type { LockerFeatureCollection, MerchantFeatureCollection } from '@city-groom/api-client'
import type { FeatureCollection, Point } from 'geojson'
import {
  AttributionControl,
  GeolocateControl,
  type GeoJSONSource,
  Map as MapLibreMap,
  type MapLayerMouseEvent,
  NavigationControl,
  setWorkerUrl,
  type StyleSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { DEFAULT_MAP_ZOOM, GRENOBLE_CENTER, MAP_STYLE_URL } from '../config'

const props = defineProps<{
  /** Lockers to display. */
  lockers: LockerFeatureCollection
  /** Local businesses to display. */
  merchants?: MerchantFeatureCollection
}>()

const emit = defineEmits<{
  /** A locker was tapped; payload is its code. */
  select: [code: string]
  /** The base map could not be loaded. */
  unavailable: []
}>()

const SOURCE_ID = 'lockers'
const MERCHANTS_SOURCE_ID = 'merchants'
const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }
const container = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | null = null

/** Adds a `free_total` property used to colour markers by availability. */
function withTotals(collection: LockerFeatureCollection): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: (collection.features ?? []).map((feature) => {
      const free = Object.values(feature.properties?.free_by_size ?? {}).reduce((a, b) => a + b, 0)
      return {
        type: 'Feature',
        geometry: feature.geometry as Point,
        properties: { ...feature.properties, free_total: free },
      }
    }),
  }
}

/** Style to draw: the configured URL, or the embedded offline map in the demo build. */
async function resolveStyle(): Promise<string | StyleSpecification | null> {
  // Tested inline (not through config) so the bundler can drop the offline
  // map, about 10 MB, from every build that does not embed it.
  if (import.meta.env.VITE_OFFLINE_MAP !== 'true') {
    // MapLibre looks for its worker script next to its own module, where the
    // bundler does not put it: hand it the URL of the file Vite emits.
    const { default: workerUrl } = await import('maplibre-gl/dist/maplibre-gl-worker.mjs?url')
    setWorkerUrl(workerUrl)
    return MAP_STYLE_URL
  }
  const { loadOfflineStyle } = await import('../demo/offlineMap')
  return loadOfflineStyle()
}

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  const style = await resolveStyle()
  if (!container.value) return
  if (!style) {
    emit('unavailable')
    return
  }
  map = new MapLibreMap({
    container: container.value,
    style,
    center: GRENOBLE_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
    // Re-added below in a corner the bottom sheet does not cover.
    attributionControl: false,
  })
  // Inside the tab bar, the page may be laid out after the map is created:
  // follow the container's size so the map always fills it.
  resizeObserver = new ResizeObserver(() => map?.resize())
  resizeObserver.observe(container.value)
  let loaded = false
  map.on('error', () => {
    // Before the first load, an error means the style itself is unreachable.
    if (!loaded) emit('unavailable')
  })
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
  map.addControl(
    new GeolocateControl({ positionOptions: { enableHighAccuracy: true } }),
    'top-right',
  )
  // Mandatory OpenStreetMap credit (ODbL), always visible on one line, placed
  // under the welcome card (see `.locker-map` styles) so that neither the card
  // nor the bottom sheet hides it.
  map.addControl(new AttributionControl({ compact: false }), 'top-left')

  map.on('load', () => {
    loaded = true
    if (!map) return
    // Businesses are drawn first so lockers stay on top.
    map.addSource(MERCHANTS_SOURCE_ID, {
      type: 'geojson',
      data: (props.merchants as FeatureCollection | undefined) ?? EMPTY,
    })
    map.addLayer({
      id: 'merchants-circle',
      type: 'circle',
      source: MERCHANTS_SOURCE_ID,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3, 16, 7],
        'circle-color': '#e0a43c',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    })
    map.addSource(SOURCE_ID, { type: 'geojson', data: withTotals(props.lockers) })
    map.addLayer({
      id: 'lockers-circle',
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 7, 16, 15],
        // Leaf green when compartments are free, soft grey when the locker is full.
        'circle-color': ['case', ['>', ['get', 'free_total'], 0], '#3f9a73', '#a9b8b1'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
        'circle-blur': 0.05,
      },
    })
    map.addLayer({
      id: 'lockers-label',
      type: 'symbol',
      source: SOURCE_ID,
      minzoom: 13,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 12,
        'text-offset': [0, 1.4],
        'text-anchor': 'top',
      },
      paint: { 'text-color': '#203a33', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
    })
    map.on('click', 'lockers-circle', (event: MapLayerMouseEvent) => {
      const code = event.features?.[0]?.properties?.code
      if (typeof code === 'string') emit('select', code)
    })
    map.on('mouseenter', 'lockers-circle', () =>
      map?.getCanvas().style.setProperty('cursor', 'pointer'),
    )
    map.on('mouseleave', 'lockers-circle', () => map?.getCanvas().style.removeProperty('cursor'))
  })
})

watch(
  () => props.lockers,
  (lockers) => {
    const source = map?.getSource(SOURCE_ID) as GeoJSONSource | undefined
    source?.setData(withTotals(lockers))
  },
)

watch(
  () => props.merchants,
  (merchants) => {
    const source = map?.getSource(MERCHANTS_SOURCE_ID) as GeoJSONSource | undefined
    source?.setData((merchants as FeatureCollection | undefined) ?? EMPTY)
  },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="container" class="locker-map" />
</template>

<style scoped>
.locker-map {
  position: absolute;
  inset: 0;
}
/* The credit sits under the welcome card of the map screen (about 130 px). */
.locker-map :deep(.maplibregl-ctrl-top-left) {
  top: calc(132px + env(safe-area-inset-top, 0px));
  right: 64px;
}
.locker-map :deep(.maplibregl-ctrl-attrib) {
  margin: 0 0 0 14px;
  border-radius: var(--cg-radius-pill);
  font-size: 10px;
}
</style>
