<script setup lang="ts">
/**
 * Soft card for one local business: category, name, address, opening hours,
 * and whether a partnership exists (real businesses are shown with public data
 * before any agreement, docs/PRODUCT.md).
 *
 * Props:
 * - `merchant`: GeoJSON feature from `GET /api/v1/merchants/`.
 */
import type { MerchantFeature } from '@city-groom/api-client'
import { useI18n } from 'vue-i18n'

defineProps<{
  /** Business to show. */
  merchant: MerchantFeature
}>()

const { t } = useI18n()
</script>

<template>
  <article class="merchant-card">
    <p class="category">{{ t(`merchants.categories.${merchant.properties?.category}`) }}</p>
    <h3>{{ merchant.properties?.name }}</h3>
    <p v-if="merchant.properties?.address" class="line">{{ merchant.properties.address }}</p>
    <p v-if="merchant.properties?.opening_hours" class="line hours">
      {{ merchant.properties.opening_hours }}
    </p>
    <p class="partner" :class="{ yes: merchant.properties?.is_partner }">
      {{ merchant.properties?.is_partner ? t('merchants.partner') : t('merchants.notPartner') }}
    </p>
  </article>
</template>

<style scoped>
.merchant-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  border-radius: var(--cg-radius-l);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
}
.category {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--cg-leaf);
}
h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.line {
  margin: 0;
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.hours {
  font-variant-numeric: tabular-nums;
}
.partner {
  align-self: flex-start;
  margin: 6px 0 0;
  padding: 3px 10px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-surface-soft);
  color: var(--cg-ink-soft);
  font-size: 12px;
  font-weight: 700;
}
.partner.yes {
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
}
</style>
