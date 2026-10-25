<script setup lang="ts">
/**
 * Frame of the merchant space: page with the shop picker. The sections are
 * reached from the side menu (`navigation.ts`). Changing shop keeps the
 * current section.
 *
 * Props:
 * - `code`: shop code from the route (first shop when empty).
 * - `section`: current section (route name), kept when the shop changes.
 *
 * Slots:
 * - default: section content.
 */
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { seedThreads } from '../data/partnerState'
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
function select(code: string): void {
  void router.replace({ name: props.section, params: { code } })
}
</script>

<template>
  <portal-page>
    <template #actions>
      <label class="picker">
        <span>{{ t('merchant.choose') }}</span>
        <select :value="shop?.code" @change="select(($event.target as HTMLSelectElement).value)">
          <option v-for="p in partners" :key="p.code" :value="p.code">{{ p.name }}</option>
        </select>
      </label>
    </template>
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
</style>
