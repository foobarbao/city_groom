<script setup lang="ts">
/**
 * Consigne overview: how it works, the button to book, current bookings and
 * history (docs/PRODUCT.md §4b).
 */
import { IonButton, IonContent, IonPage } from '@ionic/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import DemoNotice from '../components/DemoNotice.vue'
import { lockers } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { dateTime, euros } from '../utils/format'

const { t } = useI18n()
const account = useAccountStore()
const labels = computed(() => ({ today: t('common.today'), tomorrow: t('common.tomorrow') }))
const lockerName = (code: string): string => lockers.find((l) => l.code === code)?.name ?? code
const past = computed(() =>
  account.state.bookings.filter((b) => b.status === 'collected' || b.status === 'cancelled'),
)
</script>

<template>
  <ion-page>
    <ion-content>
      <main class="page">
        <h1 class="page-title">{{ t('consigne.title') }}</h1>
        <p class="page-intro">{{ t('consigne.intro') }}</p>
        <ion-button expand="block" shape="round" size="large" router-link="/consigne/reserver">
          {{ t('consigne.book') }}
        </ion-button>

        <section v-if="account.activeBookings.length" class="group">
          <h2 class="section-title">{{ t('consigne.active') }}</h2>
          <ul class="list">
            <li v-for="b in account.activeBookings" :key="b.id">
              <router-link class="soft-card" :to="`/consigne/${b.id}`">
                <span class="pill">{{ t(`consigne.status.${b.status}`) }}</span>
                <strong
                  >{{ lockerName(b.lockerCode) }} ·
                  {{ t('consigne.door', { label: b.door }) }}</strong
                >
                <span class="muted small"
                  >{{ dateTime(b.slotStart, labels) }} · {{ euros(b.priceCents) }}</span
                >
              </router-link>
            </li>
          </ul>
        </section>

        <section class="soft-card how">
          <h2 class="section-title">{{ t('consigne.how.title') }}</h2>
          <ol>
            <li>{{ t('consigne.how.step1') }}</li>
            <li>{{ t('consigne.how.step2') }}</li>
            <li>{{ t('consigne.how.step3') }}</li>
          </ol>
          <router-link class="small" to="/compte/abonnement"
            >{{ t('consigne.planHint') }} →</router-link
          >
        </section>

        <section v-if="past.length" class="group">
          <h2 class="section-title">{{ t('consigne.past') }}</h2>
          <ul class="list">
            <li v-for="b in past" :key="b.id" class="soft-card">
              <span class="pill off">{{ t(`consigne.status.${b.status}`) }}</span>
              <span>{{ lockerName(b.lockerCode) }} · {{ dateTime(b.slotStart, labels) }}</span>
            </li>
          </ul>
        </section>
        <p v-if="!account.state.bookings.length" class="muted">{{ t('consigne.none') }}</p>
        <demo-notice />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.how ol {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
