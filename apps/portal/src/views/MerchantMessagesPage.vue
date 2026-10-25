<script setup lang="ts">
/**
 * Merchant messages: customer requests (special services), answers and
 * quotes (label, price, compartment size), with their status. Deliberately
 * minimal (docs/PRODUCT.md §5).
 *
 * DEMO: customers' messages and answers are simulated (labelled).
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import MerchantShell from '../components/MerchantShell.vue'
import { clock, euros, shortDay } from '../data/format'
import { awaitsAnswer, reply, threadsOf } from '../data/partnerState'
import { partnerOrFirst } from '../data/source'

const props = defineProps<{ code?: string }>()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const shop = computed(() => partnerOrFirst(props.code))
const threads = computed(() => (shop.value ? threadsOf(shop.value.code) : []))
const current = computed(
  () => threads.value.find((th) => th.id === route.query.fil) ?? threads.value[0] ?? null,
)

const text = ref('')
const withQuote = ref(false)
const quoteLabel = ref('')
const quotePrice = ref<number | null>(null)
const quoteSize = ref('M')
const canSend = computed(
  () =>
    text.value.trim() !== '' &&
    (!withQuote.value || (quoteLabel.value.trim() !== '' && (quotePrice.value ?? 0) > 0)),
)

function open(id: string): void {
  void router.replace({ query: { fil: id } })
}

function send(): void {
  if (!current.value || !canSend.value) return
  reply(
    current.value,
    text.value.trim(),
    withQuote.value
      ? {
          label: quoteLabel.value.trim(),
          priceCents: Math.round((quotePrice.value ?? 0) * 100),
          size: quoteSize.value,
        }
      : null,
  )
  text.value = ''
  withQuote.value = false
  quoteLabel.value = ''
  quotePrice.value = null
}
</script>

<template>
  <merchant-shell :code="code" section="merchant-messages">
    <div class="layout">
      <ul class="threads" role="list">
        <li v-for="th in threads" :key="th.id">
          <button
            type="button"
            class="thread"
            :class="{ active: current?.id === th.id }"
            @click="open(th.id)"
          >
            <span class="who">
              <strong>{{ th.customer }}</strong>
              <span v-if="awaitsAnswer(th)" class="to-answer">{{
                t('merchant.messages.toAnswer')
              }}</span>
            </span>
            <span class="preview">{{ th.messages[th.messages.length - 1]?.text }}</span>
          </button>
        </li>
      </ul>

      <section v-if="current" class="card conversation">
        <h2>{{ current.customer }}</h2>
        <div class="messages">
          <div v-for="(m, i) in current.messages" :key="i" class="bubble" :class="m.from">
            <p>{{ m.text }}</p>
            <div v-if="m.quote" class="quote">
              <span class="small">{{ t('merchant.messages.quote') }}</span>
              <strong>{{ m.quote.label }}</strong>
              <strong class="amount">{{ euros(m.quote.priceCents / 100) }}</strong>
              <span class="small">{{ t('merchant.messages.size', { size: m.quote.size }) }}</span>
              <span class="status" :class="m.quote.status">{{
                t(`merchant.messages.status.${m.quote.status}`)
              }}</span>
            </div>
            <span class="meta">
              {{ shortDay(m.at) }} {{ clock(m.at)
              }}<template v-if="m.simulated"> · {{ t('merchant.messages.simulated') }}</template>
            </span>
          </div>
        </div>

        <form class="composer" @submit.prevent="send">
          <textarea v-model="text" rows="2" :placeholder="t('merchant.messages.placeholder')" />
          <label class="toggle">
            <input v-model="withQuote" type="checkbox" />
            {{ t('merchant.messages.attachQuote') }}
          </label>
          <div v-if="withQuote" class="quote-form">
            <label>
              {{ t('merchant.messages.quoteLabel') }}
              <input
                v-model="quoteLabel"
                type="text"
                :placeholder="t('merchant.messages.quoteLabelHint')"
              />
            </label>
            <label>
              {{ t('merchant.messages.quotePrice') }}
              <input
                v-model.number="quotePrice"
                type="number"
                min="1"
                step="0.5"
                inputmode="decimal"
              />
            </label>
            <label>
              {{ t('merchant.messages.quoteSize') }}
              <select v-model="quoteSize">
                <option v-for="s in ['S', 'M', 'L', 'XL']" :key="s" :value="s">{{ s }}</option>
              </select>
            </label>
          </div>
          <button class="send" type="submit" :disabled="!canSend">
            {{ withQuote ? t('merchant.messages.sendQuote') : t('merchant.messages.send') }}
          </button>
        </form>
      </section>
    </div>
  </merchant-shell>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: minmax(220px, 300px) 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 720px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
.threads {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.thread {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 14px 16px;
  border: 2px solid transparent;
  border-radius: var(--cg-radius-m);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.thread.active {
  border-color: var(--cg-leaf);
}
.who {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.to-answer {
  padding: 2px 8px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-sun);
  font-size: 12px;
  font-weight: 600;
}
.preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bubble {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 18px;
}
.bubble p {
  margin: 0;
}
.bubble.customer {
  align-self: flex-start;
  background: var(--cg-surface-soft);
}
.bubble.merchant {
  align-self: flex-end;
  background: var(--cg-leaf);
  color: #ffffff;
}
.meta,
.small {
  font-size: 12px;
  opacity: 0.8;
}
.quote {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: var(--cg-radius-s);
  background: rgb(255 255 255 / 92%);
  color: var(--cg-ink);
}
.amount {
  font-size: 20px;
  color: var(--cg-pine);
}
.status {
  align-self: flex-start;
  margin-top: 4px;
  padding: 2px 10px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-sun-soft);
  font-size: 12px;
  font-weight: 600;
}
.status.accepted {
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
}
.composer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--cg-chart-grid);
}
.composer textarea,
.quote-form input,
.quote-form select {
  padding: 10px 14px;
  border: 1px solid var(--cg-locker-door-edge);
  border-radius: var(--cg-radius-s);
  background: var(--cg-surface);
  color: var(--cg-ink);
  font: inherit;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}
.toggle input {
  width: 20px;
  height: 20px;
  accent-color: var(--cg-leaf);
}
.quote-form {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 10px;
}
.quote-form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
}
.send {
  align-self: flex-end;
  padding: 12px 22px;
  border: none;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-leaf);
  color: #ffffff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
