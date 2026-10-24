<script setup lang="ts">
/**
 * One consigne booking: locker, slot, deadline, the locker front with the
 * door to open, and the next action (drop off, collect, cancel).
 *
 * DEMO: "open the door" only changes the booking status; PROD: the app
 * opens the door through the locker driver (QR, NFC or Bluetooth).
 */
import { LockerFront, computeLockerDrawing } from '@city-groom/ui'
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
} from '@ionic/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import DemoNotice from '../components/DemoNotice.vue'
import { pickupDeadline } from '../domain/slots'
import { catalogue, lockerLayout, lockers, sizes } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { clock, dateTime, dayLabel, euros } from '../utils/format'

const props = defineProps<{ id: string }>()
const { t } = useI18n()
const account = useAccountStore()
const labels = computed(() => ({ today: t('common.today'), tomorrow: t('common.tomorrow') }))

const booking = computed(() => account.state.bookings.find((b) => b.id === props.id))
const lockerName = (code: string | undefined): string =>
  lockers.find((l) => l.code === code)?.name ?? code ?? ''
const locker = computed(() => lockers.find((l) => l.code === booking.value?.lockerCode))
const transfer = computed(() => booking.value?.transfer ?? null)
/** After the transfer round, the items wait at the new locker, behind another door. */
const moved = computed(
  () => transfer.value !== null && new Date(transfer.value.roundAt) <= new Date(),
)
const shownLocker = computed(() =>
  moved.value ? (transfer.value?.toLocker ?? '') : (booking.value?.lockerCode ?? ''),
)
const shownDoor = computed(() => (moved.value ? transfer.value?.door : booking.value?.door) ?? '')
const drawing = computed(() => {
  const layout = shownLocker.value ? lockerLayout(shownLocker.value) : undefined
  return layout ? computeLockerDrawing(layout, sizes) : null
})
const canTransfer = computed(
  () =>
    booking.value !== undefined &&
    !transfer.value &&
    (booking.value.status === 'booked' || booking.value.status === 'stored'),
)
const slotLabel = computed(
  () => catalogue.slots.find((s) => s.code === booking.value?.slotCode)?.label ?? t('consigne.now'),
)
const deadline = computed(() =>
  booking.value?.droppedAt
    ? pickupDeadline(new Date(booking.value.droppedAt), catalogue.consigne.max_hours)
    : null,
)
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
      <main v-if="booking" class="page">
        <span
          class="pill"
          :class="{ off: booking.status === 'cancelled' || booking.status === 'collected' }"
        >
          {{ t(`consigne.status.${booking.status}`) }}
        </span>
        <h1 class="page-title">{{ locker?.name }}</h1>
        <p class="page-intro">{{ t(`sites.${locker?.siteCategory ?? 'other'}`) }}</p>

        <section class="soft-card">
          <p>
            {{ t('consigne.when') }} :
            <strong>
              {{
                t('consigne.slot', { slot: slotLabel, day: dayLabel(booking.slotStart, labels) })
              }}
              <template v-if="booking.mode === 'slot'">
                ({{ clock(booking.slotStart) }}–{{ clock(booking.slotEnd) }})
              </template>
            </strong>
          </p>
          <p v-if="deadline">
            <strong>{{ t('consigne.deadlineAt', { date: dateTime(deadline, labels) }) }}</strong>
          </p>
          <p v-else>{{ t('consigne.deadline') }}</p>
          <p>{{ t(`locker.sizes.${booking.size}`) }} · {{ euros(booking.priceCents) }}</p>
        </section>

        <section v-if="transfer" class="soft-card transfer">
          <template v-if="moved">
            <strong>{{
              t('consigne.transfer.ready', { locker: lockerName(transfer.toLocker) })
            }}</strong>
          </template>
          <template v-else>
            <strong>{{
              t('consigne.transfer.planned', { locker: lockerName(transfer.toLocker) })
            }}</strong>
            <span class="muted small">
              {{
                t('consigne.transfer.plannedAt', {
                  time: clock(transfer.roundAt),
                  day: dayLabel(transfer.roundAt, labels),
                })
              }}
            </span>
          </template>
          <span class="muted small">
            {{
              t('consigne.transfer.from', {
                time: clock(transfer.roundAt),
                day: dayLabel(transfer.roundAt, labels),
              })
            }}
            · {{ transfer.included ? t('common.free') : euros(transfer.priceCents) }}
          </span>
        </section>

        <section v-if="drawing" class="stage">
          <locker-front
            :drawing="drawing"
            :highlighted-label="shownDoor"
            :panel-label="t('locker.panel')"
            :aria-label="t('consigne.door', { label: shownDoor })"
          />
          <p class="door">
            {{ lockerName(shownLocker) }} · {{ t('consigne.door', { label: shownDoor }) }}
          </p>
          <p class="muted small">{{ t('consigne.doorNote') }}</p>
        </section>

        <div class="actions">
          <ion-button
            v-if="booking.status === 'booked'"
            expand="block"
            shape="round"
            size="large"
            @click="account.markDropped(booking.id)"
          >
            {{ t('consigne.open', { label: booking.door }) }} · {{ t('consigne.dropped') }}
          </ion-button>
          <ion-button
            v-if="booking.status === 'stored'"
            expand="block"
            shape="round"
            size="large"
            @click="account.markCollected(booking.id)"
          >
            {{ t('consigne.open', { label: shownDoor }) }} · {{ t('consigne.collect') }}
          </ion-button>
          <ion-button
            v-if="canTransfer"
            expand="block"
            shape="round"
            fill="outline"
            :router-link="`/consigne/${booking.id}/transfert`"
          >
            {{ t('consigne.transfer.button') }}
          </ion-button>
          <ion-button
            v-if="booking.status === 'booked'"
            expand="block"
            shape="round"
            fill="clear"
            color="medium"
            @click="account.cancelBooking(booking.id)"
          >
            {{ t('consigne.cancel') }}
          </ion-button>
        </div>
        <demo-notice />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.page p {
  margin: 0;
}
.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-radius: var(--cg-radius-l);
  background: linear-gradient(180deg, var(--cg-leaf-soft), var(--cg-ground));
}
.door {
  padding: 8px 16px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  font-weight: 800;
  color: var(--cg-pine);
}
.transfer {
  gap: 4px;
  border: 2px solid var(--cg-leaf-soft);
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
