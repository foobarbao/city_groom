<script setup lang="ts">
/**
 * Rating out of 5 as stars: read-only display (with half stars), or input
 * when `editable` (one button per star, keyboard accessible).
 *
 * Props:
 * - `value`: rating from 0 to 5 (v-model when editable).
 * - `editable`: show buttons to choose the rating.
 * - `size`: star size in pixels.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{ editable?: boolean; size?: number }>(), {
  editable: false,
  size: 16,
})
const value = defineModel<number>({ default: 0 })
const { t } = useI18n()

/** Fill of each star, from 0 to 1. */
const fills = computed(() =>
  [1, 2, 3, 4, 5].map((n) => Math.max(0, Math.min(1, value.value - n + 1))),
)
const STAR = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z'
const uid = Math.random().toString(36).slice(2)
</script>

<template>
  <div
    class="stars"
    :role="editable ? 'radiogroup' : 'img'"
    :aria-label="editable ? t('review.question') : t('shop.outOf5', { rating: value })"
  >
    <component
      :is="editable ? 'button' : 'span'"
      v-for="(fill, i) in fills"
      :key="i"
      class="star"
      :type="editable ? 'button' : undefined"
      :role="editable ? 'radio' : undefined"
      :aria-checked="editable ? value === i + 1 : undefined"
      :aria-label="editable ? t('review.stars', i + 1) : undefined"
      @click="editable && (value = i + 1)"
    >
      <svg :width="props.size" :height="props.size" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient :id="`g-${uid}-${i}`">
            <stop :offset="fill" stop-color="var(--cg-sun)" />
            <stop :offset="fill" stop-color="var(--cg-surface-soft)" />
          </linearGradient>
        </defs>
        <path :d="STAR" :fill="`url(#g-${uid}-${i})`" />
      </svg>
    </component>
  </div>
</template>

<style scoped>
.stars {
  display: inline-flex;
  gap: 2px;
  align-items: center;
}
.star {
  display: inline-flex;
  padding: 0;
  border: none;
  background: none;
  line-height: 0;
}
button.star {
  padding: 4px;
  border-radius: 50%;
  cursor: pointer;
}
button.star:focus-visible {
  outline: 3px solid var(--cg-leaf);
}
</style>
