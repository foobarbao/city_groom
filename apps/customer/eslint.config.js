/**
 * ESLint flat configuration: Vue 3 + TypeScript recommended rules, with
 * formatting left entirely to Prettier (CODING_STANDARDS.md §6).
 */
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  { ignores: ['dist/**', 'android/**'] },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  skipFormatting,
  {
    rules: {
      // Ionic web components use native `slot="start"` attributes, which this
      // rule mistakes for deprecated Vue 2 slot syntax.
      'vue/no-deprecated-slot-attribute': ['error', { ignore: ['/^ion-/'] }],
    },
  },
)
