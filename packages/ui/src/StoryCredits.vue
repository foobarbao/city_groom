<script setup lang="ts">
/**
 * Photo credits closing a photo story (see `story.ts`), as the photos'
 * licences require: title linked to the original, author, licence.
 *
 * Props:
 * - `photos`: the photos shown in the story.
 * - `title`, `intro`: translated heading and introduction.
 */
import type { StoryPhoto } from "./story";

defineProps<{ photos: StoryPhoto[]; title: string; intro: string }>();
</script>

<template>
  <footer class="story-credits story-glass">
    <h2>{{ title }}</h2>
    <p>{{ intro }}</p>
    <ul>
      <li v-for="photo in photos" :key="photo.file">
        <a :href="photo.sourceUrl" target="_blank" rel="noopener">{{
          photo.title
        }}</a>
        — {{ photo.author }},
        <a :href="photo.licenseUrl" target="_blank" rel="noopener">{{
          photo.license
        }}</a>
      </li>
    </ul>
  </footer>
</template>
