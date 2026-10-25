/**
 * @file Entry point of the customer app.
 */
import { IonicVue } from '@ionic/vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

/* Ionic core and recommended CSS */
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/display.css'
import '@fontsource-variable/inter'
import '@city-groom/ui/src/theme.css'
import './styles.css'

import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'

const app = createApp(App).use(IonicVue).use(createPinia()).use(i18n).use(router)

// The memory history of the single-page demo starts nowhere: open the home page.
if (import.meta.env.VITE_OFFLINE_MAP === 'true') void router.push('/accueil')

router
  .isReady()
  .then(() => app.mount('#app'))
  .catch((error: unknown) => {
    // Routing cannot fail at startup unless the app is broken; log for diagnosis.
    console.error('Router failed to initialise', error)
  })
