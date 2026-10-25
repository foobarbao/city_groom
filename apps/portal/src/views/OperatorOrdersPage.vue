<script setup lang="ts">
/**
 * Orders of the network: search (order, shop, service, locker) and filter by
 * status; most recent first.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import OperatorNav from '../components/OperatorNav.vue'
import PortalPage from '../components/PortalPage.vue'
import { clock, euros, number, shortDay } from '../data/format'
import { activity, placeName, serviceName } from '../data/source'

/** Rows shown at once, to keep the page light. */
const PAGE_SIZE = 60
const STATUSES = [
  'awaiting_drop_off',
  'in_locker',
  'at_merchant',
  'ready_for_pickup',
  'picked_up',
] as const

const { t } = useI18n()
const route = useRoute()
const query = ref('')
const status = ref<string | null>(null)
const shown = ref(PAGE_SIZE)

// Alerts link here with an order id.
watch(
  () => route.query.q,
  (q) => {
    if (typeof q === 'string') query.value = q
  },
  { immediate: true },
)

const norm = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
const rows = computed(() => {
  const words = norm(query.value).split(/\s+/).filter(Boolean)
  return [...activity.orders]
    .filter((o) => !status.value || o.status === status.value)
    .filter((o) => {
      const text = norm(
        [
          o.id,
          placeName(o.merchant),
          serviceName(o.service),
          placeName(o.drop_locker),
          placeName(o.pickup_locker),
        ].join(' '),
      )
      return words.every((w) => text.includes(w))
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
})
const counts = computed(() =>
  Object.fromEntries(
    STATUSES.map((s) => [s, activity.orders.filter((o) => o.status === s).length]),
  ),
)
</script>

<template>
  <portal-page :title="t('operator.title')" back-href="/">
    <operator-nav current="operator-orders" />
    <div class="filters">
      <input
        v-model="query"
        type="search"
        :placeholder="t('operator.orders.search')"
        :aria-label="t('operator.orders.search')"
      />
    </div>
    <div class="filters">
      <button class="chip-btn" :class="{ active: !status }" type="button" @click="status = null">
        {{ t('operator.orders.all') }} · {{ number(activity.orders.length) }}
      </button>
      <button
        v-for="s in STATUSES"
        :key="s"
        class="chip-btn"
        :class="{ active: status === s }"
        type="button"
        @click="status = s"
      >
        {{ t(`operator.orders.status.${s}`) }} · {{ number(counts[s] ?? 0) }}
      </button>
    </div>
    <section class="card">
      <h2>{{ t('operator.orders.count', rows.length) }}</h2>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">{{ t('operator.orders.id') }}</th>
              <th scope="col">{{ t('operator.orders.date') }}</th>
              <th scope="col">{{ t('operator.orders.shop') }}</th>
              <th scope="col">{{ t('operator.orders.service') }}</th>
              <th scope="col">{{ t('operator.orders.lockers') }}</th>
              <th scope="col">{{ t('operator.orders.statusCol') }}</th>
              <th scope="col" class="num">{{ t('operator.orders.amount') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in rows.slice(0, shown)" :key="o.id">
              <td>
                <strong>{{ o.id }}</strong>
              </td>
              <td>{{ shortDay(o.created_at) }} {{ clock(o.created_at) }}</td>
              <td>{{ placeName(o.merchant) }}</td>
              <td>{{ o.items }} × {{ serviceName(o.service) }}</td>
              <td>
                {{ placeName(o.drop_locker)
                }}<template v-if="o.pickup_locker !== o.drop_locker">
                  → {{ placeName(o.pickup_locker) }}</template
                >
              </td>
              <td>
                <span
                  class="status-pill"
                  :class="{
                    ok: o.status === 'picked_up',
                    warn: o.late_pickup && o.status === 'ready_for_pickup',
                  }"
                >
                  {{ t(`operator.orders.status.${o.status}`) }}
                </span>
              </td>
              <td class="num">{{ euros(Number.parseFloat(o.price_total)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <button
        v-if="rows.length > shown"
        class="chip-btn more"
        type="button"
        @click="shown += PAGE_SIZE"
      >
        {{ t('operator.orders.more') }}
      </button>
    </section>
  </portal-page>
</template>

<style scoped>
.more {
  align-self: center;
}
</style>
