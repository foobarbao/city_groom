<script setup lang="ts">
/**
 * Sport exchange (docs/PRODUCT.md "Sport exchange"): once a week, at one
 * slot and one place, the customer collects last week's clean items (sport
 * outfit, shirt and trousers ironed and folded) and drops the dirty ones, in
 * the same compartment. Bought one week at a time, subscribers only.
 *
 * The screen shows the offer and its price for this customer, the scheduled
 * exchanges, and the form: place, day, slot, payment (simulated). "Même
 * créneau la semaine prochaine" repeats the last exchange seven days later.
 */
import { IonButton, IonContent, IonPage } from '@ionic/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { DemoPack } from '@city-groom/demo-data'

import AppHeader from '../components/AppHeader.vue'
import DemoNotice from '../components/DemoNotice.vue'
import LockerPicker from '../components/LockerPicker.vue'
import PromoCard from '../components/PromoCard.vue'
import { packPrice } from '../domain/pack'
import { eligiblePromotions } from '../domain/promotions'
import { type SlotWindow, slotsFrom } from '../domain/slots'
import {
  PACK_PROVIDER,
  SPORT_EXCHANGE_CODE,
  catalogue,
  lockers,
  packByCode,
  packItemName,
} from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { clock, dayLabel, euros } from '../utils/format'
import { reveal } from '../utils/scroll'
import { statusTone } from '../utils/tones'

const { t } = useI18n()
const account = useAccountStore()
const inSentence = computed(() => ({
  today: t('common.today').toLocaleLowerCase('fr'),
  tomorrow: t('common.tomorrow').toLocaleLowerCase('fr'),
}))

const offer = packByCode(SPORT_EXCHANGE_CODE) as DemoPack
const items = offer.items.map((i) => packItemName(i))
const price = computed(() => packPrice(offer, account.state.plan, false))
const promo = computed(
  () =>
    eligiblePromotions(catalogue.promotions, catalogue.packs, account.state.plan, (code) =>
      account.hasBoughtPack(code),
    ).find((p) => p.pack.code === offer.code) ?? null,
)
const lockerName = (code: string): string => lockers.find((l) => l.code === code)?.name ?? code

/** Scheduled exchanges, next first. */
const exchanges = computed(() =>
  account.state.orders
    .filter((o) => o.kind === 'exchange')
    .sort((a, b) => (a.dropFrom ?? '').localeCompare(b.dropFrom ?? '')),
)
const upcoming = computed(() => exchanges.value.filter((o) => o.status === 'awaiting_drop_off'))

// --- Form ----------------------------------------------------------------------

/** Slots of the next seven days (three a day). */
const options = computed<SlotWindow[]>(() => slotsFrom(new Date(), catalogue.slots, 21))
const days = computed(() => [...new Set(options.value.map((w) => w.day))])
const day = ref<string | null>(null)
const slotIndex = ref<number | null>(null)
const daySlots = computed(() => options.value.filter((w) => w.day === day.value))
const chosen = computed(() =>
  slotIndex.value === null ? null : (daySlots.value[slotIndex.value] ?? null),
)
const place = ref<string | null>(null)
const ready = computed(
  () => price.value.available && account.state.signedIn && place.value && chosen.value,
)
const summary = ref<HTMLElement | null>(null)
const bookedId = ref<string | null>(null)

function chooseDay(value: string): void {
  day.value = value
  slotIndex.value = null
}

function book(slot: SlotWindow | null = chosen.value, lockerCode = place.value): void {
  const p = price.value
  if (!p.available || !slot || !lockerCode) return
  bookedId.value = account.addExchange({
    label: offer.name,
    priceCents: p.weeklyCents,
    size: offer.size,
    shopCode: PACK_PROVIDER,
    lockerCode,
    slotStart: slot.start,
    slotEnd: slot.end,
  })
}

/** Same place and slot, seven days after the last scheduled exchange. */
function repeatNextWeek(): void {
  const last = exchanges.value.at(-1)
  if (!last?.dropFrom || !last.dropBy) return
  const week = 7 * 86_400_000
  const start = new Date(new Date(last.dropFrom).getTime() + week)
  const end = new Date(new Date(last.dropBy).getTime() + week)
  const slot = catalogue.slots.find((s) => s.starts === clock(start))
  if (!slot) return
  book({ day: '', slot, start, end }, last.dropLocker)
}
</script>

<template>
  <ion-page>
    <app-header />
    <ion-content>
      <main class="page">
        <h1 class="page-title">{{ t('exchange.title') }}</h1>
        <p class="page-intro">{{ t('exchange.intro') }}</p>

        <promo-card v-if="promo" :promo="promo" />

        <section class="soft-card">
          <h2 class="section-title">{{ t('exchange.howTitle') }}</h2>
          <ol class="how">
            <li>{{ t('exchange.how1') }}</li>
            <li>{{ t('exchange.how2', { items: items.join(', ') }) }}</li>
            <li>{{ t('exchange.how3') }}</li>
            <li>{{ t('exchange.how4') }}</li>
          </ol>
        </section>

        <section v-if="!price.available" class="soft-card">
          <p>
            <strong>{{ t('exchange.subscribersOnly') }}</strong>
          </p>
          <ion-button shape="round" router-link="/compte/abonnement">
            {{ t('pack.seePlans') }}
          </ion-button>
        </section>

        <!-- Scheduled exchanges. -->
        <section v-if="exchanges.length" class="soft-card">
          <h2 class="section-title">{{ t('exchange.mine') }}</h2>
          <ul class="rows">
            <li v-for="o in exchanges" :key="o.id">
              <router-link class="row" :to="`/compte/commandes/${o.id}`">
                <span class="row-text">
                  <strong>{{
                    t('exchange.slotLine', {
                      day: dayLabel(o.dropFrom ?? o.createdAt, inSentence),
                      from: clock(o.dropFrom ?? o.createdAt),
                      to: clock(o.dropBy ?? o.createdAt),
                    })
                  }}</strong>
                  <span class="muted small">
                    {{ lockerName(o.dropLocker) }} ·
                    {{ o.collectsClean ? t('exchange.withClean') : t('exchange.firstDrop') }}
                  </span>
                </span>
                <span class="pill" :class="statusTone(o.status)">{{
                  t(`orders.status.${o.status}`)
                }}</span>
              </router-link>
            </li>
          </ul>
          <ion-button v-if="price.available" fill="outline" shape="round" @click="repeatNextWeek">
            {{ t('exchange.repeat') }}
          </ion-button>
        </section>

        <section v-if="bookedId" class="result" role="status">
          <strong>✓ {{ t('exchange.bookedTitle') }}</strong>
          <span>{{ t('exchange.bookedText') }}</span>
          <ion-button shape="round" :router-link="`/compte/commandes/${bookedId}`">
            {{ t('exchange.seeIt') }}
          </ion-button>
        </section>

        <!-- Form. -->
        <template v-if="price.available && !upcoming.length && !bookedId">
          <section v-if="!account.state.signedIn" class="soft-card">
            <p>{{ t('pack.signInFirst') }}</p>
            <ion-button shape="round" router-link="/compte">{{ t('pack.signIn') }}</ion-button>
          </section>
          <template v-else>
            <h2 class="section-title">{{ t('exchange.placeTitle') }}</h2>
            <p class="muted small">{{ t('exchange.placeHint') }}</p>
            <locker-picker v-model="place" :size="offer.size" />

            <h2 class="section-title">{{ t('exchange.whenTitle') }}</h2>
            <div class="chips wrap" role="radiogroup" :aria-label="t('exchange.whenTitle')">
              <button
                v-for="d in days"
                :key="d"
                type="button"
                class="chip"
                role="radio"
                :aria-checked="day === d"
                :class="{ active: day === d }"
                @click="chooseDay(d)"
              >
                {{
                  dayLabel(options.find((w) => w.day === d)?.start ?? new Date(), {
                    today: t('common.today'),
                    tomorrow: t('common.tomorrow'),
                  })
                }}
              </button>
            </div>
            <div
              v-if="day"
              class="chips wrap"
              role="radiogroup"
              :aria-label="t('exchange.slotTitle')"
            >
              <button
                v-for="(w, i) in daySlots"
                :key="w.start.toISOString()"
                type="button"
                class="chip"
                role="radio"
                :aria-checked="slotIndex === i"
                :class="{ active: slotIndex === i }"
                @click="
                  () => {
                    slotIndex = i
                    reveal(summary)
                  }
                "
              >
                {{ w.slot.label }} ({{ clock(w.start) }}–{{ clock(w.end) }})
              </button>
            </div>

            <section ref="summary" class="soft-card">
              <p v-if="chosen && place">
                {{
                  t('exchange.summary', {
                    place: lockerName(place),
                    day: dayLabel(chosen.start, inSentence),
                    from: clock(chosen.start),
                    to: clock(chosen.end),
                  })
                }}
              </p>
              <p class="muted small">{{ t('exchange.firstNote') }}</p>
            </section>
            <ion-button
              expand="block"
              shape="round"
              size="large"
              :disabled="!ready"
              @click="book()"
            >
              {{ t('exchange.pay', { price: price.available ? euros(price.weeklyCents) : '' }) }}
            </ion-button>
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
.how {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding-left: 20px;
}
.rows {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--cg-surface-soft);
  color: inherit;
  text-decoration: none;
}
.rows li:first-child .row {
  border-top: none;
}
.row-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
