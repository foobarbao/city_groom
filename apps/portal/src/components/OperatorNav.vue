<script setup lang="ts">
/**
 * Menu of the operator space: overview, alerts, lockers, orders, rounds,
 * partner shops, forecasts.
 *
 * Props:
 * - `current`: route name of the current section.
 */
import { useI18n } from 'vue-i18n'

import { operatorAlerts } from '../data/operator'
import { activity, lockers } from '../data/source'

defineProps<{ current: string }>()
const { t } = useI18n()

const alertCount = operatorAlerts(lockers, activity.orders).length
const SECTIONS = [
  { name: 'operator', label: 'operator.nav.overview' },
  { name: 'operator-alerts', label: 'operator.nav.alerts' },
  { name: 'operator-lockers', label: 'operator.nav.lockers' },
  { name: 'operator-orders', label: 'operator.nav.orders' },
  { name: 'operator-rounds', label: 'operator.nav.rounds' },
  { name: 'operator-partners', label: 'operator.nav.partners' },
  { name: 'operator-forecast', label: 'operator.nav.forecast' },
]
</script>

<template>
  <nav class="sub-nav" :aria-label="t('operator.title')">
    <router-link
      v-for="s in SECTIONS"
      :key="s.name"
      :to="{ name: s.name }"
      class="sub-link"
      :class="{ active: s.name === current }"
      :aria-current="s.name === current ? 'page' : undefined"
    >
      {{ t(s.label) }}
      <span v-if="s.name === 'operator-alerts' && alertCount" class="badge">{{ alertCount }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.sub-nav {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 2px 6px;
}
.sub-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 10px 18px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  font-weight: 800;
  text-decoration: none;
}
.sub-link.active {
  background: var(--cg-leaf);
  color: #ffffff;
}
.badge {
  min-width: 20px;
  padding: 1px 6px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-sun);
  color: var(--cg-ink);
  font-size: 12px;
  text-align: center;
}
</style>
