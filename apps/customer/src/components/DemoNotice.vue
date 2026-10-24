<script setup lang="ts">
/** Discreet notice that the screen shows fictitious data (CODING_STANDARDS.md §10). */
import { useI18n } from 'vue-i18n'

defineProps<{ text?: string }>()
const { t } = useI18n()
</script>

<template>
  <p class="demo-notice" role="note">
    <span class="dot" aria-hidden="true" />{{ text ?? t('demo.notice') }}
  </p>
</template>

<style scoped>
.demo-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 8px 14px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-surface-soft);
  font-size: 12px;
  color: var(--cg-ink-soft);
}
.dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cg-sun);
}
</style>
