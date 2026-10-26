/**
 * @file Photo stories: full-screen chapters told over photos that cross-fade
 * as each chapter scrolls into view (the portal's "Notre mission" page, the
 * customer app's scooter lockers). `StoryBackdrop.vue` draws the photos and
 * holds the shared styles (`story-*` classes, docs/DESIGN.md); this composable
 * follows which chapter is in view.
 */
import {
  type Ref,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";

/** A background photo and the credit its licence requires. */
export interface StoryPhoto {
  /** File name, unique within the story. */
  file: string;
  /** URL of the bundled file (resolved by Vite). */
  src: string;
  /** CSS `background-position` keeping the subject in frame on narrow screens. */
  focus: string;
  /** Title of the original (e.g. on Wikimedia Commons). */
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  /** Page of the original. */
  sourceUrl: string;
}

/**
 * Follows the chapter in view. Sections of `content` carrying a
 * `data-photo` attribute select the photo when they cross the middle of the
 * screen. Only the active photo and the next one are requested, so photos
 * far down the page download only if the visitor scrolls that far.
 */
export function useStory(photoCount: number): {
  content: Ref<HTMLElement | undefined>;
  active: Ref<number>;
  requested: Set<number>;
  photoFor: (index: number) => number;
} {
  /** Photo for the n-th section, looping over the available photos. */
  const photoFor = (index: number): number => index % photoCount;
  const active = ref(0);
  const requested = reactive(new Set<number>());
  watch(
    active,
    (index) => {
      requested.add(index);
      requested.add(photoFor(index + 1));
    },
    { immediate: true },
  );
  const content = ref<HTMLElement>();
  let observer: IntersectionObserver | undefined;

  onMounted(() => {
    // The root margin shrinks the viewport to a line at mid-height.
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            active.value = Number(
              (entry.target as HTMLElement).dataset.photo ?? 0,
            );
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const section of content.value?.querySelectorAll("[data-photo]") ??
      []) {
      observer.observe(section);
    }
  });
  onBeforeUnmount(() => observer?.disconnect());

  return { content, active, requested, photoFor };
}
