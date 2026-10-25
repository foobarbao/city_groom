<script setup lang="ts">
/**
 * Promotion card: coloured background (theme), badge, title, pitch, weekly
 * price and a call to action. Used in the "Offres du moment" strip of the
 * home screen and at the top of the pack screen.
 *
 * Props:
 * - `promo`: promotion with its price (domain/promotions.ts).
 * - `to`: where the card leads; no link (static card) when omitted.
 */
import { IonIcon } from '@ionic/vue'
import { arrowForwardOutline } from 'ionicons/icons'
import { useI18n } from 'vue-i18n'

import type { ShownPromotion } from '../domain/promotions'
import { euros } from '../utils/format'

defineProps<{ promo: ShownPromotion; to?: string }>()
const { t } = useI18n()
</script>

<template>
  <component
    :is="to ? 'router-link' : 'article'"
    :to="to"
    class="promo"
    :class="`theme-${promo.promotion.theme}`"
  >
    <span class="badge">{{ promo.promotion.badge }}</span>
    <strong class="title">{{ promo.promotion.title }}</strong>
    <span class="text">{{ promo.promotion.text }}</span>
    <span class="price">
      <span v-if="!promo.available">{{ t('promo.from') }}</span>
      <strong>{{ euros(promo.weeklyCents) }}</strong>
      <span>{{ t('promo.perWeek') }}</span>
    </span>
    <span class="terms">{{
      !promo.available
        ? t('promo.withSubscription')
        : promo.pack.weeks_per_purchase > 1
          ? t('promo.terms', {
              total: euros(promo.totalCents),
              weeks: promo.pack.weeks_per_purchase,
            })
          : t('promo.noCommitment')
    }}</span>
    <span v-if="to" class="cta">
      {{ promo.available ? t('promo.cta') : t('promo.see') }}
      <ion-icon :icon="arrowForwardOutline" aria-hidden="true" />
    </span>
  </component>
</template>

<style scoped>
/* Fixed colours on purpose: a promotion keeps its colours in dark mode,
   like a printed flyer; text contrast is checked on each theme. */
.promo {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
  padding: 18px;
  border-radius: var(--cg-radius-l);
  color: #12352a;
  text-decoration: none;
  box-shadow: var(--cg-shadow-strong);
  transition:
    transform var(--cg-motion) var(--cg-ease),
    box-shadow var(--cg-motion) var(--cg-ease);
}
a.promo:hover,
a.promo:focus-visible {
  transform: translateY(-3px);
}
a.promo:active {
  transform: scale(0.985);
}
/* A light sheen sweeps across the card every few seconds: the offer catches
   the eye without blinking. */
.promo::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 45%;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 35%), transparent);
  animation: cg-sheen 6s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}
/* A soft disc in the corner gives depth without imagery. */
.promo::after {
  content: '';
  position: absolute;
  right: -50px;
  bottom: -60px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: rgb(255 255 255 / 22%);
  pointer-events: none;
  z-index: 0;
}
/* Content above the decorative disc. */
.promo > * {
  position: relative;
  z-index: 1;
}
.theme-sun {
  background: linear-gradient(135deg, #ecd08a 0%, #f6e7bf 100%);
}
.theme-leaf {
  background: linear-gradient(135deg, #0f6b47 0%, #1b9463 100%);
  color: #ffffff;
}
.theme-coral {
  background: linear-gradient(135deg, #f2a585 0%, #ffd2bd 100%);
}
.badge {
  align-self: flex-start;
  padding: 3px 10px;
  border-radius: var(--cg-radius-pill);
  background: #12352a;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
}
.theme-leaf .badge {
  background: #ffffff;
  color: #0f6b47;
}
.title {
  font-size: 19px;
  font-weight: 700;
  line-height: 1.25;
}
.text {
  font-size: 14px;
  opacity: 0.85;
}
.price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 4px;
}
.price strong {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.terms {
  font-size: 13px;
  opacity: 0.8;
}
.cta {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  margin-top: 6px;
  padding: 8px 14px;
  border-radius: var(--cg-radius-m);
  background: #12352a;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}
.theme-leaf .cta {
  background: #ffffff;
  color: #0f6b47;
}
</style>
