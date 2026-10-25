<script setup lang="ts">
/**
 * Page frame shared by every portal space: header with the way back, title,
 * and a permanent notice that the figures are fictitious, with their date.
 *
 * Props:
 * - `title`: page title.
 * - `backHref`: where the back button leads; no back button when omitted.
 * - `backText`: label of the back button.
 *
 * Slots:
 * - default: page content, laid out in a centred column.
 * - `actions`: controls shown next to the title (e.g. merchant picker).
 */
import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonToolbar } from '@ionic/vue'
import { useI18n } from 'vue-i18n'

import { clock, longDay } from '../data/format'
import { demoNow } from '../data/source'

defineProps<{
  title: string
  backHref?: string
  backText?: string
}>()

const { t } = useI18n()
const asOf = t('app.asOf', {
  date: longDay(demoNow.toISOString()),
  time: clock(demoNow.toISOString()),
})
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons v-if="backHref" slot="start">
          <ion-back-button :default-href="backHref" :text="backText ?? t('app.home')" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main class="portal-page">
        <header class="portal-head">
          <div>
            <p class="eyebrow">{{ t('app.name') }}</p>
            <h1>{{ title }}</h1>
          </div>
          <slot name="actions" />
        </header>
        <p class="fictitious" role="note">
          <span class="dot" aria-hidden="true" />{{ t('app.fictitious') }} {{ asOf }}.
        </p>
        <slot />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.portal-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px 40px;
}
.portal-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}
.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cg-leaf);
}
h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  color: var(--cg-ink);
}
.fictitious {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 8px 14px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-surface-soft);
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cg-sun);
}
</style>
