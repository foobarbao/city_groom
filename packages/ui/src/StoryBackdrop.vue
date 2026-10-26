<script setup lang="ts">
/**
 * Decorative background of a photo story (see `story.ts`): every photo is
 * stacked behind the transparent header and content, only the active one is
 * visible, with a slow zoom and a dark green veil so white text stays
 * readable whatever the theme. Place it directly in `ion-page`, before the
 * header.
 *
 * Also holds the shared, unscoped styles of story pages: `story-header`,
 * `story-content`, `story` (main), `story-chapter` (`left`, `right`,
 * `center`), `story-eyebrow`, `story-lead`, `story-scroll-hint`,
 * `story-glass`, `story-points`, `story-actions`, `story-button`
 * (`primary`), `story-credits`.
 *
 * Props:
 * - `photos`: the photos, in chapter order.
 * - `active`: index of the visible photo.
 * - `requested`: indexes of the photos to download.
 */
import type { StoryPhoto } from "./story";

defineProps<{ photos: StoryPhoto[]; active: number; requested: Set<number> }>();
</script>

<template>
  <div class="story-backdrop" aria-hidden="true">
    <div
      v-for="(photo, index) in photos"
      :key="photo.file"
      class="story-photo"
      :class="{ active: index === active }"
      :style="{
        backgroundImage: requested.has(index) ? `url(${photo.src})` : undefined,
        backgroundPosition: photo.focus,
      }"
    />
    <div class="story-veil" />
  </div>
</template>

<style>
/* The page sits on photos whatever the theme: text is always light on a dark veil. */
.story-header ion-toolbar {
  --background: transparent;
  --color: #fff;
}
.story-header ion-back-button,
.story-header ion-menu-button {
  --color: #fff;
}
.story-content {
  --background: transparent;
}
.story-backdrop {
  position: absolute;
  z-index: 0;
  background: #13201c;
  inset: 0;
  overflow: hidden;
}
.story-photo {
  position: absolute;
  inset: 0;
  background-size: cover;
  opacity: 0;
  transform: scale(1.08);
  transition:
    opacity 1.4s ease,
    transform 12s ease-out;
}
.story-photo.active {
  opacity: 1;
  transform: scale(1);
}
/* Darkens the photos enough for white text, greener at the bottom. */
.story-veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgb(10 25 20 / 45%) 0%,
      rgb(10 25 20 / 25%) 40%,
      rgb(16 48 38 / 70%) 100%
    ),
    rgb(0 0 0 / 15%);
}
.story {
  position: relative;
  color: #fff;
}
.story-chapter {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  max-width: 1080px;
  margin: 0 auto;
  padding: 96px 16px;
}
.story-chapter.left {
  align-items: flex-start;
}
.story-chapter.right {
  align-items: flex-end;
}
.story-chapter.center {
  align-items: center;
  gap: 18px;
  text-align: center;
}
.story h1 {
  margin: 0;
  max-width: 820px;
  font-size: clamp(36px, 7vw, 68px);
  font-weight: 600;
  line-height: 1.05;
  text-shadow: 0 4px 30px rgb(0 0 0 / 35%);
}
.story-eyebrow {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #b9f0d2;
}
.story-lead {
  margin: 0;
  max-width: 640px;
  font-size: clamp(17px, 2.2vw, 21px);
  line-height: 1.5;
  text-shadow: 0 2px 16px rgb(0 0 0 / 40%);
}
.story-scroll-hint {
  margin: 40px 0 0;
  font-weight: 700;
  opacity: 0.85;
  animation: story-float 2.4s ease-in-out infinite;
}
@keyframes story-float {
  50% {
    transform: translateY(8px);
  }
}
/* Frosted card that keeps the text readable over any photo. */
.story-glass {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 560px;
  padding: 28px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: var(--cg-radius-l);
  background: rgb(14 36 29 / 58%);
  backdrop-filter: blur(14px) saturate(1.2);
  box-shadow: 0 20px 50px rgb(0 0 0 / 25%);
}
.story-glass h2,
.story-chapter.center h2 {
  margin: 0;
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 600;
  line-height: 1.15;
}
.story-glass p {
  margin: 0;
  font-size: 17px;
  line-height: 1.6;
}
.story-points {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}
.story-points li {
  position: relative;
  padding-left: 28px;
  font-weight: 700;
}
.story-points li::before {
  content: "";
  position: absolute;
  top: 0.45em;
  left: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #7fe0ae;
}
.story-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}
.story-button {
  padding: 14px 22px;
  border: 1px solid rgb(255 255 255 / 60%);
  border-radius: var(--cg-radius-pill);
  background: transparent;
  color: #fff;
  font: inherit;
  font-weight: 600;
  text-decoration: none;
  backdrop-filter: blur(8px);
  cursor: pointer;
}
.story-button.primary {
  border-color: transparent;
  background: #3f9a73;
}
.story-button:hover,
.story-button:focus-visible {
  box-shadow: 0 8px 24px rgb(0 0 0 / 30%);
}
.story-button:disabled {
  opacity: 0.6;
  cursor: default;
}
.story-credits {
  max-width: 1048px;
  margin: 0 auto 40px;
  font-size: 13px;
}
/* The credits card is wider than the chapter cards; margins keep a gutter on phones. */
@media (max-width: 1080px) {
  .story-credits {
    margin: 0 16px 40px;
  }
}
.story-credits h2 {
  font-size: 17px;
}
.story-credits p {
  font-size: 13px;
}
.story-credits ul {
  margin: 0;
  padding-left: 18px;
  line-height: 1.6;
}
.story-credits a {
  color: #b9f0d2;
}
@media (prefers-reduced-motion: reduce) {
  .story-photo {
    transform: none;
    transition: opacity 0.3s linear;
  }
  .story-photo.active {
    transform: none;
  }
  .story-scroll-hint {
    animation: none;
  }
}
</style>
