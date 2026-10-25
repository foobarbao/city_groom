<script setup lang="ts">
/**
 * Root component: side menu and pages (docs/DESIGN.md "Partner portal
 * navigation").
 *
 * The Ionic split pane shows the menu as a fixed column from 992 px wide
 * (`lg`) and as a drawer below, opened by the menu button of each page. The
 * mission page is a full-screen story: the menu is off there.
 */
import { IonApp, IonMenu, IonRouterOutlet, IonSplitPane } from '@ionic/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import PortalNav from './components/PortalNav.vue'

const route = useRoute()
const immersive = computed(() => route.name === 'mission')
</script>

<template>
  <ion-app>
    <ion-split-pane content-id="main" when="lg" :disabled="immersive">
      <ion-menu content-id="main" type="overlay" :disabled="immersive" class="portal-menu">
        <portal-nav />
      </ion-menu>
      <ion-router-outlet id="main" />
    </ion-split-pane>
  </ion-app>
</template>

<style>
/* Menu column: a little wider than Ionic's default, separated by a hairline. */
ion-split-pane {
  --side-width: 272px;
  --side-max-width: 272px;
  --border: 1px solid var(--cg-surface-soft);
}
</style>
