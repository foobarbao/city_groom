<script setup lang="ts">
/**
 * Shops and services. Customers mostly look for a service rather than a
 * shop: the screen starts with the service types (ironing, resoling…); one
 * tap lists the partner shops offering it, with price and turnaround. A
 * search field suggests services and shops (name, category, street); below,
 * shops are grouped by category, partners first, best rated first.
 */
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import { chevronForwardOutline, storefrontOutline } from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import AppHeader from '../components/AppHeader.vue'
import DemoNotice from '../components/DemoNotice.vue'
import ShopCard from '../components/ShopCard.vue'
import {
  buildIndex,
  groupByCategory,
  matchServices,
  rankProviders,
  searchShops,
} from '../domain/shops'
import RatingStars from '../components/RatingStars.vue'
import {
  CATEGORY_ORDER,
  offeredServices,
  providersOf,
  serviceByCode,
  shops,
} from '../services/catalogue'
import { euros } from '../utils/format'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

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

/** Service type chosen by the customer (from the route, so "back" works). */
const service = computed(() =>
  typeof route.query.service === 'string' ? serviceByCode(route.query.service) : undefined,
)
const providers = computed(() =>
  service.value ? rankProviders(providersOf(service.value.code)) : [],
)
const fromPrice = computed(() =>
  providers.value.length ? Math.min(...providers.value.map((p) => p.offer.priceCents)) : 0,
)
const suggestions = computed(() => matchServices(offeredServices, query.value))
const servicesByCategory = CATEGORY_ORDER.map((c) => ({
  category: c,
  services: offeredServices.filter((s) => s.category === c),
})).filter((g) => g.services.length)
const days = (rounds: number): number => Math.max(1, Math.round(rounds / 3))

function chooseService(code: string | null): void {
  query.value = ''
  void router.replace({ query: code ? { service: code } : {} })
}

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
    <app-header>
      <div class="search-wrap">
        <input
          v-model="query"
          class="search"
          type="search"
          :placeholder="t('shops.searchPlaceholder')"
          :aria-label="t('common.search')"
        />
      </div>
    </app-header>
    <ion-content>
      <main v-if="service" class="page">
        <button class="back-link" type="button" @click="chooseService(null)">
          ← {{ t('shops.allServices') }}
        </button>
        <h1 class="page-title">{{ service.name }}</h1>
        <p class="page-intro">
          {{ t('shops.providers', providers.length) }}
          <template v-if="providers.length">
            · {{ t('shops.fromPrice', { price: euros(fromPrice) }) }}</template
          >
        </p>
        <ul class="list">
          <li v-for="p in providers" :key="p.offer.id" class="soft-card provider">
            <div class="thumb">
              <img v-if="p.offer.photo" :src="p.offer.photo" :alt="p.offer.title" />
              <ion-icon v-else :icon="storefrontOutline" aria-hidden="true" />
            </div>
            <div class="provider-body">
              <strong>{{ p.offer.title }}</strong>
              <router-link class="shop-link" :to="`/boutiques/${p.shop.code}`">{{
                p.shop.name
              }}</router-link>
              <span v-if="p.shop.rating" class="rating">
                <rating-stars :model-value="p.shop.rating.average" :size="13" />
                {{ p.shop.rating.average.toLocaleString('fr-FR') }}
                <span class="muted small">({{ t('shops.ratingCount', p.shop.rating.count) }})</span>
              </span>
              <span v-if="p.offer.description" class="muted small">{{ p.offer.description }}</span>
            </div>
            <div class="provider-side">
              <strong class="price">{{ euros(p.offer.priceCents) }}</strong>
              <span class="muted small">{{
                t('shop.turnaround', { days: t('shop.days', days(p.offer.turnaroundRounds)) })
              }}</span>
              <router-link
                class="order"
                :to="{ path: '/commander', query: { boutique: p.shop.code, offre: p.offer.id } }"
              >
                {{ t('shop.order') }}
              </router-link>
            </div>
          </li>
        </ul>
        <demo-notice />
      </main>
      <main v-else class="page">
        <section v-if="!query.trim()" class="services">
          <h2 class="section-title">{{ t('shops.servicesTitle') }}</h2>
          <div class="service-groups">
            <div v-for="g in servicesByCategory" :key="g.category" class="service-group">
              <span class="group-label">{{ t(`merchants.categories.${g.category}`) }}</span>
              <button
                v-for="sv in g.services"
                :key="sv.code"
                class="service-row"
                type="button"
                @click="chooseService(sv.code)"
              >
                <span>{{ sv.name }}</span>
                <ion-icon :icon="chevronForwardOutline" aria-hidden="true" />
              </button>
            </div>
          </div>
          <h2 class="section-title">{{ t('shops.orBrowse') }}</h2>
        </section>
        <section v-else-if="suggestions.length" class="services">
          <h2 class="section-title">{{ t('shops.matchingServices') }}</h2>
          <div class="service-group">
            <button
              v-for="sv in suggestions"
              :key="sv.code"
              class="service-row"
              type="button"
              @click="chooseService(sv.code)"
            >
              <span>{{ sv.name }}</span>
              <ion-icon :icon="chevronForwardOutline" aria-hidden="true" />
            </button>
          </div>
          <h2 class="section-title">{{ t('shops.title') }}</h2>
        </section>
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
.back-link {
  align-self: flex-start;
  padding: 8px 14px;
  border: none;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-glass);
  color: var(--cg-pine);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.services {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.service-groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 12px;
  align-items: start;
}
/* One card per category, services as rows separated by hairlines. */
.service-group {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--cg-radius-l);
  background: var(--cg-glass);
  box-shadow: var(--cg-shadow);
}
.group-label {
  padding: 12px 14px 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cg-ink-soft);
}
.service-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border: none;
  border-top: 1px solid var(--cg-surface-soft);
  background: none;
  color: var(--cg-ink);
  font: inherit;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}
.service-row ion-icon {
  flex: none;
  color: var(--cg-ink-soft);
}
.service-row:hover,
.service-row:focus-visible {
  background: var(--cg-leaf-soft);
}
.provider {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: center;
  gap: 12px;
}
.thumb {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-leaf-soft);
  overflow: hidden;
  font-size: 26px;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.provider-body,
.provider-side {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.provider-side {
  align-items: flex-end;
  text-align: right;
}
.shop-link {
  font-size: 14px;
  font-weight: 700;
  color: var(--cg-pine);
  text-decoration: none;
}
.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}
.price {
  font-size: 18px;
  color: var(--cg-pine);
}
.order {
  margin-top: 4px;
  padding: 8px 14px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-leaf);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}
.search-wrap {
  max-width: 640px;
  padding: 6px 12px 6px 4px;
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
