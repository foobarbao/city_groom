<script setup lang="ts">
/**
 * Home page of the demo: a link to the mission page, one card per space
 * (customer app, merchant, courier, operator), and where the data comes from.
 */
import { IonIcon } from '@ionic/vue'
import {
  bicycleOutline,
  phonePortraitOutline,
  speedometerOutline,
  storefrontOutline,
} from 'ionicons/icons'
import { useI18n } from 'vue-i18n'

import PortalPage from '../components/PortalPage.vue'

const { t } = useI18n()

/** The customer app is a separate app, served next to the portal on the demo site. */
const customerUrl = import.meta.env.VITE_CUSTOMER_URL ?? 'http://localhost:5173/'

const spaces = [
  { key: 'merchant', to: '/commerce', icon: storefrontOutline },
  { key: 'courier', to: '/coursier', icon: bicycleOutline },
  { key: 'operator', to: '/exploitation', icon: speedometerOutline },
] as const
</script>

<template>
  <portal-page :title="t('home.title')">
    <p class="intro">{{ t('home.intro') }}</p>
    <router-link class="mission card" to="/mission">
      <span class="mission-text">
        <h2>{{ t('mission.link.title') }}</h2>
        <span>{{ t('mission.link.text') }}</span>
      </span>
      <span class="open">{{ t('home.read') }} →</span>
    </router-link>
    <nav class="spaces">
      <a class="space card" :href="customerUrl">
        <span class="icon" aria-hidden="true"><ion-icon :icon="phonePortraitOutline" /></span>
        <h2>{{ t('home.customer.title') }}</h2>
        <p>{{ t('home.customer.text') }}</p>
        <span class="open">{{ t('home.open') }} →</span>
      </a>
      <router-link v-for="space in spaces" :key="space.key" class="space card" :to="space.to">
        <span class="icon" aria-hidden="true"><ion-icon :icon="space.icon" /></span>
        <h2>{{ t(`home.${space.key}.title`) }}</h2>
        <p>{{ t(`home.${space.key}.text`) }}</p>
        <span class="open">{{ t('home.open') }} →</span>
      </router-link>
    </nav>
    <p class="data-note">{{ t('home.dataNote') }}</p>
  </portal-page>
</template>

<style scoped>
.intro {
  margin: 0;
  max-width: 640px;
  font-size: 17px;
  color: var(--cg-ink-soft);
}
.spaces {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.mission {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  text-decoration: none;
  background:
    linear-gradient(100deg, rgb(20 60 46 / 88%), rgb(20 60 46 / 45%)),
    url('../assets/mission/jardin-de-ville-hotel-de-ville.jpg') center 65% / cover;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.mission:hover,
.mission:focus-visible {
  box-shadow: var(--cg-shadow-strong);
}
.mission h2 {
  color: #fff;
}
.mission-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mission .open {
  color: #b9f0d2;
}
.space {
  gap: 8px;
  color: inherit;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.space:hover,
.space:focus-visible {
  box-shadow: var(--cg-shadow-strong);
}
.icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-leaf-soft);
  color: var(--cg-leaf);
  font-size: 22px;
}
.space p {
  margin: 0;
  flex: 1;
  color: var(--cg-ink-soft);
}
.open {
  font-weight: 600;
  color: var(--cg-leaf);
}
.data-note {
  margin: 0;
  font-size: 13px;
  color: var(--cg-ink-soft);
}
</style>
