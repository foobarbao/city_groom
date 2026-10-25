<script setup lang="ts">
/**
 * Merchant reviews: rating out of 5, distribution of ratings, verified
 * reviews (one per completed order, ADR-0008) and a public reply to each.
 *
 * DEMO: reviews are fictitious; replies stay on the device.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import MerchantShell from '../components/MerchantShell.vue'
import StatTile from '../components/StatTile.vue'
import { longDay, number } from '../data/format'
import { partnerState } from '../data/partnerState'
import { partnerOrFirst } from '../data/source'

const props = defineProps<{ code?: string }>()
const { t } = useI18n()

const shop = computed(() => partnerOrFirst(props.code))
const reviews = computed(() => shop.value?.reviews)
const distribution = computed(() =>
  [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.value?.distribution[String(star)] ?? 0 })),
)
const keyOf = (r: { author: string; date: string }): string => `${r.author}|${r.date}`
const replies = computed(() => partnerState.reviewReplies[shop.value?.code ?? ''] ?? {})
const drafts = ref<Record<string, string>>({})

function publish(key: string): void {
  const text = drafts.value[key]?.trim()
  if (!text || !shop.value) return
  ;(partnerState.reviewReplies[shop.value.code] ??= {})[key] = text
  drafts.value[key] = ''
}
const stars = (n: number): string => '★'.repeat(n) + '☆'.repeat(5 - n)
</script>

<template>
  <merchant-shell :code="code" section="merchant-reviews">
    <div v-if="reviews" class="tiles">
      <stat-tile
        :label="t('merchant.reviews.average')"
        :value="`${reviews.average.toLocaleString('fr-FR')} / 5`"
      />
      <stat-tile
        :label="t('merchant.reviews.count')"
        :value="number(reviews.count)"
        :hint="t('merchant.reviews.verified')"
      />
    </div>
    <div v-if="reviews" class="columns">
      <section class="card">
        <h2>{{ t('merchant.reviews.distribution') }}</h2>
        <div v-for="row in distribution" :key="row.star" class="bar-row">
          <span>{{ row.star }} ★</span>
          <span class="bar"
            ><span class="fill" :style="{ width: `${(row.count / reviews.count) * 100}%` }"
          /></span>
          <span class="muted">{{ row.count }}</span>
        </div>
        <p class="note">{{ t('merchant.reviews.policy') }}</p>
      </section>
      <section class="card">
        <h2>{{ t('merchant.reviews.recent') }}</h2>
        <ul class="plain-list">
          <li v-for="r in reviews.recent" :key="keyOf(r)">
            <span class="head"
              ><strong>{{ r.author }}</strong
              ><span
                class="stars"
                :aria-label="t('merchant.reviews.outOf5', { rating: r.rating })"
                >{{ stars(r.rating) }}</span
              ></span
            >
            <span>{{ r.comment }}</span>
            <span class="muted"
              >{{ longDay(r.date) }} · {{ t('merchant.reviews.verifiedOrder') }}</span
            >
            <div v-if="replies[keyOf(r)]" class="reply">
              <strong>{{ t('merchant.reviews.yourReply') }}</strong>
              <span>{{ replies[keyOf(r)] }}</span>
            </div>
            <form v-else class="reply-form" @submit.prevent="publish(keyOf(r))">
              <input
                v-model="drafts[keyOf(r)]"
                type="text"
                :placeholder="t('merchant.reviews.replyPlaceholder')"
              />
              <button type="submit" :disabled="!drafts[keyOf(r)]?.trim()">
                {{ t('merchant.reviews.reply') }}
              </button>
            </form>
          </li>
        </ul>
        <p class="note">{{ t('merchant.reviews.demo') }}</p>
      </section>
    </div>
  </merchant-shell>
</template>

<style scoped>
.bar-row {
  display: grid;
  grid-template-columns: 40px 1fr 32px;
  align-items: center;
  gap: 10px;
}
.bar {
  height: 10px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-surface-soft);
  overflow: hidden;
}
.fill {
  display: block;
  height: 100%;
  background: var(--cg-sun);
}
.head {
  display: flex;
  justify-content: space-between;
}
.stars {
  color: #c99a06;
  letter-spacing: 1px;
}
.reply {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
  padding: 10px 12px;
  border-radius: var(--cg-radius-s);
  background: var(--cg-leaf-soft);
}
.reply-form {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
.reply-form input {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border: 1px solid var(--cg-locker-door-edge);
  border-radius: var(--cg-radius-pill);
  background: var(--cg-surface);
  color: var(--cg-ink);
  font: inherit;
}
.reply-form button {
  padding: 8px 16px;
  border: none;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-leaf);
  color: #ffffff;
  font: inherit;
  font-weight: 600;
}
.reply-form button:disabled {
  opacity: 0.5;
}
.muted {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
</style>
