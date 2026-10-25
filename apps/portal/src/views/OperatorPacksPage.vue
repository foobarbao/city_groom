<script setup lang="ts">
/**
 * Weekly packs, operator view (docs/PRODUCT.md "Weekly pack"). INTERNAL:
 * active packs, weekly and monthly volume, and the dispatch to partner
 * laundries according to the availability they declare (`packs.ts`). The
 * volume announced to each laundry is the monthly figure of this table.
 */
import { useI18n } from 'vue-i18n'

import PortalPage from '../components/PortalPage.vue'
import StatTile from '../components/StatTile.vue'
import { number, percent } from '../data/format'
import { activePacks, packDispatch, packLaundries, perPack, weeklyPack } from '../data/packDispatch'

const { t } = useI18n()
const weeks = weeklyPack.weeks_per_purchase
const totalCapacity = (): number => packLaundries.value.reduce((n, l) => n + l.capacityShirts, 0)
const totalShirts = (): number => packDispatch.value.allocations.reduce((n, a) => n + a.shirts, 0)
</script>

<template>
  <portal-page>
    <p class="internal" role="note">{{ t('operator.packs.internal') }}</p>
    <div class="tiles">
      <stat-tile :label="t('operator.packs.active')" :value="number(activePacks)" />
      <stat-tile
        :label="t('operator.packs.weekly')"
        :value="
          t('operator.packs.items', {
            shirts: number(activePacks * perPack.shirts),
            trousers: number(activePacks * perPack.trousers),
          })
        "
      />
      <stat-tile
        :label="t('operator.packs.monthly', { weeks })"
        :value="
          t('operator.packs.items', {
            shirts: number(activePacks * perPack.shirts * weeks),
            trousers: number(activePacks * perPack.trousers * weeks),
          })
        "
      />
      <stat-tile
        :label="t('operator.packs.load')"
        :value="totalCapacity() ? percent(totalShirts() / totalCapacity()) : '—'"
        :hint="t('operator.packs.loadHint', { capacity: number(totalCapacity()) })"
      />
    </div>

    <section class="card">
      <h2>{{ t('operator.packs.dispatchTitle') }}</h2>
      <p class="note">{{ t('operator.packs.dispatchRule') }}</p>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">{{ t('operator.packs.laundry') }}</th>
              <th scope="col" class="num">{{ t('operator.packs.capacity') }}</th>
              <th scope="col" class="num">{{ t('operator.packs.packs') }}</th>
              <th scope="col" class="num">{{ t('operator.packs.perWeek') }}</th>
              <th scope="col" class="num">{{ t('operator.packs.announced', { weeks }) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in packDispatch.allocations" :key="a.code">
              <td>{{ a.name }}</td>
              <td class="num">{{ number(a.capacityShirts) }}</td>
              <td class="num">{{ number(a.packs) }}</td>
              <td class="num">
                {{ t('operator.packs.items', { shirts: a.shirts, trousers: a.trousers }) }}
              </td>
              <td class="num">
                {{
                  t('operator.packs.items', {
                    shirts: a.shirts * weeks,
                    trousers: a.trousers * weeks,
                  })
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="packDispatch.unallocated" class="warn" role="alert">
        {{ t('operator.packs.unallocated', packDispatch.unallocated) }}
      </p>
      <p class="note">{{ t('operator.packs.demo') }}</p>
    </section>
  </portal-page>
</template>

<style scoped>
.internal {
  align-self: flex-start;
  margin: 0;
  padding: 8px 14px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-sun-soft);
  font-size: 13px;
  font-weight: 600;
}
.num {
  text-align: right;
}
.warn {
  margin: 0;
  color: #9a5b00;
  font-weight: 600;
}
</style>
