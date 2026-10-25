<script setup lang="ts">
/**
 * Headline figure: a label, a large value and an optional hint underneath.
 *
 * Props: `label`, `value` (already formatted), `hint` (optional).
 */
defineProps<{
  /** What the figure measures. */
  label: string
  /** Formatted value. */
  value: string
  /** Optional context (period, comparison). */
  hint?: string
}>()
</script>

<template>
  <article class="stat-tile">
    <p class="label">{{ label }}</p>
    <p class="value">{{ value }}</p>
    <p v-if="hint" class="hint">{{ hint }}</p>
  </article>
</template>

<style scoped>
.stat-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px 18px;
  border-radius: var(--cg-radius-l);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  min-width: 0;
}
.label {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--cg-ink-soft);
}
.value {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--cg-ink);
  font-variant-numeric: tabular-nums;
}
.hint {
  margin: 0;
  font-size: 12px;
  color: var(--cg-ink-soft);
}
</style>
