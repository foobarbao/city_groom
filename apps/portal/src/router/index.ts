/**
 * @file Routes of the partner portal. Paths are user-visible, hence in French.
 */
import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

import HomePage from '../views/HomePage.vue'

// Spaces are loaded on demand: the home page stays light (charts, map and
// dataset are only downloaded when a space is opened).
const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/mission', name: 'mission', component: () => import('../views/MissionPage.vue') },
  {
    path: '/commerce/:code?',
    name: 'merchant',
    component: () => import('../views/MerchantPage.vue'),
    props: true,
  },
  {
    path: '/commerce/:code/tournees',
    name: 'merchant-rounds',
    component: () => import('../views/MerchantRoundsPage.vue'),
    props: true,
  },
  {
    path: '/commerce/:code/messages',
    name: 'merchant-messages',
    component: () => import('../views/MerchantMessagesPage.vue'),
    props: true,
  },
  {
    path: '/commerce/:code/avis',
    name: 'merchant-reviews',
    component: () => import('../views/MerchantReviewsPage.vue'),
    props: true,
  },
  {
    path: '/commerce/:code/services',
    name: 'merchant-services',
    component: () => import('../views/MerchantServicesPage.vue'),
    props: true,
  },
  { path: '/coursier', name: 'courier', component: () => import('../views/CourierPage.vue') },
  {
    path: '/coursier/tournee',
    name: 'courier-round',
    component: () => import('../views/CourierRoundPage.vue'),
  },
  { path: '/exploitation', name: 'operator', component: () => import('../views/OperatorPage.vue') },
  {
    path: '/exploitation/casiers/:code',
    name: 'operator-locker',
    component: () => import('../views/OperatorLockerPage.vue'),
    props: true,
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
