<script setup lang="ts">
/**
 * Courier space: what a cargo-bike partner can expect (rounds per day, items
 * and distance per round, monthly projection), the next rounds and the map of
 * the next one (docs/PRODUCT.md §6). The indicators are a proposal awaiting
 * the project owner's choice (open question 5).
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import BarChart, { type Bar } from '../components/BarChart.vue'
import PortalMap from '../components/PortalMap.vue'
import PortalPage from '../components/PortalPage.vue'
import StatTile from '../components/StatTile.vue'
import { clock, number, shortDay } from '../data/format'
import { activity, demoNow, lockerPoints, merchantPoints, positions } from '../data/source'
import { courierSummary, nearestNeighbourOrder } from '../data/summaries'

const { t } = useI18n()

const summary = courierSummary(activity, demoNow)
const nextRound = summary.nextRounds[0]

const at = (codes: string[]): [number, number][] =>
  codes.map((code) => positions[code]).filter((p): p is [number, number] => p !== undefined)

/**
 * Stops of the next round, for display: from the city centre (average
 * position of the merchants) to the lockers, then to the merchants, each
 * time to the nearest stop.
 */
const route = computed<[number, number][]>(() => {
  if (!nextRound) return []
  const shops = at(nextRound.merchant_stops)
  const centre: [number, number] = shops.length
    ? [
        shops.reduce((s, p) => s + p[0], 0) / shops.length,
        shops.reduce((s, p) => s + p[1], 0) / shops.length,
      ]
    : [5.7245, 45.1885]
  const lockerStops = nearestNeighbourOrder(at(nextRound.locker_stops), centre)
  const merchantStops = nearestNeighbourOrder(shops, lockerStops.at(-1) ?? centre)
  return [centre, ...lockerStops, ...merchantStops]
})

// Each item travels twice: collected on the way to the merchant, returned after.
const bars: Bar[] = [
  ...activity.daily.map((d) => ({ label: shortDay(d.date), values: [d.items * 2] })),
  ...activity.forecast.map((f) => ({
    label: shortDay(f.date),
    values: [f.items * 2],
    forecast: true,
  })),
]
</script>

<template>
  <portal-page>
    <p class="intro">{{ t('courier.intro') }}</p>
    <div class="tiles">
      <stat-tile
        :label="t('courier.roundsPerDay')"
        :value="number(summary.roundsPerDay)"
        :hint="
          t('courier.roundTimes', {
            times: new Intl.ListFormat('fr', { type: 'conjunction' }).format(activity.round_times),
          })
        "
      />
      <stat-tile
        :label="t('courier.itemsPerRound')"
        :value="number(summary.averageItemsPerRound)"
        :hint="t('courier.lastWeek')"
      />
      <stat-tile
        :label="t('courier.kmPerRound')"
        :value="number(summary.averageKmPerRound)"
        :hint="t('courier.lastWeek')"
      />
      <stat-tile
        :label="t('courier.perMonth')"
        :value="number(summary.projectedItemsPerMonth)"
        :hint="t('courier.projected')"
      />
      <stat-tile
        :label="t('courier.transfersTile')"
        :value="number(summary.transfersLast7Days)"
        :hint="t('courier.lastWeekTotal')"
      />
    </div>

    <div class="columns">
      <section class="card">
        <h2>{{ t('courier.nextTitle') }}</h2>
        <ul class="plain-list">
          <li v-for="round in summary.nextRounds" :key="round.id">
            <strong>{{
              t('courier.round', { time: clock(round.starts_at), day: shortDay(round.starts_at) })
            }}</strong>
            <span>
              {{ t('courier.toCollect', { count: round.items_collected }) }} ·
              {{ t('courier.toReturn', { count: round.items_returned }) }}
            </span>
            <span class="muted">
              {{
                [
                  t('courier.lockers', round.locker_stops.length),
                  t('courier.merchants', round.merchant_stops.length),
                  t('courier.km', { km: number(round.distance_km) }),
                ].join(' · ')
              }}
            </span>
          </li>
        </ul>
      </section>
      <section class="card">
        <h2>{{ t('courier.mapTitle') }}</h2>
        <portal-map
          class="map"
          :lockers="lockerPoints"
          :merchants="merchantPoints"
          :route="route"
        />
        <p class="note">{{ t('courier.mapNote') }}</p>
      </section>
    </div>

    <section class="card">
      <bar-chart
        :title="t('courier.itemsChart')"
        :table-label="t('charts.table')"
        :bars="bars"
        :series="[{ name: t('courier.itemsSeries'), color: 'var(--cg-chart-1)' }]"
        :forecast-label="t('charts.forecast')"
        :format="number"
      />
    </section>
  </portal-page>
</template>

<style scoped>
.intro {
  margin: 0;
  max-width: 640px;
  font-size: 17px;
  color: var(--cg-ink-soft);
}
.map {
  height: 340px;
}
</style>
