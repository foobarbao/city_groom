<script setup lang="ts">
/**
 * Operator space: volume indicators, network fill rate (overall, per size,
 * per locker), live map and daily orders with the forecast
 * (docs/PRODUCT.md §7).
 */
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import BarChart, { type Bar } from '../components/BarChart.vue'
import PortalMap from '../components/PortalMap.vue'
import PortalPage from '../components/PortalPage.vue'
import StatTile from '../components/StatTile.vue'
import { number, percent, shortDay } from '../data/format'
import { activity, demoNow, lockerPoints, lockers, operatorData } from '../data/source'
import { operatorKpis } from '../data/summaries'

const { t } = useI18n()
const router = useRouter()

const kpis = operatorKpis(activity, demoNow)
const stats = operatorData.stats

const lockerList = [...lockers].sort((a, b) => b.fill_rate - a.fill_rate)
const freeCount = (free: Record<string, number>): number =>
  Object.values(free).reduce((sum, n) => sum + n, 0)

const sizes = Object.keys(stats.capacity_by_size).map((size) => {
  const capacity = stats.capacity_by_size[size] ?? 0
  const used = capacity - (stats.free_by_size[size] ?? 0)
  return { size, capacity, used, rate: capacity ? used / capacity : 0 }
})

const bars: Bar[] = [
  ...activity.daily.map((d) => ({ label: shortDay(d.date), values: [d.orders] })),
  ...activity.forecast.map((f) => ({
    label: shortDay(f.date),
    values: [f.orders],
    forecast: true,
  })),
]

function openLocker(code: string): void {
  void router.push({ name: 'operator-locker', params: { code } })
}
</script>

<template>
  <portal-page :title="t('operator.title')" back-href="/">
    <div class="tiles">
      <stat-tile :label="t('operator.ordersToday')" :value="number(kpis.ordersToday)" />
      <stat-tile :label="t('operator.itemsInLockers')" :value="number(kpis.itemsInLockers)" />
      <stat-tile :label="t('operator.itemsAtMerchants')" :value="number(kpis.itemsAtMerchants)" />
      <stat-tile
        :label="t('operator.fillRate')"
        :value="percent(stats.fill_rate)"
        :hint="
          t('operator.ofCompartments', {
            used: number(stats.in_use),
            total: number(stats.in_service),
          })
        "
      />
    </div>

    <section class="card">
      <bar-chart
        :title="t('operator.ordersChart')"
        :table-label="t('charts.table')"
        :bars="bars"
        :series="[{ name: t('operator.ordersSeries'), color: 'var(--cg-chart-1)' }]"
        :forecast-label="t('charts.forecast')"
        :format="number"
      />
    </section>

    <div class="columns">
      <section class="card">
        <h2>{{ t('operator.mapTitle') }}</h2>
        <portal-map class="map" :lockers="lockerPoints" :merchants="[]" @select="openLocker" />
        <p class="note">{{ t('operator.mapNote') }}</p>
      </section>

      <section class="card">
        <h2>{{ t('operator.sizesTitle') }}</h2>
        <table class="sizes">
          <thead>
            <tr>
              <th scope="col">{{ t('operator.size') }}</th>
              <th scope="col">{{ t('operator.used') }}</th>
              <th scope="col">{{ t('operator.capacity') }}</th>
              <th scope="col">
                <span class="visually-hidden">{{ t('operator.fillRate') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in sizes" :key="row.size">
              <th scope="row">{{ row.size }}</th>
              <td>{{ number(row.used) }}</td>
              <td>{{ number(row.capacity) }}</td>
              <td class="meter-cell">
                <span class="meter"
                  ><span class="meter-fill" :style="{ width: `${row.rate * 100}%` }"
                /></span>
                {{ percent(row.rate) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <section class="card">
      <h2>{{ t('operator.lockersTitle') }}</h2>
      <ul class="lockers">
        <li v-for="locker in lockerList" :key="locker.code">
          <router-link :to="{ name: 'operator-locker', params: { code: locker.code } }">
            <strong>{{ locker.name }}</strong>
            <span class="meter"
              ><span class="meter-fill" :style="{ width: `${locker.fill_rate * 100}%` }"
            /></span>
            <span class="muted">
              {{
                t('operator.lockerLine', {
                  rate: percent(locker.fill_rate),
                  free: freeCount(locker.free_by_size),
                })
              }}
            </span>
          </router-link>
        </li>
      </ul>
    </section>
  </portal-page>
</template>

<style scoped>
.map {
  height: 360px;
}
.sizes {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.sizes th,
.sizes td {
  padding: 10px 6px;
  text-align: left;
  border-bottom: 1px solid var(--cg-chart-grid);
}
.sizes thead th {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.meter-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.meter {
  flex: 1;
  display: block;
  min-width: 60px;
  height: 8px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-surface-soft);
  overflow: hidden;
}
.meter-fill {
  display: block;
  height: 100%;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-chart-1);
}
.lockers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.lockers a {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-ground);
  color: inherit;
  text-decoration: none;
}
.lockers a:hover,
.lockers a:focus-visible {
  background: var(--cg-leaf-soft);
}
.muted {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
