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
import { activity, demoNow, lockerPoints, lockers, operatorData, placeName } from '../data/source'
import { operatorAlerts } from '../data/operator'
import { operatorKpis } from '../data/summaries'
import OperatorNav from '../components/OperatorNav.vue'

const { t } = useI18n()
const router = useRouter()

const kpis = operatorKpis(activity, demoNow)
const stats = operatorData.stats

const alerts = operatorAlerts(lockers, activity.orders)
const transfersToday = activity.transfers.filter(
  (tr) =>
    new Date(tr.round_at).toLocaleDateString('sv-SE', { timeZone: activity.timezone }) ===
    demoNow.toLocaleDateString('sv-SE', { timeZone: activity.timezone }),
).length

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
    <operator-nav current="operator" />
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
      <stat-tile
        :label="t('operator.transfersToday')"
        :value="number(transfersToday)"
        :hint="t('operator.consigne')"
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

    <div class="columns">
      <section class="card">
        <h2>{{ t('operator.alerts.title') }}</h2>
        <p v-if="!alerts.length" class="note">{{ t('operator.alerts.none') }}</p>
        <ul class="plain-list">
          <li v-for="a in alerts.slice(0, 4)" :key="a.kind + a.ref">
            <strong>{{ t(`operator.alerts.kinds.${a.kind}`, { value: a.value }) }}</strong>
            <span class="muted">{{
              a.kind === 'late_pickup'
                ? t('operator.alerts.order', { id: a.ref })
                : placeName(a.ref)
            }}</span>
          </li>
        </ul>
        <router-link class="more" :to="{ name: 'operator-alerts' }"
          >{{ t('operator.alerts.all', alerts.length) }} →</router-link
        >
      </section>
      <section class="card">
        <h2>{{ t('operator.admin.title') }}</h2>
        <p>{{ t('operator.admin.text') }}</p>
        <ul class="admin-list">
          <li
            v-for="item in ['lockers', 'merchants', 'offers', 'commission', 'apiKeys']"
            :key="item"
          >
            {{ t(`operator.admin.items.${item}`) }}
          </li>
        </ul>
        <p class="note">{{ t('operator.admin.demo') }}</p>
      </section>
    </div>
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
.more {
  font-weight: 800;
  color: var(--cg-leaf);
  text-decoration: none;
}
.admin-list {
  margin: 0;
  padding-left: 18px;
  color: var(--cg-ink-soft);
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
