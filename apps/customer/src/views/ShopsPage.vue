<script setup lang="ts">
/**
 * Shop catalogue: a search field (name, service, category, street), category
 * filters and a "partners only" switch. Without a search, shops are grouped
 * by category; partners come first in every group, best rated first.
 */
import { IonContent, IonHeader, IonPage, IonToolbar } from '@ionic/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import DemoNotice from '../components/DemoNotice.vue'
import ShopCard from '../components/ShopCard.vue'
import { buildIndex, groupByCategory, searchShops } from '../domain/shops'
import { CATEGORY_ORDER, serviceByCode, shops } from '../services/catalogue'

const { t } = useI18n()
const route = useRoute()

const query = ref('')
const category = ref<string | null>(null)
const partnersOnly = ref(false)

// The home page links here with a category.
watch(
  () => route.query.categorie,
  (value) => {
    if (typeof value === 'string' && CATEGORY_ORDER.includes(value)) category.value = value
  },
  { immediate: true },
)

const index = buildIndex(
  shops,
  (code) => t(`merchants.categories.${code}`),
  (code) => serviceByCode(code)?.name ?? '',
)

const results = computed(() =>
  searchShops(index, query.value)
    .filter((s) => !category.value || s.category === category.value)
    .filter((s) => !partnersOnly.value || s.partner),
)
/** Grouped view when the customer is browsing, flat ranked list when searching. */
const groups = computed(() =>
  query.value.trim() ? null : groupByCategory(results.value, CATEGORY_ORDER),
)
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="search-bar">
        <div class="search-wrap">
          <input
            v-model="query"
            class="search"
            type="search"
            :placeholder="t('shops.searchPlaceholder')"
            :aria-label="t('common.search')"
          />
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main class="page">
        <div class="chips" role="group" :aria-label="t('shops.title')">
          <button
            class="chip"
            :class="{ active: !category }"
            type="button"
            @click="category = null"
          >
            {{ t('shops.all') }}
          </button>
          <button
            v-for="c in CATEGORY_ORDER"
            :key="c"
            class="chip"
            :class="{ active: category === c }"
            type="button"
            @click="category = category === c ? null : c"
          >
            {{ t(`merchants.categories.${c}`) }}
          </button>
        </div>
        <div class="filters">
          <label class="toggle">
            <input v-model="partnersOnly" type="checkbox" />
            {{ t('shops.partnersOnly') }}
          </label>
          <span class="muted small" aria-live="polite">{{
            t('shops.results', results.length)
          }}</span>
        </div>

        <p v-if="!results.length" class="muted">{{ t('shops.noResult') }}</p>
        <template v-else-if="groups">
          <section v-for="group in groups" :key="group.category" class="group">
            <h2 class="section-title">
              {{ t(`merchants.categories.${group.category}`) }}
              <span class="count">{{ group.shops.length }}</span>
            </h2>
            <ul class="list">
              <li v-for="shop in group.shops" :key="shop.code"><shop-card :shop="shop" /></li>
            </ul>
          </section>
        </template>
        <ul v-else class="list">
          <li v-for="shop in results" :key="shop.code"><shop-card :shop="shop" /></li>
        </ul>

        <demo-notice />
        <p class="muted small">{{ t('shops.source') }}</p>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.search-bar {
  --background: var(--cg-ground);
}
.search-wrap {
  max-width: 640px;
  margin: 0 auto;
  padding: 10px 16px 4px;
}
.filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}
.toggle input {
  width: 20px;
  height: 20px;
  accent-color: var(--cg-leaf);
}
.group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.count {
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-surface-soft);
  font-size: 13px;
  color: var(--cg-ink-soft);
}
</style>
