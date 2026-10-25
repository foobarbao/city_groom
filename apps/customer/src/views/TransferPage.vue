<script setup lang="ts">
/**
 * Transfer of a consigne: choose another locker and the round at which a
 * courier moves the items, within the 24 hours after drop-off; price
 * according to the plan (included transfers, then a reduced supplement).
 * See docs/PRODUCT.md §4b.
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
  IonMenuButton,
} from '@ionic/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import DemoNotice from '../components/DemoNotice.vue'
import LockerPicker from '../components/LockerPicker.vue'
import { transferPrice, transferRounds } from '../domain/transfer'
import { catalogue, lockerLayout, planByCode, sizes } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { clock, dayLabel, euros } from '../utils/format'
import { reveal } from '../utils/scroll'

const props = defineProps<{ id: string }>()
const { t } = useI18n()
const router = useIonRouter()
const account = useAccountStore()
const labels = computed(() => ({ today: t('common.today'), tomorrow: t('common.tomorrow') }))

const booking = computed(() => account.state.bookings.find((b) => b.id === props.id))
const toLocker = ref<string | null>(null)
const roundAt = ref<string | null>(null)

const rounds = computed(() =>
  booking.value
    ? transferRounds(booking.value, new Date(), catalogue.consigne.max_hours, catalogue.round_times)
    : [],
)
const plan = computed(() => planByCode(account.state.plan))
const price = computed(() =>
  transferPrice(catalogue.consigne.transfer_price, plan.value, account.transfersUsedThisMonth),
)
/** Door at the new locker. DEMO: an example door of the size; PROD: the reserved one. */
const door = computed(() => {
  const layout = toLocker.value ? lockerLayout(toLocker.value) : undefined
  if (!layout || !booking.value) return null
  return exampleDoorLabel(
    computeLockerDrawing(layout, sizes),
    booking.value.size as CompartmentSize,
  )
})
const ready = computed(
  () => toLocker.value !== null && roundAt.value !== null && door.value !== null,
)

// After each choice, bring the next part of the form into view.
const roundTitle = ref<HTMLElement | null>(null)
const confirmButton = ref<InstanceType<typeof IonButton> | null>(null)
watch(toLocker, () => reveal(roundTitle.value))
watch(roundAt, () => reveal(confirmButton.value))

function confirm(): void {
  if (!booking.value || !toLocker.value || !roundAt.value || !door.value) return
  account.requestTransfer(booking.value.id, {
    toLocker: toLocker.value,
    roundAt: roundAt.value,
    door: door.value,
    priceCents: price.value.cents,
    included: price.value.included,
  })
  router.back()
}
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button :aria-label="t('nav.menu')" />
          <ion-back-button :default-href="`/consigne/${id}`" :text="t('common.back')" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main v-if="booking" class="page">
        <h1 class="page-title">{{ t('consigne.transfer.title') }}</h1>
        <p class="page-intro">{{ t('consigne.transfer.intro') }}</p>

        <p v-if="!rounds.length" class="soft-card">{{ t('consigne.transfer.none') }}</p>
        <template v-else>
          <h2 class="section-title">{{ t('consigne.transfer.chooseLocker') }}</h2>
          <locker-picker v-model="toLocker" :size="booking.size" />

          <h2 ref="roundTitle" class="section-title">{{ t('consigne.transfer.chooseRound') }}</h2>
          <div class="chips wrap" role="radiogroup">
            <button
              v-for="r in rounds"
              :key="r.toISOString()"
              type="button"
              role="radio"
              class="chip"
              :class="{ active: roundAt === r.toISOString() }"
              :aria-checked="roundAt === r.toISOString()"
              @click="roundAt = r.toISOString()"
            >
              {{ t('consigne.transfer.round', { time: clock(r), day: dayLabel(r, labels) }) }}
            </button>
          </div>

          <section class="soft-card">
            <p class="price">
              <span>{{ t('consigne.transfer.price') }}</span>
              <strong>{{ price.included ? t('common.free') : euros(price.cents) }}</strong>
            </p>
            <p v-if="price.included" class="muted small">
              {{
                t('consigne.transfer.included', {
                  used: account.transfersUsedThisMonth + 1,
                  total: plan.transfers_included,
                })
              }}
            </p>
            <router-link v-else class="small" to="/compte/abonnement">{{
              t('consigne.planHint')
            }}</router-link>
            <p class="muted small">
              {{ t('demo.placeholderPrices') }} · {{ t('consigne.transfer.oneOnly') }}
            </p>
          </section>
          <ion-button
            ref="confirmButton"
            expand="block"
            shape="round"
            size="large"
            :disabled="!ready"
            @click="confirm"
          >
            {{
              t('consigne.transfer.confirm', {
                price: price.included ? t('common.free') : euros(price.cents),
              })
            }}
          </ion-button>
        </template>
        <demo-notice />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.page p {
  margin: 0;
}
.wrap {
  flex-wrap: wrap;
  overflow: visible;
}
.price {
  display: flex;
  justify-content: space-between;
  font-size: 18px;
}
</style>
