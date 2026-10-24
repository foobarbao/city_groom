/**
 * @file Entry point of the partner portal.
 */
import { IonicVue } from '@ionic/vue'
import { createApp } from 'vue'

/* Ionic core and recommended CSS */
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@fontsource-variable/nunito'
import '@city-groom/ui/src/theme.css'
import './styles.css'

import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'

const app = createApp(App).use(IonicVue).use(i18n).use(router)

router
  .isReady()
  .then(() => app.mount('#app'))
  .catch((error: unknown) => {
    // Routing cannot fail at startup unless the app is broken; log for diagnosis.
    console.error('Router failed to initialise', error)
  })
