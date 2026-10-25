<script setup lang="ts">
/**
 * Subscription plans (placeholders, docs/PRODUCT.md open question 8):
 * subscribers pay less for the consigne. Subscribing needs an account.
 */
import { IonButton, IonContent, IonPage } from '@ionic/vue'
import { useI18n } from 'vue-i18n'

import AppHeader from '../components/AppHeader.vue'
import { toCents } from '../domain/pricing'
import { catalogue } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { euros } from '../utils/format'

const { t } = useI18n()
const account = useAccountStore()
</script>

<template>
  <ion-page>
    <app-header back-href="/compte" />
    <ion-content>
      <main class="page">
        <h1 class="page-title">{{ t('plans.title') }}</h1>
        <p class="page-intro">{{ t('plans.intro') }}</p>
        <p v-if="!account.state.signedIn" class="pill warn">{{ t('plans.signInFirst') }}</p>
        <article
          v-for="p in catalogue.plans"
          :key="p.code"
          class="soft-card plan"
          :class="{ current: account.state.plan === p.code }"
        >
          <span class="head">
            <strong class="name">{{ p.name }}</strong>
            <strong>
              {{
                toCents(p.monthly_price)
                  ? t('common.perMonth', { price: euros(toCents(p.monthly_price)) })
                  : t('common.free')
              }}
            </strong>
          </span>
          <ul>
            <li v-for="perk in p.perks" :key="perk">{{ perk }}</li>
          </ul>
          <span v-if="account.state.plan === p.code" class="pill">{{ t('plans.current') }}</span>
          <ion-button
            v-else
            shape="round"
            size="small"
            :disabled="!account.state.signedIn"
            @click="account.choosePlan(p.code)"
          >
            {{ t('plans.choose') }}
          </ion-button>
        </article>
        <p class="muted small">{{ t('demo.placeholderPrices') }}</p>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.plan {
  border: 2px solid transparent;
}
.plan.current {
  border-color: var(--cg-leaf);
}
.head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.name {
  font-size: 18px;
}
ul {
  margin: 0;
  padding-left: 18px;
  color: var(--cg-ink-soft);
}
.page p {
  margin: 0;
}
</style>
