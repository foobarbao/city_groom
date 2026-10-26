<script setup lang="ts">
/**
 * "Casiers autour de moi": the lockers closest to the customer, with the
 * same chooser as the consigne booking (owner, 2026-10-26): map, search and
 * a list built like the side menu, opened sorted by distance ("Près de
 * moi"). The chosen locker, the nearest one with room for a consigne at
 * first, shows its walking distance, free compartments and one-tap actions:
 * drop belongings now, book a slot, or open the locker.
 *
 * Without a position (permission refused, no GPS), distances are measured
 * from the centre of Grenoble, and the screen says so.
 */
import { IonButton, IonIcon, IonContent, IonPage, IonSpinner } from '@ionic/vue'
import { navigateOutline } from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppHeader from '../components/AppHeader.vue'
import DemoNotice from '../components/DemoNotice.vue'
import LockerPicker from '../components/LockerPicker.vue'
import { usePosition } from '../composables/usePosition'
import { byDistance, distanceMeters, formatDistance, walkingMinutes } from '../domain/geo'
import { catalogue, lockers } from '../services/catalogue'

const { t } = useI18n()
const { status, origin, locate } = usePosition()

/** Sizes offered for the consigne (no hanging compartment). */
const CONSIGNE_SIZES = Object.keys(catalogue.consigne.prices)
const freeConsigne = (free: Record<string, number>): number =>
  CONSIGNE_SIZES.reduce((sum, size) => sum + (free[size] ?? 0), 0)

const selectedCode = ref<string | null>(null)
const selected = computed(() => lockers.find((l) => l.code === selectedCode.value) ?? null)
const distance = computed(() =>
  selected.value
    ? distanceMeters(origin.value, [selected.value.longitude, selected.value.latitude])
    : 0,
)

// Once the position is settled (found, refused or unavailable), preselect
// the nearest locker with room for a consigne, unless one was chosen.
watch(
  status,
  (value) => {
    if (selectedCode.value || value === 'idle' || value === 'locating') return
    selectedCode.value =
      byDistance(lockers, origin.value).find((l) => freeConsigne(l.freeBySize) > 0)?.code ?? null
  },
  { immediate: true },
)
</script>

<template>
  <ion-page>
    <app-header back-href="/accueil" />
    <ion-content>
      <main class="page wide">
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

        <locker-picker v-model="selectedCode" :exclude="['XL']" start-near-me allow-full />

        <section v-if="selected" class="soft-card locker" aria-live="polite">
          <div class="head">
            <span class="name-block">
              <strong class="name">{{ selected.name }}</strong>
              <span class="muted small">{{ t(`sites.${selected.siteCategory}`) }}</span>
            </span>
            <span class="distance">
              <strong>{{ formatDistance(distance) }}</strong>
              <span class="muted small">{{
                t('nearby.walk', { minutes: walkingMinutes(distance) })
              }}</span>
            </span>
          </div>
          <div class="sizes">
            <span
              v-for="size in CONSIGNE_SIZES"
              :key="size"
              class="size"
              :class="{ none: !(selected.freeBySize[size] ?? 0) }"
            >
              {{ t(`locker.sizes.${size}`) }} · {{ selected.freeBySize[size] ?? 0 }}
            </span>
          </div>
          <p v-if="!freeConsigne(selected.freeBySize)" class="muted small">
            {{ t('nearby.full') }}
          </p>
          <div class="actions">
            <ion-button
              v-if="freeConsigne(selected.freeBySize) > 0"
              size="small"
              shape="round"
              :router-link="{
                path: '/consigne/reserver',
                query: { casier: selected.code, maintenant: '1' },
              }"
            >
              {{ t('nearby.dropNow') }}
            </ion-button>
            <ion-button
              size="small"
              shape="round"
              fill="outline"
              :router-link="{ path: '/consigne/reserver', query: { casier: selected.code } }"
            >
              {{ t('nearby.book') }}
            </ion-button>
            <ion-button
              size="small"
              shape="round"
              fill="clear"
              :router-link="`/casiers/${selected.code}`"
            >
              {{ t('nearby.see') }}
            </ion-button>
          </div>
        </section>
        <p v-else class="muted">{{ t('nearby.choose') }}</p>

        <p class="muted small">{{ t('nearby.privacy') }}</p>
        <demo-notice :text="t('app.simulatedNotice')" />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
/* Room for the map beside the list, as on the consigne booking. */
.page.wide {
  max-width: 1080px;
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
