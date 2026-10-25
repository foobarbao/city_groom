<script setup lang="ts">
/**
 * Lockers of the network: search, filter by kind of place, sort by fill
 * rate or name; each row opens the locker front with door statuses.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import OperatorNav from '../components/OperatorNav.vue'
import PortalPage from '../components/PortalPage.vue'
import { number, percent } from '../data/format'
import { lockers } from '../data/source'

const { t } = useI18n()
const query = ref('')
const category = ref<string | null>(null)
const sort = ref<'fill' | 'name'>('fill')

const categories = [...new Set(lockers.map((l) => l.site_category))].sort()
const norm = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
const free = (f: Record<string, number>): number => Object.values(f).reduce((s, n) => s + n, 0)
const outOfService = (l: (typeof lockers)[number]): number =>
  l.compartments.filter((c) => c.status === 'out_of_service').length

const rows = computed(() =>
  lockers
    .filter((l) => !category.value || l.site_category === category.value)
    .filter((l) => norm(l.name).includes(norm(query.value.trim())))
    .sort((a, b) =>
      sort.value === 'fill' ? b.fill_rate - a.fill_rate : a.name.localeCompare(b.name, 'fr'),
    ),
)
</script>

<template>
  <portal-page :title="t('operator.title')" back-href="/">
    <operator-nav current="operator-lockers" />
    <div class="filters">
      <input
        v-model="query"
        type="search"
        :placeholder="t('operator.lockers.search')"
        :aria-label="t('operator.lockers.search')"
      />
      <button
        class="chip-btn"
        :class="{ active: sort === 'fill' }"
        type="button"
        @click="sort = 'fill'"
      >
        {{ t('operator.lockers.sortFill') }}
      </button>
      <button
        class="chip-btn"
        :class="{ active: sort === 'name' }"
        type="button"
        @click="sort = 'name'"
      >
        {{ t('operator.lockers.sortName') }}
      </button>
    </div>
    <div class="filters">
      <button
        class="chip-btn"
        :class="{ active: !category }"
        type="button"
        @click="category = null"
      >
        {{ t('operator.lockers.all') }}
      </button>
      <button
        v-for="c in categories"
        :key="c"
        class="chip-btn"
        :class="{ active: category === c }"
        type="button"
        @click="category = c"
      >
        {{ t(`operator.sites.${c}`) }}
      </button>
    </div>
    <section class="card">
      <h2>{{ t('operator.lockers.count', rows.length) }}</h2>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">{{ t('operator.lockers.name') }}</th>
              <th scope="col">{{ t('operator.lockers.kind') }}</th>
              <th scope="col" class="num">{{ t('operator.lockers.fill') }}</th>
              <th scope="col" class="num">{{ t('operator.lockers.free') }}</th>
              <th scope="col" class="num">{{ t('operator.lockers.doors') }}</th>
              <th scope="col" class="num">{{ t('operator.lockers.outOfService') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in rows" :key="l.code">
              <td>
                <router-link :to="{ name: 'operator-locker', params: { code: l.code } }">{{
                  l.name
                }}</router-link>
              </td>
              <td>{{ t(`operator.sites.${l.site_category}`) }}</td>
              <td class="num">
                <span class="status-pill" :class="{ warn: l.fill_rate >= 0.75 }">{{
                  percent(l.fill_rate)
                }}</span>
              </td>
              <td class="num">{{ number(free(l.free_by_size)) }}</td>
              <td class="num">{{ number(l.compartments.length) }}</td>
              <td class="num">{{ outOfService(l) || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </portal-page>
</template>

<style scoped>
a {
  font-weight: 800;
  color: var(--cg-pine);
  text-decoration: none;
}
</style>
