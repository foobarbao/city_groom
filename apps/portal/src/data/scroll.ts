/**
 * @file Smooth scrolling to a part of the page after an action (e.g. to the
 * offer editor when it opens).
 */
import { nextTick } from 'vue'

/** Scrolls an element into view once the DOM is updated. */
export async function reveal(element: HTMLElement | null): Promise<void> {
  await nextTick()
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
