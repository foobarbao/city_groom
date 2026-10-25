<script setup lang="ts">
/**
 * Rounds of the network: past and planned, with stops, items, consigne
 * transfers and distance; each opens the courier's round sheet.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import PortalPage from '../components/PortalPage.vue'
import StatTile from '../components/StatTile.vue'
import { clock, number, shortDay } from '../data/format'
import { activity, demoNow } from '../data/source'

const { t } = useI18n()
const view = ref<'planned' | 'done'>('planned')
const rows = computed(() =>
  activity.rounds
    .filter((r) => r.status === view.value)
    .sort((a, b) =>
      view.value === 'planned'
        ? a.starts_at.localeCompare(b.starts_at)
        : b.starts_at.localeCompare(a.starts_at),
    ),
)
const today = demoNow.toLocaleDateString('sv-SE', { timeZone: activity.timezone })
const todays = activity.rounds.filter(
  (r) =>
    new Date(r.starts_at).toLocaleDateString('sv-SE', { timeZone: activity.timezone }) === today,
)
const sum = (key: 'items_collected' | 'items_returned' | 'transfers' | 'distance_km'): number =>
  todays.reduce((s, r) => s + (r[key] ?? 0), 0)
</script>

<template>
  <portal-page>
    <div class="tiles">
      <stat-tile
        :label="t('operator.rounds.today')"
        :value="number(todays.length)"
        :hint="activity.round_times.join(' · ')"
      />
      <stat-tile :label="t('operator.rounds.collected')" :value="number(sum('items_collected'))" />
      <stat-tile :label="t('operator.rounds.returned')" :value="number(sum('items_returned'))" />
      <stat-tile :label="t('operator.rounds.transfers')" :value="number(sum('transfers'))" />
      <stat-tile
        :label="t('operator.rounds.km')"
        :value="number(Math.round(sum('distance_km')))"
        :hint="t('operator.rounds.byBike')"
      />
    </div>
    <div class="filters">
      <button
        class="chip-btn"
        :class="{ active: view === 'planned' }"
        type="button"
        @click="view = 'planned'"
      >
        {{ t('operator.rounds.planned') }}
      </button>
      <button
        class="chip-btn"
        :class="{ active: view === 'done' }"
        type="button"
        @click="view = 'done'"
      >
        {{ t('operator.rounds.done') }}
      </button>
    </div>
    <section class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">{{ t('operator.rounds.round') }}</th>
              <th scope="col" class="num">{{ t('operator.rounds.stops') }}</th>
              <th scope="col" class="num">{{ t('operator.rounds.collected') }}</th>
              <th scope="col" class="num">{{ t('operator.rounds.returned') }}</th>
              <th scope="col" class="num">{{ t('operator.rounds.transfers') }}</th>
              <th scope="col" class="num">{{ t('operator.rounds.km') }}</th>
              <th scope="col">
                <span class="visually-hidden">{{ t('operator.rounds.sheet') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td>
                <strong>{{ clock(r.starts_at) }}</strong> · {{ shortDay(r.starts_at) }}
              </td>
              <td class="num">{{ r.locker_stops.length + r.merchant_stops.length }}</td>
              <td class="num">{{ number(r.items_collected) }}</td>
              <td class="num">{{ number(r.items_returned) }}</td>
              <td class="num">{{ number(r.transfers ?? 0) }}</td>
              <td class="num">{{ number(r.distance_km) }}</td>
              <td>
                <router-link :to="{ name: 'courier-round', query: { tournee: r.id } }"
                  >{{ t('operator.rounds.sheet') }} →</router-link
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="note">{{ t('operator.rounds.note') }}</p>
    </section>
  </portal-page>
</template>

<style scoped>
a {
  font-weight: 800;
  color: var(--cg-leaf);
  text-decoration: none;
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
