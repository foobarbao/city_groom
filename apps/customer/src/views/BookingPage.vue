<script setup lang="ts">
/**
 * One consigne booking: locker, slot, deadline, the next action right below
 * the summary, then the locker front with the door to open.
 *
 * Drop-off and collection are guided in two steps, as at the locker:
 * 1. "Open door B9": the door opens;
 * 2. "Put your things in (or take them out), then close the door", confirmed
 *    with "Done" — followed by a clear confirmation of the result.
 *
 * DEMO: opening only changes the booking status; PROD: the app opens the door
 * through the locker driver (QR, NFC or Bluetooth) and the closing is
 * reported by the locker (`door_closed` event).
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import DemoNotice from '../components/DemoNotice.vue'
import { collectBy, pickupDeadline } from '../domain/slots'
import { catalogue, lockerLayout, lockers, sizes } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { clock, dateTime, dayLabel, euros } from '../utils/format'
import { reveal } from '../utils/scroll'

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
/** Collection deadline once dropped: end of the pickup slot, at most 24 h after drop-off. */
const deadline = computed(() => {
  const b = booking.value
  if (!b?.droppedAt) return null
  const dropped = new Date(b.droppedAt)
  return b.pickupEnd
    ? collectBy(dropped, new Date(b.pickupEnd), catalogue.consigne.max_hours)
    : pickupDeadline(dropped, catalogue.consigne.max_hours)
})
const pickupSlot = computed(() => {
  const b = booking.value
  if (!b?.pickupStart || !b.pickupEnd) return null
  const start = new Date(b.pickupStart)
  const label = catalogue.slots.find((s) => s.starts === clock(start))?.label ?? ''
  return { label, start, end: new Date(b.pickupEnd) }
})

/** Door currently open in the guided flow, if any. */
const doorOpen = ref<'drop' | 'collect' | null>(null)
/** Result just confirmed, shown until the customer leaves the screen. */
const done = ref<'stored' | 'collected' | null>(null)
const panel = ref<HTMLElement | null>(null)

function openDoor(kind: 'drop' | 'collect'): void {
  doorOpen.value = kind
  void reveal(panel.value)
}

function confirmClosed(): void {
  if (!booking.value) return
  if (doorOpen.value === 'drop') {
    account.markDropped(booking.value.id)
    done.value = 'stored'
  } else if (doorOpen.value === 'collect') {
    account.markCollected(booking.value.id)
    done.value = 'collected'
  }
  doorOpen.value = null
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
          <p v-if="pickupSlot">
            {{ t('consigne.pickup') }} :
            <strong>
              {{
                t('consigne.slot', {
                  slot: pickupSlot.label,
                  day: dayLabel(pickupSlot.start, labels),
                })
              }}
              ({{ clock(pickupSlot.start) }}–{{ clock(pickupSlot.end) }})
            </strong>
          </p>
          <p v-if="deadline">
            <strong>{{ t('consigne.deadlineAt', { date: dateTime(deadline, labels) }) }}</strong>
          </p>
          <p v-else>{{ pickupSlot ? t('consigne.deadlineSlot') : t('consigne.deadline') }}</p>
          <p>{{ t(`locker.sizes.${booking.size}`) }} · {{ euros(booking.priceCents) }}</p>
        </section>

        <section v-if="transfer" class="soft-card transfer">
          <strong v-if="moved">
            {{ t('consigne.transfer.ready', { locker: lockerName(transfer.toLocker) }) }}
          </strong>
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

        <!-- Next action, right under the summary so it is never hidden. -->
        <section ref="panel" class="actions">
          <div v-if="done" class="result" role="status">
            <strong
              >✓
              {{
                done === 'stored'
                  ? t('consigne.flow.storedTitle')
                  : t('consigne.flow.collectedTitle')
              }}</strong
            >
            <span v-if="done === 'stored' && deadline">
              {{ t('consigne.deadlineAt', { date: dateTime(deadline, labels) }) }}
            </span>
            <span v-else-if="done === 'collected'">{{ t('consigne.flow.collectedText') }}</span>
            <ion-button shape="round" :router-link="done === 'stored' ? '/consigne' : '/accueil'">
              {{
                done === 'stored' ? t('consigne.flow.backToBookings') : t('consigne.flow.backHome')
              }}
            </ion-button>
          </div>

          <div v-else-if="doorOpen" class="door-open" role="status">
            <strong>{{ t('consigne.flow.opened', { label: shownDoor }) }}</strong>
            <span>
              {{
                doorOpen === 'drop'
                  ? t('consigne.flow.dropInstruction')
                  : t('consigne.flow.collectInstruction')
              }}
            </span>
            <ion-button expand="block" shape="round" size="large" @click="confirmClosed">
              {{ t('consigne.flow.closed') }}
            </ion-button>
          </div>

          <template v-else>
            <ion-button
              v-if="booking.status === 'booked'"
              expand="block"
              shape="round"
              size="large"
              @click="openDoor('drop')"
            >
              {{ t('consigne.open', { label: shownDoor }) }}
            </ion-button>
            <ion-button
              v-if="booking.status === 'stored'"
              expand="block"
              shape="round"
              size="large"
              @click="openDoor('collect')"
            >
              {{ t('consigne.open', { label: shownDoor }) }}
            </ion-button>
          </template>

          <ion-button
            v-if="canTransfer && !doorOpen"
            expand="block"
            shape="round"
            fill="outline"
            :router-link="`/consigne/${booking.id}/transfert`"
          >
            {{ t('consigne.transfer.button') }}
          </ion-button>
          <ion-button
            v-if="booking.status === 'booked' && !doorOpen"
            expand="block"
            shape="round"
            fill="clear"
            color="medium"
            @click="account.cancelBooking(booking.id)"
          >
            {{ t('consigne.cancel') }}
          </ion-button>
        </section>

        <section v-if="drawing && booking.status !== 'collected'" class="stage">
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
        <demo-notice />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.page p {
  margin: 0;
}
.transfer {
  gap: 4px;
  border: 2px solid var(--cg-leaf-soft);
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.door-open,
.result {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: var(--cg-radius-l);
  box-shadow: var(--cg-shadow);
}
/* Door open: warm lemon, the action is in progress. */
.door-open {
  background: var(--cg-sun-soft);
  color: var(--cg-ink);
}
.door-open strong,
.result strong {
  font-size: 19px;
}
/* Done: green confirmation. */
.result {
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
}
.result ion-button {
  align-self: flex-start;
}
.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-radius: var(--cg-radius-l);
  background: linear-gradient(180deg, var(--cg-leaf-soft), transparent);
}
.door {
  padding: 8px 16px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-glass-strong);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  font-weight: 800;
  color: var(--cg-pine);
}
</style>
