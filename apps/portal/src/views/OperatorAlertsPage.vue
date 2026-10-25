<script setup lang="ts">
/**
 * Operator alerts: lockers almost full or without a large free door, doors
 * out of service, customers late to collect. Each alert links to the
 * locker or order concerned.
 */
import { useI18n } from 'vue-i18n'

import PortalPage from '../components/PortalPage.vue'
import { ALMOST_FULL, operatorAlerts } from '../data/operator'
import { percent } from '../data/format'
import { activity, lockers, placeName } from '../data/source'

const { t } = useI18n()
const alerts = operatorAlerts(lockers, activity.orders)
const isLocker = (kind: string): boolean => kind !== 'late_pickup'
</script>

<template>
  <portal-page>
    <p class="intro">{{ t('operator.alerts.intro', { threshold: percent(ALMOST_FULL) }) }}</p>
    <p v-if="!alerts.length" class="card">{{ t('operator.alerts.none') }}</p>
    <ul class="alerts">
      <li v-for="a in alerts" :key="a.kind + a.ref" class="card alert" :class="a.level">
        <span class="dot" aria-hidden="true" />
        <span class="body">
          <strong>{{ t(`operator.alerts.kinds.${a.kind}`, { value: a.value }) }}</strong>
          <span class="muted">{{
            isLocker(a.kind) ? placeName(a.ref) : t('operator.alerts.order', { id: a.ref })
          }}</span>
        </span>
        <router-link
          v-if="isLocker(a.kind)"
          class="open"
          :to="{ name: 'operator-locker', params: { code: a.ref } }"
        >
          {{ t('operator.alerts.openLocker') }} →
        </router-link>
        <router-link v-else class="open" :to="{ name: 'operator-orders', query: { q: a.ref } }">
          {{ t('operator.alerts.openOrder') }} →
        </router-link>
      </li>
    </ul>
  </portal-page>
</template>

<style scoped>
.intro {
  margin: 0;
  color: var(--cg-ink-soft);
}
.alerts {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.alert {
  flex-direction: row !important;
  align-items: center;
  gap: 14px;
}
.dot {
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--cg-sun);
}
.alert.high .dot {
  background: #d9542b;
}
.body {
  display: flex;
  flex: 1;
  flex-direction: column;
}
.muted {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.open {
  font-weight: 600;
  color: var(--cg-leaf);
  text-decoration: none;
  white-space: nowrap;
}
</style>
