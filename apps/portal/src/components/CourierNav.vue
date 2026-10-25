<script setup lang="ts">
/**
 * Menu of the courier space: presentation of the activity (to approach
 * courier partners) and the round sheet (to work during a round).
 *
 * Props:
 * - `current`: route name of the current tab.
 */
import { useI18n } from 'vue-i18n'

defineProps<{ current: 'courier' | 'courier-round' }>()
const { t } = useI18n()
</script>

<template>
  <nav class="sub-nav" :aria-label="t('courier.title')">
    <router-link
      :to="{ name: 'courier' }"
      class="sub-link"
      :class="{ active: current === 'courier' }"
      :aria-current="current === 'courier' ? 'page' : undefined"
    >
      {{ t('courier.nav.overview') }}
    </router-link>
    <router-link
      :to="{ name: 'courier-round' }"
      class="sub-link"
      :class="{ active: current === 'courier-round' }"
      :aria-current="current === 'courier-round' ? 'page' : undefined"
    >
      {{ t('courier.nav.sheet') }}
    </router-link>
  </nav>
</template>

<style scoped>
.sub-nav {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 2px 6px;
}
.sub-link {
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
</style>
