<script setup lang="ts">
/**
 * Round sheet of a courier: pick a round, then follow the stops in order,
 * with what to pick up and drop off at each one (customer orders and
 * consigne transfers), and tick each stop when done.
 *
 * DEMO: rounds are fictitious; ticks stay on the device.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import CourierNav from '../components/CourierNav.vue'
import PortalMap from '../components/PortalMap.vue'
import PortalPage from '../components/PortalPage.vue'
import { clock, number, shortDay } from '../data/format'
import { partnerState, toggleStop } from '../data/partnerState'
import { buildRoundSheet } from '../data/roundSheet'
import {
  activity,
  demoNow,
  lockerPoints,
  merchantPoints,
  placeName,
  positions,
  serviceName,
} from '../data/source'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

/** Centre of Grenoble, where rounds start. */
const CENTRE: [number, number] = [5.7245, 45.1885]

/** Rounds to choose from: the last one done and the next ones. */
const choices = computed(() => {
  const sorted = [...activity.rounds].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const next = sorted.findIndex((r) => new Date(r.starts_at) > demoNow)
  const from = Math.max(0, (next === -1 ? sorted.length : next) - 1)
  return sorted.slice(from, from + 7)
})
const round = computed(
  () =>
    choices.value.find((r) => r.id === route.query.tournee) ??
    choices.value.find((r) => new Date(r.starts_at) > demoNow) ??
    choices.value[0],
)
const stops = computed(() =>
  round.value
    ? buildRoundSheet(activity.orders, activity.transfers, round.value.starts_at, positions, CENTRE)
    : [],
)
const done = computed(() => partnerState.stopsDone[round.value?.id ?? ''] ?? [])
const route2 = computed<[number, number][]>(() => [
  CENTRE,
  ...stops.value.map((s) => positions[s.code] ?? CENTRE),
])
const what = (code: string): string =>
  code === 'consigne' ? t('courier.sheet.consigne') : serviceName(code)

function choose(id: string): void {
  void router.replace({ query: { tournee: id } })
}
</script>

<template>
  <portal-page :title="t('courier.title')" back-href="/">
    <courier-nav current="courier-round" />
    <div class="chips" role="radiogroup" :aria-label="t('courier.sheet.choose')">
      <button
        v-for="r in choices"
        :key="r.id"
        type="button"
        role="radio"
        class="chip"
        :class="{ active: r.id === round?.id, past: r.status === 'done' }"
        :aria-checked="r.id === round?.id"
        @click="choose(r.id)"
      >
        {{ clock(r.starts_at) }} · {{ shortDay(r.starts_at) }}
      </button>
    </div>

    <template v-if="round">
      <div class="summary card">
        <h2>
          {{ t('courier.round', { time: clock(round.starts_at), day: shortDay(round.starts_at) }) }}
        </h2>
        <p class="note">
          {{ t('courier.sheet.summary', { stops: stops.length, km: number(round.distance_km) }) }} ·
          {{ t('courier.toCollect', { count: round.items_collected }) }} ·
          {{ t('courier.toReturn', { count: round.items_returned }) }} ·
          {{ t('courier.sheet.transfers', round.transfers) }}
        </p>
        <div
          class="progress"
          role="progressbar"
          :aria-valuenow="done.length"
          :aria-valuemax="stops.length"
        >
          <span :style="{ width: `${stops.length ? (done.length / stops.length) * 100 : 0}%` }" />
        </div>
        <p class="note">
          {{ t('courier.sheet.progress', { done: done.length, total: stops.length }) }}
        </p>
      </div>

      <div class="columns">
        <ol class="stops">
          <li
            v-for="(stop, i) in stops"
            :key="stop.key"
            class="card stop"
            :class="{ done: done.includes(stop.key) }"
          >
            <header class="stop-head">
              <span class="num">{{ i + 1 }}</span>
              <span class="stop-title">
                <strong>{{ placeName(stop.code) }}</strong>
                <span class="muted">{{
                  stop.type === 'locker' ? t('courier.sheet.locker') : t('courier.sheet.merchant')
                }}</span>
              </span>
              <label class="tick">
                <input
                  type="checkbox"
                  :checked="done.includes(stop.key)"
                  @change="toggleStop(round.id, stop.key)"
                />
                {{ t('courier.sheet.done') }}
              </label>
            </header>
            <ul class="tasks">
              <li v-for="task in stop.tasks" :key="task.kind + task.ref" :class="task.kind">
                <span class="arrow" aria-hidden="true">{{
                  task.kind === 'pickup' ? '↑' : '↓'
                }}</span>
                <span>
                  <strong>{{
                    task.kind === 'pickup' ? t('courier.sheet.pickup') : t('courier.sheet.dropoff')
                  }}</strong>
                  {{ task.items }} × {{ what(task.what) }} ({{ task.size }})
                  <span class="muted">
                    · {{ task.ref }} ·
                    {{
                      task.kind === 'pickup'
                        ? t('courier.sheet.to', { place: placeName(task.other) })
                        : t('courier.sheet.from', { place: placeName(task.other) })
                    }}
                  </span>
                </span>
              </li>
            </ul>
          </li>
        </ol>
        <section class="card map-card">
          <h2>{{ t('courier.mapTitle') }}</h2>
          <portal-map
            class="map"
            :lockers="lockerPoints"
            :merchants="merchantPoints"
            :route="route2"
          />
          <p class="note">{{ t('courier.mapNote') }}</p>
        </section>
      </div>
    </template>
  </portal-page>
</template>

<style scoped>
.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 2px 6px;
}
.chip {
  flex: none;
  padding: 9px 16px;
  border: none;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-glass);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}
.chip.past {
  opacity: 0.7;
}
.chip.active {
  background: var(--cg-sun);
  opacity: 1;
}
.progress {
  height: 10px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-surface-soft);
  overflow: hidden;
}
.progress span {
  display: block;
  height: 100%;
  background: var(--cg-leaf);
  transition: width 0.3s ease;
}
.stops {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.stop.done {
  opacity: 0.6;
}
.stop-head {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  gap: 12px;
}
.num {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--cg-leaf);
  color: #ffffff;
  font-weight: 900;
}
.stop-title {
  display: flex;
  flex-direction: column;
}
.tick {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
  cursor: pointer;
}
.tick input {
  width: 22px;
  height: 22px;
  accent-color: var(--cg-leaf);
}
.tasks {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tasks li {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--cg-radius-s);
}
.tasks li.pickup {
  background: var(--cg-sun-soft);
}
.tasks li.dropoff {
  background: var(--cg-leaf-soft);
}
.arrow {
  font-weight: 900;
  text-align: center;
}
.muted {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.map-card {
  position: sticky;
  top: 12px;
}
.map {
  height: 380px;
}
</style>
