<script setup lang="ts">
/**
 * Weekly pack (docs/PRODUCT.md "Weekly pack"): what it includes, its price
 * for this customer (welcome offer, then by plan), the running pack with its
 * four weeks, and the purchase form: weekly drop-off day and slot, lockers,
 * preview of the four weeks with the computed return, payment (simulated).
 *
 * The internal rationale (traffic builder, volumes announced to partner
 * laundries, dispatch) is commercial and never shown to customers.
 */
import { computeLockerDrawing, exampleDoorLabel } from '@city-groom/ui'
import { IonButton, IonContent, IonPage } from '@ionic/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { CompartmentSize } from '@city-groom/api-client'
import type { DemoPack, Slot } from '@city-groom/demo-data'

import AppHeader from '../components/AppHeader.vue'
import DemoNotice from '../components/DemoNotice.vue'
import LockerPicker from '../components/LockerPicker.vue'
import { type PackWeek, packPrice, packSchedule } from '../domain/pack'
import { type SlotWindow, slotsFrom } from '../domain/slots'
import {
  PACK_PROVIDER,
  catalogue,
  lockerLayout,
  lockers,
  planByCode,
  serviceByCode,
  sizes,
} from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { clock, dateTime, dayLabel, euros } from '../utils/format'
import { reveal } from '../utils/scroll'

const { t } = useI18n()
const account = useAccountStore()
const labels = computed(() => ({ today: t('common.today'), tomorrow: t('common.tomorrow') }))
/** Same labels in lower case, for dates inside a sentence. */
const inSentence = computed(() => ({
  today: t('common.today').toLocaleLowerCase('fr'),
  tomorrow: t('common.tomorrow').toLocaleLowerCase('fr'),
}))

const pack = catalogue.packs[0] as DemoPack
const itemsLine = pack.items
  .map((i) => `${i.quantity} × ${serviceByCode(i.service)?.name ?? i.service}`)
  .join(' + ')
const planPrice = (code: string): string =>
  euros(Math.round(Number(pack.weekly_prices[code]) * 100))

const price = computed(() => packPrice(pack, account.state.plan, account.hasBoughtPack(pack.code)))
const plan = computed(() => planByCode(account.state.plan))
const lockerName = (code: string): string => lockers.find((l) => l.code === code)?.name ?? code

/** The latest purchase still running (its last week not yet back). */
const running = computed(() => {
  const latest = (account.state.packs ?? [])[0]
  if (!latest) return null
  const weeks = latest.orderIds
    .map((id) => account.state.orders.find((o) => o.id === id))
    .filter((o) => o !== undefined)
  const last = weeks[weeks.length - 1]
  return last?.returnAt && new Date(last.returnAt) > new Date() ? { latest, weeks } : null
})
/** Buying again is offered during the last week of a running pack. */
const canRebuy = computed(() => {
  const last = running.value?.weeks.at(-1)
  return !running.value || (last?.dropFrom !== undefined && new Date(last.dropFrom) <= new Date())
})
const showForm = ref(false)

// --- Purchase form ------------------------------------------------------------

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]
/** Short French weekday names, from a known Monday (2026-10-26). */
const weekdayName = (day: number): string =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2026, 9, 25 + day, 12)),
  )
/** Weekday and date of a slot, e.g. "dim. 1 nov.", for the pickup choices. */
const weekdayOf = (at: Date): string =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Paris',
  }).format(at)
const weekday = ref<number>(5)
const slotCode = ref<Slot['code']>('evening')
const slot = computed(
  () => catalogue.slots.find((s) => s.code === slotCode.value) ?? (catalogue.slots[0] as Slot),
)
const dropLocker = ref<string | null>(null)
/** Where to collect each week: chosen explicitly, no default. */
const pickupChoice = ref<'same' | 'other' | null>(null)
const pickupLocker = ref<string | null>(null)
const pickup = computed(() =>
  pickupChoice.value === 'same'
    ? dropLocker.value
    : pickupChoice.value === 'other'
      ? pickupLocker.value
      : null,
)
/** Rank of the pickup slot after each week's return (0 = the first one). */
const pickupRank = ref<number | null>(null)

const weeks = computed<PackWeek[]>(() =>
  packSchedule(pack, weekday.value, slot.value, catalogue.round_times, new Date()),
)
/** Pickup slots offered, from week 1's return; the same rank applies every week. */
const pickupOptions = computed<SlotWindow[]>(() => {
  const first = weeks.value[0]
  return first ? slotsFrom(first.returnAt, catalogue.slots, 6) : []
})
/** Each week with its pickup slot (the chosen rank after that week's return). */
const plannedWeeks = computed(() =>
  weeks.value.map((w) => ({
    ...w,
    pickup:
      pickupRank.value === null
        ? null
        : (slotsFrom(w.returnAt, catalogue.slots, pickupRank.value + 1)[pickupRank.value] ?? null),
  })),
)
const door = computed(() => {
  const layout = dropLocker.value ? lockerLayout(dropLocker.value) : undefined
  return layout
    ? (exampleDoorLabel(computeLockerDrawing(layout, sizes), pack.size as CompartmentSize) ??
        undefined)
    : undefined
})
const ready = computed(
  () =>
    price.value.available &&
    account.state.signedIn &&
    dropLocker.value &&
    pickup.value &&
    pickupRank.value !== null,
)
const summary = ref<HTMLElement | null>(null)
const boughtId = ref<string | null>(null)
const firstWeekOrder = computed(() => {
  const purchase = (account.state.packs ?? []).find((p) => p.id === boughtId.value)
  return purchase?.orderIds[0] ?? null
})

function chooseLocker(code: string | null): void {
  dropLocker.value = code
  if (code) void reveal(summary.value)
}

function buy(): void {
  const p = price.value
  if (!p.available || !dropLocker.value || !pickup.value) return
  boughtId.value = account.buyPack(
    {
      packCode: pack.code,
      weeklyCents: p.weeklyCents,
      totalCents: p.totalCents,
      welcome: p.welcome,
      plan: account.state.plan,
      dropLocker: dropLocker.value,
      pickupLocker: pickup.value,
      weekday: weekday.value,
      slotCode: slotCode.value,
    },
    plannedWeeks.value.map((w) => ({
      ...w,
      pickupStart: w.pickup?.start,
      pickupEnd: w.pickup?.end,
    })),
    {
      label: pack.name,
      quantity: pack.items.reduce((n, i) => n + i.quantity, 0),
      size: pack.size,
      shopCode: PACK_PROVIDER,
      door: door.value,
    },
  )
  showForm.value = false
}
</script>

<template>
  <ion-page>
    <app-header />
    <ion-content>
      <main class="page">
        <h1 class="page-title">{{ t('pack.title') }}</h1>
        <p class="page-intro">{{ t('pack.intro', { items: itemsLine }) }}</p>

        <section class="soft-card offer">
          <template v-if="price.available">
            <span v-if="price.welcome" class="pill">{{ t('pack.welcomeBadge') }}</span>
            <p class="amount">
              <strong>{{ euros(price.weeklyCents) }}</strong> {{ t('pack.perWeek') }}
            </p>
            <p class="muted">
              {{
                t('pack.billed', {
                  total: euros(price.totalCents),
                  weeks: pack.weeks_per_purchase,
                })
              }}
            </p>
            <p v-if="price.welcome" class="muted small">
              {{
                t('pack.afterWelcome', { plus: planPrice('plus'), premium: planPrice('premium') })
              }}
            </p>
            <p v-else class="muted small">{{ t('pack.withPlan', { plan: plan.name }) }}</p>
          </template>
          <template v-else>
            <p>
              <strong>{{ t('pack.subscriptionRequired') }}</strong>
            </p>
            <p class="muted small">
              {{
                t('pack.afterWelcome', { plus: planPrice('plus'), premium: planPrice('premium') })
              }}
            </p>
            <ion-button shape="round" router-link="/compte/abonnement">
              {{ t('pack.seePlans') }}
            </ion-button>
          </template>
        </section>

        <section class="soft-card">
          <h2 class="section-title">{{ t('pack.howTitle') }}</h2>
          <ol class="how">
            <li>{{ t('pack.how1') }}</li>
            <li>{{ t('pack.how2') }}</li>
            <li>{{ t('pack.how3') }}</li>
            <li>{{ t('pack.how4') }}</li>
          </ol>
        </section>

        <!-- Running pack: the four weeks, each opening its order (drop-off). -->
        <section v-if="running" class="soft-card">
          <h2 class="section-title">{{ t('pack.myPack') }}</h2>
          <p class="muted small">
            {{ lockerName(running.latest.dropLocker) }} ·
            {{ euros(running.latest.totalCents) }}
          </p>
          <ul class="weeks">
            <li v-for="o in running.weeks" :key="o.id">
              <router-link class="week" :to="`/compte/commandes/${o.id}`">
                <span class="week-no">{{ t('pack.week', { n: o.packWeek }) }}</span>
                <span class="week-text">
                  <span>{{
                    t('pack.dropLine', {
                      day: dayLabel(o.dropFrom ?? o.createdAt, inSentence),
                      from: clock(o.dropFrom ?? o.createdAt),
                      by: clock(o.dropBy ?? o.createdAt),
                    })
                  }}</span>
                  <span class="muted small">{{
                    o.pickupStart && o.pickupEnd
                      ? t('pack.pickupLine', {
                          day: dayLabel(o.pickupStart, inSentence),
                          from: clock(o.pickupStart),
                          to: clock(o.pickupEnd),
                        })
                      : t('pack.returnLine', { date: dateTime(o.returnAt ?? o.createdAt, labels) })
                  }}</span>
                </span>
                <span class="pill" :class="{ off: o.status === 'picked_up' }">{{
                  t(`orders.status.${o.status}`)
                }}</span>
              </router-link>
            </li>
          </ul>
          <ion-button
            v-if="canRebuy && price.available && !showForm"
            fill="outline"
            shape="round"
            @click="showForm = true"
          >
            {{ t('pack.rebuy') }}
          </ion-button>
        </section>

        <!-- Purchase confirmation. -->
        <section v-if="boughtId" class="result" role="status">
          <strong>✓ {{ t('pack.boughtTitle') }}</strong>
          <span>{{ t('pack.boughtText') }}</span>
          <ion-button
            v-if="firstWeekOrder"
            shape="round"
            :router-link="`/compte/commandes/${firstWeekOrder}`"
          >
            {{ t('pack.seeWeek1') }}
          </ion-button>
        </section>

        <!-- Purchase form. -->
        <template v-if="price.available && (!running || showForm) && !boughtId">
          <section v-if="!account.state.signedIn" class="soft-card">
            <p>{{ t('pack.signInFirst') }}</p>
            <ion-button shape="round" router-link="/compte">{{ t('pack.signIn') }}</ion-button>
          </section>
          <template v-else>
            <h2 class="section-title">{{ t('pack.dayTitle') }}</h2>
            <div class="chips" role="radiogroup" :aria-label="t('pack.dayTitle')">
              <button
                v-for="d in WEEKDAYS"
                :key="d"
                type="button"
                class="chip"
                role="radio"
                :aria-checked="weekday === d"
                :class="{ active: weekday === d }"
                @click="weekday = d"
              >
                {{ weekdayName(d) }}
              </button>
            </div>
            <div class="chips" role="radiogroup" :aria-label="t('pack.slotTitle')">
              <button
                v-for="s in catalogue.slots"
                :key="s.code"
                type="button"
                class="chip"
                role="radio"
                :aria-checked="slotCode === s.code"
                :class="{ active: slotCode === s.code }"
                @click="slotCode = s.code"
              >
                {{ s.label }} ({{ s.starts }}–{{ s.ends }})
              </button>
            </div>

            <h2 class="section-title">{{ t('pack.lockerTitle') }}</h2>
            <locker-picker
              :model-value="dropLocker"
              :size="pack.size"
              @update:model-value="chooseLocker"
            />
            <h2 class="section-title">{{ t('pack.pickupTitle') }}</h2>
            <div class="choices" role="radiogroup" :aria-label="t('pack.pickupTitle')">
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
                <span class="muted small">{{ dropLocker ? lockerName(dropLocker) : '—' }}</span>
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
              :size="pack.size"
              :exclude-lockers="dropLocker ? [dropLocker] : []"
            />
            <h3 class="sub-title">{{ t('pack.pickupSlot') }}</h3>
            <p class="muted small">{{ t('pack.pickupSlotHint') }}</p>
            <div class="chips wrap" role="radiogroup" :aria-label="t('pack.pickupSlot')">
              <button
                v-for="(w, i) in pickupOptions"
                :key="w.start.toISOString()"
                type="button"
                class="chip"
                role="radio"
                :aria-checked="pickupRank === i"
                :class="{ active: pickupRank === i }"
                @click="pickupRank = i"
              >
                {{ weekdayOf(w.start) }} · {{ w.slot.label }} ({{ clock(w.start) }}–{{
                  clock(w.end)
                }})
              </button>
            </div>

            <section ref="summary" class="soft-card">
              <h2 class="section-title">{{ t('pack.scheduleTitle') }}</h2>
              <ul class="weeks">
                <li v-for="w in plannedWeeks" :key="w.week" class="week">
                  <span class="week-no">{{ t('pack.week', { n: w.week }) }}</span>
                  <span class="week-text">
                    <span>{{
                      t('pack.dropLine', {
                        date: dateTime(w.dropFrom, labels),
                        by: clock(w.dropBy),
                      })
                    }}</span>
                    <span class="muted small">{{
                      w.pickup
                        ? t('pack.pickupLine', {
                            day: dayLabel(w.pickup.start, inSentence),
                            from: clock(w.pickup.start),
                            to: clock(w.pickup.end),
                          })
                        : t('pack.returnLine', { date: dateTime(w.returnAt, labels) })
                    }}</span>
                  </span>
                </li>
              </ul>
              <p v-if="dropLocker" class="muted small">
                {{ lockerName(dropLocker) }}
                <template v-if="pickup && pickup !== dropLocker">
                  → {{ lockerName(pickup) }}</template
                >
              </p>
            </section>

            <ion-button expand="block" shape="round" size="large" :disabled="!ready" @click="buy">
              {{ t('pack.pay', { total: euros(price.totalCents) }) }}
            </ion-button>
            <p class="muted small">{{ t('pack.noRenewal') }}</p>
          </template>
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
.offer {
  gap: 6px;
}
.amount {
  font-size: 15px;
}
.amount strong {
  font-size: 32px;
  font-weight: 700;
  color: var(--cg-pine);
}
.offer ion-button {
  align-self: flex-start;
}
.how {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding-left: 20px;
}
.weeks {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
.week {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--cg-surface-soft);
  color: inherit;
  text-decoration: none;
}
.weeks li:first-child .week,
.weeks li.week:first-child {
  border-top: none;
}
.week-no {
  font-weight: 600;
  color: var(--cg-pine);
}
.week-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
.result {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: var(--cg-radius-l);
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
}
.result strong {
  font-size: 18px;
}
.result ion-button {
  align-self: flex-start;
}
</style>
