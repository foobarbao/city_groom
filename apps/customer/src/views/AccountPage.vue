<script setup lang="ts">
/**
 * Account: sign-in (guests can order, signing in is encouraged,
 * docs/PRODUCT.md §8), subscription, orders and reviews to write.
 *
 * Sign-in is real with Google when it is configured (VITE_GOOGLE_CLIENT_ID,
 * ADR-0010): Google's button, then the API verifies the token. Otherwise, and
 * in the Android app for now, the demo sign-in (a first name) is kept.
 */
import { IonButton, IonContent, IonPage } from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { signInWithGoogle } from '../api/auth'
import { ApiError } from '../api/http'
import DemoNotice from '../components/DemoNotice.vue'
import { canReview } from '../domain/reviews'
import { planByCode } from '../services/catalogue'
import { googleSignInAvailable, renderGoogleButton } from '../services/googleIdentity'
import { useAccountStore } from '../stores/account'

const { t } = useI18n()
const account = useAccountStore()
const name = ref('')
const plan = computed(() => planByCode(account.state.plan))

const withGoogle = googleSignInAvailable()
const googleButton = ref<HTMLElement | null>(null)
const googleBusy = ref(false)
const googleError = ref('')

async function onCredential(credential: string): Promise<void> {
  googleBusy.value = true
  googleError.value = ''
  try {
    account.signInWithGoogle(await signInWithGoogle(credential))
  } catch (error) {
    googleError.value =
      error instanceof ApiError && error.status === 400
        ? t('account.google.refused')
        : t('account.google.unreachable')
  } finally {
    googleBusy.value = false
  }
}

async function showGoogleButton(): Promise<void> {
  if (!withGoogle || !googleButton.value) return
  try {
    await renderGoogleButton(googleButton.value, (credential) => void onCredential(credential))
  } catch {
    googleError.value = t('account.google.unavailable')
  }
}
onMounted(() => void showGoogleButton())

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
          <template v-if="withGoogle">
            <div ref="googleButton" class="google-button" :aria-busy="googleBusy" />
            <p v-if="googleBusy" class="muted small">{{ t('account.google.busy') }}</p>
            <p v-if="googleError" class="error small" role="alert">{{ googleError }}</p>
            <p class="muted small">{{ t('account.google.privacy') }}</p>
          </template>
          <form v-else class="sign-in" @submit.prevent="account.signIn(name)">
            <label class="field">
              {{ t('account.name') }}
              <input v-model="name" type="text" autocomplete="given-name" />
            </label>
            <ion-button type="submit" shape="round">{{ t('account.signIn') }}</ion-button>
          </form>
        </section>
        <section v-else class="soft-card profile">
          <img
            v-if="account.state.google?.pictureUrl"
            class="avatar"
            :src="account.state.google.pictureUrl"
            alt=""
            referrerpolicy="no-referrer"
          />
          <span v-else class="avatar" aria-hidden="true">{{ account.state.name.charAt(0) }}</span>
          <span class="who">
            <strong>{{ account.state.name }}</strong>
            <span v-if="account.state.google" class="muted small">
              {{ account.state.google.email }} · {{ t('account.google.linked') }}
            </span>
          </span>
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
.who {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow-wrap: anywhere;
}
.google-button {
  min-height: 44px;
}
.error {
  color: #b42318;
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
  object-fit: cover;
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
