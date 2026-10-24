<script setup lang="ts">
/**
 * Column chart, single or stacked series, with optional forecast columns.
 *
 * Follows the dataviz rules: columns at most 24 px wide with 4 px rounded
 * tops and square baseline, 2 px surface gap between stacked segments, one
 * recessive grid, clean y ticks, a legend for two series or more, a hover
 * tooltip on every column and a data table for accessibility.
 *
 * Props:
 * - `bars`: one entry per column (`label`, `values` per series, `forecast`).
 * - `series`: name and colour token of each series, bottom to top.
 * - `format`: value formatter for ticks, tooltip and table.
 * - `forecastLabel`: legend text for forecast columns (shown if any).
 * - `title`: accessible name of the chart.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export interface Bar {
  label: string
  values: number[]
  forecast?: boolean
}
export interface Series {
  name: string
  /** CSS colour, usually a `var(--cg-chart-*)` token. */
  color: string
}

const props = withDefaults(
  defineProps<{
    bars: Bar[]
    series: Series[]
    format?: (value: number) => string
    forecastLabel?: string
    title: string
    tableLabel: string
  }>(),
  { format: (v: number) => String(v), forecastLabel: '' },
)

/** Drawing width, kept equal to the rendered width so text keeps its size. */
const width = ref(640)
const HEIGHT = 220
const PAD = { top: 12, right: 8, bottom: 28, left: 56 }
const MAX_BAR = 24
const GAP = 2
const RADIUS = 4

const plotW = computed(() => width.value - PAD.left - PAD.right)
const plotH = HEIGHT - PAD.top - PAD.bottom

/** Clean upper bound and ticks (1, 2, 2.5 or 5 × 10^n). */
const scale = computed(() => {
  const max = Math.max(1, ...props.bars.map((b) => b.values.reduce((s, v) => s + v, 0)))
  const raw = max / 4
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw
  const top = Math.ceil(max / step) * step
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  return { top, ticks }
})

const y = (value: number): number => PAD.top + plotH - (value / scale.value.top) * plotH
const band = computed(() => plotW.value / Math.max(1, props.bars.length))
const barWidth = computed(() => Math.min(MAX_BAR, band.value * 0.6))

/** Path of a column segment; only the top segment gets rounded corners. */
function segmentPath(x: number, y0: number, y1: number, w: number, rounded: boolean): string {
  const h = y0 - y1
  if (h <= 0) return ''
  const r = rounded ? Math.min(RADIUS, h, w / 2) : 0
  return [
    `M${x},${y0}`,
    `V${y1 + r}`,
    r ? `Q${x},${y1} ${x + r},${y1}` : '',
    `H${x + w - r}`,
    r ? `Q${x + w},${y1} ${x + w},${y1 + r}` : '',
    `V${y0}`,
    'Z',
  ].join(' ')
}

const columns = computed(() =>
  props.bars.map((bar, i) => {
    const x = PAD.left + band.value * i + (band.value - barWidth.value) / 2
    let base = 0
    const lastIndex = bar.values.reduce((last, v, j) => (v > 0 ? j : last), -1)
    const segments = bar.values.map((value, j) => {
      const y0 = y(base) - (j > 0 && base > 0 ? GAP : 0)
      base += value
      return {
        d: segmentPath(x, y0, y(base), barWidth.value, j === lastIndex),
        color: props.series[j]?.color,
      }
    })
    return { bar, x, segments, total: base }
  }),
)

// Show at most ~8 x labels to avoid collisions.
const labelEvery = computed(() => Math.ceil(props.bars.length / 8))

const plot = ref<HTMLDivElement | null>(null)
let observer: ResizeObserver | null = null
onMounted(() => {
  if (!plot.value || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(([entry]) => {
    if (entry) width.value = Math.max(280, Math.round(entry.contentRect.width))
  })
  observer.observe(plot.value)
})
onBeforeUnmount(() => observer?.disconnect())

const hovered = ref<number | null>(null)
/** Column under the pointer or focus, for the tooltip. */
const tip = computed(() => (hovered.value === null ? null : (columns.value[hovered.value] ?? null)))
const hasForecast = computed(() => props.bars.some((b) => b.forecast))
</script>

<template>
  <figure class="bar-chart">
    <ul v-if="series.length > 1 || hasForecast" class="legend">
      <li v-for="s in series" :key="s.name">
        <span class="swatch" :style="{ background: s.color }" />{{ s.name }}
      </li>
      <li v-if="hasForecast">
        <span class="swatch forecast" :style="{ background: series[0]?.color }" />{{
          forecastLabel
        }}
      </li>
    </ul>

    <div ref="plot" class="plot">
      <svg :viewBox="`0 0 ${width} ${HEIGHT}`" role="img" :aria-label="title">
        <g class="grid">
          <g v-for="tick in scale.ticks" :key="tick">
            <line :x1="PAD.left" :x2="width - PAD.right" :y1="y(tick)" :y2="y(tick)" />
            <text :x="PAD.left - 8" :y="y(tick)" class="tick">{{ format(tick) }}</text>
          </g>
        </g>
        <g
          v-for="(col, i) in columns"
          :key="col.bar.label"
          class="column"
          :class="{ forecast: col.bar.forecast, dim: hovered !== null && hovered !== i }"
          tabindex="0"
          @mouseenter="hovered = i"
          @mouseleave="hovered = null"
          @focus="hovered = i"
          @blur="hovered = null"
        >
          <!-- Hit target wider and taller than the column -->
          <rect class="hit" :x="PAD.left + band * i" :y="PAD.top" :width="band" :height="plotH" />
          <path v-for="(seg, j) in col.segments" :key="j" :d="seg.d" :fill="seg.color" />
          <text
            v-if="i % labelEvery === 0"
            class="x-label"
            :x="col.x + barWidth / 2"
            :y="HEIGHT - 8"
          >
            {{ col.bar.label }}
          </text>
        </g>
      </svg>

      <div
        v-if="tip"
        class="tooltip"
        :style="{ left: `${((tip.x + barWidth / 2) / width) * 100}%` }"
      >
        <strong>{{ tip.bar.label }}</strong>
        <span v-if="tip.bar.forecast" class="muted">{{ forecastLabel }}</span>
        <span v-for="(s, j) in series" :key="s.name" class="row">
          <span class="swatch" :style="{ background: s.color }" />{{ s.name }} :
          {{ format(tip.bar.values[j] ?? 0) }}
        </span>
      </div>
    </div>

    <details class="table-view">
      <summary>{{ tableLabel }}</summary>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col" />
              <th v-for="s in series" :key="s.name" scope="col">{{ s.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bar in bars" :key="bar.label">
              <th scope="row">{{ bar.label }}{{ bar.forecast ? ` (${forecastLabel})` : '' }}</th>
              <td v-for="(s, j) in series" :key="s.name">{{ format(bar.values[j] ?? 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </figure>
</template>

<style scoped>
.bar-chart {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.legend li {
  display: flex;
  align-items: center;
  gap: 6px;
}
.swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
}
.swatch.forecast {
  opacity: 0.4;
}
.plot {
  position: relative;
}
svg {
  width: 100%;
  display: block;
  overflow: visible;
}
.grid line {
  stroke: var(--cg-chart-grid);
  stroke-width: 1;
}
.tick {
  font-size: 11px;
  fill: var(--cg-ink-soft);
  text-anchor: end;
  dominant-baseline: middle;
  font-variant-numeric: tabular-nums;
}
.x-label {
  font-size: 11px;
  fill: var(--cg-ink-soft);
  text-anchor: middle;
}
.hit {
  fill: transparent;
}
.column {
  outline: none;
  transition: opacity 0.15s;
}
.column.forecast path {
  opacity: 0.4;
}
.column.dim {
  opacity: 0.55;
}
.tooltip {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-radius: var(--cg-radius-s);
  background: var(--cg-surface);
  box-shadow: var(--cg-shadow-strong);
  font-size: 12px;
  color: var(--cg-ink);
  pointer-events: none;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.tooltip .row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.muted {
  color: var(--cg-ink-soft);
}
.table-view summary {
  cursor: pointer;
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.table-scroll {
  overflow-x: auto;
}
table {
  border-collapse: collapse;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  margin-top: 8px;
}
th,
td {
  padding: 4px 10px;
  text-align: right;
  border-bottom: 1px solid var(--cg-chart-grid);
}
th[scope='row'] {
  text-align: left;
  font-weight: 600;
}
</style>
