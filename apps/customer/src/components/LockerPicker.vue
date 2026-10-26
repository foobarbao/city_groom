<script setup lang="ts">
/**
 * Locker chooser: a map of the lockers next to a list panel built like the
 * side menu (owner, 2026-10-26: the filter chips were neither pretty nor
 * practical). The list folds by kind of place (tram stop, campus, lycée…),
 * with an icon and the free compartments of each locker; a search field
 * and the "Près de moi" button (sort by distance) turn it into a flat
 * list. Tapping a locker on the map or in the list chooses it and emits
 * `pick`, so the page can move on to its next step.
 *
 * When the picker is wide enough (760 px), the list and the map sit side
 * by side; otherwise the map is above the list. Without a base map (none
 * configured, or it failed to load), the list alone remains.
 *
 * Props:
 * - `size`: size whose free compartments are shown and required (optional).
 * - `exclude`: sizes that cannot be used (e.g. hanging compartments for the consigne).
 * - `excludeLockers`: lockers not offered (e.g. the drop-off locker when
 *   choosing "another locker" for the pickup).
 * - `modelValue`: selected locker code (v-model).
 *
 * Emits:
 * - `pick(code)`: a locker with free compartments was tapped (map or list).
 */
import type { LockerFeatureCollection } from '@city-groom/api-client'
import { IonIcon } from '@ionic/vue'
import { chevronDownOutline, navigateOutline, searchOutline } from 'ionicons/icons'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { HAS_MAP } from '../config'
import { usePosition } from '../composables/usePosition'
import { distanceMeters, formatDistance } from '../domain/geo'
import { normalize } from '../domain/shops'
import { type LockerSummary, lockerFeatures, lockers } from '../services/catalogue'
import { siteIcon } from '../utils/icons'
import LockerMap from './LockerMap.vue'

const props = withDefaults(
  defineProps<{ size?: string | null; exclude?: string[]; excludeLockers?: string[] }>(),
  { size: null, exclude: () => [], excludeLockers: () => [] },
)
const selected = defineModel<string | null>({ default: null })
const emit = defineEmits<{ pick: [code: string] }>()
const { t } = useI18n()

/** Hidden when no base map is configured or it failed to load. */
const mapShown = ref(HAS_MAP)

const query = ref('')
/** Sort by distance from the customer ("Près de moi"); asks for the position. */
const nearMe = ref(false)
const position = usePosition()
const distance = (l: LockerSummary): number =>
  distanceMeters(position.origin.value, [l.longitude, l.latitude])

function toggleNearMe(): void {
  nearMe.value = !nearMe.value
  if (nearMe.value && position.status.value !== 'located') position.locate()
}

/** Sizes counted as free for this choice. */
const usable = (size: string): boolean =>
  props.size ? size === props.size : !props.exclude.includes(size)

const free = (locker: LockerSummary): number =>
  Object.entries(locker.freeBySize)
    .filter(([size]) => usable(size))
    .reduce((sum, [, n]) => sum + n, 0)

const offered = computed(() => lockers.filter((l) => !props.excludeLockers.includes(l.code)))

const matching = computed(() => {
  const words = normalize(query.value).split(' ').filter(Boolean)
  return offered.value.filter((l) => {
    const text = normalize(`${l.name} ${t(`sites.${l.siteCategory}`)}`)
    return words.every((w) => text.includes(w))
  })
})

/** Lockers with free compartments first, then by distance or by name. */
const sorted = computed(() =>
  [...matching.value].sort(
    (a, b) =>
      Number(free(b) > 0) - Number(free(a) > 0) ||
      (nearMe.value ? distance(a) - distance(b) : a.name.localeCompare(b.name, 'fr')),
  ),
)

/** Searching or sorting by distance shows one flat list; otherwise folded groups. */
const flat = computed(() => nearMe.value || query.value.trim() !== '')

/** Groups by kind of place, the largest first. */
const groups = computed(() => {
  const byCategory = new Map<string, LockerSummary[]>()
  for (const l of sorted.value)
    byCategory.set(l.siteCategory, [...(byCategory.get(l.siteCategory) ?? []), l])
  return [...byCategory.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([category, items]) => ({ category, items }))
})

const open = ref<string[]>([])
function toggle(category: string): void {
  const index = open.value.indexOf(category)
  if (index === -1) open.value.push(category)
  else open.value.splice(index, 1)
}

/** The map shows the offered lockers, counting only the usable sizes. */
const mapLockers = computed<LockerFeatureCollection>(() => ({
  ...lockerFeatures,
  features: (lockerFeatures.features ?? [])
    .filter((f) => !props.excludeLockers.includes(f.properties?.code ?? ''))
    .map((f) => ({
      ...f,
      properties: f.properties && {
        ...f.properties,
        free_by_size: Object.fromEntries(
          Object.entries(f.properties.free_by_size ?? {}).filter(([size]) => usable(size)),
        ),
      },
    })),
}))

function choose(locker: LockerSummary): void {
  if (free(locker) === 0) return
  selected.value = locker.code
  emit('pick', locker.code)
}

/** A tap on the map: open the locker's group and show its row, then choose it. */
const list = ref<HTMLElement | null>(null)
async function chooseOnMap(code: string): Promise<void> {
  const locker = offered.value.find((l) => l.code === code)
  if (!locker) return
  query.value = ''
  if (!nearMe.value && !open.value.includes(locker.siteCategory))
    open.value.push(locker.siteCategory)
  await nextTick()
  list.value
    ?.querySelector(`[data-code="${CSS.escape(code)}"]`)
    ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  choose(locker)
}

// A locker chosen beforehand (e.g. coming back to this step): show its group.
watch(
  selected,
  (code) => {
    const category = lockers.find((l) => l.code === code)?.siteCategory
    if (category && !open.value.includes(category)) open.value.push(category)
  },
  { immediate: true },
)
</script>

<template>
  <div class="picker">
    <div class="layout" :class="{ 'with-map': mapShown }">
      <div class="panel">
        <div class="tools">
          <label class="search">
            <ion-icon :icon="searchOutline" aria-hidden="true" />
            <input
              v-model="query"
              type="search"
              :placeholder="t('picker.search')"
              :aria-label="t('picker.search')"
            />
          </label>
          <button
            class="near"
            :class="{ active: nearMe }"
            type="button"
            :aria-pressed="nearMe"
            :aria-label="t('nearby.nearMe')"
            :title="t('nearby.nearMe')"
            @click="toggleNearMe"
          >
            <ion-icon :icon="navigateOutline" aria-hidden="true" />
          </button>
        </div>

        <div ref="list" class="list" role="listbox" :aria-label="t('picker.list')">
          <p v-if="!sorted.length" class="empty">{{ t('picker.none') }}</p>

          <template v-if="flat">
            <button
              v-for="locker in sorted"
              :key="locker.code"
              :data-code="locker.code"
              type="button"
              role="option"
              class="row"
              :class="{ selected: selected === locker.code, full: free(locker) === 0 }"
              :aria-selected="selected === locker.code"
              :disabled="free(locker) === 0"
              @click="choose(locker)"
            >
              <ion-icon :icon="siteIcon(locker.siteCategory)" aria-hidden="true" />
              <span class="text">
                <span class="name">{{ locker.name }}</span>
                <span class="meta">
                  {{ t(`sites.${locker.siteCategory}`) }}
                  <template v-if="nearMe"> · {{ formatDistance(distance(locker)) }}</template>
                </span>
              </span>
              <span class="free">{{ t('consigne.freeCount', free(locker)) }}</span>
            </button>
          </template>

          <template v-else>
            <section v-for="group in groups" :key="group.category" class="group">
              <button
                type="button"
                class="group-row"
                :aria-expanded="open.includes(group.category)"
                @click="toggle(group.category)"
              >
                <ion-icon :icon="siteIcon(group.category)" aria-hidden="true" />
                <span class="label">{{ t(`sites.${group.category}`) }}</span>
                <span class="count">{{ group.items.length }}</span>
                <ion-icon
                  class="chevron"
                  :class="{ up: open.includes(group.category) }"
                  :icon="chevronDownOutline"
                  aria-hidden="true"
                />
              </button>
              <div v-show="open.includes(group.category)" class="children">
                <button
                  v-for="locker in group.items"
                  :key="locker.code"
                  :data-code="locker.code"
                  type="button"
                  role="option"
                  class="row child"
                  :class="{ selected: selected === locker.code, full: free(locker) === 0 }"
                  :aria-selected="selected === locker.code"
                  :disabled="free(locker) === 0"
                  @click="choose(locker)"
                >
                  <span class="text">
                    <span class="name">{{ locker.name }}</span>
                  </span>
                  <span class="free">{{ t('consigne.freeCount', free(locker)) }}</span>
                </button>
              </div>
            </section>
          </template>
        </div>
      </div>

      <div v-if="mapShown" class="map" :aria-label="t('picker.map')">
        <locker-map
          :lockers="mapLockers"
          :me="position.status.value === 'located' ? position.origin.value : null"
          :selected="selected"
          compact
          @select="chooseOnMap"
          @unavailable="mapShown = false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Narrow (phones, the 640 px pages): the map on top, the list under it. */
.picker {
  container-type: inline-size;
}
.layout {
  display: flex;
  flex-direction: column-reverse;
  gap: 12px;
}
.map {
  position: relative;
  height: 240px;
  overflow: hidden;
  border-radius: var(--cg-radius-l);
  box-shadow: var(--cg-shadow);
}
/* Wide (the booking page on a computer): the list as a side panel, the map beside it. */
@container (min-width: 760px) {
  .layout.with-map {
    display: grid;
    grid-template-columns: minmax(280px, 340px) 1fr;
    height: clamp(420px, 62vh, 640px);
  }
  .layout.with-map .map {
    height: auto;
  }
  .layout.with-map .panel {
    min-height: 0;
  }
  .layout.with-map .list {
    max-height: none;
  }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: var(--cg-radius-l);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
}
.tools {
  display: flex;
  gap: 8px;
}
.search {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0 12px;
  border: 1px solid var(--cg-surface-soft);
  border-radius: var(--cg-radius-m);
  background: var(--cg-surface);
  color: var(--cg-ink-soft);
}
.search:focus-within {
  border-color: var(--cg-leaf);
}
.search input {
  flex: 1;
  min-width: 0;
  padding: 10px 0;
  border: 0;
  background: transparent;
  color: var(--cg-ink);
  font: inherit;
  outline: none;
}
/* "Près de moi": an icon button, so the search field keeps its width. */
.near {
  display: grid;
  flex: none;
  place-items: center;
  width: 42px;
  border: 1px solid var(--cg-surface-soft);
  border-radius: var(--cg-radius-m);
  background: var(--cg-surface);
  color: var(--cg-ink-soft);
  font-size: 18px;
  cursor: pointer;
}
.near.active {
  border-color: var(--cg-leaf);
  background: var(--cg-leaf-soft);
  color: var(--cg-leaf);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 46vh;
  overflow-y: auto;
  flex: 1;
}
.empty {
  margin: 8px;
  color: var(--cg-ink-soft);
}

/* Rows look like the side menu: icon, label, quiet trailing figure. */
.group-row,
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: var(--cg-radius-s);
  background: transparent;
  color: var(--cg-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}
.group-row:hover,
.row:hover:not(:disabled) {
  background: var(--cg-surface-soft);
}
.group-row {
  font-weight: 600;
}
.group-row > ion-icon:first-child,
.row > ion-icon {
  flex: none;
  font-size: 19px;
  color: var(--cg-teal);
}
.label,
.text {
  flex: 1;
  min-width: 0;
}
.count {
  font-size: 13px;
  font-weight: 500;
  color: var(--cg-ink-soft);
}
.chevron {
  font-size: 16px;
  color: var(--cg-ink-soft);
  transition: transform 0.15s ease;
}
.chevron.up {
  transform: rotate(180deg);
}
.children {
  margin: 2px 0 6px 19px;
  padding-left: 12px;
  border-left: 1px solid var(--cg-surface-soft);
}
.text {
  display: flex;
  flex-direction: column;
}
.name {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.free {
  flex: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--cg-leaf);
}
.row.selected {
  background: color-mix(in srgb, var(--cg-leaf) 14%, transparent);
}
.row.selected .name {
  font-weight: 700;
}
.row.full {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (prefers-reduced-motion: reduce) {
  .group-row,
  .row,
  .chevron {
    transition: none;
  }
}
</style>
