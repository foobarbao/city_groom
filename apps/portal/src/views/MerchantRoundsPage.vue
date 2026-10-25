<script setup lang="ts">
/**
 * Merchant rounds: for each courier visit (07:00, 14:00, 20:00), first the
 * items to have ready for the courier at that time, marked ready one by one,
 * then the items the courier brings. Lockers are deliberately not shown:
 * the merchant only needs to know when to hand items over
 * (docs/PRODUCT.md §5).
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import MerchantShell from '../components/MerchantShell.vue'
import { clock, shortDay } from '../data/format'
import { partnerState, toggleReady } from '../data/partnerState'
import { activity, catalogue, demoNow, partnerOrFirst, serviceName } from '../data/source'

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
            t('merchant.rounds.visit', {
              time: clock(round.startsAt),
              day: shortDay(round.startsAt),
            })
          }}
        </h2>
        <p v-if="!round.arriving.length && !round.leaving.length" class="note">
          {{ t('merchant.rounds.nothing') }}
        </p>
        <div v-if="round.leaving.length" class="block handover">
          <h3 class="handover-title">
            <span class="time">{{ clock(round.startsAt) }}</span>
            <span>
              {{ t('merchant.rounds.handover', { time: clock(round.startsAt) }) }}
              <span class="count">
                {{
                  t('merchant.rounds.readyCount', {
                    ready: round.leaving.filter((o) => ready(o.id)).length,
                    total: round.leaving.length,
                  })
                }}
              </span>
            </span>
          </h3>
          <ul class="plain-list">
            <li v-for="o in round.leaving" :key="o.id" :class="{ done: ready(o.id) }">
              <label class="ready">
                <input type="checkbox" :checked="ready(o.id)" @change="toggleReady(o.id)" />
                <span>
                  <strong>{{ o.items }} × {{ serviceName(o.service) }}</strong>
                  <span class="muted">{{ o.id }}</span>
                </span>
              </label>
            </li>
          </ul>
          <p class="note">{{ t('merchant.rounds.readyHint') }}</p>
        </div>
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
              <span class="muted">{{ o.id }}</span>
            </li>
          </ul>
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
  font-weight: 600;
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
.handover {
  padding: 12px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-sun-soft);
}
.handover-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--cg-ink);
}
.handover-title > span:last-child {
  display: flex;
  flex-direction: column;
}
.time {
  padding: 6px 12px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-sun);
  font-size: 20px;
  font-weight: 700;
}
.count {
  font-size: 13px;
  font-weight: 700;
  color: var(--cg-ink-soft);
}
li.done {
  background: var(--cg-leaf-soft) !important;
}
</style>
