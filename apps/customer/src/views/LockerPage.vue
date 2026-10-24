<script setup lang="ts">
/**
 * Locker page: size picker, drawing of the locker front and drop-off steps.
 *
 * The customer picks the size that fits their item; the drawing highlights a
 * door of that size, which gently swings open, and the steps explain how to
 * use it. Until orders exist, the highlighted door is an example (see
 * `exampleDoorLabel`); tapping a door highlights that one instead.
 */
import type { CompartmentSize, LockerLayout, SizeSpec } from '@city-groom/api-client'
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { fetchLocker, fetchSizes } from '../api/lockers'
import SizePicker from '../components/SizePicker.vue'
import { useErrorMessage } from '../composables/useErrorMessage'
import { LockerFront, computeLockerDrawing, exampleDoorLabel } from '@city-groom/ui'

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
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/carte" :text="t('locker.back')" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="error" class="state">
        <p>{{ error }}</p>
        <ion-button shape="round" @click="load">{{ t('errors.retry') }}</ion-button>
      </div>
      <div v-else-if="!locker || !drawing" class="state">
        <ion-spinner name="dots" />
      </div>
      <main v-else class="page">
        <header class="intro">
          <p class="eyebrow">{{ t('locker.eyebrow') }}</p>
          <h1>{{ locker.name }}</h1>
          <p class="methods">{{ t('locker.opensWith', { methods: accessMethods }) }}</p>
        </header>

        <section class="card">
          <h2>{{ t('locker.chooseSize') }}</h2>
          <size-picker v-model="selectedSize" :sizes="sizes" :free-by-size="locker.free_by_size" />
          <p v-if="selectedSpec" class="fits">
            {{ t('locker.fits', { examples: selectedSpec.examples.join(', ') }) }}
            <span class="dims">
              {{
                t('locker.dimensions', {
                  height: selectedSpec.height_cm,
                  width: selectedSpec.width_cm,
                  depth: selectedSpec.depth_cm,
                })
              }}
            </span>
          </p>
        </section>

        <section class="locker-stage">
          <locker-front
            :drawing="drawing"
            :highlighted-label="highlightedLabel"
            :panel-label="t('locker.panel')"
            :aria-label="
              highlightedLabel ? t('locker.previewDoor', { label: highlightedLabel }) : undefined
            "
            @select="onDoorSelected"
          />
          <p v-if="highlightedLabel" class="door-callout">
            {{ t('locker.previewDoor', { label: highlightedLabel }) }}
          </p>
          <p v-else class="door-callout muted">{{ t('locker.noDoorOfSize') }}</p>
        </section>

        <section v-if="highlightedLabel" class="card">
          <h2>{{ t('locker.previewTitle') }}</h2>
          <ol class="steps">
            <li>{{ t('locker.steps.identify', { methods: accessMethods }) }}</li>
            <li>{{ t('locker.steps.open', { label: highlightedLabel }) }}</li>
            <li>{{ t('locker.steps.drop') }}</li>
          </ol>
        </section>

        <p v-if="locker.is_simulated" class="notice">{{ t('app.simulatedNotice') }}</p>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 30vh 24px 0;
  text-align: center;
}
.page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 560px;
  margin: 0 auto;
  padding: 0 18px 32px;
}
.intro {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cg-leaf);
}
h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: var(--cg-ink);
}
.methods {
  margin: 0;
  color: var(--cg-ink-soft);
}
.card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: var(--cg-radius-l);
  background: var(--cg-surface);
  box-shadow: var(--cg-shadow);
}
h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}
.fits {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--cg-ink);
}
.dims {
  font-size: 13px;
  color: var(--cg-ink-soft);
  font-variant-numeric: tabular-nums;
}
.locker-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 22px 18px 18px;
  border-radius: var(--cg-radius-l);
  background: linear-gradient(180deg, var(--cg-leaf-soft), var(--cg-ground));
}
.door-callout {
  margin: 0;
  padding: 8px 16px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-surface);
  box-shadow: var(--cg-shadow);
  font-weight: 800;
  color: var(--cg-pine);
}
.door-callout.muted {
  font-weight: 600;
  color: var(--cg-ink-soft);
}
.steps {
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.steps li {
  counter-increment: step;
  display: grid;
  grid-template-columns: 32px 1fr;
  align-items: center;
  gap: 12px;
}
.steps li::before {
  content: counter(step);
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
  font-weight: 800;
}
.notice {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: var(--cg-ink-soft);
}
</style>
