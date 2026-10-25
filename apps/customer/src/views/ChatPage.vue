<script setup lang="ts">
/**
 * Conversation with a partner shop: messages, photos and quotes. Accepting a
 * quote leads to the order screen (drop-off and pickup lockers).
 *
 * DEMO: the merchant's replies are simulated and labelled as such.
 */
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { shopByCode } from '../services/catalogue'
import { useAccountStore } from '../stores/account'
import { clock, euros } from '../utils/format'
import { downscalePhoto } from '@city-groom/ui'

const props = defineProps<{ shop: string }>()
const { t } = useI18n()
const router = useIonRouter()
const account = useAccountStore()

const text = ref('')
const photo = ref<string | null>(null)
const content = ref<InstanceType<typeof IonContent> | null>(null)

const shopName = computed(() => shopByCode(props.shop)?.name ?? props.shop)
const messages = computed(() => account.state.conversations[props.shop] ?? [])
const quote = (id: string | null) => account.state.quotes.find((q) => q.id === id)

watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    await content.value?.$el.scrollToBottom(300)
  },
)

async function onPhoto(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) photo.value = await downscalePhoto(file)
}

function send(): void {
  if (!text.value.trim() && !photo.value) return
  account.sendMessage(props.shop, text.value.trim(), photo.value)
  text.value = ''
  photo.value = null
}

function accept(id: string): void {
  account.setQuoteStatus(id, 'accepted')
  router.push({ path: '/commander', query: { boutique: props.shop, devis: id } })
}
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/messages" :text="''" />
        </ion-buttons>
        <ion-title>{{ shopName }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content ref="content">
      <main class="page chat">
        <p v-if="!messages.length" class="hint">{{ t('messages.hint') }}</p>
        <div v-for="m in messages" :key="m.id" class="bubble" :class="m.from">
          <img v-if="m.photo" :src="m.photo" :alt="t('messages.photoAlt')" class="photo" />
          <p v-if="m.text">{{ m.text }}</p>
          <div v-if="quote(m.quoteId)" class="quote-card">
            <span class="small">{{ t('messages.quote') }}</span>
            <strong>{{ quote(m.quoteId)?.label }}</strong>
            <strong class="amount">{{ euros(quote(m.quoteId)?.priceCents ?? 0) }}</strong>
            <div v-if="quote(m.quoteId)?.status === 'pending'" class="quote-actions">
              <ion-button size="small" shape="round" @click="accept(m.quoteId as string)">
                {{ t('messages.accept') }}
              </ion-button>
              <ion-button
                size="small"
                shape="round"
                fill="outline"
                @click="account.setQuoteStatus(m.quoteId as string, 'declined')"
              >
                {{ t('messages.decline') }}
              </ion-button>
            </div>
            <span v-else class="pill">{{
              t(`messages.quoteStatus.${quote(m.quoteId)?.status}`)
            }}</span>
          </div>
          <span class="meta">
            {{ clock(m.at)
            }}<template v-if="m.simulated"> · {{ t('demo.simulatedReply') }}</template>
          </span>
        </div>
      </main>
    </ion-content>
    <ion-footer class="ion-no-border">
      <form class="composer" @submit.prevent="send">
        <div v-if="photo" class="preview">
          <img :src="photo" :alt="t('messages.photoAlt')" />
          <button type="button" :aria-label="t('common.cancel')" @click="photo = null">×</button>
        </div>
        <label class="attach" :title="t('messages.photo')">
          <input type="file" accept="image/*" class="hidden" @change="onPhoto" />
          <span aria-hidden="true">📷</span>
          <span class="sr-only">{{ t('messages.photo') }}</span>
        </label>
        <input v-model="text" class="input" type="text" :placeholder="t('messages.placeholder')" />
        <ion-button type="submit" shape="round" :disabled="!text.trim() && !photo">
          {{ t('messages.send') }}
        </ion-button>
      </form>
    </ion-footer>
  </ion-page>
</template>

<style scoped>
.chat {
  gap: 10px;
}
.hint {
  margin: 0;
  padding: 14px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-surface-soft);
  color: var(--cg-ink-soft);
}
.bubble {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 82%;
  padding: 10px 14px;
  border-radius: 20px;
}
.bubble p {
  margin: 0;
}
.bubble.customer {
  align-self: flex-end;
  border-bottom-right-radius: 6px;
  background: var(--cg-leaf);
  color: var(--cg-surface);
}
.bubble.merchant {
  align-self: flex-start;
  border-bottom-left-radius: 6px;
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
}
.photo {
  max-width: 100%;
  border-radius: 14px;
}
.meta {
  font-size: 11px;
  opacity: 0.75;
}
.quote-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-leaf-soft);
  color: var(--cg-ink);
}
.amount {
  font-size: 20px;
  color: var(--cg-pine);
}
.quote-actions {
  display: flex;
  gap: 6px;
}
.composer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  max-width: 640px;
  margin: 0 auto;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: var(--cg-ground);
}
.input {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  border: none;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  font: inherit;
}
.attach {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  font-size: 20px;
  cursor: pointer;
}
.hidden,
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.preview {
  position: relative;
  flex-basis: 100%;
}
.preview img {
  height: 72px;
  border-radius: 12px;
}
.preview button {
  position: absolute;
  top: -6px;
  left: 64px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: var(--cg-ink);
  color: var(--cg-surface);
}
</style>
