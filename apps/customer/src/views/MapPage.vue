<script setup lang="ts">
/**
 * Home screen: map of Grenoble with the lockers and local businesses, a
 * floating welcome card and a bottom sheet with two tabs (lockers,
 * businesses). Tapping a locker opens its page.
 *
 * If the base map cannot load (offline, blocked network), the list takes the
 * whole screen so the app stays usable.
 */
import type { LockerFeatureCollection, MerchantFeatureCollection } from '@city-groom/api-client'
import { IonButton, IonContent, IonPage, IonSpinner, useIonRouter } from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { fetchLockers } from '../api/lockers'
import { fetchMerchants } from '../api/merchants'
import { HAS_MAP } from '../config'
import LockerCard from '../components/LockerCard.vue'
import LockerMap from '../components/LockerMap.vue'
import MerchantCard from '../components/MerchantCard.vue'
import { useErrorMessage } from '../composables/useErrorMessage'
import { CATEGORY_ORDER } from '../services/catalogue'

const { t } = useI18n()
const router = useIonRouter()
const toMessage = useErrorMessage()

const lockers = ref<LockerFeatureCollection | null>(null)
const merchants = ref<MerchantFeatureCollection | null>(null)
/** Tab shown in the bottom sheet. */
const tab = ref<'lockers' | 'merchants'>('lockers')
const error = ref<string | null>(null)
/** True when no base map is configured or it failed to load: the list takes over. */
const mapUnavailable = ref(!HAS_MAP)

/** Lockers with free compartments first, then by name. */
const sortedLockers = computed(() =>
  [...(lockers.value?.features ?? [])].sort((a, b) => {
    const freeA = Object.values(a.properties?.free_by_size ?? {}).reduce((x, y) => x + y, 0)
    const freeB = Object.values(b.properties?.free_by_size ?? {}).reduce((x, y) => x + y, 0)
    if ((freeA === 0) !== (freeB === 0)) return freeA === 0 ? 1 : -1
    return (a.properties?.name ?? '').localeCompare(b.properties?.name ?? '', 'fr')
  }),
)

/** Businesses grouped by category (catalogue order), alphabetical within a group. */
const merchantGroups = computed(() =>
  CATEGORY_ORDER.map((category) => ({
    category,
    merchants: (merchants.value?.features ?? [])
      .filter((m) => m.properties?.category === category)
      .sort((a, b) => (a.properties?.name ?? '').localeCompare(b.properties?.name ?? '', 'fr')),
  })).filter((group) => group.merchants.length > 0),
)

function open(code: string): void {
  router.push(`/casiers/${code}`)
}

async function load(): Promise<void> {
  error.value = null
  try {
    ;[lockers.value, merchants.value] = await Promise.all([fetchLockers(), fetchMerchants()])
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
          :merchants="merchants ?? undefined"
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
          <div class="tabs" role="tablist">
            <button
              id="tab-lockers"
              type="button"
              role="tab"
              :aria-selected="tab === 'lockers'"
              :class="{ active: tab === 'lockers' }"
              @click="tab = 'lockers'"
            >
              {{ t('map.lockersTab') }} · {{ sortedLockers.length }}
            </button>
            <button
              id="tab-merchants"
              type="button"
              role="tab"
              :aria-selected="tab === 'merchants'"
              :class="{ active: tab === 'merchants' }"
              @click="tab = 'merchants'"
            >
              {{ t('merchants.tab') }} · {{ merchants?.features?.length ?? 0 }}
            </button>
          </div>
          <p v-if="mapUnavailable" class="map-note">{{ t('map.unavailable') }}</p>

          <template v-if="tab === 'lockers'">
            <div class="cards">
              <locker-card
                v-for="locker in sortedLockers"
                :key="locker.properties?.code"
                :locker="locker"
                @open="open"
              />
            </div>
            <p class="notice">{{ t('app.simulatedNotice') }}</p>
          </template>
          <template v-else>
            <template v-if="merchants?.features?.length">
              <router-link class="to-catalogue" to="/boutiques">
                {{ t('map.searchShops') }} →
              </router-link>
              <section v-for="group in merchantGroups" :key="group.category" class="group">
                <h2 class="group-title">
                  {{ t(`merchants.categories.${group.category}`) }}
                  <span class="count">{{ group.merchants.length }}</span>
                </h2>
                <div class="cards">
                  <merchant-card
                    v-for="merchant in group.merchants"
                    :key="merchant.id"
                    :merchant="merchant"
                  />
                </div>
              </section>
            </template>
            <p v-else class="empty">{{ t('merchants.empty') }}</p>
            <p class="notice">{{ t('merchants.source') }}</p>
          </template>
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
  /* Brand green, opaque: readable over any part of the map. White text
     keeps 4.5:1 on both ends of the gradient. */
  background: linear-gradient(150deg, #0f6b47, #158556);
  box-shadow: var(--cg-shadow-strong);
  color: #ffffff;
}
.brand {
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f7d44c;
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
  color: rgb(255 255 255 / 85%);
}
.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 42%;
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
.tabs {
  display: inline-flex;
  align-self: flex-start;
  gap: 4px;
  padding: 4px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-surface-soft);
}
.tabs button {
  padding: 8px 16px;
  border: 0;
  border-radius: var(--cg-radius-pill);
  background: transparent;
  color: var(--cg-ink-soft);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}
.tabs button.active {
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  color: var(--cg-ink);
  box-shadow: var(--cg-shadow);
}
.empty {
  margin: 0;
  padding: 18px;
  border-radius: var(--cg-radius-l);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  color: var(--cg-ink-soft);
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
.to-catalogue {
  align-self: flex-start;
  padding: 10px 16px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-leaf);
  color: var(--cg-surface);
  font-weight: 800;
  text-decoration: none;
}
.group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.group-title {
  margin: 6px 0 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--cg-ink);
}
.count {
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-surface-soft);
  font-size: 12px;
  color: var(--cg-ink-soft);
}
</style>
