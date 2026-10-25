<script setup lang="ts">
/**
 * Home screen: choose a mode (have something serviced, or store belongings),
 * see what is in progress (consigne, orders, quotes), browse shops by
 * category, open the map of the lockers.
 */
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import {
  chevronForwardOutline,
  lockClosedOutline,
  navigateOutline,
  repeatOutline,
  shirtOutline,
} from 'ionicons/icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AppHeader from '../components/AppHeader.vue'
import DemoNotice from '../components/DemoNotice.vue'
import {
  CATEGORY_ORDER,
  WEEKLY_PACK_CODE,
  catalogue,
  lockers,
  offerPath,
  packByCode,
  providerName,
} from '../services/catalogue'
import { packPrice } from '../domain/pack'
import { eligiblePromotions } from '../domain/promotions'
import PromoCard from '../components/PromoCard.vue'
import { useAccountStore } from '../stores/account'
import { euros } from '../utils/format'
import { categoryTone, statusTone } from '../utils/tones'

const { t } = useI18n()
const account = useAccountStore()

const lockerName = (code: string): string => lockers.find((l) => l.code === code)?.name ?? code
const shopName = providerName

const openOrders = computed(() => account.state.orders.filter((o) => o.status !== 'picked_up'))
const hasCurrent = computed(
  () => account.activeBookings.length + openOrders.value.length + account.pendingQuotes.length > 0,
)
const pack = packByCode(WEEKLY_PACK_CODE)
const packOffer = computed(() =>
  pack ? packPrice(pack, account.state.plan, account.hasBoughtPack(pack.code)) : null,
)
/** Promotions this customer can use, highlighted first on the home screen. */
const promotions = computed(() =>
  eligiblePromotions(catalogue.promotions, catalogue.packs, account.state.plan, (code) =>
    account.hasBoughtPack(code),
  ),
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
    <app-header />
    <ion-content>
      <main class="page home">
        <header class="hello">
          <h1 class="page-title">
            {{
              account.state.signedIn
                ? t('home.hello', { name: account.state.name })
                : t('home.helloGuest')
            }}
          </h1>
          <p class="page-intro">{{ t('home.question') }}</p>
        </header>

        <section v-if="promotions.length" class="promos-section">
          <h2 class="section-title">{{ t('promo.title') }}</h2>
          <div class="promos" :class="{ single: promotions.length === 1 }">
            <promo-card
              v-for="p in promotions"
              :key="p.promotion.code"
              :promo="p"
              :to="offerPath(p.pack)"
            />
          </div>
        </section>

        <nav class="modes">
          <router-link class="mode services" to="/boutiques">
            <span class="mode-icon" aria-hidden="true"><ion-icon :icon="shirtOutline" /></span>
            <span class="mode-title">{{ t('home.services.title') }}</span>
            <span class="mode-text">{{ t('home.services.text') }}</span>
          </router-link>
          <router-link class="mode consigne" to="/consigne/reserver">
            <span class="mode-icon" aria-hidden="true"><ion-icon :icon="lockClosedOutline" /></span>
            <span class="mode-title">{{ t('home.consigne.title') }}</span>
            <span class="mode-text">{{ t('home.consigne.text') }}</span>
          </router-link>
        </nav>

        <router-link class="nearby" to="/autour">
          <span class="nearby-icon sky" aria-hidden="true"
            ><ion-icon :icon="navigateOutline"
          /></span>
          <span class="nearby-text">
            <strong>{{ t('nearby.shortcut') }}</strong>
            <span>{{ t('nearby.shortcutText') }}</span>
          </span>
          <ion-icon class="chevron" :icon="chevronForwardOutline" aria-hidden="true" />
        </router-link>

        <router-link v-if="pack && !promotions.length" class="nearby pack" to="/pack">
          <span class="nearby-icon" aria-hidden="true"><ion-icon :icon="repeatOutline" /></span>
          <span class="nearby-text">
            <strong>{{ t('home.pack.title') }}</strong>
            <span v-if="packOffer?.available">{{
              packOffer.welcome
                ? t('home.pack.welcome', { price: euros(packOffer.weeklyCents) })
                : t('home.pack.price', { price: euros(packOffer.weeklyCents) })
            }}</span>
            <span v-else>{{ t('home.pack.subscribers') }}</span>
          </span>
          <ion-icon class="chevron" :icon="chevronForwardOutline" aria-hidden="true" />
        </router-link>

        <section v-if="hasCurrent" class="current">
          <h2 class="section-title">{{ t('home.current') }}</h2>
          <ul class="list">
            <li v-for="b in account.activeBookings" :key="b.id">
              <router-link class="soft-card row" :to="`/consigne/${b.id}`">
                <span>{{ t('home.bookingActive', { locker: lockerName(b.lockerCode) }) }}</span>
                <span class="pill" :class="statusTone(b.status)">{{
                  t(`consigne.status.${b.status}`)
                }}</span>
              </router-link>
            </li>
            <li v-for="o in openOrders" :key="o.id">
              <router-link class="soft-card row" to="/compte/commandes">
                <span>{{
                  t('home.orderActive', { label: o.label, shop: shopName(o.shopCode) })
                }}</span>
                <span class="pill" :class="statusTone(o.status)">{{
                  t(`orders.status.${o.status}`)
                }}</span>
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
              v-for="(c, i) in CATEGORY_ORDER"
              :key="c"
              class="category"
              :class="`tone-${categoryTone(i)}`"
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
          <strong>{{ t('home.map') }}</strong>
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
.modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.mode {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border-radius: var(--cg-radius-l);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  color: inherit;
  text-decoration: none;
  transition:
    box-shadow var(--cg-motion) var(--cg-ease),
    transform var(--cg-motion) var(--cg-ease);
}
/* Soft tint per mode: emerald for services, teal for the consigne. */
.mode.services {
  background: linear-gradient(160deg, var(--cg-leaf-soft) 0%, var(--cg-glass) 70%);
}
.mode.consigne {
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--cg-teal) 12%, transparent) 0%,
    var(--cg-glass) 70%
  );
}
.mode:hover,
.mode:focus-visible {
  box-shadow: var(--cg-shadow-strong);
  transform: translateY(-2px);
}
.mode-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-bottom: 4px;
  border-radius: var(--cg-radius-m);
  font-size: 22px;
}
.services .mode-icon {
  background: var(--cg-leaf-soft);
  color: var(--cg-leaf);
}
.consigne .mode-icon {
  background: color-mix(in srgb, var(--cg-teal) 15%, transparent);
  color: var(--cg-teal);
}
.mode-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--cg-ink);
}
.mode-text {
  font-size: 13px;
  line-height: 1.4;
  color: var(--cg-ink-soft);
}
.nearby {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--cg-radius-l);
  background: var(--cg-glass);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  text-decoration: none;
}
.nearby-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-leaf-soft);
  color: var(--cg-leaf);
  font-size: 20px;
}
.nearby-icon.sky {
  background: color-mix(in srgb, var(--cg-teal) 15%, transparent);
  color: var(--cg-teal);
}
.chevron {
  font-size: 18px;
  color: var(--cg-ink-soft);
}
.nearby-text {
  display: flex;
  flex-direction: column;
  font-size: 15px;
}
.nearby-text span {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 600;
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
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}
.category svg {
  box-sizing: content-box;
  padding: 8px;
  border-radius: var(--cg-radius-m);
  background: var(--tone-soft);
  fill: none;
  stroke: var(--tone);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.tone-leaf {
  --tone: var(--cg-leaf);
  --tone-soft: var(--cg-leaf-soft);
}
.tone-teal {
  --tone: var(--cg-teal);
  --tone-soft: color-mix(in srgb, var(--cg-teal) 15%, transparent);
}
.tone-sky {
  --tone: var(--cg-sky);
  --tone-soft: var(--cg-sky-soft);
}
.tone-coral {
  --tone: var(--cg-coral);
  --tone-soft: var(--cg-coral-soft);
}
.tone-plum {
  --tone: var(--cg-plum);
  --tone-soft: var(--cg-plum-soft);
}
.tone-sun {
  --tone: var(--cg-ink);
  --tone-soft: var(--cg-sun-soft);
}
.promos-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
/* Several promotions scroll sideways, one card per view on phones. */
.promos {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(280px, 88%);
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  /* Room for the cards' shadow, which the scroll box would otherwise cut
     into a grey band. */
  padding: 4px 12px 16px;
  margin: -4px -12px -12px;
  scroll-padding: 0 12px;
  scrollbar-width: none;
}
.promos > * {
  scroll-snap-align: start;
  box-shadow: var(--cg-shadow);
}
.promos.single {
  grid-auto-columns: 100%;
}
.map-link {
  gap: 4px;
}
</style>
