<script setup lang="ts">
/**
 * Merchant space: what arrives at the next rounds, what is being processed,
 * revenue and commission, the forecast, and how the commission will decrease
 * (docs/PRODUCT.md §5 and §9).
 *
 * The demo shows fictitious "Démo · …" merchants only, so that no real
 * business is associated with invented orders or revenue (docs/DEMO.md).
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import BarChart, { type Bar } from '../components/BarChart.vue'
import MerchantShell from '../components/MerchantShell.vue'
import StatTile from '../components/StatTile.vue'
import { clock, euros, eurosRounded, number, percent, shortDay } from '../data/format'
import { activity, demoNow, partnerOrFirst, serviceName } from '../data/source'
import { merchantSummary } from '../data/summaries'

/** Long-term commission target stated by the project owner (docs/PRODUCT.md §9). */
const TARGET_COMMISSION_RATE = 0.01

const props = defineProps<{
  /** Merchant code, from the route; the first demo merchant when empty. */
  code?: string
}>()

const { t } = useI18n()

const merchant = computed(() => partnerOrFirst(props.code))
const summary = computed(() =>
  merchant.value ? merchantSummary(activity, merchant.value.code, demoNow) : null,
)

/** Items being processed, the next handover to the courier first. */
const handoverOrder = computed(() =>
  [...(summary.value?.inProgress ?? [])].sort((a, b) =>
    (a.returned_at ?? '9').localeCompare(b.returned_at ?? '9'),
  ),
)

const revenueBars = computed<Bar[]>(() =>
  (summary.value?.days ?? []).map((d) => ({
    label: shortDay(d.date),
    values: [d.net, d.commission],
  })),
)
const itemBars = computed<Bar[]>(() => [
  ...(summary.value?.days ?? []).map((d) => ({ label: shortDay(d.date), values: [d.items] })),
  ...(summary.value?.forecastItems ?? []).map((f) => ({
    label: shortDay(f.date),
    values: [f.items],
    forecast: true,
  })),
])
</script>

<template>
  <merchant-shell :code="code" section="merchant">
    <template v-if="summary">
      <div class="columns">
        <section class="card">
          <h2>{{ t('merchant.incomingTitle') }}</h2>
          <ul v-if="summary.incoming.length" class="plain-list">
            <li v-for="round in summary.incoming" :key="round.startsAt">
              <strong>
                {{
                  t('merchant.incomingRound', {
                    time: clock(round.startsAt),
                    day: shortDay(round.startsAt),
                  })
                }}
                · {{ t('merchant.items', round.items) }}
              </strong>
              <span class="muted">
                {{
                  round.byService.map((s) => `${s.items} × ${serviceName(s.service)}`).join(' · ')
                }}
              </span>
            </li>
          </ul>
          <p v-else class="note">{{ t('merchant.incomingEmpty') }}</p>
        </section>

        <section class="card">
          <h2>{{ t('merchant.inProgressTitle') }}</h2>
          <ul v-if="summary.inProgress.length" class="plain-list">
            <li v-for="order in handoverOrder.slice(0, 6)" :key="order.id">
              <strong>
                {{ t('merchant.items', order.items) }} ·
                {{ serviceName(order.service) }}
              </strong>
              <span v-if="order.returned_at" class="handover">
                {{
                  t('merchant.handoverAt', {
                    time: clock(order.returned_at),
                    day: shortDay(order.returned_at),
                  })
                }}
              </span>
              <span class="muted">{{ order.id }}</span>
            </li>
          </ul>
          <p v-else class="note">{{ t('merchant.inProgressEmpty') }}</p>
        </section>
      </div>

      <h2 class="section-title">{{ t('merchant.totalsTitle', { days: summary.days.length }) }}</h2>
      <div class="tiles">
        <stat-tile :label="t('merchant.orders')" :value="number(summary.totals.orders)" />
        <stat-tile :label="t('merchant.revenue')" :value="euros(summary.totals.revenue)" />
        <stat-tile
          :label="t('merchant.commission')"
          :value="euros(summary.totals.commission)"
          :hint="percent(summary.commissionRate)"
        />
        <stat-tile :label="t('merchant.net')" :value="euros(summary.totals.net)" />
      </div>

      <div class="columns">
        <section class="card">
          <bar-chart
            :title="t('merchant.revenueChart')"
            :table-label="t('charts.table')"
            :bars="revenueBars"
            :series="[
              { name: t('merchant.net'), color: 'var(--cg-chart-1)' },
              { name: t('merchant.commission'), color: 'var(--cg-chart-2)' },
            ]"
            :format="eurosRounded"
          />
        </section>
        <section class="card">
          <bar-chart
            :title="t('merchant.itemsChart')"
            :table-label="t('charts.table')"
            :bars="itemBars"
            :series="[{ name: t('merchant.itemsSeries'), color: 'var(--cg-chart-1)' }]"
            :forecast-label="t('charts.forecast')"
            :format="number"
          />
        </section>
      </div>

      <section class="card commission">
        <h2>{{ t('merchant.commissionTitle') }}</h2>
        <p class="rate">
          {{ t('merchant.commissionRate', { rate: percent(summary.commissionRate) }) }}
        </p>
        <div class="gauge" aria-hidden="true">
          <span class="gauge-target">{{ percent(TARGET_COMMISSION_RATE) }}</span>
          <span class="gauge-track"><span class="gauge-now" /></span>
          <span class="gauge-start">{{ percent(summary.commissionRate) }}</span>
        </div>
        <p>{{ t('merchant.commissionText', { rate: percent(summary.commissionRate) }) }}</p>
        <p>{{ t('merchant.commissionTarget', { target: percent(TARGET_COMMISSION_RATE) }) }}</p>
        <p class="note">
          {{
            t('merchant.commissionExample', {
              target: percent(TARGET_COMMISSION_RATE),
              amount: euros(summary.totals.revenue * TARGET_COMMISSION_RATE),
            })
          }}
        </p>
      </section>
    </template>
  </merchant-shell>
</template>

<style scoped>
.section-title {
  margin: 8px 0 0;
  font-size: 19px;
  font-weight: 800;
}
.commission p {
  margin: 0;
}
.rate {
  font-size: 22px;
  font-weight: 800;
  color: var(--cg-pine);
}
.gauge {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--cg-ink-soft);
}
.gauge-track {
  position: relative;
  height: 12px;
  border-radius: var(--cg-radius-pill);
  background: linear-gradient(90deg, var(--cg-leaf), var(--cg-leaf-soft));
}
/* The current rate sits at the start of the decrease (right end). */
.gauge-now {
  position: absolute;
  right: -2px;
  top: -5px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  border: 4px solid var(--cg-chart-2);
}
.handover {
  align-self: flex-start;
  margin: 2px 0;
  padding: 3px 10px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-sun-soft);
  font-size: 13px;
  font-weight: 800;
  color: var(--cg-ink);
}
</style>
