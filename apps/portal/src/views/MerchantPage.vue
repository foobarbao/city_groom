<script setup lang="ts">
/**
 * Merchant space: what arrives at the next rounds, what is being processed,
 * revenue and commission, the forecast, and how the commission will decrease
 * (docs/PRODUCT.md §5 and §9).
 *
 * The demo shows fictitious "Démo · …" merchants only, so that no real
 * business is associated with invented orders or revenue (docs/DEMO.md).
 */
import { IonIcon } from '@ionic/vue'
import { calendarOutline, chevronForwardOutline } from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import BarChart, { type Bar } from '../components/BarChart.vue'
import MerchantShell from '../components/MerchantShell.vue'
import StatTile from '../components/StatTile.vue'
import { clock, euros, eurosRounded, number, percent, shortDay } from '../data/format'
import { packDispatch, weeklyPack } from '../data/packDispatch'
import { DEFAULT_CAPACITY_SHIRTS, PACK_CATEGORIES } from '../data/packs'
import { googleCalendarOf, packCapacityOf, setPackCapacity } from '../data/partnerState'
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

// Weekly pack (laundries only): volume announced by CityPal for the next
// weeks, and the availability the laundry declares for it.
const takesPacks = computed(() => PACK_CATEGORIES.includes(merchant.value?.category ?? ''))
const packShare = computed(() =>
  packDispatch.value.allocations.find((a) => a.code === merchant.value?.code),
)
const capacityDraft = ref(DEFAULT_CAPACITY_SHIRTS)
watch(
  merchant,
  (m) => {
    capacityDraft.value = (m && packCapacityOf(m.code)) ?? DEFAULT_CAPACITY_SHIRTS
  },
  { immediate: true },
)
const capacitySaved = ref(false)
function saveCapacity(): void {
  if (!merchant.value) return
  setPackCapacity(merchant.value.code, Number(capacityDraft.value))
  capacitySaved.value = true
}
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
    <!-- Entry point to the Google Agenda sync, kept visible on the dashboard. -->
    <router-link
      v-if="merchant && !googleCalendarOf(merchant.code)"
      class="card gcal-banner"
      :to="{ name: 'merchant-agenda', params: { code: merchant.code } }"
    >
      <span class="gcal-icon" aria-hidden="true"><ion-icon :icon="calendarOutline" /></span>
      <span class="gcal-text">
        <strong>{{ t('merchant.agenda.gsync.bannerTitle') }}</strong>
        <span>{{ t('merchant.agenda.gsync.bannerText') }}</span>
      </span>
      <ion-icon class="gcal-chevron" :icon="chevronForwardOutline" aria-hidden="true" />
    </router-link>
    <section v-if="takesPacks && packShare" class="card pack">
      <h2>{{ t('merchant.pack.title') }}</h2>
      <p>
        {{ t('merchant.pack.announced', { weeks: weeklyPack.weeks_per_purchase }) }}
        <strong>{{
          t('merchant.pack.items', {
            shirts: packShare.shirts * weeklyPack.weeks_per_purchase,
            trousers: packShare.trousers * weeklyPack.weeks_per_purchase,
          })
        }}</strong>
      </p>
      <p class="note">
        {{
          t('merchant.pack.perWeek', {
            packs: packShare.packs,
            items: t('merchant.pack.items', {
              shirts: packShare.shirts,
              trousers: packShare.trousers,
            }),
          })
        }}
      </p>
      <form class="capacity" @submit.prevent="saveCapacity">
        <label>
          {{ t('merchant.pack.capacity') }}
          <input
            v-model.number="capacityDraft"
            type="number"
            min="0"
            step="5"
            inputmode="numeric"
            @input="capacitySaved = false"
          />
        </label>
        <button type="submit">{{ t('merchant.pack.save') }}</button>
        <span v-if="capacitySaved" class="note" role="status"
          >✓ {{ t('merchant.pack.saved') }}</span
        >
      </form>
    </section>
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
  font-weight: 600;
}
.commission p {
  margin: 0;
}
.rate {
  font-size: 22px;
  font-weight: 600;
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
  font-weight: 600;
  color: var(--cg-ink);
}
.gcal-banner {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}
.gcal-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-leaf-soft);
  color: var(--cg-leaf);
  font-size: 20px;
}
.gcal-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.gcal-text span {
  font-size: 14px;
  color: var(--cg-ink-soft);
}
.gcal-chevron {
  color: var(--cg-ink-soft);
}
.pack p {
  margin: 0;
}
.capacity {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
}
.capacity label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}
.capacity input {
  width: 120px;
  padding: 8px 12px;
  border: 1px solid var(--cg-locker-door-edge);
  border-radius: var(--cg-radius-s);
  background: var(--cg-ground);
  color: var(--cg-ink);
  font: inherit;
}
.capacity button {
  padding: 9px 16px;
  border: none;
  border-radius: var(--cg-radius-m);
  background: var(--cg-leaf);
  color: #ffffff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
</style>
