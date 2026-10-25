<script setup lang="ts">
/**
 * List of lockers to choose from, with a search field and filters by kind of
 * place (tram stop, station, tourist site…). Shows the free compartments of
 * the size the customer needs.
 *
 * Props:
 * - `size`: size whose free compartments are shown and required (optional).
 * - `exclude`: sizes that cannot be used (e.g. hanging compartments for the consigne).
 * - `modelValue`: selected locker code (v-model).
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePosition } from '../composables/usePosition'
import { distanceMeters, formatDistance } from '../domain/geo'
import { normalize } from '../domain/shops'
import { type LockerSummary, lockers } from '../services/catalogue'

const props = withDefaults(defineProps<{ size?: string | null; exclude?: string[] }>(), {
  size: null,
  exclude: () => [],
})
const selected = defineModel<string | null>({ default: null })
const { t } = useI18n()

const query = ref('')
const category = ref<string | null>(null)
/** Sort by distance from the customer ("Près de moi"); asks for the position. */
const nearMe = ref(false)
const position = usePosition()
const distance = (l: LockerSummary): number =>
  distanceMeters(position.origin.value, [l.longitude, l.latitude])

function toggleNearMe(): void {
  nearMe.value = !nearMe.value
  if (nearMe.value && position.status.value !== 'located') position.locate()
}

/** Kinds of place present in the network, most frequent first. */
const categories = computed(() => {
  const counts = new Map<string, number>()
  for (const l of lockers) counts.set(l.siteCategory, (counts.get(l.siteCategory) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([code]) => code)
})

const free = (locker: LockerSummary): number =>
  props.size
    ? (locker.freeBySize[props.size] ?? 0)
    : Object.entries(locker.freeBySize)
        .filter(([size]) => !props.exclude.includes(size))
        .reduce((sum, [, n]) => sum + n, 0)

const shown = computed(() => {
  const words = normalize(query.value).split(' ').filter(Boolean)
  return lockers
    .filter((l) => !category.value || l.siteCategory === category.value)
    .filter((l) => {
      const text = normalize(`${l.name} ${t(`sites.${l.siteCategory}`)}`)
      return words.every((w) => text.includes(w))
    })
    .sort(
      (a, b) =>
        Number(free(b) > 0) - Number(free(a) > 0) ||
        (nearMe.value ? distance(a) - distance(b) : a.name.localeCompare(b.name, 'fr')),
    )
})
</script>

<template>
  <div class="picker">
    <input
      v-model="query"
      class="search"
      type="search"
      :placeholder="t('common.search')"
      :aria-label="t('common.search')"
    />
    <div class="chips" role="group">
      <button
        class="chip near"
        :class="{ active: nearMe }"
        type="button"
        :aria-pressed="nearMe"
        @click="toggleNearMe"
      >
        📍 {{ t('nearby.nearMe') }}
      </button>
      <button
        class="chip"
        :class="{ active: category === null }"
        type="button"
        @click="category = null"
      >
        {{ t('shops.all') }}
      </button>
      <button
        v-for="c in categories"
        :key="c"
        class="chip"
        :class="{ active: category === c }"
        type="button"
        @click="category = c"
      >
        {{ t(`sites.${c}`) }}
      </button>
    </div>
    <ul class="list" role="listbox">
      <li v-for="locker in shown" :key="locker.code">
        <button
          type="button"
          role="option"
          class="locker"
          :class="{ selected: selected === locker.code, full: free(locker) === 0 }"
          :aria-selected="selected === locker.code"
          :disabled="free(locker) === 0"
          @click="selected = locker.code"
        >
          <span class="name">{{ locker.name }}</span>
          <span class="meta">
            {{ t(`sites.${locker.siteCategory}`) }}
            <template v-if="nearMe"> · {{ formatDistance(distance(locker)) }}</template>
          </span>
          <span class="free">{{ t('consigne.freeCount', free(locker)) }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.list {
  max-height: 46vh;
  overflow-y: auto;
  gap: 8px;
}
.locker {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 12px;
  width: 100%;
  padding: 12px 16px;
  border: 2px solid transparent;
  border-radius: var(--cg-radius-m);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.locker.selected {
  border-color: var(--cg-leaf);
  background: var(--cg-leaf-soft);
}
.locker.full {
  opacity: 0.5;
  cursor: not-allowed;
}
.name {
  font-weight: 800;
}
.meta {
  grid-column: 1;
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.free {
  grid-row: 1 / span 2;
  grid-column: 2;
  align-self: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--cg-pine);
}
</style>
