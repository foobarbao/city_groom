<script setup lang="ts">
/**
 * "Casiers autour de moi": the lockers closest to the customer, with walking
 * distance and free compartments, and one-tap actions to drop belongings
 * now or book a slot (consigne), or open the locker.
 *
 * Without a position (permission refused, no GPS), distances are measured
 * from the centre of Grenoble, and the screen says so.
 */
import { IonButton, IonContent, IonIcon, IonPage, IonSpinner, useIonRouter } from '@ionic/vue'
import { navigateOutline } from 'ionicons/icons'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AppHeader from '../components/AppHeader.vue'
import DemoNotice from '../components/DemoNotice.vue'
import LockerMap from '../components/LockerMap.vue'
import { HAS_MAP } from '../config'
import { usePosition } from '../composables/usePosition'
import { byDistance, formatDistance, walkingMinutes } from '../domain/geo'
import { catalogue, lockerFeatures, lockers } from '../services/catalogue'

const { t } = useI18n()
const { status, origin, position, locate } = usePosition()
const router = useIonRouter()
/** Hidden when no base map is configured or it failed to load. */
const mapShown = ref(HAS_MAP)
/** Close-up zoom: lockers within walking distance. */
const NEARBY_ZOOM = 14.5

/** Lockers listed at first; "Voir plus" adds as many. */
const STEP = 8
const shown = ref(STEP)
const consigneOnly = ref(true)

/** Sizes offered for the consigne (no hanging compartment). */
const CONSIGNE_SIZES = Object.keys(catalogue.consigne.prices)
const freeConsigne = (free: Record<string, number>): number =>
  CONSIGNE_SIZES.reduce((sum, size) => sum + (free[size] ?? 0), 0)

const nearby = computed(() =>
  byDistance(lockers, origin.value).filter(
    (l) => !consigneOnly.value || freeConsigne(l.freeBySize) > 0,
  ),
)

onMounted(() => {
  if (status.value !== 'located') locate()
})
</script>

<template>
  <ion-page>
    <app-header back-href="/accueil" />
    <ion-content>
      <main class="page">
        <h1 class="page-title">{{ t('nearby.title') }}</h1>

        <p v-if="status === 'locating'" class="banner">
          <ion-spinner name="dots" /> {{ t('nearby.locating') }}
        </p>
        <p v-else-if="status === 'located'" class="banner ok">
          <ion-icon :icon="navigateOutline" aria-hidden="true" /> {{ t('nearby.located') }}
        </p>
        <div v-else-if="status === 'denied' || status === 'unavailable'" class="banner warn">
          <span>{{ status === 'denied' ? t('nearby.denied') : t('nearby.unavailable') }}</span>
          <ion-button size="small" shape="round" fill="outline" @click="locate">
            {{ t('nearby.retry') }}
          </ion-button>
        </div>

        <div v-if="mapShown" class="map-box">
          <locker-map
            :lockers="lockerFeatures"
            :center="origin"
            :zoom="NEARBY_ZOOM"
            :me="position"
            compact
            @select="(code) => router.push(`/casiers/${code}`)"
            @unavailable="mapShown = false"
          />
        </div>

        <div class="chips" role="group">
          <button
            class="chip"
            :class="{ active: consigneOnly }"
            type="button"
            @click="consigneOnly = true"
          >
            {{ t('nearby.forConsigne') }}
          </button>
          <button
            class="chip"
            :class="{ active: !consigneOnly }"
            type="button"
            @click="consigneOnly = false"
          >
            {{ t('nearby.all') }}
          </button>
        </div>

        <ul class="list">
          <li
            v-for="(l, i) in nearby.slice(0, shown)"
            :key="l.code"
            class="soft-card locker"
            :class="{ first: i === 0 }"
          >
            <div class="head">
              <span class="name-block">
                <strong class="name">{{ l.name }}</strong>
                <span class="muted small">{{ t(`sites.${l.siteCategory}`) }}</span>
              </span>
              <span class="distance">
                <strong>{{ formatDistance(l.distance) }}</strong>
                <span class="muted small">{{
                  t('nearby.walk', { minutes: walkingMinutes(l.distance) })
                }}</span>
              </span>
            </div>
            <div class="sizes">
              <span
                v-for="size in CONSIGNE_SIZES"
                :key="size"
                class="size"
                :class="{ none: !(l.freeBySize[size] ?? 0) }"
              >
                {{ t(`locker.sizes.${size}`) }} · {{ l.freeBySize[size] ?? 0 }}
              </span>
            </div>
            <div class="actions">
              <ion-button
                v-if="freeConsigne(l.freeBySize) > 0"
                size="small"
                shape="round"
                :router-link="{
                  path: '/consigne/reserver',
                  query: { casier: l.code, maintenant: '1' },
                }"
              >
                {{ t('nearby.dropNow') }}
              </ion-button>
              <ion-button
                size="small"
                shape="round"
                fill="outline"
                :router-link="{ path: '/consigne/reserver', query: { casier: l.code } }"
              >
                {{ t('nearby.book') }}
              </ion-button>
              <ion-button
                size="small"
                shape="round"
                fill="clear"
                :router-link="`/casiers/${l.code}`"
              >
                {{ t('nearby.see') }}
              </ion-button>
            </div>
          </li>
        </ul>
        <ion-button v-if="nearby.length > shown" fill="clear" @click="shown += STEP">{{
          t('nearby.more')
        }}</ion-button>
        <router-link class="small" to="/carte">{{ t('home.map') }} →</router-link>
        <p class="muted small">{{ t('nearby.privacy') }}</p>
        <demo-notice :text="t('app.simulatedNotice')" />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.map-box {
  position: relative;
  height: 280px;
  border-radius: var(--cg-radius-l);
  overflow: hidden;
  box-shadow: var(--cg-shadow);
}
.banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
  padding: 12px 16px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  font-weight: 700;
}
.banner.ok {
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
}
.banner.warn {
  background: var(--cg-sun-soft);
}
.locker {
  gap: 12px;
}
.locker.first {
  border: 2px solid var(--cg-leaf);
}
.head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.name-block,
.distance {
  display: flex;
  flex-direction: column;
}
.distance {
  flex: none;
  align-items: flex-end;
  text-align: right;
  white-space: nowrap;
  color: var(--cg-pine);
}
.name {
  font-size: 17px;
}
.sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.size {
  padding: 4px 10px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
  font-size: 13px;
  font-weight: 600;
}
.size.none {
  background: var(--cg-surface-soft);
  color: var(--cg-ink-soft);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
