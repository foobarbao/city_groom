<script setup lang="ts">
/**
 * Drawing of a locker front: columns, doors of several sizes and the control
 * panel, with one door highlighted and gently swinging open (the one the
 * customer will use).
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

/** Space kept between doors, in grid units, so they read as separate soft tiles. */
const DOOR_INSET = 0.09
</script>

<template>
  <svg
    class="locker-front"
    :viewBox="`-0.4 -0.4 ${drawing.width + 0.8} ${drawing.height + 1.4}`"
    role="img"
    :aria-label="
      highlightedLabel ? t('locker.previewDoor', { label: highlightedLabel }) : undefined
    "
  >
    <!-- Soft ground shadow under the locker -->
    <ellipse
      class="ground"
      :cx="drawing.width / 2"
      :cy="drawing.height + 0.45"
      :rx="drawing.width / 2"
      ry="0.35"
    />
    <rect class="body" x="0" y="0" :width="drawing.width" :height="drawing.height" rx="0.7" />

    <g class="panel">
      <rect
        class="panel-screen"
        :x="drawing.panel.x + 0.5"
        :y="drawing.panel.y + 0.5"
        :width="drawing.panel.width - 1"
        :height="drawing.panel.height * 0.42"
        rx="0.45"
      />
      <text
        class="panel-label"
        :x="drawing.panel.x + drawing.panel.width / 2"
        :y="drawing.panel.y + 0.5 + drawing.panel.height * 0.21"
      >
        {{ t('locker.panel') }}
      </text>
      <circle
        class="panel-reader"
        :cx="drawing.panel.x + drawing.panel.width / 2"
        :cy="drawing.panel.y + drawing.panel.height * 0.76"
        r="0.75"
      />
      <circle
        class="panel-reader-dot"
        :cx="drawing.panel.x + drawing.panel.width / 2"
        :cy="drawing.panel.y + drawing.panel.height * 0.76"
        r="0.22"
      />
    </g>

    <g
      v-for="door in drawing.doors"
      :key="door.id"
      class="door"
      :class="{ highlighted: door.label === highlightedLabel }"
      role="button"
      tabindex="0"
      :aria-label="door.label"
      @click="emit('select', door.label)"
      @keydown.enter.prevent="emit('select', door.label)"
    >
      <!-- Inside of the compartment, visible when the door swings open -->
      <rect
        class="door-inside"
        :x="door.x + DOOR_INSET"
        :y="door.y + DOOR_INSET"
        :width="door.width - 2 * DOOR_INSET"
        :height="door.height - 2 * DOOR_INSET"
        rx="0.32"
      />
      <g class="door-leaf">
        <rect
          class="door-panel"
          :x="door.x + DOOR_INSET"
          :y="door.y + DOOR_INSET"
          :width="door.width - 2 * DOOR_INSET"
          :height="door.height - 2 * DOOR_INSET"
          rx="0.32"
        />
        <rect
          class="door-handle"
          :x="door.x + door.width - 0.55"
          :y="door.y + door.height / 2 - Math.min(0.32, door.height / 4)"
          width="0.16"
          :height="Math.min(0.64, door.height / 2)"
          rx="0.08"
        />
      </g>
      <text
        class="door-label"
        :x="door.x + 0.4"
        :y="door.y + Math.min(door.height / 2, 1.1) + 0.25"
      >
        {{ door.label }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.locker-front {
  width: 100%;
  max-height: 58vh;
  display: block;
  overflow: visible;
}
.ground {
  fill: var(--cg-ink);
  opacity: 0.08;
}
.body {
  fill: var(--cg-locker-body);
}
.panel-screen {
  fill: var(--cg-leaf-soft);
}
.panel-label {
  font-size: 0.75px;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: middle;
  fill: var(--cg-pine);
}
.panel-reader {
  fill: none;
  stroke: var(--cg-leaf);
  stroke-width: 0.14;
}
.panel-reader-dot {
  fill: var(--cg-leaf);
}
.door {
  cursor: pointer;
  outline: none;
}
.door-inside {
  fill: var(--cg-pine);
  opacity: 0.85;
}
.door-panel {
  fill: var(--cg-locker-door);
  stroke: var(--cg-locker-door-edge);
  stroke-width: 0.05;
  transition: fill 0.25s ease;
}
.door:hover .door-panel,
.door:focus-visible .door-panel {
  fill: var(--cg-leaf-soft);
}
.door-handle {
  fill: var(--cg-locker-door-edge);
}
.door-label {
  font-size: 0.62px;
  font-weight: 700;
  fill: var(--cg-ink-soft);
  pointer-events: none;
}

/* The highlighted door glows and slowly swings open, hinged on its left edge. */
.door-leaf {
  transform-box: fill-box;
  transform-origin: left center;
}
.door.highlighted .door-panel {
  fill: var(--cg-leaf);
  stroke: none;
}
.door.highlighted .door-handle {
  fill: var(--cg-surface);
}
.door.highlighted .door-label {
  fill: var(--cg-surface);
}
.door.highlighted .door-leaf {
  animation: swing 3.2s ease-in-out infinite;
}
.door.highlighted .door-inside {
  fill: var(--cg-sun);
  opacity: 0.55;
}
@keyframes swing {
  0%,
  25%,
  100% {
    transform: perspective(40px) rotateY(0deg);
  }
  50%,
  75% {
    transform: perspective(40px) rotateY(-55deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .door.highlighted .door-leaf {
    animation: none;
  }
}
</style>
