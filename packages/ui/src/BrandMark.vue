<script setup lang="ts">
/**
 * The CityPal mark: a "C" whose top end sprouts a honey leaf, on an
 * emerald-to-teal tile (docs/DESIGN.md "Brand"). Decorative: the product
 * name always sits next to it as text, so it is hidden from assistive
 * technologies. Same drawing as `packages/ui/brand/citypal-mark.svg`, the
 * source of the favicon and home-screen icons; change both together.
 *
 * Props:
 * - `size`: width and height in CSS pixels (default 32).
 */
import { useId } from "vue";

withDefaults(defineProps<{ size?: number }>(), { size: 32 });

// Each mark on the page needs its own gradient id, or a hidden one (e.g. in
// a closed menu) would blank the others.
const gradient = `citypal-tile-${useId()}`;
</script>

<template>
  <svg
    class="brand-mark"
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient :id="gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1fa67d" />
        <stop offset="0.55" stop-color="#0e7a5c" />
        <stop offset="1" stop-color="#12808a" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" :fill="`url(#${gradient})`" />
    <path
      d="M41.5 23.4A15 15 0 1 0 41.5 42.6"
      fill="none"
      stroke="#ffffff"
      stroke-width="7"
      stroke-linecap="round"
    />
    <path
      d="M41.5 23.4C40.6 16.4 44.8 11.6 52.4 11C52.8 18.6 48.6 23.6 41.5 23.4Z"
      fill="#e8c468"
    />
    <path
      d="M42.8 22.1Q46.6 17.2 50.4 13.4"
      fill="none"
      stroke="#8a6414"
      stroke-width="1.1"
      stroke-linecap="round"
      opacity="0.5"
    />
  </svg>
</template>

<style scoped>
.brand-mark {
  display: block;
  flex: none;
}
</style>
