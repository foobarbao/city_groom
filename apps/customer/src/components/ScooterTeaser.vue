<script setup lang="ts">
/**
 * "Coming soon" card of the scooter lockers (docs/PRODUCT.md §4d), linking
 * to their explanatory page. Shown where customers deal with the consigne
 * (overview, booking) so the announced offer is seen (owner, 2026-10-26).
 */
import { IonIcon } from '@ionic/vue'
import { chevronForwardOutline } from 'ionicons/icons'
import { useI18n } from 'vue-i18n'

import { SCOOTER_PATH } from '../utils/icons'

const { t } = useI18n()
</script>

<template>
  <router-link class="soon" to="/consigne/trottinettes">
    <span class="soon-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="24" height="24"><path :d="SCOOTER_PATH" /></svg>
    </span>
    <span class="soon-text">
      <span class="pill warn">{{ t('scooters.soon') }}</span>
      <strong>{{ t('scooters.title') }}</strong>
      <span>{{ t('scooters.teaser') }}</span>
    </span>
    <ion-icon class="chevron" :icon="chevronForwardOutline" aria-hidden="true" />
  </router-link>
</template>

<style scoped>
/* Same shape as the home shortcuts, honey tint. */
.soon {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--cg-radius-l);
  background: linear-gradient(160deg, var(--cg-sun-soft) 0%, var(--cg-glass) 75%);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  text-decoration: none;
}
.soon-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-sun-soft);
}
.soon-icon svg {
  fill: none;
  stroke: var(--cg-sun-strong);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.soon-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 15px;
}
.soon-text > span:last-child {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.chevron {
  font-size: 18px;
  color: var(--cg-ink-soft);
}
</style>
