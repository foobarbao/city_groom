<script setup lang="ts">
/**
 * Top bar of every screen: the menu button (shown when the side menu is a
 * drawer, on phones and narrow windows), an optional way back, and either
 * the screen's own controls (slot) or the CityPal name.
 *
 * Props:
 * - `backHref`: where the back button leads when there is no history
 *   (opened from a link); no back button when omitted.
 *
 * Slots:
 * - default: content of the bar (e.g. a search field); the app name otherwise.
 */
import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { useI18n } from 'vue-i18n'

defineProps<{ backHref?: string }>()
const { t } = useI18n()
</script>

<template>
  <ion-header class="ion-no-border app-header">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-menu-button :aria-label="t('nav.menu')" />
        <ion-back-button v-if="backHref" :default-href="backHref" :text="t('common.back')" />
      </ion-buttons>
      <slot>
        <ion-title class="brand">{{ t('app.name') }}</ion-title>
      </slot>
    </ion-toolbar>
  </ion-header>
</template>

<style scoped>
.brand {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
/* With the menu as a fixed column (wide screens), the name is already in it. */
@media (min-width: 992px) {
  .brand {
    display: none;
  }
}
</style>
