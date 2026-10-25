<script setup lang="ts">
/**
 * Frame of the merchant space: page with the shop picker and the sub-menu
 * (dashboard, rounds, messages, reviews, services). Changing shop keeps the
 * current section.
 *
 * Props:
 * - `code`: shop code from the route (first shop when empty).
 * - `section`: current section, highlighted in the menu.
 *
 * Slots:
 * - default: section content.
 */
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { awaitsAnswer, seedThreads, threadsOf } from '../data/partnerState'
import { partnerOrFirst, partners } from '../data/source'
import PortalPage from './PortalPage.vue'

export type MerchantSection =
  | 'merchant'
  | 'merchant-rounds'
  | 'merchant-messages'
  | 'merchant-reviews'
  | 'merchant-services'
  | 'merchant-agenda'

const props = defineProps<{ code?: string; section: MerchantSection }>()
const { t } = useI18n()
const router = useRouter()

const shop = computed(() => partnerOrFirst(props.code))
// Fictitious conversations are created the first time a shop is opened.
watch(shop, (value) => value && seedThreads(value.code, value.category), { immediate: true })
const unanswered = computed(() =>
  shop.value ? threadsOf(shop.value.code).filter(awaitsAnswer).length : 0,
)
const SECTIONS: { name: MerchantSection; label: string }[] = [
  { name: 'merchant', label: 'merchant.nav.dashboard' },
  { name: 'merchant-agenda', label: 'merchant.nav.agenda' },
  { name: 'merchant-rounds', label: 'merchant.nav.rounds' },
  { name: 'merchant-messages', label: 'merchant.nav.messages' },
  { name: 'merchant-reviews', label: 'merchant.nav.reviews' },
  { name: 'merchant-services', label: 'merchant.nav.services' },
]

function select(code: string): void {
  void router.replace({ name: props.section, params: { code } })
}
</script>

<template>
  <portal-page :title="t('merchant.title')" back-href="/">
    <template #actions>
      <label class="picker">
        <span>{{ t('merchant.choose') }}</span>
        <select :value="shop?.code" @change="select(($event.target as HTMLSelectElement).value)">
          <option v-for="p in partners" :key="p.code" :value="p.code">{{ p.name }}</option>
        </select>
      </label>
    </template>
    <nav class="sub-nav" :aria-label="t('merchant.title')">
      <router-link
        v-for="s in SECTIONS"
        :key="s.name"
        :to="{ name: s.name, params: { code: shop?.code } }"
        class="sub-link"
        :class="{ active: s.name === section }"
        :aria-current="s.name === section ? 'page' : undefined"
      >
        {{ t(s.label) }}
        <span v-if="s.name === 'merchant-messages' && unanswered" class="badge">{{
          unanswered
        }}</span>
      </router-link>
    </nav>
    <slot v-if="shop" :shop="shop" />
  </portal-page>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--cg-ink-soft);
}
.picker select {
  min-width: 240px;
  padding: 10px 16px;
  border: none;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-glass-strong);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  font: inherit;
  font-size: 15px;
  color: var(--cg-ink);
}
.sub-nav {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 2px 6px;
}
.sub-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 10px 18px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
  font-weight: 800;
  text-decoration: none;
}
.sub-link.active {
  background: var(--cg-leaf);
  color: #ffffff;
}
.badge {
  min-width: 20px;
  padding: 1px 6px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-sun);
  color: var(--cg-ink);
  font-size: 12px;
  text-align: center;
}
</style>
