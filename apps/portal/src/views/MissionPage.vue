<script setup lang="ts">
/**
 * "Notre mission" page: the project's double mission (everyday convenience and
 * ecology, with technology in their service), told in full-screen chapters
 * over photos of green Grenoble streets.
 *
 * The photos form a fixed background that cross-fades to the next photo as
 * each chapter scrolls into view; the photos loop, so the page can grow by any
 * number of chapters. Photo credits are shown at the bottom, as their licences
 * require (`src/data/missionPhotos.ts`).
 *
 * The page shows no figures, hence no "fictitious data" notice
 * (unlike `PortalPage`).
 */
import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonToolbar } from '@ionic/vue'
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

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

/** Index of the photo shown behind the chapter currently in view. */
const activePhoto = ref(0)
/**
 * Photos already requested: the active one and the next one, so that the
 * cross-fade never waits, while photos far down the page are only downloaded
 * if the visitor scrolls that far.
 */
const requested = reactive(new Set<number>())
watch(
  activePhoto,
  (index) => {
    requested.add(index)
    requested.add(photoFor(index + 1))
  },
  { immediate: true },
)
/** Page content; its sections with a `data-photo` attribute select the photo. */
const content = ref<HTMLElement>()
let observer: IntersectionObserver | undefined

onMounted(() => {
  // A section takes over the background when it crosses the middle of the
  // screen: the root margin shrinks the viewport to a line at mid-height.
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activePhoto.value = Number((entry.target as HTMLElement).dataset.photo ?? 0)
        }
      }
    },
    { rootMargin: '-50% 0px -50% 0px' },
  )
  for (const section of content.value?.querySelectorAll('[data-photo]') ?? []) {
    observer.observe(section)
  }
})

onBeforeUnmount(() => observer?.disconnect())

/** Photo for the n-th section, looping over the available photos. */
function photoFor(index: number): number {
  return index % missionPhotos.length
}
</script>

<template>
  <ion-page>
    <!-- Decorative background behind the transparent header and content:
         every photo is stacked, only the active one is visible. -->
    <div class="backdrop" aria-hidden="true">
      <div
        v-for="(photo, index) in missionPhotos"
        :key="photo.file"
        class="photo"
        :class="{ active: index === activePhoto }"
        :style="{
          backgroundImage: requested.has(index) ? `url(${photo.src})` : undefined,
          backgroundPosition: photo.focus,
        }"
      />
      <div class="veil" />
    </div>
    <ion-header class="ion-no-border mission-header" translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="t('mission.back')" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content fullscreen class="mission-content">
      <main ref="content" class="mission">
        <section class="chapter hero" :data-photo="photoFor(0)">
          <p class="eyebrow">{{ t('mission.hero.eyebrow') }}</p>
          <h1>{{ t('mission.hero.title') }}</h1>
          <p class="lead">{{ t('mission.hero.text') }}</p>
          <p class="scroll-hint" aria-hidden="true">{{ t('mission.hero.scroll') }} ↓</p>
        </section>

        <section
          v-for="(chapter, index) in chapters"
          :key="chapter"
          class="chapter"
          :class="index % 2 ? 'right' : 'left'"
          :data-photo="photoFor(index + 1)"
        >
          <article class="glass">
            <p class="eyebrow">{{ t(`mission.chapters.${chapter}.eyebrow`) }}</p>
            <h2>{{ t(`mission.chapters.${chapter}.title`) }}</h2>
            <p>{{ t(`mission.chapters.${chapter}.text`) }}</p>
            <ul v-if="points(chapter).length" class="points">
              <li v-for="point in points(chapter)" :key="point">{{ point }}</li>
            </ul>
          </article>
        </section>

        <section class="chapter closing" :data-photo="photoFor(chapters.length + 1)">
          <h2>{{ t('mission.closing.title') }}</h2>
          <p class="lead">{{ t('mission.closing.text') }}</p>
          <div class="actions">
            <a class="button primary" :href="customerUrl">{{ t('mission.closing.customer') }}</a>
            <router-link class="button" to="/">{{ t('mission.closing.home') }}</router-link>
          </div>
        </section>

        <footer class="credits glass">
          <h2>{{ t('mission.credits.title') }}</h2>
          <p>{{ t('mission.credits.intro') }}</p>
          <ul>
            <li v-for="photo in missionPhotos" :key="photo.file">
              <a :href="photo.sourceUrl" target="_blank" rel="noopener">{{ photo.title }}</a>
              — {{ photo.author }},
              <a :href="photo.licenseUrl" target="_blank" rel="noopener">{{ photo.license }}</a>
            </li>
          </ul>
        </footer>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
/* The page sits on photos whatever the theme: text is always light on a dark veil. */
.mission-header ion-toolbar {
  --background: transparent;
  --color: #fff;
}
.mission-header ion-back-button {
  --color: #fff;
}
.mission-content {
  --background: transparent;
}
.backdrop {
  position: absolute;
  z-index: 0;
  background: #13201c;
  inset: 0;
  overflow: hidden;
}
.photo {
  position: absolute;
  inset: 0;
  background-size: cover;
  opacity: 0;
  transform: scale(1.08);
  transition:
    opacity 1.4s ease,
    transform 12s ease-out;
}
.photo.active {
  opacity: 1;
  transform: scale(1);
}
/* Darkens the photos enough for white text, greener at the bottom. */
.veil {
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
.mission {
  position: relative;
  color: #fff;
}
.chapter {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  max-width: 1080px;
  margin: 0 auto;
  padding: 96px 16px;
}
.chapter.left {
  align-items: flex-start;
}
.chapter.right {
  align-items: flex-end;
}
.hero,
.closing {
  align-items: center;
  text-align: center;
  gap: 18px;
}
h1 {
  margin: 0;
  max-width: 820px;
  font-size: clamp(36px, 7vw, 68px);
  font-weight: 600;
  line-height: 1.05;
  text-shadow: 0 4px 30px rgb(0 0 0 / 35%);
}
.eyebrow {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #b9f0d2;
}
.lead {
  margin: 0;
  max-width: 640px;
  font-size: clamp(17px, 2.2vw, 21px);
  line-height: 1.5;
  text-shadow: 0 2px 16px rgb(0 0 0 / 40%);
}
.scroll-hint {
  margin: 40px 0 0;
  font-weight: 700;
  opacity: 0.85;
  animation: float 2.4s ease-in-out infinite;
}
@keyframes float {
  50% {
    transform: translateY(8px);
  }
}
/* Frosted card that keeps the text readable over any photo. */
.glass {
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
.glass h2,
.closing h2 {
  margin: 0;
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 600;
  line-height: 1.15;
}
.glass p {
  margin: 0;
  font-size: 17px;
  line-height: 1.6;
}
.points {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}
.points li {
  position: relative;
  padding-left: 28px;
  font-weight: 700;
}
.points li::before {
  content: '';
  position: absolute;
  top: 0.45em;
  left: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #7fe0ae;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}
.button {
  padding: 14px 22px;
  border: 1px solid rgb(255 255 255 / 60%);
  border-radius: var(--cg-radius-pill);
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  backdrop-filter: blur(8px);
}
.button.primary {
  border-color: transparent;
  background: #3f9a73;
}
.button:hover,
.button:focus-visible {
  box-shadow: 0 8px 24px rgb(0 0 0 / 30%);
}
.credits {
  max-width: 1048px;
  margin: 0 auto 40px;
  font-size: 13px;
}
/* The credits card is wider than the chapter cards; margins keep a gutter on phones. */
@media (max-width: 1080px) {
  .credits {
    margin: 0 16px 40px;
  }
}
.credits h2 {
  font-size: 17px;
}
.credits p {
  font-size: 13px;
}
.credits ul {
  margin: 0;
  padding-left: 18px;
  line-height: 1.6;
}
.credits a {
  color: #b9f0d2;
}
@media (prefers-reduced-motion: reduce) {
  .photo {
    transform: none;
    transition: opacity 0.3s linear;
  }
  .photo.active {
    transform: none;
  }
  .scroll-hint {
    animation: none;
  }
}
</style>
