<script setup lang="ts">
/**
 * Privacy policy (public page, /confidentialite), linked from the sign-in
 * and the home screen; its address is the one given to Google's OAuth
 * consent screen. Written from what the code collects today and the
 * owner's answers of 2026-10-25 (controller: Alexis Steinmann, personally;
 * contact address; announcements by opt-in). The repository draft
 * `docs/legal/privacy-policy.fr.md` lists the points still to validate with
 * a legal adviser.
 */
import { IonContent, IonPage } from '@ionic/vue'
import { useI18n } from 'vue-i18n'

import AppHeader from '../components/AppHeader.vue'
import { PRIVACY_CONTACT } from '../config'

const { t } = useI18n()
const email = PRIVACY_CONTACT
</script>

<template>
  <ion-page>
    <app-header />
    <ion-content>
      <main class="page privacy">
        <h1 class="page-title">{{ t('privacy.title') }}</h1>
        <p class="muted small">{{ t('privacy.updated') }}</p>
        <p>{{ t('privacy.intro') }}</p>

        <section class="soft-card">
          <h2 class="section-title">{{ t('privacy.who.title') }}</h2>
          <p>{{ t('privacy.who.body') }}</p>
          <p>
            {{ t('privacy.who.contact') }}
            <a :href="`mailto:${email}`">{{ email }}</a>
          </p>
        </section>

        <section class="soft-card">
          <h2 class="section-title">{{ t('privacy.collected.title') }}</h2>
          <h3>{{ t('privacy.collected.googleTitle') }}</h3>
          <p>{{ t('privacy.collected.google') }}</p>
          <h3>{{ t('privacy.collected.announcementsTitle') }}</h3>
          <p>{{ t('privacy.collected.announcements') }}</p>
          <h3>{{ t('privacy.collected.interestsTitle') }}</h3>
          <p>{{ t('privacy.collected.interests') }}</p>
          <h3>{{ t('privacy.collected.demoTitle') }}</h3>
          <p>{{ t('privacy.collected.demo') }}</p>
          <h3>{{ t('privacy.collected.locationTitle') }}</h3>
          <p>{{ t('privacy.collected.location') }}</p>
          <h3>{{ t('privacy.collected.technicalTitle') }}</h3>
          <p>{{ t('privacy.collected.technical') }}</p>
        </section>

        <section class="soft-card">
          <h2 class="section-title">{{ t('privacy.recipients.title') }}</h2>
          <p>{{ t('privacy.recipients.body') }}</p>
          <ul>
            <li>{{ t('privacy.recipients.google') }}</li>
            <li>{{ t('privacy.recipients.render') }}</li>
            <li>{{ t('privacy.recipients.neon') }}</li>
            <li>{{ t('privacy.recipients.netlify') }}</li>
            <li>{{ t('privacy.recipients.maps') }}</li>
          </ul>
          <p>
            {{ t('privacy.recipients.googleRules') }}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener"
              >policies.google.com/privacy</a
            >
          </p>
        </section>

        <section class="soft-card">
          <h2 class="section-title">{{ t('privacy.retention.title') }}</h2>
          <ul>
            <li>{{ t('privacy.retention.account') }}</li>
            <li>{{ t('privacy.retention.announcements') }}</li>
            <li>{{ t('privacy.retention.interests') }}</li>
          </ul>
        </section>

        <section class="soft-card">
          <h2 class="section-title">{{ t('privacy.rights.title') }}</h2>
          <p>{{ t('privacy.rights.body', { email }) }}</p>
        </section>

        <section class="soft-card">
          <h2 class="section-title">{{ t('privacy.storage.title') }}</h2>
          <p>{{ t('privacy.storage.body') }}</p>
        </section>

        <section class="soft-card">
          <h2 class="section-title">{{ t('privacy.changes.title') }}</h2>
          <p>{{ t('privacy.changes.body') }}</p>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.privacy p,
.privacy ul {
  margin: 0;
  line-height: 1.55;
}
.privacy ul {
  padding-left: 20px;
}
.privacy h3 {
  margin: 6px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--cg-ink);
}
</style>
