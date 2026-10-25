<script setup lang="ts">
/**
 * Partner shops: rating, orders, revenue, platform commission and items in
 * progress over the activity window; links to each merchant space. Real
 * businesses that are not partners are counted, never rated.
 */
import { useI18n } from 'vue-i18n'

import PortalPage from '../components/PortalPage.vue'
import StatTile from '../components/StatTile.vue'
import { euros, number, percent } from '../data/format'
import { partnerStats } from '../data/operator'
import { activity, partners, placeName, publicData } from '../data/source'

const { t } = useI18n()
const stats = partnerStats(
  activity,
  partners.map((p) => p.code),
)
const rating = (code: string) => partners.find((p) => p.code === code)?.reviews
const total = (key: 'revenue' | 'commission'): number => stats.reduce((s, p) => s + p[key], 0)
const otherBusinesses = (publicData.merchants.features ?? []).length
</script>

<template>
  <portal-page>
    <div class="tiles">
      <stat-tile
        :label="t('operator.partners.partners')"
        :value="number(partners.length)"
        :hint="t('operator.partners.fictitious')"
      />
      <stat-tile
        :label="t('operator.partners.revenue')"
        :value="euros(total('revenue'))"
        :hint="t('operator.partners.window', { days: activity.daily.length })"
      />
      <stat-tile
        :label="t('operator.partners.commission')"
        :value="euros(total('commission'))"
        :hint="percent(Number.parseFloat(activity.commission_rate))"
      />
      <stat-tile
        :label="t('operator.partners.others')"
        :value="number(otherBusinesses)"
        :hint="t('operator.partners.othersHint')"
      />
    </div>
    <section class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">{{ t('operator.partners.shop') }}</th>
              <th scope="col" class="num">{{ t('operator.partners.rating') }}</th>
              <th scope="col" class="num">{{ t('operator.partners.orders') }}</th>
              <th scope="col" class="num">{{ t('operator.partners.revenue') }}</th>
              <th scope="col" class="num">{{ t('operator.partners.commission') }}</th>
              <th scope="col" class="num">{{ t('operator.partners.inProgress') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in stats" :key="p.code">
              <td>
                <router-link :to="{ name: 'merchant', params: { code: p.code } }">{{
                  placeName(p.code)
                }}</router-link>
              </td>
              <td class="num">
                ★ {{ rating(p.code)?.average.toLocaleString('fr-FR') }}
                <span class="muted">({{ rating(p.code)?.count }})</span>
              </td>
              <td class="num">{{ number(p.orders) }}</td>
              <td class="num">{{ euros(p.revenue) }}</td>
              <td class="num">{{ euros(p.commission) }}</td>
              <td class="num">{{ number(p.inProgress) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="note">{{ t('operator.partners.note') }}</p>
    </section>
  </portal-page>
</template>

<style scoped>
a {
  font-weight: 800;
  color: var(--cg-pine);
  text-decoration: none;
}
.muted {
  font-size: 12px;
  color: var(--cg-ink-soft);
}
</style>
