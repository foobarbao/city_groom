<script setup lang="ts">
/**
 * Home screen: map of Grenoble with the lockers, a floating welcome card and a
 * bottom sheet listing the lockers. Tapping a locker opens its page.
 *
 * If the base map cannot load (offline, blocked network), the list takes the
 * whole screen so the app stays usable.
 */
import type { LockerFeatureCollection } from '@city-groom/api-client'
import { IonButton, IonContent, IonPage, IonSpinner, useIonRouter } from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { fetchLockers } from '../api/lockers'
import { MAP_STYLE_URL } from '../config'
import LockerCard from '../components/LockerCard.vue'
import LockerMap from '../components/LockerMap.vue'
import { useErrorMessage } from '../composables/useErrorMessage'

const { t } = useI18n()
const router = useIonRouter()
const toMessage = useErrorMessage()

const lockers = ref<LockerFeatureCollection | null>(null)
const error = ref<string | null>(null)
/** True when no base map is configured or it failed to load: the list takes over. */
const mapUnavailable = ref(MAP_STYLE_URL === '')

/** Lockers with free compartments first, then by name. */
const sortedLockers = computed(() =>
  [...(lockers.value?.features ?? [])].sort((a, b) => {
    const freeA = Object.values(a.properties?.free_by_size ?? {}).reduce((x, y) => x + y, 0)
    const freeB = Object.values(b.properties?.free_by_size ?? {}).reduce((x, y) => x + y, 0)
    if ((freeA === 0) !== (freeB === 0)) return freeA === 0 ? 1 : -1
    return (a.properties?.name ?? '').localeCompare(b.properties?.name ?? '', 'fr')
  }),
)

function open(code: string): void {
  router.push(`/casiers/${code}`)
}

async function load(): Promise<void> {
  error.value = null
  try {
    lockers.value = await fetchLockers()
  } catch (e) {
    error.value = toMessage(e)
  }
}

onMounted(load)
</script>

<template>
  <ion-page>
    <ion-content :scroll-y="false">
      <div v-if="error" class="state">
        <p>{{ error }}</p>
        <ion-button shape="round" @click="load">{{ t('errors.retry') }}</ion-button>
      </div>
      <div v-else-if="!lockers" class="state">
        <ion-spinner name="dots" />
        <p>{{ t('map.loading') }}</p>
      </div>
      <div v-else class="screen" :class="{ 'no-map': mapUnavailable }">
        <locker-map
          v-if="!mapUnavailable"
          :lockers="lockers"
          @select="open"
          @unavailable="mapUnavailable = true"
        />

        <header class="welcome">
          <p class="brand">{{ t('app.name') }}</p>
          <h1>{{ t('app.tagline') }}</h1>
          <p class="sub">{{ t('map.subtitle', sortedLockers.length) }}</p>
        </header>

        <section class="sheet" :aria-label="t('map.listTitle')">
          <span class="grabber" aria-hidden="true" />
          <h2>{{ t('map.listTitle') }}</h2>
          <p v-if="mapUnavailable" class="map-note">{{ t('map.unavailable') }}</p>
          <div class="cards">
            <locker-card
              v-for="locker in sortedLockers"
              :key="locker.properties?.code"
              :locker="locker"
              @open="open"
            />
          </div>
          <p class="notice">{{ t('app.simulatedNotice') }}</p>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  padding: 24px;
  text-align: center;
}
.screen {
  position: relative;
  height: 100%;
  overflow: hidden;
}
.welcome {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top, 0px));
  left: 14px;
  right: 64px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 18px;
  border-radius: var(--cg-radius-l);
  background: color-mix(in srgb, var(--cg-surface) 92%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: var(--cg-shadow);
}
.brand {
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cg-leaf);
}
.welcome h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.25;
}
.sub {
  margin: 0;
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 46%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 16px calc(16px + env(safe-area-inset-bottom, 0px));
  border-radius: var(--cg-radius-l) var(--cg-radius-l) 0 0;
  background: var(--cg-ground);
  box-shadow: var(--cg-shadow-strong);
  overflow-y: auto;
}
.grabber {
  align-self: center;
  width: 44px;
  height: 5px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-surface-soft);
}
.sheet h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.map-note,
.notice {
  margin: 0;
  font-size: 12px;
  color: var(--cg-ink-soft);
}

/* Without a base map, a soft leafy ground replaces it and the list rises. */
.no-map {
  background:
    radial-gradient(circle at 20% 15%, var(--cg-leaf-soft), transparent 45%),
    radial-gradient(circle at 85% 35%, var(--cg-surface-soft), transparent 40%), var(--cg-ground);
}
.no-map .welcome {
  right: 14px;
}
.no-map .sheet {
  top: calc(150px + env(safe-area-inset-top, 0px));
  max-height: none;
  background: transparent;
  box-shadow: none;
}
.no-map .grabber {
  display: none;
}
</style>
