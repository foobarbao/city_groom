<script setup lang="ts">
/**
 * "Installer l'application" button: adds the web app to the home screen
 * until the app is on the Play Store (services/installApp.ts).
 *
 * Hidden when the app already runs installed. Opens the browser's install
 * dialog when there is one (Chrome, Edge, Samsung Internet), otherwise an
 * alert explaining how to install from the browser's menu (Safari, Firefox).
 * Never shown as a pop-up on its own (owner's decision of 2026-10-26).
 */
import { IonIcon, alertController } from '@ionic/vue'
import { downloadOutline } from 'ionicons/icons'
import { useI18n } from 'vue-i18n'

import { installPlatform, installState, promptInstall } from '../services/installApp'

/** `card` on the home screen, `compact` in the side menu. */
withDefaults(defineProps<{ variant?: 'card' | 'compact' }>(), { variant: 'card' })

const { t } = useI18n()

async function install(): Promise<void> {
  if ((await promptInstall()) !== 'unavailable') return
  const platform = installPlatform(navigator.userAgent, navigator.maxTouchPoints)
  const alert = await alertController.create({
    header: t('install.howTitle'),
    message: t(`install.how.${platform}`),
    buttons: [t('install.ok')],
  })
  await alert.present()
}
</script>

<template>
  <button
    v-if="!installState.installed"
    type="button"
    class="install"
    :class="variant"
    @click="install"
  >
    <span class="install-icon" aria-hidden="true"><ion-icon :icon="downloadOutline" /></span>
    <span class="install-text">
      <strong>{{ t('install.button') }}</strong>
      <span v-if="variant === 'card'">{{ t('install.text') }}</span>
    </span>
  </button>
</template>

<style scoped>
.install {
  display: grid;
  grid-template-columns: 40px 1fr;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 0;
  border-radius: var(--cg-radius-l);
  background: var(--cg-glass);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.install.compact {
  grid-template-columns: 32px 1fr;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-leaf-soft);
  box-shadow: none;
}
.install:focus-visible {
  outline: 2px solid var(--cg-leaf);
  outline-offset: 2px;
}
.install-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-leaf-soft);
  color: var(--cg-leaf);
  font-size: 20px;
}
.compact .install-icon {
  width: 32px;
  height: 32px;
  font-size: 18px;
}
.install-text {
  display: flex;
  flex-direction: column;
  font-size: 15px;
}
.compact .install-text {
  font-size: 14px;
}
.install-text span {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
</style>
