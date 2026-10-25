<script setup lang="ts">
/**
 * Rating a shop after a collected order: 1 to 5 stars and an optional
 * comment, once per order (ADR-0008).
 */
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  useIonRouter,
} from '@ionic/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import RatingStars from '../components/RatingStars.vue'
import { canReview, isValidRating } from '../domain/reviews'
import { shopByCode } from '../services/catalogue'
import { useAccountStore } from '../stores/account'

const props = defineProps<{ order: string }>()
const { t } = useI18n()
const router = useIonRouter()
const account = useAccountStore()

const rating = ref(0)
const comment = ref('')
const order = computed(() => account.state.orders.find((o) => o.id === props.order))
const shop = computed(() => (order.value ? shopByCode(order.value.shopCode) : undefined))
const allowed = computed(() =>
  order.value ? canReview(order.value, account.reviewedOrderIds) : false,
)

function publish(): void {
  if (!order.value || !isValidRating(rating.value) || !allowed.value) return
  account.addReview({
    orderId: order.value.id,
    shopCode: order.value.shopCode,
    rating: rating.value,
    comment: comment.value.trim(),
  })
  router.replace(`/boutiques/${order.value.shopCode}`)
}
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/compte/commandes" :text="t('common.back')" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main v-if="order && shop" class="page">
        <h1 class="page-title">{{ t('review.title', { shop: shop.name }) }}</h1>
        <p class="page-intro">{{ order.quantity }} × {{ order.label }}</p>
        <section class="soft-card center">
          <p>{{ t('review.question') }}</p>
          <rating-stars v-model="rating" editable :size="40" />
        </section>
        <label class="field">
          {{ t('review.comment') }}
          <textarea v-model="comment" rows="4" maxlength="500" />
        </label>
        <ion-button
          expand="block"
          shape="round"
          :disabled="!isValidRating(rating) || !allowed"
          @click="publish"
        >
          {{ t('review.send') }}
        </ion-button>
        <p class="muted small">{{ t('shop.reviewPolicy') }}</p>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.center {
  align-items: center;
  text-align: center;
}
.page p {
  margin: 0;
}
</style>
