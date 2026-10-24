<script setup lang="ts">
/**
 * Picker of compartment sizes, as soft cards with a pictogram, the number of
 * free compartments and the kind of items each size fits.
 *
 * Used on the locker page. Sizes with no free compartment stay selectable
 * (to see the door) but are visually muted.
 *
 * Props:
 * - `sizes`: size catalogue from the API.
 * - `freeBySize`: free compartments per size code.
 * - `modelValue`: selected size code (v-model).
 */
import type { CompartmentSize, SizeSpec } from '@city-groom/api-client'
import { useI18n } from 'vue-i18n'

defineProps<{
  /** Size catalogue, in display order. */
  sizes: SizeSpec[]
  /** Number of free compartments per size code. */
  freeBySize: Record<string, number>
}>()

/** Selected size code. */
const selected = defineModel<CompartmentSize>({ required: true })

const { t } = useI18n()

/** Simple line pictograms (24×24 viewBox) evoking what each size holds. */
const ICONS: Record<string, string> = {
  // Watch
  S: 'M9 3h6l1 4a5 5 0 0 1 0 10l-1 4H9l-1-4a5 5 0 0 1 0-10zM12 9v3l2 1',
  // Shoe
  M: 'M3 16c0-3 1-6 2-8l4 3c2 1 5 2 8 2 2 0 4 1 4 3v2H3zM3 18h18',
  // Laundry bag
  L: 'M8 7c0-2 2-4 4-4s4 2 4 4M5 8h14l-1.5 12h-11zM9 12c1 1 5 1 6 0',
  // Hanger
  XL: 'M12 6a2 2 0 1 1 2 2c-1 .5-2 1-2 2l9 6H3l9-6',
}
</script>

<template>
  <div class="size-picker" role="radiogroup" :aria-label="t('locker.chooseSize')">
    <button
      v-for="spec in sizes"
      :id="`size-${spec.code}`"
      :key="spec.code"
      type="button"
      role="radio"
      class="size-card"
      :class="{ selected: selected === spec.code, empty: (freeBySize[spec.code] ?? 0) === 0 }"
      :aria-checked="selected === spec.code"
      @click="selected = spec.code as CompartmentSize"
    >
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path :d="ICONS[spec.code]" />
      </svg>
      <span class="name">{{ t(`locker.sizes.${spec.code}`) }}</span>
      <span class="free">{{ t('locker.free', freeBySize[spec.code] ?? 0) }}</span>
    </button>
  </div>
</template>

<style scoped>
.size-picker {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.size-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 6px 12px;
  border: 0;
  border-radius: var(--cg-radius-m);
  background: var(--cg-surface);
  color: var(--cg-ink);
  font: inherit;
  box-shadow: var(--cg-shadow);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}
.size-card:active {
  transform: scale(0.97);
}
.size-card.selected {
  background: var(--cg-leaf);
  color: var(--ion-color-primary-contrast);
}
.size-card.empty:not(.selected) {
  opacity: 0.55;
}
.icon {
  width: 30px;
  height: 30px;
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.name {
  font-weight: 800;
  font-size: 14px;
}
.free {
  font-size: 12px;
  opacity: 0.8;
}
</style>
