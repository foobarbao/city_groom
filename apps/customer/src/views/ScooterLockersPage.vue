<script setup lang="ts">
/**
 * Scooter lockers, announced as "Bientôt disponible" (docs/PRODUCT.md §4d),
 * told as a photo story like the portal's "Notre mission" page (owner,
 * 2026-10-26: "une bonne publicité visuelle"): full-screen chapters over
 * photos that cross-fade as they scroll into view (`useStory`).
 *
 * Chapters: one closed locker per scooter, some double lockers for two;
 * used like the consigne (24 hours at most); the size of a locker and the
 * reference scooters it fits; a sketch of a station; "Ça m'intéresse" for a
 * signed-in customer (recorded by the API to measure demand). Photo credits
 * close the page, as the licences require (`data/scooterPhotos.ts`). Work in
 * progress: nothing can be booked yet.
 */
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonPage,
  IonToolbar,
} from '@ionic/vue'
import { checkmarkCircleOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { StoryBackdrop, StoryCredits, useStory } from '@city-groom/ui'

import { scooterPhotos } from '../data/scooterPhotos'
import {
  EXAMPLE_STATION,
  PARTITION_CM,
  REFERENCE_SCOOTERS,
  SCOOTER_LOCKERS,
  SCOOTER_PLACE,
  fitsScooterPlace,
  stationFrontCm,
  stationScooters,
} from '../domain/scooterLockers'
import { useAccountStore } from '../stores/account'
import { SCOOTER_PATH } from '../utils/icons'

const OFFER = 'scooter_lockers'

const { t, tm, rt } = useI18n()
const account = useAccountStore()
const { content, active, requested, photoFor } = useStory(scooterPhotos.length)

const points = computed(() => {
  const messages = tm('scooters.one.points')
  return Array.isArray(messages) ? messages.map((message) => rt(message)) : []
})

// Sketch of the example station front, in centimetres (1 unit = 1 cm).
const ROOF = 12
const ICON = 34
const station = computed(() => {
  let x = PARTITION_CM
  const doors = EXAMPLE_STATION.map((kind, index) => {
    const { widthCm } = SCOOTER_LOCKERS[kind].size
    const door = { kind, x, width: widthCm, key: `${index}-${kind}` }
    x += widthCm + PARTITION_CM
    return door
  })
  const width = stationFrontCm(EXAMPLE_STATION)
  return {
    doors,
    width,
    height: SCOOTER_PLACE.heightCm + ROOF + PARTITION_CM,
    metres: (width / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 }),
    scooters: stationScooters(EXAMPLE_STATION),
  }
})

/** Left edges of the scooter pictograms drawn in a door (one or two). */
function iconsIn(door: { kind: keyof typeof SCOOTER_LOCKERS; x: number; width: number }): number[] {
  const count = SCOOTER_LOCKERS[door.kind].scooters
  const slot = door.width / count
  return Array.from({ length: count }, (_, i) => door.x + slot * i + (slot - ICON) / 2)
}

const interested = computed(() => account.hasInterest(OFFER))
const busy = ref(false)
const status = ref('')

async function toggleInterest(): Promise<void> {
  busy.value = true
  status.value = ''
  try {
    await account.setInterest(OFFER, !interested.value)
    status.value = interested.value ? t('scooters.interest.saved') : t('scooters.interest.removed')
  } catch {
    status.value = t('scooters.interest.error')
  } finally {
    busy.value = false
  }
}

/** The hero's call to action leads to the "Ça m'intéresse" chapter. */
const interestSection = ref<HTMLElement | null>(null)
function goToInterest(): void {
  interestSection.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <ion-page>
    <story-backdrop :photos="scooterPhotos" :active="active" :requested="requested" />
    <ion-header class="ion-no-border story-header" translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button :aria-label="t('nav.menu')" />
          <ion-back-button default-href="/consigne" :text="t('common.back')" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content fullscreen class="story-content">
      <main ref="content" class="story">
        <section class="story-chapter center" :data-photo="photoFor(0)">
          <p class="story-eyebrow">{{ t('scooters.hero.eyebrow') }}</p>
          <h1>{{ t('scooters.hero.title') }}</h1>
          <p class="story-lead">{{ t('scooters.hero.text') }}</p>
          <div class="story-actions">
            <button class="story-button primary" type="button" @click="goToInterest">
              {{ t('scooters.hero.cta') }}
            </button>
          </div>
          <p class="story-scroll-hint" aria-hidden="true">{{ t('scooters.hero.scroll') }} ↓</p>
        </section>

        <section class="story-chapter left" :data-photo="photoFor(1)">
          <article class="story-glass">
            <p class="story-eyebrow">{{ t('scooters.one.eyebrow') }}</p>
            <h2>{{ t('scooters.one.title') }}</h2>
            <p>{{ t('scooters.one.text') }}</p>
            <ul class="story-points">
              <li v-for="point in points" :key="point">{{ point }}</li>
            </ul>
          </article>
        </section>

        <section class="story-chapter right" :data-photo="photoFor(2)">
          <article class="story-glass">
            <p class="story-eyebrow">{{ t('scooters.use.eyebrow') }}</p>
            <h2>{{ t('scooters.use.title') }}</h2>
            <p>{{ t('scooters.use.text') }}</p>
          </article>
        </section>

        <section class="story-chapter left" :data-photo="photoFor(3)">
          <article class="story-glass">
            <p class="story-eyebrow">{{ t('scooters.fit.eyebrow') }}</p>
            <h2>{{ t('scooters.fit.title') }}</h2>
            <p>
              {{
                t('scooters.fit.place', {
                  length: SCOOTER_PLACE.lengthCm,
                  width: SCOOTER_PLACE.widthCm,
                  height: SCOOTER_PLACE.heightCm,
                })
              }}
            </p>
            <ul class="models">
              <li v-for="s in REFERENCE_SCOOTERS" :key="s.name">
                <ion-icon
                  v-if="fitsScooterPlace(s.size)"
                  class="ok"
                  :icon="checkmarkCircleOutline"
                  aria-hidden="true"
                />
                <span>
                  <strong>{{ s.name }}</strong>
                  <span class="dim">
                    {{
                      t('scooters.fit.size', {
                        length: s.size.lengthCm,
                        width: s.size.widthCm,
                        height: s.size.heightCm,
                      })
                    }}
                  </span>
                </span>
              </li>
            </ul>
            <p class="note">{{ t('scooters.fit.note') }}</p>
          </article>
        </section>

        <section class="story-chapter center" :data-photo="photoFor(4)">
          <article class="story-glass wide">
            <p class="story-eyebrow">{{ t('scooters.station.eyebrow') }}</p>
            <h2>{{ t('scooters.station.title') }}</h2>
            <p>{{ t('scooters.station.text') }}</p>
            <svg
              class="station"
              :viewBox="`0 0 ${station.width} ${station.height}`"
              role="img"
              :aria-label="
                t('scooters.station.alt', {
                  lockers: station.doors.length,
                  scooters: station.scooters,
                  width: station.metres,
                })
              "
            >
              <rect
                class="body"
                x="0"
                y="0"
                :width="station.width"
                :height="station.height"
                rx="6"
              />
              <g v-for="door in station.doors" :key="door.key">
                <rect
                  class="door"
                  :class="door.kind"
                  :x="door.x"
                  :y="ROOF"
                  :width="door.width"
                  :height="SCOOTER_PLACE.heightCm"
                  rx="3"
                />
                <svg
                  v-for="x in iconsIn(door)"
                  :key="x"
                  class="scooter"
                  :x="x"
                  :y="ROOF + SCOOTER_PLACE.heightCm - ICON - 18"
                  :width="ICON"
                  :height="ICON"
                  viewBox="0 0 24 24"
                >
                  <path :d="SCOOTER_PATH" />
                </svg>
              </g>
            </svg>
            <div class="legend">
              <span><i class="swatch single" />{{ t('scooters.station.single') }}</span>
              <span><i class="swatch double" />{{ t('scooters.station.double') }}</span>
            </div>
            <p class="note">
              {{
                t('scooters.station.size', {
                  scooters: station.scooters,
                  width: station.metres,
                  depth: SCOOTER_PLACE.lengthCm,
                  height: station.height,
                })
              }}
            </p>
          </article>
        </section>

        <section ref="interestSection" class="story-chapter center" :data-photo="photoFor(5)">
          <h2>{{ t('scooters.interest.title') }}</h2>
          <p class="story-lead">{{ t('scooters.interest.text') }}</p>
          <div class="story-actions">
            <template v-if="account.state.signedIn">
              <button
                class="story-button"
                :class="{ primary: !interested }"
                type="button"
                :disabled="busy"
                @click="toggleInterest"
              >
                {{ interested ? t('scooters.interest.withdraw') : t('scooters.interest.cta') }}
              </button>
            </template>
            <router-link v-else class="story-button primary" to="/compte">
              {{ t('scooters.interest.signIn') }}
            </router-link>
          </div>
          <p v-if="!account.state.signedIn" class="dim">{{ t('scooters.interest.signInHint') }}</p>
          <p v-else-if="interested" class="dim">{{ t('scooters.interest.recorded') }}</p>
          <p v-if="status" class="dim" role="status">{{ status }}</p>
        </section>

        <story-credits
          :photos="scooterPhotos"
          :title="t('scooters.credits.title')"
          :intro="t('scooters.credits.intro')"
        />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
/* Text over the photos stays light whatever the theme (see StoryBackdrop). */
.dim {
  margin: 0;
  font-size: 14px;
  color: rgb(255 255 255 / 75%);
}
.story-glass .note {
  font-size: 13px;
  color: rgb(255 255 255 / 70%);
}
.story-glass.wide {
  width: min(100%, 760px);
  max-width: 760px;
  text-align: left;
}
.models {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.models li {
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 8px;
  align-items: start;
}
.models li > span {
  display: flex;
  flex-direction: column;
}
.ok {
  font-size: 20px;
  color: #7fe0ae;
}
.station {
  width: 100%;
  max-height: 260px;
}
.station .body {
  fill: rgb(255 255 255 / 10%);
  stroke: rgb(255 255 255 / 30%);
  stroke-width: 1.5;
}
.station .door {
  fill: rgb(255 255 255 / 8%);
  stroke: rgb(255 255 255 / 55%);
  stroke-width: 1.5;
}
.station .door.double {
  fill: rgb(232 196 104 / 16%);
  stroke: #e8c468;
}
.station .scooter path {
  fill: none;
  stroke: #b9f0d2;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  font-size: 14px;
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.swatch {
  width: 14px;
  height: 14px;
  border: 1.5px solid rgb(255 255 255 / 55%);
  border-radius: 3px;
  background: rgb(255 255 255 / 8%);
}
.swatch.double {
  border-color: #e8c468;
  background: rgb(232 196 104 / 16%);
}
</style>
