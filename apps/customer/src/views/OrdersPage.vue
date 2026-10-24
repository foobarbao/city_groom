<script setup lang="ts">
/**
 * The customer's orders with their status; collected orders can be rated
 * once (ADR-0008).
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
import { canReview } from '../domain/reviews'
import { lockers, shopByCode } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { dateTime, euros } from '../utils/format'

const { t } = useI18n()
const account = useAccountStore()
const labels = computed(() => ({ today: t('common.today'), tomorrow: t('common.tomorrow') }))
const shopName = (code: string): string => shopByCode(code)?.name ?? code
const lockerName = (code: string): string => lockers.find((l) => l.code === code)?.name ?? code
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/compte" :text="t('common.back')" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main class="page">
        <h1 class="page-title">{{ t('orders.title') }}</h1>
        <p v-if="!account.state.orders.length" class="muted">{{ t('orders.none') }}</p>
        <ul class="list">
          <li v-for="o in account.state.orders" :key="o.id" class="soft-card">
            <span class="pill" :class="{ off: o.status === 'picked_up' }">{{
              t(`orders.status.${o.status}`)
            }}</span>
            <strong>{{ o.quantity }} × {{ o.label }}</strong>
            <span class="muted small">
              {{ shopName(o.shopCode) }} · {{ euros(o.priceCents) }} ·
              {{ dateTime(o.createdAt, labels) }}
            </span>
            <span class="muted small"
              >{{ lockerName(o.dropLocker) }} → {{ lockerName(o.pickupLocker) }}</span
            >
            <ion-button
              v-if="o.status === 'awaiting_drop_off'"
              size="small"
              shape="round"
              @click="account.markOrderDropped(o.id)"
            >
              {{ t('orders.dropNow') }}
            </ion-button>
            <ion-button
              v-if="canReview(o, account.reviewedOrderIds)"
              size="small"
              shape="round"
              :router-link="`/compte/avis/${o.id}`"
            >
              ★ {{ t('orders.review') }}
            </ion-button>
            <span v-else-if="account.reviewedOrderIds.has(o.id)" class="small muted"
              >✓ {{ t('orders.reviewed') }}</span
            >
          </li>
        </ul>
        <demo-notice />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.soft-card {
  gap: 6px;
}
.soft-card ion-button {
  align-self: flex-start;
}
</style>
