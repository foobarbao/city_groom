<script setup lang="ts">
/**
 * Home screen: choose a mode (have something serviced, or store belongings),
 * see what is in progress (consigne, orders, quotes), browse shops by
 * category, open the map of the lockers.
 */
import { IonContent, IonPage } from '@ionic/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import DemoNotice from '../components/DemoNotice.vue'
import { CATEGORY_ORDER, catalogue, lockers, shopByCode } from '../services/catalogue'
import { useAccountStore } from '../stores/account'

const { t } = useI18n()
const account = useAccountStore()

const lockerName = (code: string): string => lockers.find((l) => l.code === code)?.name ?? code
const shopName = (code: string): string => shopByCode(code)?.name ?? code

const openOrders = computed(() => account.state.orders.filter((o) => o.status !== 'picked_up'))
const hasCurrent = computed(
  () => account.activeBookings.length + openOrders.value.length + account.pendingQuotes.length > 0,
)
const roundTimes = new Intl.ListFormat('fr', { type: 'conjunction' }).format(catalogue.round_times)

/** Line pictograms (24×24) for the category tiles. */
const CATEGORY_ICONS: Record<string, string> = {
  dry_cleaning: 'M12 6a2 2 0 1 1 2 2c-1 .5-2 1-2 2l9 6H3l9-6',
  laundry: 'M5 3h14v18H5zM5 7h14M12 15m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
  tailoring:
    'M6 3l12 18M18 3L6 21M4 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0M16 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  shoe_repair: 'M3 16c0-3 1-6 2-8l4 3c2 1 5 2 8 2 2 0 4 1 4 3v2H3zM3 18h18',
  watch_repair: 'M9 3h6l1 4a5 5 0 0 1 0 10l-1 4H9l-1-4a5 5 0 0 1 0-10zM12 9v3l2 1',
  jewellery_repair: 'M6 9l3-5h6l3 5-6 11zM6 9h12',
  electronics_repair: 'M7 3h10v18H7zM11 18h2',
  key_cutting: 'M8 14a4 4 0 1 1 3-6.7L20 7v3h-2v2h-2v2h-4.3A4 4 0 0 1 8 14z',
}
</script>

<template>
  <ion-page>
    <ion-content>
      <main class="page home">
        <header class="hello">
          <p class="brand">{{ t('app.name') }}</p>
          <h1 class="page-title">
            {{
              account.state.signedIn
                ? t('home.hello', { name: account.state.name })
                : t('home.helloGuest')
            }}
          </h1>
          <p class="page-intro">{{ t('home.question') }}</p>
        </header>

        <nav class="modes">
          <router-link class="mode services" to="/boutiques">
            <span class="mode-icon" aria-hidden="true">🧺</span>
            <span class="mode-title">{{ t('home.services.title') }}</span>
            <span class="mode-text">{{ t('home.services.text') }}</span>
          </router-link>
          <router-link class="mode consigne" to="/consigne/reserver">
            <span class="mode-icon" aria-hidden="true">🔐</span>
            <span class="mode-title">{{ t('home.consigne.title') }}</span>
            <span class="mode-text">{{ t('home.consigne.text') }}</span>
          </router-link>
        </nav>

        <section v-if="hasCurrent" class="current">
          <h2 class="section-title">{{ t('home.current') }}</h2>
          <ul class="list">
            <li v-for="b in account.activeBookings" :key="b.id">
              <router-link class="soft-card row" :to="`/consigne/${b.id}`">
                <span>{{ t('home.bookingActive', { locker: lockerName(b.lockerCode) }) }}</span>
                <span class="pill">{{ t(`consigne.status.${b.status}`) }}</span>
              </router-link>
            </li>
            <li v-for="o in openOrders" :key="o.id">
              <router-link class="soft-card row" to="/compte/commandes">
                <span>{{
                  t('home.orderActive', { label: o.label, shop: shopName(o.shopCode) })
                }}</span>
                <span class="pill">{{ t(`orders.status.${o.status}`) }}</span>
              </router-link>
            </li>
            <li v-for="q in account.pendingQuotes" :key="q.id">
              <router-link class="soft-card row" :to="`/messages/${q.shopCode}`">
                <span>{{ t('home.quotePending', { shop: shopName(q.shopCode) }) }}</span>
                <span class="pill warn">{{ t('messages.quoteStatus.pending') }}</span>
              </router-link>
            </li>
          </ul>
        </section>

        <section>
          <h2 class="section-title">{{ t('home.categoriesTitle') }}</h2>
          <div class="categories">
            <router-link
              v-for="c in CATEGORY_ORDER"
              :key="c"
              class="category"
              :to="{ path: '/boutiques', query: { categorie: c } }"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                <path :d="CATEGORY_ICONS[c]" />
              </svg>
              <span>{{ t(`merchants.categories.${c}`) }}</span>
            </router-link>
          </div>
        </section>

        <router-link class="soft-card map-link" to="/carte">
          <strong>{{ t('home.map') }} →</strong>
          <span class="muted small">{{ t('home.rounds', { times: roundTimes }) }}</span>
        </router-link>

        <demo-notice />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.hello {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 12px;
}
.brand {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cg-leaf);
}
.modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.mode {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 170px;
  padding: 18px;
  border-radius: var(--cg-radius-l);
  color: inherit;
  text-decoration: none;
  box-shadow: var(--cg-shadow);
}
.mode.services {
  background: linear-gradient(160deg, var(--cg-leaf-soft), var(--cg-surface));
}
.mode.consigne {
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--cg-sun) 40%, var(--cg-surface)),
    var(--cg-surface)
  );
}
.mode-icon {
  font-size: 30px;
}
.mode-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--cg-ink);
}
.mode-text {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  font-weight: 700;
}
.categories {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 10px;
}
.category {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 4px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-surface);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}
.category svg {
  fill: none;
  stroke: var(--cg-leaf);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.map-link {
  gap: 4px;
}
</style>
