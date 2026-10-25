/**
 * @file Smooth scrolling to the next part of a form after a choice, so the
 * customer sees what comes next (e.g. the "Continuer" button below a list).
 */
import { type ComponentPublicInstance, nextTick } from 'vue'

/**
 * Scrolls an element (or a component's root element) to the middle of the
 * screen once the DOM is updated.
 */
export async function reveal(target: HTMLElement | ComponentPublicInstance | null): Promise<void> {
  await nextTick()
  const element = target instanceof HTMLElement ? target : (target?.$el as HTMLElement | undefined)
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
