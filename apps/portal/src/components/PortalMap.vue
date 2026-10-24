<script setup lang="ts">
/**
 * Map of Grenoble for the portal: lockers coloured by fill rate, merchants,
 * and optionally a courier route.
 *
 * Fill rate uses one hue from light to dark (sequential), so a fuller locker
 * reads darker. The route joins stops in visiting order with straight lines:
 * it is indicative, not a street itinerary.
 *
 * Props:
 * - `lockers`: points with code, name and fill rate (0 to 1).
 * - `merchants`: points with code and name.
 * - `route`: ordered [longitude, latitude] positions, or empty.
 *
 * Emits:
 * - `select(code)`: a locker was clicked.
 */
import type { Feature, FeatureCollection, LineString, Point } from 'geojson'
import {
  AttributionControl,
  type GeoJSONSource,
  Map as MapLibreMap,
  type MapLayerMouseEvent,
  NavigationControl,
  setWorkerUrl,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

export interface MapPoint {
  code: string
  name: string
  longitude: number
  latitude: number
  fillRate?: number
}

const props = withDefaults(
  defineProps<{
    lockers: MapPoint[]
    merchants?: MapPoint[]
    route?: [number, number][]
  }>(),
  { merchants: () => [], route: () => [] },
)

const emit = defineEmits<{ select: [code: string] }>()

// MapLibre looks for its worker script next to its own module, where the
// bundler does not put it: hand it the URL of the file Vite emits.
setWorkerUrl(workerUrl)

const STYLE_URL =
  import.meta.env.VITE_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty'
const CENTER: [number, number] = [5.7245, 45.1885]

const container = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | null = null

const points = (list: MapPoint[]): FeatureCollection<Point> => ({
  type: 'FeatureCollection',
  features: list.map((p) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
    properties: { code: p.code, name: p.name, fill: p.fillRate ?? 0 },
  })),
})

const line = (route: [number, number][]): Feature<LineString> => ({
  type: 'Feature',
  geometry: { type: 'LineString', coordinates: route },
  properties: {},
})

/** Reads a design token so map layers follow the theme (MapLibre needs literal colours). */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#3f9a73'
}

onMounted(() => {
  if (!container.value) return
  map = new MapLibreMap({
    container: container.value,
    style: STYLE_URL,
    center: CENTER,
    zoom: 11.6,
    attributionControl: false,
  })
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
  map.addControl(new AttributionControl({ compact: true }), 'bottom-right')
  map.on('load', () => {
    if (!map) return
    map.addSource('route', { type: 'geojson', data: line(props.route) })
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      paint: { 'line-color': token('--cg-chart-2'), 'line-width': 3, 'line-opacity': 0.8 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    })
    map.addSource('merchants', { type: 'geojson', data: points(props.merchants) })
    map.addLayer({
      id: 'merchants',
      type: 'circle',
      source: 'merchants',
      paint: {
        'circle-radius': 6,
        'circle-color': token('--cg-chart-2'),
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    })
    map.addSource('lockers', { type: 'geojson', data: points(props.lockers) })
    map.addLayer({
      id: 'lockers',
      type: 'circle',
      source: 'lockers',
      paint: {
        'circle-radius': 8,
        // Sequential: pale leaf when empty, deep pine when full.
        'circle-color': ['interpolate', ['linear'], ['get', 'fill'], 0, '#a8d8bf', 1, '#1d4d40'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    })
    map.on('click', 'lockers', (event: MapLayerMouseEvent) => {
      const code = event.features?.[0]?.properties?.code
      if (typeof code === 'string') emit('select', code)
    })
    map.on('mouseenter', 'lockers', () => map?.getCanvas().style.setProperty('cursor', 'pointer'))
    map.on('mouseleave', 'lockers', () => map?.getCanvas().style.removeProperty('cursor'))
  })
})

watch(
  () => props.route,
  (route) => (map?.getSource('route') as GeoJSONSource | undefined)?.setData(line(route)),
)
watch(
  () => props.lockers,
  (list) => (map?.getSource('lockers') as GeoJSONSource | undefined)?.setData(points(list)),
)

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="container" class="portal-map" />
</template>

<style scoped>
.portal-map {
  width: 100%;
  height: 100%;
  min-height: 320px;
  border-radius: var(--cg-radius-l);
  overflow: hidden;
}
</style>
