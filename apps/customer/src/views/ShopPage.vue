<script setup lang="ts">
/**
 * Shop page. Partner shops: rating and reviews (verified orders, ADR-0008),
 * the merchant's offers (photo, description, price, turnaround), order,
 * contact and quote buttons. Other businesses:
 * public information only, never a rating.
 */
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
} from '@ionic/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import DemoNotice from '../components/DemoNotice.vue'
import RatingStars from '../components/RatingStars.vue'
import { withRatings } from '../domain/reviews'
import { partnerByCode, shopByCode, shopOffers } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { euros } from '../utils/format'

const props = defineProps<{ code: string }>()
const { t } = useI18n()
const account = useAccountStore()

const shop = computed(() => shopByCode(props.code))
const partner = computed(() => partnerByCode(props.code))
/** The merchant's visible offers. */
const offers = computed(() => (shop.value ? shopOffers(shop.value.code) : []))
/** The customer's own reviews of this shop (kept on the device in the demo). */
const myReviews = computed(() => account.state.reviews.filter((r) => r.shopCode === props.code))
const rating = computed(() =>
  partner.value
    ? withRatings(
        partner.value.reviews,
        myReviews.value.map((r) => r.rating),
      )
    : null,
)
const distribution = computed(() => {
  const d = { ...(partner.value?.reviews.distribution ?? {}) }
  for (const r of myReviews.value) d[String(r.rating)] = (d[String(r.rating)] ?? 0) + 1
  return [5, 4, 3, 2, 1].map((star) => ({ star, count: d[String(star)] ?? 0 }))
})
const days = (rounds: number): number => Math.max(1, Math.round(rounds / 3))
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/boutiques" :text="t('common.back')" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main v-if="shop" class="page">
        <header class="head">
          <p class="pill" :class="{ off: !shop.partner }">
            {{ shop.partner ? t('shops.partner') : t('shops.notPartner') }}
          </p>
          <h1 class="page-title">{{ shop.name }}</h1>
          <p class="muted">{{ t(`merchants.categories.${shop.category}`) }}</p>
          <p v-if="rating" class="rating">
            <rating-stars :model-value="rating.average" :size="20" />
            <strong>{{ rating.average.toLocaleString('fr-FR') }}</strong>
            <span class="muted">({{ t('shops.ratingCount', rating.count) }})</span>
          </p>
        </header>

        <template v-if="shop.partner">
          <div class="actions">
            <ion-button shape="round" :router-link="`/messages/${shop.code}`">
              {{ t('shop.quote') }}
            </ion-button>
            <ion-button shape="round" fill="outline" :router-link="`/messages/${shop.code}`">
              {{ t('shop.contact') }}
            </ion-button>
          </div>

          <section class="soft-card">
            <h2 class="section-title">{{ t('shop.services') }}</h2>
            <ul class="list services">
              <li v-for="o in offers" :key="o.id" class="offer">
                <div class="thumb">
                  <img v-if="o.photo" :src="o.photo" :alt="o.title" />
                  <span v-else aria-hidden="true">🧺</span>
                </div>
                <span class="offer-body">
                  <strong>{{ o.title }}</strong>
                  <span v-if="o.description" class="small">{{ o.description }}</span>
                  <span class="muted small">
                    {{ t('shop.perItem', { price: euros(o.priceCents) }) }} ·
                    {{ t('shop.turnaround', { days: t('shop.days', days(o.turnaroundRounds)) }) }}
                  </span>
                </span>
                <ion-button
                  size="small"
                  shape="round"
                  :router-link="{
                    path: '/commander',
                    query: { boutique: shop.code, offre: o.id },
                  }"
                >
                  {{ t('shop.order') }}
                </ion-button>
              </li>
            </ul>
            <p class="muted small">{{ t('demo.placeholderPrices') }}</p>
          </section>

          <section v-if="rating && partner" class="soft-card">
            <h2 class="section-title">{{ t('shop.reviews') }}</h2>
            <div class="histogram">
              <div v-for="row in distribution" :key="row.star" class="bar-row">
                <span class="small">{{ row.star }} ★</span>
                <span class="bar">
                  <span
                    class="fill"
                    :style="{ width: `${rating.count ? (row.count / rating.count) * 100 : 0}%` }"
                  />
                </span>
                <span class="small muted">{{ row.count }}</span>
              </div>
            </div>
            <ul class="list">
              <li v-for="r in myReviews" :key="r.orderId" class="review mine">
                <span class="review-head">
                  <strong>{{ t('shop.yourReview') }}</strong>
                  <rating-stars :model-value="r.rating" :size="14" />
                </span>
                <span v-if="r.comment">{{ r.comment }}</span>
              </li>
              <li v-for="r in partner.reviews.recent" :key="r.author + r.date" class="review">
                <span class="review-head">
                  <strong>{{ r.author }}</strong>
                  <rating-stars :model-value="r.rating" :size="14" />
                </span>
                <span>{{ r.comment }}</span>
                <span class="muted small">{{ t('shop.verified') }} · {{ r.date }}</span>
              </li>
            </ul>
            <p class="muted small">{{ t('shop.reviewPolicy') }}</p>
          </section>
          <demo-notice />
        </template>

        <template v-else>
          <section class="soft-card">
            <p>{{ t('shop.notPartnerText') }}</p>
            <p v-if="shop.address">
              <strong>{{ shop.address }}</strong>
            </p>
            <p v-if="shop.openingHours">
              <strong>{{ t('shop.hours') }}</strong> : {{ shop.openingHours }}
            </p>
            <a v-if="shop.website" :href="shop.website" target="_blank" rel="noopener">
              {{ t('shop.website') }} ↗
            </a>
          </section>
          <p class="muted small">{{ t('shops.source') }}</p>
        </template>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.head p {
  margin: 0;
}
.rating {
  display: flex;
  align-items: center;
  gap: 8px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.offer {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  align-items: center;
  gap: 12px;
}
.thumb {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-leaf-soft);
  overflow: hidden;
  font-size: 22px;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.offer-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.service {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.service > span {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.histogram {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bar-row {
  display: grid;
  grid-template-columns: 36px 1fr 28px;
  align-items: center;
  gap: 8px;
}
.bar {
  height: 8px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-surface-soft);
  overflow: hidden;
}
.fill {
  display: block;
  height: 100%;
  background: var(--cg-sun);
}
.review {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-ground);
}
.review.mine {
  background: var(--cg-leaf-soft);
}
.review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
p {
  margin: 0;
}
</style>
