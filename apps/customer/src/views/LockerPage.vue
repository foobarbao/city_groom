<script setup lang="ts">
/**
 * Locker page: drawing of the locker front, size picker and drop-off steps.
 *
 * The customer picks the size that fits their item; the drawing highlights a
 * door of that size and the steps explain how it opens. Until orders exist,
 * the highlighted door is an example (see `exampleDoorLabel`).
 */
import type { CompartmentSize, LockerLayout, SizeSpec } from '@city-groom/api-client'
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { fetchLocker, fetchSizes } from '../api/lockers'
import LockerFront from '../components/LockerFront.vue'
import { useErrorMessage } from '../composables/useErrorMessage'
import { computeLockerDrawing, exampleDoorLabel } from '../utils/lockerDrawing'

const props = defineProps<{
  /** Locker code, from the route. */
  code: string
}>()

const { t } = useI18n()
const toMessage = useErrorMessage()

const locker = ref<LockerLayout | null>(null)
const sizes = ref<SizeSpec[]>([])
const selectedSize = ref<CompartmentSize>('M')
/** Door tapped by the user, if any; takes precedence over the example door. */
const tappedLabel = ref<string | null>(null)
const error = ref<string | null>(null)

const drawing = computed(() =>
  locker.value && sizes.value.length ? computeLockerDrawing(locker.value, sizes.value) : null,
)
const highlightedLabel = computed(() => {
  if (!drawing.value) return null
  const tapped = drawing.value.doors.find((d) => d.label === tappedLabel.value)
  if (tapped && tapped.size === selectedSize.value) return tapped.label
  return exampleDoorLabel(drawing.value, selectedSize.value)
})
const selectedSpec = computed(() => sizes.value.find((s) => s.code === selectedSize.value))
const accessMethods = computed(() =>
  (locker.value?.access_methods ?? []).map((m) => t(`locker.accessMethods.${m}`)).join(', '),
)

function freeCount(size: string): number {
  return locker.value?.free_by_size[size] ?? 0
}

/** Tapping a door highlights it and selects its size, keeping the picker in sync. */
function onDoorSelected(label: string): void {
  const door = drawing.value?.doors.find((d) => d.label === label)
  if (!door) return
  tappedLabel.value = door.label
  selectedSize.value = door.size
}

async function load(): Promise<void> {
  error.value = null
  try {
    ;[locker.value, sizes.value] = await Promise.all([fetchLocker(props.code), fetchSizes()])
  } catch (e) {
    error.value = toMessage(e)
  }
}

onMounted(load)
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/carte" :text="t('locker.back')" />
        </ion-buttons>
        <ion-title>{{ locker?.name ?? '' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="error" class="state">
        <ion-text color="danger">
          <p>{{ error }}</p>
        </ion-text>
        <ion-button @click="load">{{ t('errors.retry') }}</ion-button>
      </div>
      <div v-else-if="!locker || !drawing" class="state">
        <ion-spinner />
      </div>
      <template v-else>
        <p v-if="locker.is_simulated" class="notice">{{ t('app.simulatedNotice') }}</p>

        <h2 class="question">{{ t('locker.chooseSize') }}</h2>
        <ion-segment v-model="selectedSize" :scrollable="true">
          <ion-segment-button v-for="spec in sizes" :key="spec.code" :value="spec.code">
            <span class="size-name">{{ t(`locker.sizes.${spec.code}`) }}</span>
            <span class="size-free">{{ t('locker.free', freeCount(spec.code)) }}</span>
          </ion-segment-button>
        </ion-segment>

        <p v-if="selectedSpec" class="size-details">
          {{ t('locker.fits', { examples: selectedSpec.examples.join(', ') }) }}
          <br />
          <small>
            {{
              t('locker.dimensions', {
                height: selectedSpec.height_cm,
                width: selectedSpec.width_cm,
                depth: selectedSpec.depth_cm,
              })
            }}
          </small>
        </p>

        <locker-front
          :drawing="drawing"
          :highlighted-label="highlightedLabel"
          @select="onDoorSelected"
        />

        <ion-card>
          <ion-card-content>
            <template v-if="highlightedLabel">
              <h3>{{ t('locker.previewTitle') }}</h3>
              <ol>
                <li>{{ t('locker.steps.identify', { methods: accessMethods }) }}</li>
                <li>{{ t('locker.steps.open', { label: highlightedLabel }) }}</li>
                <li>{{ t('locker.steps.drop') }}</li>
              </ol>
            </template>
            <p v-else>{{ t('locker.noDoorOfSize') }}</p>
          </ion-card-content>
        </ion-card>
      </template>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 30vh;
  text-align: center;
}
.notice {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--ion-color-medium);
}
.question {
  font-size: 1.1rem;
  margin: 8px 0 12px;
}
ion-segment-button {
  min-width: 80px;
}
.size-name {
  font-weight: 600;
}
.size-free {
  font-size: 11px;
}
.size-details {
  margin: 12px 0;
  font-size: 14px;
}
ion-card ol {
  padding-left: 20px;
}
</style>
