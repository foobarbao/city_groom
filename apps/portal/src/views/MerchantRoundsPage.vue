<script setup lang="ts">
/**
 * Merchant rounds: for each of the next rounds (07:00, 14:00, 20:00), the
 * items a courier brings to the shop and the items that go back to the
 * customers' lockers, which the merchant marks ready beforehand.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import MerchantShell from '../components/MerchantShell.vue'
import { clock, shortDay } from '../data/format'
import { partnerState, toggleReady } from '../data/partnerState'
import {
  activity,
  catalogue,
  demoNow,
  partnerOrFirst,
  placeName,
  serviceName,
} from '../data/source'

const props = defineProps<{ code?: string }>()
const { t } = useI18n()

/** Number of upcoming rounds shown. */
const SHOWN_ROUNDS = 6

const shop = computed(() => partnerOrFirst(props.code))
const orders = computed(() => activity.orders.filter((o) => o.merchant === shop.value?.code))

/** Next rounds of the network, with this shop's arrivals and departures. */
const rounds = computed(() =>
  activity.rounds
    .filter((r) => new Date(r.starts_at) > demoNow)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, SHOWN_ROUNDS)
    .map((r) => {
      const at = new Date(r.starts_at).getTime()
      const same = (iso: string | null): boolean => iso !== null && new Date(iso).getTime() === at
      return {
        id: r.id,
        startsAt: r.starts_at,
        arriving: orders.value.filter((o) => same(o.collected_at)),
        leaving: orders.value.filter((o) => same(o.returned_at)),
      }
    }),
)
const ready = (id: string): boolean => partnerState.ready.includes(id)
</script>

<template>
  <merchant-shell :code="code" section="merchant-rounds">
    <p class="intro">
      {{
        t('merchant.rounds.intro', {
          times: new Intl.ListFormat('fr', { type: 'conjunction' }).format(catalogue.round_times),
        })
      }}
    </p>
    <div class="rounds">
      <section v-for="round in rounds" :key="round.id" class="card">
        <h2>
          {{
            t('merchant.incomingRound', {
              time: clock(round.startsAt),
              day: shortDay(round.startsAt),
            })
          }}
        </h2>
        <p v-if="!round.arriving.length && !round.leaving.length" class="note">
          {{ t('merchant.rounds.nothing') }}
        </p>
        <div v-if="round.arriving.length" class="block">
          <h3>
            ↓ {{ t('merchant.rounds.arriving') }} ·
            {{
              t(
                'merchant.items',
                round.arriving.reduce((s, o) => s + o.items, 0),
              )
            }}
          </h3>
          <ul class="plain-list">
            <li v-for="o in round.arriving" :key="o.id">
              <strong>{{ o.items }} × {{ serviceName(o.service) }}</strong>
              <span class="muted"
                >{{ o.id }} ·
                {{ t('merchant.rounds.from', { locker: placeName(o.drop_locker) }) }}</span
              >
            </li>
          </ul>
        </div>
        <div v-if="round.leaving.length" class="block">
          <h3>
            ↑ {{ t('merchant.rounds.leaving') }} ·
            {{
              t(
                'merchant.items',
                round.leaving.reduce((s, o) => s + o.items, 0),
              )
            }}
          </h3>
          <ul class="plain-list">
            <li v-for="o in round.leaving" :key="o.id" :class="{ done: ready(o.id) }">
              <label class="ready">
                <input type="checkbox" :checked="ready(o.id)" @change="toggleReady(o.id)" />
                <span>
                  <strong>{{ o.items }} × {{ serviceName(o.service) }}</strong>
                  <span class="muted"
                    >{{ o.id }} ·
                    {{ t('merchant.rounds.to', { locker: placeName(o.pickup_locker) }) }}</span
                  >
                </span>
              </label>
            </li>
          </ul>
          <p class="note">{{ t('merchant.rounds.readyHint') }}</p>
        </div>
      </section>
    </div>
    <p class="note">{{ t('merchant.rounds.otherShops') }}</p>
  </merchant-shell>
</template>

<style scoped>
.intro {
  margin: 0;
  color: var(--cg-ink-soft);
}
.rounds {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
  gap: 16px;
}
.block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--cg-pine);
}
.ready {
  display: grid;
  grid-template-columns: 24px 1fr;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.ready > span {
  display: flex;
  flex-direction: column;
}
.ready input {
  width: 22px;
  height: 22px;
  accent-color: var(--cg-leaf);
}
li.done {
  background: var(--cg-leaf-soft) !important;
}
</style>
