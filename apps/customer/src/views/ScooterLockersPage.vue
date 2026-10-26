<script setup lang="ts">
/**
 * Scooter lockers, announced as "Bientôt disponible" (docs/PRODUCT.md §4d):
 * explains the concept (2 to 5 places per locker, the scooter rolls in
 * front first, used like the consigne), the size of a place with the
 * reference scooters it fits, and lets a signed-in customer say "Ça
 * m'intéresse" (recorded by the API to measure demand). Work in progress:
 * nothing can be booked yet.
 */
import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/vue'
import { checkmarkCircleOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AppHeader from '../components/AppHeader.vue'
import {
  REFERENCE_SCOOTERS,
  SCOOTER_PLACE,
  SCOOTER_PLACES,
  fitsScooterPlace,
  lockerFrontCm,
} from '../domain/scooterLockers'
import { useAccountStore } from '../stores/account'

const OFFER = 'scooter_lockers'

const { t } = useI18n()
const account = useAccountStore()

/** Places shown on the drawing; the customer can try 2 to 5. */
const places = ref(3)
const placeChoices = Array.from(
  { length: SCOOTER_PLACES.max - SCOOTER_PLACES.min + 1 },
  (_, i) => SCOOTER_PLACES.min + i,
)
const frontMetres = computed(() =>
  (lockerFrontCm(places.value) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 }),
)

// Drawing of the locker front, in centimetres (1 unit = 1 cm).
const WALL = 5
const ROOF = 12
const drawing = computed(() => {
  const width = lockerFrontCm(places.value)
  const height = SCOOTER_PLACE.heightCm + ROOF + WALL
  const doors = Array.from({ length: places.value }, (_, i) => ({
    x: WALL + i * (SCOOTER_PLACE.widthCm + WALL),
    label: `${i + 1}`,
  }))
  return { width, height, doors }
})

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
</script>

<template>
  <ion-page>
    <app-header back-href="/consigne" />
    <ion-content>
      <main class="page">
        <div class="tags">
          <span class="pill warn">{{ t('scooters.soon') }}</span>
          <span class="pill info">{{ t('scooters.wip') }}</span>
        </div>
        <h1 class="page-title">{{ t('scooters.title') }}</h1>
        <p class="page-intro">{{ t('scooters.intro') }}</p>

        <section class="soft-card">
          <h2 class="section-title">{{ t('scooters.concept.title') }}</h2>
          <ul class="points">
            <li>{{ t('scooters.concept.places', SCOOTER_PLACES) }}</li>
            <li>{{ t('scooters.concept.slim') }}</li>
            <li>{{ t('scooters.concept.consigne') }}</li>
          </ul>
        </section>

        <section class="soft-card">
          <h2 class="section-title">{{ t('scooters.front.title') }}</h2>
          <div class="chips wrap" role="group" :aria-label="t('scooters.front.places')">
            <button
              v-for="n in placeChoices"
              :key="n"
              type="button"
              class="chip"
              :class="{ active: n === places }"
              :aria-pressed="n === places"
              @click="places = n"
            >
              {{ t('scooters.front.placesCount', { n }) }}
            </button>
          </div>
          <svg
            class="front"
            :viewBox="`0 0 ${drawing.width} ${drawing.height}`"
            role="img"
            :aria-label="t('scooters.front.alt', { n: places, width: frontMetres })"
          >
            <rect class="body" x="0" y="0" :width="drawing.width" :height="drawing.height" rx="6" />
            <g v-for="d in drawing.doors" :key="d.label">
              <rect
                class="door"
                :x="d.x"
                :y="ROOF"
                :width="SCOOTER_PLACE.widthCm"
                :height="SCOOTER_PLACE.heightCm"
                rx="3"
              />
              <text class="label" :x="d.x + SCOOTER_PLACE.widthCm / 2" :y="ROOF + 28">
                {{ d.label }}
              </text>
            </g>
          </svg>
          <p class="muted small">
            {{
              t('scooters.front.size', {
                width: frontMetres,
                depth: SCOOTER_PLACE.lengthCm,
                height: SCOOTER_PLACE.heightCm + ROOF + WALL,
              })
            }}
          </p>
        </section>

        <section class="soft-card">
          <h2 class="section-title">{{ t('scooters.fit.title') }}</h2>
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
                <span class="muted small">
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
          <p class="muted small">{{ t('scooters.fit.note') }}</p>
        </section>

        <section class="soft-card interest">
          <h2 class="section-title">{{ t('scooters.interest.title') }}</h2>
          <p>{{ t('scooters.interest.text') }}</p>
          <template v-if="account.state.signedIn">
            <ion-button
              expand="block"
              shape="round"
              :fill="interested ? 'outline' : 'solid'"
              :disabled="busy"
              @click="toggleInterest"
            >
              {{ interested ? t('scooters.interest.withdraw') : t('scooters.interest.cta') }}
            </ion-button>
            <p v-if="interested" class="muted small">{{ t('scooters.interest.recorded') }}</p>
          </template>
          <template v-else>
            <p class="muted small">{{ t('scooters.interest.signInHint') }}</p>
            <ion-button expand="block" shape="round" router-link="/compte">
              {{ t('scooters.interest.signIn') }}
            </ion-button>
          </template>
          <p v-if="status" class="small" role="status">{{ status }}</p>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.tags {
  display: flex;
  gap: 8px;
  padding-top: 12px;
}
.points {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding-left: 20px;
}
/* Four short chips: wrap rather than scroll, so "5 places" stays visible. */
.chips.wrap {
  flex-wrap: wrap;
}
.front {
  width: 100%;
  max-height: 220px;
  margin-top: 8px;
}
.front .body {
  fill: var(--cg-locker-body);
}
.front .door {
  fill: var(--cg-locker-door);
  stroke: var(--cg-locker-door-edge);
  stroke-width: 1.5;
}
.front .label {
  fill: var(--cg-ink-soft);
  font-size: 18px;
  font-weight: 700;
  text-anchor: middle;
}
.models {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 8px 0;
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
  color: var(--cg-leaf);
}
.interest {
  gap: 10px;
}
</style>
