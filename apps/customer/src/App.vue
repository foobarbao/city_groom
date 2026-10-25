<script setup lang="ts">
/**
 * Root component: side menu and screens (docs/DESIGN.md "Navigation").
 *
 * The Ionic split pane shows the menu as a fixed column from 992 px wide
 * (`lg`, tablets in landscape and computers) and as a drawer below, opened
 * by the menu button of each screen (`AppHeader`). Web parallel: an admin
 * sidebar that becomes an off-canvas menu on mobile.
 */
import { IonApp, IonMenu, IonRouterOutlet, IonSplitPane } from '@ionic/vue'

import AppNav from './components/AppNav.vue'
</script>

<template>
  <ion-app>
    <ion-split-pane content-id="main" when="lg">
      <ion-menu content-id="main" type="overlay">
        <app-nav />
      </ion-menu>
      <ion-router-outlet id="main" />
    </ion-split-pane>
  </ion-app>
</template>

<style>
ion-split-pane {
  --side-width: 264px;
  --side-max-width: 264px;
  --border: 1px solid var(--cg-surface-soft);
}
</style>
