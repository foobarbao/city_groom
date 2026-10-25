<script setup lang="ts">
/**
 * Ordering a service from a partner shop, or an accepted quote: quantity,
 * drop-off and pickup lockers, collection by the next round, total and
 * simulated payment. Guests can order (docs/PRODUCT.md §8).
 *
 * Query: `boutique` (shop code) and either `service` (service code) or
 * `devis` (accepted quote id).
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
} from '@ionic/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import DemoNotice from '../components/DemoNotice.vue'
import LockerPicker from '../components/LockerPicker.vue'
import { toCents } from '../domain/pricing'
import { currentSlot } from '../domain/slots'
import {
  catalogue,
  lockerLayout,
  lockers,
  serviceByCode,
  shopByCode,
  sizes,
} from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { clock, euros } from '../utils/format'
import { reveal } from '../utils/scroll'

const { t } = useI18n()
const route = useRoute()
const account = useAccountStore()

const shop = computed(() => shopByCode(String(route.query.boutique ?? '')))
const service = computed(() => serviceByCode(String(route.query.service ?? '')))
const quote = computed(() => account.state.quotes.find((q) => q.id === route.query.devis))

const quantity = ref(1)
const dropLocker = ref<string | null>(null)
const pickupLocker = ref<string | null>(null)
const sameLocker = ref(true)
const doneId = ref<string | null>(null)

const label = computed(() => quote.value?.label ?? service.value?.name ?? '')
const size = computed(() => quote.value?.size ?? service.value?.size ?? 'L')
const unitCents = computed(() =>
  quote.value ? quote.value.priceCents : service.value ? toCents(service.value.price) : 0,
)
const totalCents = computed(() => unitCents.value * (quote.value ? 1 : quantity.value))
const nextRound = computed(() => currentSlot(new Date(), catalogue.slots)?.end ?? null)
const readyDays = computed(() =>
  Math.max(1, Math.round((service.value?.turnaround_rounds ?? 3) / catalogue.round_times.length)),
)
const pickup = computed(() => (sameLocker.value ? dropLocker.value : pickupLocker.value))
const lockerName = (code: string | null): string => lockers.find((l) => l.code === code)?.name ?? ''
const door = computed(() => {
  const layout = dropLocker.value ? lockerLayout(dropLocker.value) : undefined
  return layout
    ? exampleDoorLabel(computeLockerDrawing(layout, sizes), size.value as CompartmentSize)
    : null
})
const ready = computed(() => Boolean(shop.value && label.value && dropLocker.value && pickup.value))

// After choosing a locker, bring the rest of the form into view.
const afterDrop = ref<HTMLElement | null>(null)
const summary = ref<HTMLElement | null>(null)
watch(dropLocker, () => reveal(afterDrop.value))
watch(pickupLocker, () => reveal(summary.value))

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
  })
}
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
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
          <p>{{ t('checkout.doneText', { locker: lockerName(dropLocker), door: door ?? '—' }) }}</p>
          <p v-if="nextRound" class="muted">
            {{ t('checkout.whenText', { time: clock(nextRound) }) }}
          </p>
        </section>
        <ion-button expand="block" shape="round" router-link="/compte/commandes">{{
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

        <label ref="afterDrop" class="same">
          <input v-model="sameLocker" type="checkbox" />
          {{ t('checkout.sameLocker') }}
        </label>
        <template v-if="!sameLocker">
          <h2 class="section-title">{{ t('checkout.pickupLocker') }}</h2>
          <locker-picker v-model="pickupLocker" :size="size" />
        </template>

        <section ref="summary" class="soft-card">
          <p v-if="nextRound">
            <strong>{{ t('checkout.when') }}</strong> ·
            {{ t('checkout.whenText', { time: clock(nextRound) }) }}
          </p>
          <p v-if="!quote">{{ t('checkout.ready', { days: t('shop.days', readyDays) }) }}</p>
          <p class="total">
            <span>{{ t('checkout.total') }}</span
            ><strong>{{ euros(totalCents) }}</strong>
          </p>
        </section>
        <p v-if="!account.state.signedIn" class="muted small">{{ t('checkout.guestNote') }}</p>
        <ion-button expand="block" shape="round" size="large" :disabled="!ready" @click="pay">
          {{ t('checkout.pay', { price: euros(totalCents) }) }}
        </ion-button>
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
  font-weight: 800;
}
.stepper button:disabled {
  opacity: 0.4;
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
</style>
