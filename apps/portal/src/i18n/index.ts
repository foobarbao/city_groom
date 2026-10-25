/**
 * @file vue-i18n setup. Every user-facing string goes through `t()`.
 */
import { createI18n } from 'vue-i18n'

import fr from './fr'

export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'fr',
  messages: { fr },
})
