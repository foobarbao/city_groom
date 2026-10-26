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

import AppHeader from '../components/AppHeader.vue'
import { Capacitor } from '@capacitor/core'

import { signInWithGoogle } from '../api/auth'
import { ApiError } from '../api/http'
import DemoNotice from '../components/DemoNotice.vue'
import { canReview } from '../domain/reviews'
import { API_CONFIGURED } from '../config'
import { planByCode } from '../services/catalogue'
import {
  googleSignInAvailable,
  readGoogleProfileUnverified,
  renderGoogleButton,
} from '../services/googleIdentity'
import { useAccountStore } from '../stores/account'

const { t } = useI18n()
const account = useAccountStore()
const name = ref('')
const plan = computed(() => planByCode(account.state.plan))

const withGoogle = googleSignInAvailable()
/** Why "Continuer avec Google" is not usable yet, shown instead of hiding it. */
const googleUnavailable = Capacitor.isNativePlatform()
  ? 'account.google.notInApp'
  : 'account.google.notConfigured'
const googleButton = ref<HTMLElement | null>(null)
const googleBusy = ref(false)
const googleError = ref('')
/**
 * Opt-in to announcement e-mails, unticked by default (owner's decision of
 * 2026-10-25, docs/PRODUCT.md question 14): sent with the Google sign-in.
 */
const announcementsOptIn = ref(false)
const announcementsStatus = ref('')

async function onCredential(credential: string): Promise<void> {
  googleBusy.value = true
  googleError.value = ''
  try {
    if (!API_CONFIGURED) {
      // DEMO: no backend online yet; show the Google profile read on the device.
      const profile = readGoogleProfileUnverified(credential)
      if (!profile) throw new Error('unreadable token')
      account.signInWithGoogleDemo(profile, announcementsOptIn.value)
      return
    }
    account.signInWithGoogle(await signInWithGoogle(credential, announcementsOptIn.value))
  } catch (error) {
    googleError.value =
      error instanceof ApiError && error.status === 400
        ? t('account.google.refused')
        : t('account.google.unreachable')
  } finally {
    googleBusy.value = false
  }
}

/** Change the announcement choice from the profile card. */
async function toggleAnnouncements(event: Event): Promise<void> {
  const box = event.target as HTMLInputElement
  try {
    await account.setAnnouncements(box.checked)
    announcementsStatus.value = t('account.google.announcementsSaved')
  } catch {
    box.checked = !box.checked
    announcementsStatus.value = t('account.google.announcementsError')
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
    <app-header />
    <ion-content>
      <main class="page">
        <h1 class="page-title">{{ t('account.title') }}</h1>

        <section v-if="!account.state.signedIn" class="soft-card">
          <p class="muted">{{ t('account.guest') }}</p>
          <p>{{ t('account.signInPitch') }}</p>
          <template v-if="withGoogle">
            <label class="consent">
              <input v-model="announcementsOptIn" type="checkbox" />
              <span>{{ t('account.google.announcements') }}</span>
            </label>
            <div ref="googleButton" class="google-button" :aria-busy="googleBusy" />
            <p v-if="googleBusy" class="muted small">{{ t('account.google.busy') }}</p>
            <p v-if="googleError" class="error small" role="alert">{{ googleError }}</p>
          </template>
          <template v-else>
            <!-- Shown even when not usable yet, so the sign-in option is visible. -->
            <button type="button" class="google-placeholder" disabled>
              {{ t('account.google.continue') }}
            </button>
            <p class="muted small">{{ t(googleUnavailable) }}</p>
          </template>
          <p class="muted small">
            {{ t('account.google.privacy') }}
            <router-link to="/confidentialite">{{ t('account.google.privacyLink') }}</router-link>
          </p>
          <p class="or">{{ t('account.google.or') }}</p>
          <form class="sign-in" @submit.prevent="account.signIn(name)">
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
            <span v-if="account.state.google && !account.state.google.token" class="muted small">
              {{ t('account.google.demoNote') }}
            </span>
          </span>
          <ion-button fill="clear" size="small" @click="account.signOut()">{{
            t('account.signOut')
          }}</ion-button>
          <label v-if="account.state.google" class="consent full">
            <input
              type="checkbox"
              :checked="account.state.google.announcements === true"
              @change="toggleAnnouncements"
            />
            <span>{{ t('account.google.announcements') }}</span>
          </label>
          <p v-if="announcementsStatus" class="muted small full" role="status">
            {{ announcementsStatus }}
          </p>
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
  flex-wrap: wrap;
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
.google-placeholder {
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid var(--cg-locker-door-edge);
  border-radius: var(--cg-radius-pill);
  background: var(--cg-glass);
  color: var(--cg-ink-soft);
  font: inherit;
  font-weight: 600;
  cursor: not-allowed;
}
.or {
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--cg-ink-soft);
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
  font-weight: 600;
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
.consent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--cg-ink);
  cursor: pointer;
}
.consent input {
  flex: none;
  width: 18px;
  height: 18px;
  margin: 1px 0 0;
  accent-color: var(--cg-leaf);
}
/* In the profile card (a flex row), take a line of their own. */
.full {
  flex-basis: 100%;
}
</style>
