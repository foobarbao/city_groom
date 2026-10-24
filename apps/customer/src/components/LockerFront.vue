<script setup lang="ts">
/**
 * Drawing of a locker front: columns, doors of several sizes and the control
 * panel, with one door highlighted (the one that will open).
 *
 * Used on the locker page of the customer app; designed to be reused by the
 * operator view, which will colour doors by status.
 *
 * Props:
 * - `drawing`: geometry computed by `computeLockerDrawing`.
 * - `highlightedLabel`: label of the door to highlight, or `null`.
 *
 * Emits:
 * - `select(label)`: when the user taps a door.
 */
import { useI18n } from 'vue-i18n'

import type { LockerDrawing } from '../utils/lockerDrawing'

defineProps<{
  /** Geometry of the locker front, in grid units. */
  drawing: LockerDrawing
  /** Label of the door to highlight (e.g. "B3"), or null for none. */
  highlightedLabel: string | null
}>()

const emit = defineEmits<{
  /** A door was tapped; payload is its label. */
  select: [label: string]
}>()

const { t } = useI18n()
</script>

<template>
  <svg
    class="locker-front"
    :viewBox="`0 0 ${drawing.width} ${drawing.height}`"
    role="img"
    :aria-label="
      highlightedLabel ? t('locker.previewDoor', { label: highlightedLabel }) : undefined
    "
  >
    <rect class="frame" x="0" y="0" :width="drawing.width" :height="drawing.height" rx="0.3" />

    <g class="panel">
      <rect
        :x="drawing.panel.x"
        :y="drawing.panel.y"
        :width="drawing.panel.width"
        :height="drawing.panel.height"
        rx="0.15"
      />
      <rect
        class="screen"
        :x="drawing.panel.x + 0.6"
        :y="drawing.panel.y + 0.6"
        :width="drawing.panel.width - 1.2"
        :height="drawing.panel.height * 0.45"
        rx="0.1"
      />
      <text
        class="screen-label"
        :x="drawing.panel.x + drawing.panel.width / 2"
        :y="drawing.panel.y + 0.6 + drawing.panel.height * 0.27"
      >
        {{ t('locker.panel') }}
      </text>
      <circle
        class="reader"
        :cx="drawing.panel.x + drawing.panel.width / 2"
        :cy="drawing.panel.y + drawing.panel.height * 0.78"
        r="0.6"
      />
    </g>

    <g
      v-for="door in drawing.doors"
      :key="door.id"
      class="door"
      :class="[`size-${door.size}`, { highlighted: door.label === highlightedLabel }]"
      @click="emit('select', door.label)"
    >
      <rect
        :x="door.x + 0.05"
        :y="door.y + 0.05"
        :width="door.width - 0.1"
        :height="door.height - 0.1"
        rx="0.12"
      />
      <text
        class="door-label"
        :x="door.x + 0.35"
        :y="door.y + Math.min(door.height / 2, 1.3) + 0.25"
      >
        {{ door.label }}
      </text>
      <rect
        class="handle"
        :x="door.x + door.width - 0.55"
        :y="door.y + door.height / 2 - Math.min(0.35, door.height / 4)"
        width="0.15"
        :height="Math.min(0.7, door.height / 2)"
        rx="0.07"
      />
    </g>
  </svg>
</template>

<style scoped>
.locker-front {
  width: 100%;
  max-height: 60vh;
  display: block;
}
.frame {
  fill: var(--locker-frame, #2f3b45);
}
.panel > rect:first-child {
  fill: var(--locker-panel, #3d4b57);
}
.screen {
  fill: #9fd3c7;
}
.screen-label {
  font-size: 0.7px;
  text-anchor: middle;
  dominant-baseline: middle;
  fill: #1d3b34;
}
.reader {
  fill: none;
  stroke: #9fd3c7;
  stroke-width: 0.12;
}
.door rect:first-child {
  fill: var(--locker-door, #e9eef1);
  stroke: #b8c3ca;
  stroke-width: 0.06;
  cursor: pointer;
  transition: fill 0.2s;
}
.door-label {
  font-size: 0.75px;
  fill: #51606b;
  pointer-events: none;
}
.handle {
  fill: #9aa7b0;
  pointer-events: none;
}
.door.highlighted rect:first-child {
  fill: var(--ion-color-success, #2dd36f);
  stroke: var(--ion-color-success-shade, #28ba62);
  animation: pulse 1.6s ease-in-out infinite;
}
.door.highlighted .door-label {
  fill: #fff;
  font-weight: 700;
}
@keyframes pulse {
  50% {
    opacity: 0.7;
  }
}
@media (prefers-reduced-motion: reduce) {
  .door.highlighted rect:first-child {
    animation: none;
  }
}
</style>
