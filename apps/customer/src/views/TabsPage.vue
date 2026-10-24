<script setup lang="ts">
/**
 * Main navigation: a tab bar with the five areas of the app (home, shops,
 * consigne, messages, account), like most mobile apps. Each tab keeps its own
 * navigation history.
 */
import {
  IonBadge,
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/vue'
import {
  chatbubblesOutline,
  homeOutline,
  lockClosedOutline,
  personCircleOutline,
  storefrontOutline,
} from 'ionicons/icons'
import { useI18n } from 'vue-i18n'

import { useAccountStore } from '../stores/account'

const { t } = useI18n()
const account = useAccountStore()
</script>

<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom" class="tab-bar">
        <ion-tab-button tab="home" href="/accueil">
          <ion-icon :icon="homeOutline" aria-hidden="true" />
          <ion-label>{{ t('nav.home') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="shops" href="/boutiques">
          <ion-icon :icon="storefrontOutline" aria-hidden="true" />
          <ion-label>{{ t('nav.shops') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="consigne" href="/consigne">
          <ion-icon :icon="lockClosedOutline" aria-hidden="true" />
          <ion-label>{{ t('nav.consigne') }}</ion-label>
          <ion-badge v-if="account.activeBookings.length">{{
            account.activeBookings.length
          }}</ion-badge>
        </ion-tab-button>
        <ion-tab-button tab="messages" href="/messages">
          <ion-icon :icon="chatbubblesOutline" aria-hidden="true" />
          <ion-label>{{ t('nav.messages') }}</ion-label>
          <ion-badge v-if="account.pendingQuotes.length">{{
            account.pendingQuotes.length
          }}</ion-badge>
        </ion-tab-button>
        <ion-tab-button tab="account" href="/compte">
          <ion-icon :icon="personCircleOutline" aria-hidden="true" />
          <ion-label>{{ t('nav.account') }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<style scoped>
.tab-bar {
  --background: var(--cg-surface);
  --color: var(--cg-ink-soft);
  --color-selected: var(--cg-leaf);
  height: 64px;
  border-top: none;
  box-shadow: 0 -8px 24px rgb(36 87 74 / 8%);
  font-weight: 700;
}
ion-badge {
  --background: var(--cg-sun);
  --color: var(--cg-ink);
}
</style>
