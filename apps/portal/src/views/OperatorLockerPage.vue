<script setup lang="ts">
/**
 * Locker detail for operators: the drawing of the locker front with every
 * door coloured by its status, and the count of doors per status
 * (docs/PRODUCT.md §4, "Locker visualisation").
 */
import { LockerFront, computeLockerDrawing } from '@city-groom/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import PortalPage from '../components/PortalPage.vue'
import StatTile from '../components/StatTile.vue'
import { number, percent } from '../data/format'
import { operatorData, publicData } from '../data/source'

const STATUSES = ['free', 'reserved', 'occupied', 'out_of_service'] as const

const props = defineProps<{
  /** Locker code, from the route. */
  code: string
}>()

const { t } = useI18n()

const locker = computed(() => operatorData.details[props.code] ?? null)
const drawing = computed(() =>
  locker.value ? computeLockerDrawing(locker.value, publicData.sizes) : null,
)
const statuses = computed(() =>
  Object.fromEntries((locker.value?.compartments ?? []).map((c) => [c.label, c.status])),
)
const counts = computed(() =>
  STATUSES.map((status) => ({
    status,
    count: (locker.value?.compartments ?? []).filter((c) => c.status === status).length,
  })),
)
const methods = computed(() =>
  (locker.value?.access_methods ?? []).map((m) => t(`operator.methods.${m}`)).join(', '),
)
</script>

<template>
  <portal-page
    :title="locker?.name ?? code"
    back-href="/exploitation"
    :back-text="t('operator.lockerBack')"
  >
    <template v-if="locker && drawing">
      <div class="tiles">
        <stat-tile :label="t('operator.lockerFillRate')" :value="percent(locker.fill_rate)" />
        <stat-tile
          v-for="item in counts"
          :key="item.status"
          :label="t(`operator.statuses.${item.status}`)"
          :value="number(item.count)"
        />
      </div>
      <section class="card stage">
        <h2>{{ t('operator.doorsTitle') }}</h2>
        <p class="note">
          {{ t('operator.accessMethods', { methods }) }}
          <template v-if="locker.is_simulated"> · {{ t('operator.simulated') }}</template>
        </p>
        <locker-front
          :drawing="drawing"
          :statuses="statuses"
          :panel-label="t('operator.panel')"
          class="drawing"
          :aria-label="locker.name"
        />
        <ul class="legend">
          <li v-for="item in counts" :key="item.status">
            <span :class="['swatch', `swatch-${item.status}`]" aria-hidden="true" />
            {{ t(`operator.statuses.${item.status}`) }} ({{ item.count }})
          </li>
        </ul>
      </section>
    </template>
  </portal-page>
</template>

<style scoped>
.drawing {
  width: 100%;
  max-width: 560px;
}
.stage {
  align-items: center;
  background: linear-gradient(180deg, var(--cg-leaf-soft), var(--cg-surface));
}
/* Same colours as the door statuses in LockerFront. */
.legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
}
.legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid var(--cg-locker-door-edge);
}
.swatch-free {
  background: var(--cg-locker-door);
}
.swatch-reserved {
  background: var(--cg-sun);
}
.swatch-occupied {
  background: var(--cg-leaf);
}
.swatch-out_of_service {
  background: var(--cg-surface-soft);
  border-style: dashed;
}
</style>
