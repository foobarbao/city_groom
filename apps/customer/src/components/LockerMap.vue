<script setup lang="ts">
/**
 * Map of Grenoble showing lockers, coloured by availability.
 *
 * Rendered with MapLibre GL JS and OpenStreetMap-based vector tiles
 * (ADR-0002); the style's attribution control keeps the mandatory
 * OpenStreetMap credit visible.
 *
 * Props:
 * - `lockers`: GeoJSON collection from `GET /api/lockers/`.
 *
 * Emits:
 * - `select(code)`: when the user taps a locker.
 */
import type { LockerFeatureCollection } from '@city-groom/api-client'
import type { FeatureCollection, Point } from 'geojson'
import {
  GeolocateControl,
  type GeoJSONSource,
  Map as MapLibreMap,
  type MapLayerMouseEvent,
  NavigationControl,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { DEFAULT_MAP_ZOOM, GRENOBLE_CENTER, MAP_STYLE_URL } from '../config'

const props = defineProps<{
  /** Lockers to display. */
  lockers: LockerFeatureCollection
}>()

const emit = defineEmits<{
  /** A locker was tapped; payload is its code. */
  select: [code: string]
}>()

const SOURCE_ID = 'lockers'
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

onMounted(() => {
  if (!container.value) return
  map = new MapLibreMap({
    container: container.value,
    style: MAP_STYLE_URL,
    center: GRENOBLE_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
  })
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
  map.addControl(
    new GeolocateControl({ positionOptions: { enableHighAccuracy: true } }),
    'top-right',
  )

  map.on('load', () => {
    if (!map) return
    map.addSource(SOURCE_ID, { type: 'geojson', data: withTotals(props.lockers) })
    map.addLayer({
      id: 'lockers-circle',
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 6, 16, 14],
        // Green when compartments are free, grey when the locker is full.
        'circle-color': ['case', ['>', ['get', 'free_total'], 0], '#2a9d8f', '#9aa7b0'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
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
      paint: { 'text-color': '#264653', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
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

onBeforeUnmount(() => {
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
</style>
