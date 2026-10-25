<script setup lang="ts">
/**
 * One row of a list (orders, consigne bookings, quotes), built like the side
 * menu (owner, 2026-10-25: an icon on every row, the title, then discreet
 * description text):
 *
 *   [icon]  Title                        [status tag]
 *           Discreet description
 *           (extra lines from the default slot)
 *
 * With `to`, the whole card is clickable through its title link (stretched
 * over the card), so buttons in the `actions` slot stay separate controls
 * instead of being nested in a link.
 */
import { IonIcon } from '@ionic/vue'
import type { RouteLocationRaw } from 'vue-router'

import type { ItemIcon } from '../utils/icons'

defineProps<{
  /** Icon of the item (Ionicons icon or category pictogram). */
  icon: ItemIcon
  /** Colour family of the icon tile. */
  tone?: 'leaf' | 'teal' | 'sky' | 'sun' | 'plum'
  title: string
  /** Discreet line under the title. */
  description?: string
  /** Status tag on the right, with its tone (`.pill.<tone>`). */
  status?: { label: string; tone: string }
  to?: RouteLocationRaw
}>()
</script>

<template>
  <div class="soft-card list-row" :class="{ linked: to }">
    <span class="icon" :class="`tone-${tone ?? 'leaf'}`" aria-hidden="true">
      <ion-icon v-if="icon.icon" :icon="icon.icon" />
      <svg v-else viewBox="0 0 24 24" width="20" height="20"><path :d="icon.path" /></svg>
    </span>
    <span class="text">
      <span class="head">
        <router-link v-if="to" :to="to" class="title stretched">{{ title }}</router-link>
        <strong v-else class="title">{{ title }}</strong>
        <span v-if="status" class="pill" :class="status.tone">{{ status.label }}</span>
      </span>
      <span v-if="description" class="description">{{ description }}</span>
      <slot />
      <span v-if="$slots.actions" class="actions"><slot name="actions" /></span>
    </span>
  </div>
</template>

<style scoped>
.list-row {
  position: relative;
  display: grid;
  grid-template-columns: 36px 1fr;
  align-items: start;
  gap: 12px;
  padding: 14px 16px;
  color: inherit;
  text-decoration: none;
}
.icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--cg-radius-m);
  background: color-mix(in srgb, var(--tone) 14%, transparent);
  color: var(--tone);
  font-size: 19px;
}
.icon svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.tone-leaf {
  --tone: var(--cg-leaf);
}
.tone-teal {
  --tone: var(--cg-teal);
}
.tone-sky {
  --tone: var(--cg-sky);
}
.tone-sun {
  --tone: var(--cg-sun-strong);
}
.tone-plum {
  --tone: var(--cg-plum);
}
.text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--cg-ink);
}
/* The title link covers the whole card. */
.stretched {
  text-decoration: none;
}
.stretched::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}
.linked:hover {
  box-shadow: var(--cg-shadow-strong);
}
/* Clicks on the tag reach the card link; buttons stay above it. */
.pill {
  pointer-events: none;
}
.actions {
  position: relative;
  z-index: 1;
}
.description {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.text :deep(.line) {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
</style>
