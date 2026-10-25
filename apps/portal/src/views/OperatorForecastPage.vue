<script setup lang="ts">
/**
 * Flow forecasts (docs/PRODUCT.md §7): orders per day, items per round and
 * busiest lockers over the next days, from the past activity.
 */
import { useI18n } from 'vue-i18n'

import BarChart, { type Bar } from '../components/BarChart.vue'
import OperatorNav from '../components/OperatorNav.vue'
import PortalPage from '../components/PortalPage.vue'
import { number, shortDay } from '../data/format'
import { forecastByLocker, forecastByRound } from '../data/operator'
import { activity, placeName } from '../data/source'

const { t } = useI18n()
const days: Bar[] = [
  ...activity.daily.slice(-7).map((d) => ({ label: shortDay(d.date), values: [d.items] })),
  ...activity.forecast.map((f) => ({ label: shortDay(f.date), values: [f.items], forecast: true })),
]
const byRound = forecastByRound(activity)
const dates = [...new Set(byRound.map((r) => r.date))]
const cell = (date: string, time: string): number =>
  byRound.find((r) => r.date === date && r.time === time)?.items ?? 0
const lockers = forecastByLocker(activity)
</script>

<template>
  <portal-page :title="t('operator.title')" back-href="/">
    <operator-nav current="operator-forecast" />
    <section class="card">
      <bar-chart
        :title="t('operator.forecast.days')"
        :table-label="t('charts.table')"
        :bars="days"
        :series="[{ name: t('operator.forecast.items'), color: 'var(--cg-chart-1)' }]"
        :forecast-label="t('charts.forecast')"
        :format="number"
      />
    </section>
    <div class="columns">
      <section class="card">
        <h2>{{ t('operator.forecast.byRound') }}</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">{{ t('operator.forecast.day') }}</th>
                <th v-for="time in activity.round_times" :key="time" scope="col" class="num">
                  {{ time }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in dates" :key="d">
                <td>{{ shortDay(d) }}</td>
                <td v-for="time in activity.round_times" :key="time" class="num">
                  {{ number(cell(d, time)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="note">{{ t('operator.forecast.byRoundNote') }}</p>
      </section>
      <section class="card">
        <h2>{{ t('operator.forecast.byLocker') }}</h2>
        <ol class="plain-list">
          <li v-for="l in lockers" :key="l.code" class="row">
            <span>{{ placeName(l.code) }}</span>
            <strong>{{ t('operator.forecast.itemsCount', l.items) }}</strong>
          </li>
        </ol>
        <p class="note">
          {{ t('operator.forecast.byLockerNote', { days: activity.forecast.length }) }}
        </p>
      </section>
    </div>
  </portal-page>
</template>

<style scoped>
.row {
  flex-direction: row !important;
  justify-content: space-between;
}
</style>
