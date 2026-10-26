<script setup lang="ts">
/**
 * Consigne overview: how it works, the button to book, current bookings and
 * history (docs/PRODUCT.md §4b). A card announces the scooter lockers,
 * coming soon (§4d).
 */
import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/vue'
import { chevronForwardOutline, navigateOutline } from 'ionicons/icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AppHeader from '../components/AppHeader.vue'
import DemoNotice from '../components/DemoNotice.vue'
import ListRow from '../components/ListRow.vue'
import { lockers } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { dateTime, euros } from '../utils/format'
import { CONSIGNE_ICON, SCOOTER_PATH } from '../utils/icons'
import { statusTone } from '../utils/tones'

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
    <app-header />
    <ion-content>
      <main class="page">
        <h1 class="page-title">{{ t('consigne.title') }}</h1>
        <p class="page-intro">{{ t('consigne.intro') }}</p>
        <ion-button expand="block" shape="round" size="large" router-link="/consigne/reserver">
          {{ t('consigne.book') }}
        </ion-button>
        <ion-button expand="block" shape="round" fill="outline" router-link="/autour">
          <ion-icon :icon="navigateOutline" aria-hidden="true" /> {{ t('nearby.shortcut') }}
        </ion-button>

        <router-link class="soon" to="/consigne/trottinettes">
          <span class="soon-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24"><path :d="SCOOTER_PATH" /></svg>
          </span>
          <span class="soon-text">
            <span class="pill warn">{{ t('scooters.soon') }}</span>
            <strong>{{ t('scooters.title') }}</strong>
            <span>{{ t('scooters.teaser') }}</span>
          </span>
          <ion-icon class="chevron" :icon="chevronForwardOutline" aria-hidden="true" />
        </router-link>

        <section v-if="account.activeBookings.length" class="group">
          <h2 class="section-title">{{ t('consigne.active') }}</h2>
          <ul class="list">
            <li v-for="b in account.activeBookings" :key="b.id">
              <list-row
                :icon="CONSIGNE_ICON"
                tone="teal"
                :title="lockerName(b.lockerCode)"
                :description="`${
                  b.door ? t('consigne.door', { label: b.door }) : t(`locker.sizes.${b.size}`)
                } · ${dateTime(b.slotStart, labels)} · ${euros(b.priceCents)}`"
                :status="{ label: t(`consigne.status.${b.status}`), tone: statusTone(b.status) }"
                :to="`/consigne/${b.id}`"
              />
            </li>
          </ul>
        </section>

        <section class="soft-card how">
          <h2 class="section-title">{{ t('consigne.how.title') }}</h2>
          <ol>
            <li>{{ t('consigne.how.step1') }}</li>
            <li>{{ t('consigne.how.step2') }}</li>
            <li>{{ t('consigne.how.step2b') }}</li>
            <li>{{ t('consigne.how.step3') }}</li>
          </ol>
          <router-link class="small" to="/compte/abonnement"
            >{{ t('consigne.planHint') }} →</router-link
          >
        </section>

        <section v-if="past.length" class="group">
          <h2 class="section-title">{{ t('consigne.past') }}</h2>
          <ul class="list">
            <li v-for="b in past" :key="b.id">
              <list-row
                :icon="CONSIGNE_ICON"
                tone="teal"
                :title="lockerName(b.lockerCode)"
                :description="dateTime(b.slotStart, labels)"
                :status="{ label: t(`consigne.status.${b.status}`), tone: 'off' }"
              />
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
/* "Coming soon" card: same shape as the home shortcuts, honey tint. */
.soon {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--cg-radius-l);
  background: linear-gradient(160deg, var(--cg-sun-soft) 0%, var(--cg-glass) 75%);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  text-decoration: none;
}
.soon-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-sun-soft);
}
.soon-icon svg {
  fill: none;
  stroke: var(--cg-sun-strong);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.soon-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 15px;
}
.soon-text > span:last-child {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.chevron {
  font-size: 18px;
  color: var(--cg-ink-soft);
}
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
