<script setup lang="ts">
/**
 * Messages: quotes waiting for an answer, then conversations with partner
 * shops (special services on quote, docs/PRODUCT.md §2).
 */
import { IonContent, IonPage } from '@ionic/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AppHeader from '../components/AppHeader.vue'
import DemoNotice from '../components/DemoNotice.vue'
import { shopByCode } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { dateTime, euros } from '../utils/format'

const { t } = useI18n()
const account = useAccountStore()
const labels = computed(() => ({ today: t('common.today'), tomorrow: t('common.tomorrow') }))
const shopName = (code: string): string => shopByCode(code)?.name ?? code

const conversations = computed(() =>
  Object.entries(account.state.conversations)
    .map(([shop, messages]) => ({ shop, last: messages[messages.length - 1] }))
    .filter((c) => c.last)
    .sort((a, b) => (b.last?.at ?? '').localeCompare(a.last?.at ?? '')),
)
</script>

<template>
  <ion-page>
    <app-header />
    <ion-content>
      <main class="page">
        <h1 class="page-title">{{ t('messages.title') }}</h1>

        <section class="group">
          <h2 class="section-title">{{ t('messages.quotes') }}</h2>
          <ul v-if="account.state.quotes.length" class="list">
            <li v-for="q in account.state.quotes" :key="q.id">
              <router-link class="soft-card quote" :to="`/messages/${q.shopCode}`">
                <span
                  class="pill"
                  :class="{ warn: q.status === 'pending', off: q.status === 'declined' }"
                >
                  {{ t(`messages.quoteStatus.${q.status}`) }}
                </span>
                <strong>{{ q.label }}</strong>
                <span class="muted small"
                  >{{ shopName(q.shopCode) }} · {{ euros(q.priceCents) }}</span
                >
              </router-link>
            </li>
          </ul>
          <p v-else class="muted">{{ t('messages.noQuote') }}</p>
        </section>

        <section class="group">
          <h2 class="section-title">{{ t('messages.conversations') }}</h2>
          <ul v-if="conversations.length" class="list">
            <li v-for="c in conversations" :key="c.shop">
              <router-link class="soft-card" :to="`/messages/${c.shop}`">
                <strong>{{ shopName(c.shop) }}</strong>
                <span class="muted small preview">{{ c.last?.text }}</span>
                <span class="muted small">{{ c.last ? dateTime(c.last.at, labels) : '' }}</span>
              </router-link>
            </li>
          </ul>
          <p v-else class="muted">{{ t('messages.none') }}</p>
        </section>
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
.preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.soft-card {
  gap: 4px;
}
</style>
