<script setup lang="ts">
/**
 * Card of one shop in the catalogue: category, name, rating (partners) or
 * "not yet a partner" (other businesses, never rated: ADR-0008).
 *
 * Props:
 * - `shop`: shop to show.
 */
import { useI18n } from 'vue-i18n'

import type { Shop } from '../domain/shops'
import RatingStars from './RatingStars.vue'

defineProps<{ shop: Shop }>()
const { t } = useI18n()
</script>

<template>
  <router-link class="shop-card" :to="`/boutiques/${shop.code}`">
    <span class="mark" :class="{ partner: shop.partner }" aria-hidden="true">
      {{ shop.name.replace('Démo · ', '').charAt(0) }}
    </span>
    <span class="body">
      <span class="name">{{ shop.name }}</span>
      <span class="meta">{{ t(`merchants.categories.${shop.category}`) }}</span>
      <span v-if="shop.rating" class="rating">
        <rating-stars :model-value="shop.rating.average" :size="14" />
        <strong>{{ shop.rating.average.toLocaleString('fr-FR') }}</strong>
        <span class="meta">({{ t('shops.ratingCount', shop.rating.count) }})</span>
      </span>
      <span v-else class="meta">{{ t('shops.notPartner') }}</span>
    </span>
    <span v-if="shop.partner" class="pill">{{ t('shops.partner') }}</span>
  </router-link>
</template>

<style scoped>
.shop-card {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: var(--cg-radius-l);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  color: inherit;
  text-decoration: none;
}
.mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-surface-soft);
  font-weight: 600;
  font-size: 20px;
  color: var(--cg-ink-soft);
}
.mark.partner {
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
}
.body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 600;
  color: var(--cg-ink);
}
.meta {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.rating {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
</style>
