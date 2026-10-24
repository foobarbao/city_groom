<script setup lang="ts">
/**
 * Soft card summarising one locker: name, free compartments per size and a
 * button to open its page. Used in the bottom sheet of the map screen.
 *
 * Props:
 * - `locker`: GeoJSON feature from `GET /api/v1/lockers/`.
 *
 * Emits:
 * - `open(code)`: when the user wants to see the locker.
 */
import type { LockerFeature } from '@city-groom/api-client'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  /** Locker to summarise. */
  locker: LockerFeature
}>()

const emit = defineEmits<{
  /** The user tapped the card; payload is the locker code. */
  open: [code: string]
}>()

const { t } = useI18n()

const SIZE_ORDER = ['S', 'M', 'L', 'XL'] as const

const free = computed(() => props.locker.properties?.free_by_size ?? {})
const total = computed(() => Object.values(free.value).reduce((a, b) => a + b, 0))
</script>

<template>
  <button
    type="button"
    class="locker-card"
    :class="{ full: total === 0 }"
    @click="emit('open', locker.properties?.code ?? '')"
  >
    <span class="dot" aria-hidden="true" />
    <span class="name">{{ locker.properties?.name }}</span>
    <span class="total">{{ t('map.freeCompartments', total) }}</span>
    <span class="sizes">
      <span v-for="size in SIZE_ORDER" :key="size" class="size" :class="{ none: !free[size] }">
        {{ t(`locker.sizes.${size}`) }} · {{ free[size] ?? 0 }}
      </span>
    </span>
    <span class="cta">{{ t('map.open') }}</span>
  </button>
</template>

<style scoped>
.locker-card {
  display: grid;
  grid-template-columns: 14px 1fr;
  align-items: center;
  column-gap: 10px;
  row-gap: 8px;
  width: 100%;
  padding: 16px 18px;
  border: 0;
  border-radius: var(--cg-radius-l);
  background: var(--cg-surface);
  color: var(--cg-ink);
  font: inherit;
  text-align: left;
  box-shadow: var(--cg-shadow);
  cursor: pointer;
  transition: transform 0.2s ease;
}
.locker-card:active {
  transform: scale(0.98);
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-leaf);
  box-shadow: 0 0 0 4px var(--cg-leaf-soft);
}
.full .dot {
  background: var(--cg-ink-soft);
  box-shadow: 0 0 0 4px var(--cg-surface-soft);
}
.name {
  font-weight: 800;
  font-size: 16px;
  min-width: 0;
}
.total,
.sizes,
.cta {
  grid-column: 2;
}
.total {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.size {
  padding: 3px 10px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.size.none {
  background: var(--cg-surface-soft);
  color: var(--cg-ink-soft);
}
.cta {
  justify-self: start;
  font-weight: 800;
  color: var(--cg-leaf);
}
</style>
