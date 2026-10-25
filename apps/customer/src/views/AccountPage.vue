<script setup lang="ts">
/**
 * Account: demo sign-in (guests can order, signing in is encouraged,
 * docs/PRODUCT.md §8), subscription, orders and reviews to write.
 */
import { IonButton, IonContent, IonPage } from '@ionic/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import DemoNotice from '../components/DemoNotice.vue'
import { canReview } from '../domain/reviews'
import { planByCode } from '../services/catalogue'
import { useAccountStore } from '../stores/account'

const { t } = useI18n()
const account = useAccountStore()
const name = ref('')
const plan = computed(() => planByCode(account.state.plan))
const toReview = computed(
  () => account.state.orders.filter((o) => canReview(o, account.reviewedOrderIds)).length,
)
</script>

<template>
  <ion-page>
    <ion-content>
      <main class="page">
        <h1 class="page-title">{{ t('account.title') }}</h1>

        <section v-if="!account.state.signedIn" class="soft-card">
          <p class="muted">{{ t('account.guest') }}</p>
          <p>{{ t('account.signInPitch') }}</p>
          <form class="sign-in" @submit.prevent="account.signIn(name)">
            <label class="field">
              {{ t('account.name') }}
              <input v-model="name" type="text" autocomplete="given-name" />
            </label>
            <ion-button type="submit" shape="round">{{ t('account.signIn') }}</ion-button>
          </form>
        </section>
        <section v-else class="soft-card profile">
          <span class="avatar" aria-hidden="true">{{ account.state.name.charAt(0) }}</span>
          <strong>{{ account.state.name }}</strong>
          <ion-button fill="clear" size="small" @click="account.signOut()">{{
            t('account.signOut')
          }}</ion-button>
        </section>

        <nav class="list menu">
          <router-link class="soft-card item" to="/compte/abonnement">
            <span>
              <strong>{{ t('account.plan') }}</strong>
              <span class="muted small">{{ plan.name }}</span>
            </span>
            <span aria-hidden="true">›</span>
          </router-link>
          <router-link class="soft-card item" to="/compte/commandes">
            <span>
              <strong>{{ t('account.orders') }}</strong>
              <span class="muted small">{{ t('account.reviewsToWrite', toReview) }}</span>
            </span>
            <span aria-hidden="true">›</span>
          </router-link>
          <router-link class="soft-card item" to="/consigne">
            <span
              ><strong>{{ t('consigne.title') }}</strong></span
            >
            <span aria-hidden="true">›</span>
          </router-link>
          <router-link class="soft-card item" to="/carte">
            <span
              ><strong>{{ t('home.map') }}</strong></span
            >
            <span aria-hidden="true">›</span>
          </router-link>
        </nav>

        <demo-notice />
        <ion-button fill="clear" color="medium" size="small" @click="account.resetDemo()">
          {{ t('demo.reset') }}
        </ion-button>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.page p {
  margin: 0;
}
.sign-in {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.profile {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}
.profile strong {
  flex: 1;
}
.avatar {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
  font-weight: 800;
}
.item {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
}
.item > span:first-child {
  display: flex;
  flex-direction: column;
}
</style>
