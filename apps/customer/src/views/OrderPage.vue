<script setup lang="ts">
/**
 * One service order: summary, then the drop-off at the locker, guided in two
 * steps as for the consigne (BookingPage):
 * 1. the customer, at the drop locker, opens a compartment of the reserved
 *    size: the door is given then (shown open on the locker drawing);
 * 2. the customer puts the item in, closes the door and confirms with
 *    "J'ai déposé mon article".
 *
 * "Déposer" in the order list opens this screen with `?ouvrir=1`: the door is
 * already open, as requested by the project owner (2026-10-25). Opened
 * without it, the screen shows "Ouvrir la porte" first.
 *
 * DEMO: opening only changes what is shown; PROD: the door opens through the
 * locker driver when the phone is at the locker (QR, NFC or Bluetooth), and
 * the closing is reported by the locker (`door_closed` event).
 */
import { LockerFront, computeLockerDrawing } from '@city-groom/ui'
import { IonButton, IonContent, IonPage } from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import AppHeader from '../components/AppHeader.vue'
import DemoNotice from '../components/DemoNotice.vue'
import { currentSlot } from '../domain/slots'
import {
  assignDoorLabel,
  catalogue,
  lockerLayout,
  lockers,
  providerName,
  sizes,
} from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { reveal } from '../utils/scroll'
import { clock, dateTime, dayLabel, euros } from '../utils/format'
import { statusTone } from '../utils/tones'

const props = defineProps<{ id: string }>()
const { t } = useI18n()
const route = useRoute()
const account = useAccountStore()
const labels = computed(() => ({ today: t('common.today'), tomorrow: t('common.tomorrow') }))
/** Same labels in lower case, for dates inside a sentence ("retrait demain…"). */
const inSentence = computed(() => ({
  today: t('common.today').toLocaleLowerCase('fr'),
  tomorrow: t('common.tomorrow').toLocaleLowerCase('fr'),
}))

const order = computed(() => account.state.orders.find((o) => o.id === props.id))
const shopName = computed(() => providerName(order.value?.shopCode ?? ''))
const lockerName = (code: string | undefined): string =>
  lockers.find((l) => l.code === code)?.name ?? code ?? ''

const drawing = computed(() => {
  const layout = order.value ? lockerLayout(order.value.dropLocker) : undefined
  return layout ? computeLockerDrawing(layout, sizes) : null
})
/** Door given on arrival at the drop locker ('' until then: a size is reserved). */
const door = computed(() => order.value?.door ?? '')
const nextRound = computed(() => currentSlot(new Date(), catalogue.slots)?.end ?? null)

/** Door open in the guided flow. */
const doorOpen = ref(false)
/** Drop-off just confirmed on this screen. */
const done = ref(false)
const panel = ref<HTMLElement | null>(null)

function openDoor(): void {
  const o = order.value
  // The door is given on arrival, when the customer opens the locker.
  if (o && !o.door) account.assignOrderDoor(o.id, assignDoorLabel(o.dropLocker, o.size))
  doorOpen.value = true
  void reveal(panel.value)
}

function confirmDropped(): void {
  if (!order.value) return
  account.markOrderDropped(order.value.id)
  doorOpen.value = false
  done.value = true
}

onMounted(() => {
  if (route.query.ouvrir === '1' && order.value?.status === 'awaiting_drop_off') openDoor()
})
</script>

<template>
  <ion-page>
    <app-header back-href="/compte/commandes" />
    <ion-content>
      <main v-if="order" class="page">
        <span class="pill" :class="statusTone(order.status)">
          {{ t(`orders.status.${order.status}`) }}
        </span>
        <h1 class="page-title">
          {{ order.packId ? order.label : `${order.quantity} × ${order.label}` }}
        </h1>
        <p class="page-intro">{{ shopName }} · {{ euros(order.priceCents) }}</p>

        <section class="soft-card summary">
          <p>
            {{ t('orders.detail.dropLocker') }} :
            <strong>{{ lockerName(order.dropLocker) }}</strong>
            ·
            {{
              door
                ? t('orders.detail.door', { label: door })
                : t('orders.detail.sizeReserved', { size: t(`locker.sizes.${order.size}`) })
            }}
          </p>
          <p>
            {{ t('orders.detail.pickupLocker') }} :
            <strong>{{ lockerName(order.pickupLocker) }}</strong>
            <template v-if="order.pickupStart && order.pickupEnd">
              ·
              {{
                t('orders.detail.pickupSlot', {
                  day: dayLabel(order.pickupStart, inSentence),
                  from: clock(order.pickupStart),
                  to: clock(order.pickupEnd),
                })
              }}
            </template>
          </p>
          <p class="muted small">
            {{ t(`locker.sizes.${order.size}`) }} ·
            {{ t('orders.detail.orderedAt', { date: dateTime(order.createdAt, inSentence) }) }}
          </p>
          <p v-if="order.droppedAt" class="muted small">
            {{ t('orders.detail.droppedAt', { date: dateTime(order.droppedAt, labels) }) }}
          </p>
        </section>

        <!-- Next action, right under the summary so it is never hidden. -->
        <section ref="panel" class="actions">
          <div v-if="done" class="result" role="status">
            <strong>✓ {{ t('orders.detail.doneTitle') }}</strong>
            <span v-if="nextRound">
              {{ t('orders.detail.doneText', { time: clock(nextRound), shop: shopName }) }}
            </span>
            <ion-button shape="round" router-link="/compte/commandes">
              {{ t('account.orders') }}
            </ion-button>
          </div>

          <div v-else-if="doorOpen" class="door-open" role="status">
            <strong>{{ t('orders.detail.opened', { label: door }) }}</strong>
            <span>{{ t('orders.detail.instruction') }}</span>
            <ion-button expand="block" shape="round" size="large" @click="confirmDropped">
              {{ t('orders.dropNow') }}
            </ion-button>
          </div>

          <ion-button
            v-else-if="order.status === 'awaiting_drop_off'"
            expand="block"
            shape="round"
            size="large"
            @click="openDoor"
          >
            {{
              door
                ? t('orders.detail.open', { label: door })
                : t('orders.detail.openNew', { size: t(`locker.sizes.${order.size}`) })
            }}
          </ion-button>
        </section>

        <section v-if="drawing && order.status === 'awaiting_drop_off'" class="stage">
          <locker-front
            :drawing="drawing"
            :highlighted-label="doorOpen ? door : null"
            :panel-label="t('locker.panel')"
            :aria-label="lockerName(order.dropLocker)"
          />
          <p class="door">
            {{ lockerName(order.dropLocker) }} ·
            {{
              door
                ? t('orders.detail.door', { label: door })
                : t('orders.detail.sizeReserved', { size: t(`locker.sizes.${order.size}`) })
            }}
          </p>
          <p class="muted small">{{ t('orders.detail.doorNote') }}</p>
        </section>
        <demo-notice />
      </main>
      <main v-else class="page">
        <p class="muted">{{ t('orders.detail.notFound') }}</p>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.page p {
  margin: 0;
}
.summary {
  gap: 6px;
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
  padding: 16px;
  border-radius: var(--cg-radius-l);
  box-shadow: var(--cg-shadow);
}
/* Door open: lemon tint, the action is in progress. */
.door-open {
  background: var(--cg-sun-soft);
  color: var(--cg-ink);
}
.door-open strong,
.result strong {
  font-size: 18px;
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
  background: var(--cg-glass);
  box-shadow: var(--cg-shadow);
}
.door {
  font-weight: 600;
  color: var(--cg-pine);
}
</style>
