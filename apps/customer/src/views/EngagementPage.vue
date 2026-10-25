<script setup lang="ts">
/**
 * "Notre engagement" (docs/PRODUCT.md "Ecology and digital"): the ecological
 * and digital approach of CityPal, as a global communication axis decided
 * by the project owner on 2026-10-25.
 *
 * On hold (2026-10-25, the owner will come back to it): not linked from the
 * menu or the home screen; reachable at /engagement only.
 *
 * Only facts true of the service are stated (cargo-bike rounds, local
 * shops, shared lockers turning over three times a day, everything in the
 * app, minimal data). No figure (CO₂, km) is shown until it can be measured
 * and sourced.
 */
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import {
  bicycleOutline,
  phonePortraitOutline,
  refreshOutline,
  shieldCheckmarkOutline,
  storefrontOutline,
  trainOutline,
} from 'ionicons/icons'
import { useI18n } from 'vue-i18n'

import AppHeader from '../components/AppHeader.vue'
import { catalogue } from '../services/catalogue'

const { t } = useI18n()
const roundTimes = new Intl.ListFormat('fr', { type: 'conjunction' }).format(catalogue.round_times)

const ECOLOGY = [
  { key: 'bike', icon: bicycleOutline, tone: 'leaf' },
  { key: 'local', icon: storefrontOutline, tone: 'coral' },
  { key: 'shared', icon: refreshOutline, tone: 'sky' },
  { key: 'tram', icon: trainOutline, tone: 'plum' },
]
const DIGITAL = [
  { key: 'app', icon: phonePortraitOutline, tone: 'sky' },
  { key: 'data', icon: shieldCheckmarkOutline, tone: 'leaf' },
]
</script>

<template>
  <ion-page>
    <app-header />
    <ion-content>
      <main class="page">
        <section class="hero">
          <span class="badge">{{ t('engagement.badge') }}</span>
          <h1>{{ t('engagement.title') }}</h1>
          <p>{{ t('engagement.intro') }}</p>
        </section>

        <h2 class="section-title">{{ t('engagement.ecologyTitle') }}</h2>
        <ul class="points">
          <li v-for="p in ECOLOGY" :key="p.key" class="soft-card point" :class="`tone-${p.tone}`">
            <span class="icon" aria-hidden="true"><ion-icon :icon="p.icon" /></span>
            <span>
              <strong>{{ t(`engagement.points.${p.key}.title`) }}</strong>
              <span class="muted">{{
                t(`engagement.points.${p.key}.text`, { times: roundTimes })
              }}</span>
            </span>
          </li>
        </ul>

        <h2 class="section-title">{{ t('engagement.digitalTitle') }}</h2>
        <ul class="points">
          <li v-for="p in DIGITAL" :key="p.key" class="soft-card point" :class="`tone-${p.tone}`">
            <span class="icon" aria-hidden="true"><ion-icon :icon="p.icon" /></span>
            <span>
              <strong>{{ t(`engagement.points.${p.key}.title`) }}</strong>
              <span class="muted">{{ t(`engagement.points.${p.key}.text`) }}</span>
            </span>
          </li>
        </ul>
        <p class="muted small">{{ t('engagement.note') }}</p>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.page p {
  margin: 0;
}
/* Same fixed colours as the promotion cards: a strong, branded opening. */
.hero {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border-radius: var(--cg-radius-l);
  background: linear-gradient(135deg, #0f6b47 0%, #1b9463 100%);
  color: #ffffff;
  box-shadow: var(--cg-shadow-strong);
}
.hero h1 {
  margin: 0;
  font-size: 26px;
}
.hero p {
  opacity: 0.9;
}
.badge {
  align-self: flex-start;
  padding: 3px 10px;
  border-radius: var(--cg-radius-pill);
  background: #ffffff;
  color: #0f6b47;
  font-size: 12px;
  font-weight: 600;
}
.points {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.point {
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
}
.point > span:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--cg-radius-m);
  background: var(--tone-soft);
  color: var(--tone);
  font-size: 20px;
}
.tone-leaf {
  --tone: var(--cg-leaf);
  --tone-soft: var(--cg-leaf-soft);
}
.tone-sky {
  --tone: var(--cg-sky);
  --tone-soft: var(--cg-sky-soft);
}
.tone-coral {
  --tone: var(--cg-coral);
  --tone-soft: var(--cg-coral-soft);
}
.tone-plum {
  --tone: var(--cg-plum);
  --tone-soft: var(--cg-plum-soft);
}
</style>
