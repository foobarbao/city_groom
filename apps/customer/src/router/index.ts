/**
 * @file Routes of the customer app. Paths are user-visible, hence in French.
 */
import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

import MapPage from '../views/MapPage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/carte' },
  { path: '/carte', name: 'map', component: MapPage },
  // Loaded on demand to keep the initial bundle smaller.
  {
    path: '/casiers/:code',
    name: 'locker',
    component: () => import('../views/LockerPage.vue'),
    props: true,
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
