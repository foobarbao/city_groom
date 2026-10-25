<script setup lang="ts">
/**
 * Ordering a service from a partner shop, or an accepted quote: quantity,
 * drop-off and pickup lockers, collection by the next round, total and
 * simulated payment. Guests can order (docs/PRODUCT.md §8).
 *
 * Query: `boutique` (shop code) and either `offre` (offer id), `service`
 * (service code: the shop's offer for it) or `devis` (accepted quote id).
 */
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonMenuButton,
} from '@ionic/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import DemoNotice from '../components/DemoNotice.vue'
import LockerPicker from '../components/LockerPicker.vue'
import { toCents } from '../domain/pricing'
import { type SlotWindow, addRounds, currentSlot, slotsFrom } from '../domain/slots'
import { catalogue, lockers, serviceByCode, shopByCode, shopOffers } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { clock, dayLabel, euros } from '../utils/format'
import { reveal } from '../utils/scroll'

const { t } = useI18n()
const route = useRoute()
const account = useAccountStore()

const shop = computed(() => shopByCode(String(route.query.boutique ?? '')))
/** The shop's offer: by id, or the first visible one for the requested service type. */
const offer = computed(() => {
  const offers = shop.value ? shopOffers(shop.value.code) : []
  return (
    offers.find((o) => o.id === route.query.offre) ??
    offers.find((o) => o.service === route.query.service)
  )
})
const service = computed(() =>
  serviceByCode(offer.value?.service ?? String(route.query.service ?? '')),
)
const quote = computed(() => account.state.quotes.find((q) => q.id === route.query.devis))

const quantity = ref(1)
const dropLocker = ref<string | null>(null)
const pickupLocker = ref<string | null>(null)
/** Where to collect: chosen explicitly by the customer, no default. */
const pickupChoice = ref<'same' | 'other' | null>(null)
/** Chosen pickup slot (index in `pickupOptions`). */
const pickupIndex = ref<number | null>(null)
const doneId = ref<string | null>(null)

const label = computed(() => quote.value?.label ?? offer.value?.title ?? service.value?.name ?? '')
const size = computed(() => quote.value?.size ?? offer.value?.size ?? service.value?.size ?? 'L')
const unitCents = computed(() =>
  quote.value
    ? quote.value.priceCents
    : (offer.value?.priceCents ?? (service.value ? toCents(service.value.price) : 0)),
)
const totalCents = computed(() => unitCents.value * (quote.value ? 1 : quantity.value))
const nextRound = computed(() => currentSlot(new Date(), catalogue.slots)?.end ?? null)
const pickup = computed(() =>
  pickupChoice.value === 'same'
    ? dropLocker.value
    : pickupChoice.value === 'other'
      ? pickupLocker.value
      : null,
)
const turnaround = computed(
  () => offer.value?.turnaroundRounds ?? service.value?.turnaround_rounds ?? 3,
)
/** Round at which the item comes back to the pickup locker. */
const readyAt = computed(() =>
  nextRound.value ? addRounds(nextRound.value, turnaround.value, catalogue.round_times) : null,
)
/**
 * Pickup slots offered: from the return round, over two days. The customer
 * collects before the end of the chosen slot (the next round), which frees
 * the compartment for the next rotation (three a day).
 */
const pickupOptions = computed<SlotWindow[]>(() =>
  readyAt.value ? slotsFrom(readyAt.value, catalogue.slots, 6) : [],
)
const pickupSlot = computed(() =>
  pickupIndex.value === null ? null : (pickupOptions.value[pickupIndex.value] ?? null),
)
const labels = computed(() => ({ today: t('common.today'), tomorrow: t('common.tomorrow') }))
/** Same labels in lower case, for dates inside a sentence ("retrait demain…"). */
const inSentence = computed(() => ({
  today: t('common.today').toLocaleLowerCase('fr'),
  tomorrow: t('common.tomorrow').toLocaleLowerCase('fr'),
}))
const lockerName = (code: string | null): string => lockers.find((l) => l.code === code)?.name ?? ''
const ready = computed(() =>
  Boolean(shop.value && label.value && dropLocker.value && pickup.value && pickupSlot.value),
)
/** Choices still missing, listed under the disabled pay button. */
const missing = computed(() =>
  [
    dropLocker.value ? null : t('checkout.missingDrop'),
    pickup.value ? null : t('checkout.missingPickup'),
    pickupSlot.value ? null : t('checkout.missingSlot'),
  ].filter((m): m is string => m !== null),
)

// After choosing a locker, bring the rest of the form into view.
const afterDrop = ref<HTMLElement | null>(null)
const summary = ref<HTMLElement | null>(null)
watch(dropLocker, () => reveal(afterDrop.value))
watch(pickupIndex, () => reveal(summary.value))

function pay(): void {
  if (!shop.value || !dropLocker.value || !pickup.value) return
  doneId.value = account.addOrder({
    shopCode: shop.value.code,
    label: label.value,
    quantity: quote.value ? 1 : quantity.value,
    priceCents: totalCents.value,
    size: size.value,
    dropLocker: dropLocker.value,
    pickupLocker: pickup.value,
    readyAt: readyAt.value?.toISOString(),
    pickupStart: pickupSlot.value?.start.toISOString(),
    pickupEnd: pickupSlot.value?.end.toISOString(),
  })
}
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button :aria-label="t('nav.menu')" />
          <ion-back-button
            :default-href="shop ? `/boutiques/${shop.code}` : '/boutiques'"
            :text="t('common.back')"
          />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main v-if="doneId" class="page">
        <h1 class="page-title">✓ {{ t('checkout.done') }}</h1>
        <section class="soft-card">
          <p>
            {{
              t('checkout.doneText', {
                locker: lockerName(dropLocker),
                size: t(`locker.sizes.${size}`),
              })
            }}
          </p>
          <p v-if="pickupSlot && pickup">
            {{
              t('checkout.donePickup', {
                locker: lockerName(pickup),
                day: dayLabel(pickupSlot.start, inSentence),
                from: clock(pickupSlot.start),
                to: clock(pickupSlot.end),
              })
            }}
          </p>
          <p v-if="nextRound" class="muted">
            {{ t('checkout.whenText', { time: clock(nextRound) }) }}
          </p>
        </section>
        <ion-button
          expand="block"
          shape="round"
          :router-link="`/compte/commandes/${doneId}?ouvrir=1`"
        >
          {{ t('orders.drop') }}
        </ion-button>
        <ion-button expand="block" shape="round" fill="outline" router-link="/compte/commandes">{{
          t('account.orders')
        }}</ion-button>
        <demo-notice />
      </main>
      <main v-else-if="shop && label" class="page">
        <p class="muted">{{ shop.name }}</p>
        <h1 class="page-title">{{ label }}</h1>
        <section v-if="!quote" class="soft-card quantity">
          <span>{{ t('checkout.quantity') }}</span>
          <span class="stepper">
            <button type="button" :disabled="quantity <= 1" aria-label="−" @click="quantity--">
              −
            </button>
            <strong>{{ quantity }}</strong>
            <button type="button" :disabled="quantity >= 20" aria-label="+" @click="quantity++">
              +
            </button>
          </span>
        </section>

        <h2 class="section-title">{{ t('checkout.dropLocker') }}</h2>
        <locker-picker v-model="dropLocker" :size="size" />

        <section ref="afterDrop" class="pickup">
          <h2 class="section-title">{{ t('checkout.pickupTitle') }}</h2>
          <div class="choices" role="radiogroup" :aria-label="t('checkout.pickupLocker')">
            <button
              type="button"
              class="choice"
              role="radio"
              :aria-checked="pickupChoice === 'same'"
              :class="{ active: pickupChoice === 'same' }"
              :disabled="!dropLocker"
              @click="pickupChoice = 'same'"
            >
              <strong>{{ t('checkout.sameLocker') }}</strong>
              <span class="muted small">{{ lockerName(dropLocker) || '—' }}</span>
            </button>
            <button
              type="button"
              class="choice"
              role="radio"
              :aria-checked="pickupChoice === 'other'"
              :class="{ active: pickupChoice === 'other' }"
              @click="pickupChoice = 'other'"
            >
              <strong>{{ t('checkout.otherLocker') }}</strong>
              <span class="muted small">{{
                pickupChoice === 'other' && pickupLocker
                  ? lockerName(pickupLocker)
                  : t('checkout.otherLockerHint')
              }}</span>
            </button>
          </div>
          <locker-picker
            v-if="pickupChoice === 'other'"
            v-model="pickupLocker"
            :size="size"
            :exclude-lockers="dropLocker ? [dropLocker] : []"
          />

          <h3 class="sub-title">{{ t('checkout.pickupSlot') }}</h3>
          <p class="muted small">{{ t('checkout.pickupSlotHint') }}</p>
          <div class="chips wrap" role="radiogroup" :aria-label="t('checkout.pickupSlot')">
            <button
              v-for="(w, i) in pickupOptions"
              :key="w.start.toISOString()"
              type="button"
              class="chip"
              role="radio"
              :aria-checked="pickupIndex === i"
              :class="{ active: pickupIndex === i }"
              @click="pickupIndex = i"
            >
              {{ dayLabel(w.start, labels) }} · {{ w.slot.label }} ({{ clock(w.start) }}–{{
                clock(w.end)
              }})
            </button>
          </div>
        </section>

        <section ref="summary" class="soft-card">
          <p v-if="nextRound">
            <strong>{{ t('checkout.when') }}</strong> ·
            {{ t('checkout.whenText', { time: clock(nextRound) }) }}
          </p>
          <p v-if="pickupSlot && pickup">
            <strong>{{ t('checkout.pickupSummary') }}</strong> ·
            {{
              t('checkout.pickupSummaryText', {
                locker: lockerName(pickup),
                day: dayLabel(pickupSlot.start, inSentence),
                from: clock(pickupSlot.start),
                to: clock(pickupSlot.end),
              })
            }}
          </p>
          <p class="total">
            <span>{{ t('checkout.total') }}</span
            ><strong>{{ euros(totalCents) }}</strong>
          </p>
        </section>
        <p v-if="!account.state.signedIn" class="muted small">{{ t('checkout.guestNote') }}</p>
        <ion-button expand="block" shape="round" size="large" :disabled="!ready" @click="pay">
          {{ t('checkout.pay', { price: euros(totalCents) }) }}
        </ion-button>
        <p v-if="!ready && missing.length" class="missing" role="status">
          {{ t('checkout.missing', { items: missing.join(', ') }) }}
        </p>
        <demo-notice />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.page p {
  margin: 0;
}
.quantity {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 14px;
}
.stepper button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
  font-size: 22px;
  font-weight: 600;
}
.stepper button:disabled {
  opacity: 0.4;
}
.pickup {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.choice {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border: 2px solid transparent;
  border-radius: var(--cg-radius-m);
  background: var(--cg-glass);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.choice.active {
  border-color: var(--cg-leaf);
  background: var(--cg-leaf-soft);
}
.choice:disabled {
  opacity: 0.5;
  cursor: default;
}
.sub-title {
  margin: 6px 0 0;
  font-size: 16px;
  font-weight: 600;
}
.chips.wrap {
  flex-wrap: wrap;
  overflow: visible;
}
.same {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}
.same input {
  width: 20px;
  height: 20px;
  accent-color: var(--cg-leaf);
}
.total {
  display: flex;
  justify-content: space-between;
  font-size: 20px;
}
.missing {
  margin: -4px 0 0;
  font-size: 14px;
  text-align: center;
  color: var(--cg-ink-soft);
}
</style>
