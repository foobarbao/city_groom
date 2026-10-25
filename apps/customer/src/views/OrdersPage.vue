<script setup lang="ts">
/**
 * The customer's orders with their status. An order opens its detail
 * (`OrderPage`); "Déposer" opens it with the locker door already open, for
 * the drop-off. Collected orders can be rated once (ADR-0008).
 */
import { IonButton, IonContent, IonPage } from '@ionic/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AppHeader from '../components/AppHeader.vue'
import DemoNotice from '../components/DemoNotice.vue'
import { canReview } from '../domain/reviews'
import { lockers, providerName } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { clock, dateTime, dayLabel, euros } from '../utils/format'
import { statusTone } from '../utils/tones'

const { t } = useI18n()
const account = useAccountStore()
/** Same labels in lower case, for dates inside a sentence ("retrait demain…"). */
const inSentence = computed(() => ({
  today: t('common.today').toLocaleLowerCase('fr'),
  tomorrow: t('common.tomorrow').toLocaleLowerCase('fr'),
}))
const shopName = providerName
const lockerName = (code: string): string => lockers.find((l) => l.code === code)?.name ?? code
</script>

<template>
  <ion-page>
    <app-header back-href="/compte" />
    <ion-content>
      <main class="page">
        <h1 class="page-title">{{ t('orders.title') }}</h1>
        <p v-if="!account.state.orders.length" class="muted">{{ t('orders.none') }}</p>
        <ul class="list">
          <li v-for="o in account.state.orders" :key="o.id" class="soft-card">
            <router-link class="detail-link" :to="`/compte/commandes/${o.id}`">
              <span class="pill" :class="statusTone(o.status)">{{
                t(`orders.status.${o.status}`)
              }}</span>
              <strong>{{ o.packId || o.kind ? o.label : `${o.quantity} × ${o.label}` }}</strong>
              <span class="muted small">
                {{ shopName(o.shopCode) }} · {{ euros(o.priceCents) }} ·
                {{ t('orders.detail.orderedAt', { date: dateTime(o.createdAt, inSentence) }) }}
              </span>
              <span class="muted small"
                >{{ lockerName(o.dropLocker) }} → {{ lockerName(o.pickupLocker) }}</span
              >
              <span v-if="o.pickupStart && o.pickupEnd && o.status !== 'picked_up'" class="small">
                {{
                  t('orders.pickupLine', {
                    day: dayLabel(o.pickupStart, inSentence),
                    from: clock(o.pickupStart),
                    to: clock(o.pickupEnd),
                  })
                }}
              </span>
              <span v-if="o.packWeek && o.dropBy && o.status === 'awaiting_drop_off'" class="small">
                {{
                  t('orders.packDrop', {
                    week: o.packWeek,
                    day: dayLabel(o.dropFrom ?? o.dropBy, inSentence),
                    from: clock(o.dropFrom ?? o.dropBy),
                    by: clock(o.dropBy),
                  })
                }}
              </span>
            </router-link>
            <ion-button
              v-if="o.status === 'awaiting_drop_off'"
              size="small"
              shape="round"
              :router-link="`/compte/commandes/${o.id}?ouvrir=1`"
            >
              {{ t('orders.drop') }}
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
.detail-link {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: inherit;
  text-decoration: none;
}
</style>
