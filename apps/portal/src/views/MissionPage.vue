<script setup lang="ts">
/**
 * "Notre mission" page: the project's double mission (everyday convenience and
 * ecology, with technology in their service), told in full-screen chapters
 * over photos of green Grenoble streets.
 *
 * A photo story (`@city-groom/ui`, `useStory`): the photos form a fixed
 * background that cross-fades to the next photo as each chapter scrolls into
 * view; the photos loop, so the page can grow by any number of chapters.
 * Photo credits are shown at the bottom, as their licences require
 * (`src/data/missionPhotos.ts`).
 *
 * The page shows no figures, hence no "fictitious data" notice
 * (unlike `PortalPage`).
 */
import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonToolbar } from '@ionic/vue'
import { useI18n } from 'vue-i18n'

import { StoryBackdrop, StoryCredits, useStory } from '@city-groom/ui'

import { missionPhotos } from '../data/missionPhotos'

const { t, tm, rt } = useI18n()

/** The customer app is a separate app, served next to the portal on the demo site. */
const customerUrl = import.meta.env.VITE_CUSTOMER_URL ?? 'http://localhost:5173/'

/** Chapters in reading order; keys under `mission.chapters` in the i18n messages. */
const chapters = ['double', 'time', 'green', 'local', 'tech', 'public'] as const

/** Bullet points of a chapter (some chapters have none). */
function points(chapter: (typeof chapters)[number]): string[] {
  const messages = tm(`mission.chapters.${chapter}.points`)
  return Array.isArray(messages) ? messages.map((message) => rt(message)) : []
}

const { content, active, requested, photoFor } = useStory(missionPhotos.length)
</script>

<template>
  <ion-page>
    <story-backdrop :photos="missionPhotos" :active="active" :requested="requested" />
    <ion-header class="ion-no-border story-header" translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="t('mission.back')" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content fullscreen class="story-content">
      <main ref="content" class="story">
        <section class="story-chapter center" :data-photo="photoFor(0)">
          <p class="story-eyebrow">{{ t('mission.hero.eyebrow') }}</p>
          <h1>{{ t('mission.hero.title') }}</h1>
          <p class="story-lead">{{ t('mission.hero.text') }}</p>
          <p class="story-scroll-hint" aria-hidden="true">{{ t('mission.hero.scroll') }} ↓</p>
        </section>

        <section
          v-for="(chapter, index) in chapters"
          :key="chapter"
          class="story-chapter"
          :class="index % 2 ? 'right' : 'left'"
          :data-photo="photoFor(index + 1)"
        >
          <article class="story-glass">
            <p class="story-eyebrow">{{ t(`mission.chapters.${chapter}.eyebrow`) }}</p>
            <h2>{{ t(`mission.chapters.${chapter}.title`) }}</h2>
            <p>{{ t(`mission.chapters.${chapter}.text`) }}</p>
            <ul v-if="points(chapter).length" class="story-points">
              <li v-for="point in points(chapter)" :key="point">{{ point }}</li>
            </ul>
          </article>
        </section>

        <section class="story-chapter center" :data-photo="photoFor(chapters.length + 1)">
          <h2>{{ t('mission.closing.title') }}</h2>
          <p class="story-lead">{{ t('mission.closing.text') }}</p>
          <div class="story-actions">
            <a class="story-button primary" :href="customerUrl">{{
              t('mission.closing.customer')
            }}</a>
            <router-link class="story-button" to="/">{{ t('mission.closing.home') }}</router-link>
          </div>
        </section>

        <story-credits
          :photos="missionPhotos"
          :title="t('mission.credits.title')"
          :intro="t('mission.credits.intro')"
        />
      </main>
    </ion-content>
  </ion-page>
</template>
