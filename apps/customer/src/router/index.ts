/**
 * @file Routes of the customer app. Paths are user-visible, hence in French.
 */
import { createMemoryHistory, createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

import LockerPage from '../views/LockerPage.vue'
import MapPage from '../views/MapPage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/carte' },
  { path: '/carte', name: 'map', component: MapPage },
  { path: '/casiers/:code', name: 'locker', component: LockerPage, props: true },
]

export const router = createRouter({
  // The standalone demo runs as a single embedded page, where path-based URLs
  // are not available: navigation is kept in memory instead.
  history:
    import.meta.env.VITE_DEMO === 'true'
      ? createMemoryHistory()
      : createWebHistory(import.meta.env.BASE_URL),
  routes,
})
