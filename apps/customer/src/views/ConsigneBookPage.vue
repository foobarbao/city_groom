<script setup lang="ts">
/**
 * Consigne booking in four steps: locker, when (now, or a slot booked at
 * least 4 hours ahead), size, summary and simulated payment
 * (docs/PRODUCT.md §4b).
 */
import type { CompartmentSize } from '@city-groom/api-client'
import { computeLockerDrawing, exampleDoorLabel } from '@city-groom/ui'
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  useIonRouter,
} from '@ionic/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import DemoNotice from '../components/DemoNotice.vue'
import LockerPicker from '../components/LockerPicker.vue'
import { consignePrice } from '../domain/pricing'
import { type SlotWindow, currentSlot, pickupDeadline, upcomingWindows } from '../domain/slots'
import { catalogue, lockerLayout, lockers, planByCode, sizes } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { clock, dateTime, dayLabel, euros } from '../utils/format'

const { t } = useI18n()
const router = useIonRouter()
const account = useAccountStore()
const labels = computed(() => ({ today: t('common.today'), tomorrow: t('common.tomorrow') }))

const STEPS = ['locker', 'when', 'size', 'confirm'] as const
const step = ref(0)
const lockerCode = ref<string | null>(null)
/** null = drop off now; otherwise the booked slot. */
const window = ref<SlotWindow | null>(null)
const whenChosen = ref(false)
const size = ref<string | null>(null)

const now = new Date()
const CONSIGNE_SIZES = Object.keys(catalogue.consigne.prices)
const locker = computed(() => lockers.find((l) => l.code === lockerCode.value))
const freeNow = (s: string): number => locker.value?.freeBySize[s] ?? 0
const canDropNow = computed(() => CONSIGNE_SIZES.some((s) => freeNow(s) > 0))

/** Next 7 days of slots, grouped by day, with their booking status. */
const days = computed(() => {
  const all = upcomingWindows(now, catalogue.slots, catalogue.consigne.min_notice_hours)
  const byDay = new Map<string, typeof all>()
  for (const w of all) byDay.set(w.window.day, [...(byDay.get(w.window.day) ?? []), w])
  return [...byDay.entries()].filter(([, ws]) => ws.some((w) => w.status !== 'past'))
})

const plan = computed(() => planByCode(account.state.plan))
const price = computed(() =>
  size.value ? consignePrice(catalogue.consigne.prices, size.value, plan.value) : null,
)
const sizeSpecs = computed(() => sizes.filter((s) => CONSIGNE_SIZES.includes(s.code)))

/** Door shown to the customer. DEMO: an example door of the size; PROD: the reserved one. */
const door = computed(() => {
  const layout = lockerCode.value ? lockerLayout(lockerCode.value) : undefined
  if (!layout || !size.value) return null
  return exampleDoorLabel(computeLockerDrawing(layout, sizes), size.value as CompartmentSize)
})

const canContinue = computed(
  () => [lockerCode.value !== null, whenChosen.value, size.value !== null, true][step.value],
)

function chooseNow(): void {
  window.value = null
  whenChosen.value = true
  step.value = 2
}

function chooseSlot(w: SlotWindow): void {
  window.value = w
  whenChosen.value = true
  step.value = 2
}

function pay(): void {
  if (!lockerCode.value || !size.value || !price.value || !door.value) return
  const current = window.value ?? currentSlot(new Date(), catalogue.slots)
  const id = account.addBooking({
    lockerCode: lockerCode.value,
    size: size.value,
    mode: window.value ? 'slot' : 'now',
    slotCode: window.value?.slot.code ?? null,
    slotStart: window.value ? window.value.start.toISOString() : new Date().toISOString(),
    slotEnd: (current?.end ?? pickupDeadline(new Date(), 1)).toISOString(),
    door: door.value,
    priceCents: price.value.cents,
    droppedAt: null,
  })
  router.replace(`/consigne/${id}`)
}
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/consigne" :text="t('common.back')" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main class="page">
        <ol class="stepper" :aria-label="t('consigne.book')">
          <li
            v-for="(s, i) in STEPS"
            :key="s"
            :class="{ done: i < step, current: i === step }"
            :aria-current="i === step ? 'step' : undefined"
          >
            <button type="button" :disabled="i > step" @click="step = i">
              <span class="num">{{ i + 1 }}</span
              >{{ t(`consigne.steps.${s}`) }}
            </button>
          </li>
        </ol>

        <section v-if="step === 0" class="group">
          <h1 class="page-title">{{ t('consigne.chooseLocker') }}</h1>
          <locker-picker v-model="lockerCode" :exclude="['XL']" />
        </section>

        <section v-else-if="step === 1" class="group">
          <h1 class="page-title">{{ t('consigne.chooseWhen') }}</h1>
          <p class="muted">{{ locker?.name }}</p>
          <button class="soft-card option" type="button" :disabled="!canDropNow" @click="chooseNow">
            <strong>{{ t('consigne.now') }}</strong>
            <span class="muted small">{{
              canDropNow ? t('consigne.nowText') : t('consigne.nowUnavailable')
            }}</span>
          </button>
          <h2 class="section-title">{{ t('consigne.orBook') }}</h2>
          <div v-for="[day, ws] in days" :key="day" class="day">
            <p class="day-label">{{ dayLabel(day, labels) }}</p>
            <div class="slots">
              <button
                v-for="w in ws"
                :key="w.window.slot.code"
                type="button"
                class="slot"
                :class="{ selected: window?.start.getTime() === w.window.start.getTime() }"
                :disabled="w.status !== 'bookable'"
                @click="chooseSlot(w.window)"
              >
                <strong>{{ w.window.slot.label }}</strong>
                <span class="small">
                  {{
                    t('consigne.slotHours', {
                      start: w.window.slot.starts,
                      end: w.window.slot.ends,
                    })
                  }}
                </span>
                <span v-if="w.status === 'too_late'" class="small">{{
                  t('consigne.tooLate')
                }}</span>
              </button>
            </div>
          </div>
        </section>

        <section v-else-if="step === 2" class="group">
          <h1 class="page-title">{{ t('consigne.chooseSize') }}</h1>
          <button
            v-for="spec in sizeSpecs"
            :key="spec.code"
            type="button"
            class="soft-card option size"
            :class="{ selected: size === spec.code }"
            :disabled="!window && freeNow(spec.code) === 0"
            @click="size = spec.code"
          >
            <span class="size-head">
              <strong>{{ t(`locker.sizes.${spec.code}`) }} ({{ spec.code }})</strong>
              <strong>{{
                euros(consignePrice(catalogue.consigne.prices, spec.code, plan)?.cents ?? 0)
              }}</strong>
            </span>
            <span>{{ t(`consigne.examples.${spec.code}`) }}</span>
            <span class="muted small">
              {{
                t('locker.dimensions', {
                  height: spec.height_cm,
                  width: spec.width_cm,
                  depth: spec.depth_cm,
                })
              }}
              · {{ t('consigne.freeCount', freeNow(spec.code)) }}
            </span>
          </button>
          <p class="muted small">{{ t('demo.placeholderPrices') }}</p>
        </section>

        <section v-else class="group">
          <h1 class="page-title">{{ t('consigne.summary') }}</h1>
          <div class="soft-card">
            <p>
              <strong>{{ locker?.name }}</strong> ·
              {{ t(`sites.${locker?.siteCategory ?? 'other'}`) }}
            </p>
            <p>
              {{ t('consigne.when') }} :
              <strong v-if="window">
                {{
                  t('consigne.slot', { slot: window.slot.label, day: dayLabel(window.day, labels) })
                }}
                ({{ clock(window.start) }}–{{ clock(window.end) }})
              </strong>
              <strong v-else>{{ t('consigne.now') }}</strong>
            </p>
            <p>{{ t(`locker.sizes.${size}`) }} · {{ t('consigne.door', { label: door }) }}</p>
            <p v-if="!window">
              {{
                t('consigne.deadlineAt', {
                  date: dateTime(pickupDeadline(now, catalogue.consigne.max_hours), labels),
                })
              }}
            </p>
            <p v-else>{{ t('consigne.deadline') }}</p>
            <p v-if="price" class="price">
              {{ t('consigne.price') }} : <strong>{{ euros(price.cents) }}</strong>
              <span v-if="price.cents !== price.baseCents" class="muted small">
                <s>{{ euros(price.baseCents) }}</s>
                {{ t('consigne.withPlan', { plan: plan.name }) }}
              </span>
            </p>
            <router-link
              v-if="price && price.cents === price.baseCents"
              class="small"
              to="/compte/abonnement"
            >
              {{ t('consigne.planHint') }}
            </router-link>
          </div>
          <ion-button expand="block" shape="round" size="large" @click="pay">
            {{ t('consigne.pay', { price: euros(price?.cents ?? 0) }) }}
          </ion-button>
          <demo-notice />
        </section>

        <ion-button
          v-if="step === 0 || step === 2"
          expand="block"
          shape="round"
          :disabled="!canContinue"
          @click="step++"
        >
          {{ t('common.continue') }}
        </ion-button>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.group p {
  margin: 0;
}
.stepper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.stepper button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  color: var(--cg-ink-soft);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}
.num {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--cg-surface-soft);
}
.current button,
.done button {
  color: var(--cg-pine);
}
.current .num {
  background: var(--cg-leaf);
  color: var(--cg-surface);
}
.done .num {
  background: var(--cg-leaf-soft);
}
.option {
  border: 2px solid transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  gap: 4px;
}
.option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.option.selected {
  border-color: var(--cg-leaf);
  background: var(--cg-leaf-soft);
}
.size-head {
  display: flex;
  justify-content: space-between;
}
.day-label {
  font-weight: 800;
  margin-bottom: 6px !important;
}
.slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.slot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 8px;
  border: 2px solid transparent;
  border-radius: var(--cg-radius-m);
  background: var(--cg-surface);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  font: inherit;
  cursor: pointer;
}
.slot:disabled {
  opacity: 0.45;
  box-shadow: none;
  cursor: not-allowed;
}
.slot.selected {
  border-color: var(--cg-leaf);
  background: var(--cg-leaf-soft);
}
.price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  font-size: 18px;
}
</style>
