/**
 * @file Routes of the customer app. Paths are user-visible, hence in French.
 *
 * Screens are reached from the side menu (`AppNav.vue`, `navigation.ts`);
 * the route names are the keys of the menu entries.
 */
import { createMemoryHistory, createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

import HomePage from '../views/HomePage.vue'

// Screens other than the home page are loaded on demand.
const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/accueil' },
  { path: '/accueil', name: 'home', component: HomePage },
  { path: '/carte', name: 'map', component: () => import('../views/MapPage.vue') },
  { path: '/autour', name: 'nearby', component: () => import('../views/NearbyPage.vue') },
  {
    path: '/casiers/:code',
    name: 'locker',
    component: () => import('../views/LockerPage.vue'),
    props: true,
  },
  { path: '/boutiques', name: 'shops', component: () => import('../views/ShopsPage.vue') },
  {
    path: '/boutiques/:code',
    name: 'shop',
    component: () => import('../views/ShopPage.vue'),
    props: true,
  },
  { path: '/pack', name: 'pack', component: () => import('../views/PackPage.vue') },
  {
    path: '/swap-sport',
    name: 'exchange',
    component: () => import('../views/ExchangePage.vue'),
  },
  {
    path: '/engagement',
    name: 'engagement',
    component: () => import('../views/EngagementPage.vue'),
  },
  { path: '/commander', name: 'checkout', component: () => import('../views/CheckoutPage.vue') },
  { path: '/consigne', name: 'consigne', component: () => import('../views/ConsignePage.vue') },
  {
    path: '/consigne/reserver',
    name: 'consigne-book',
    component: () => import('../views/ConsigneBookPage.vue'),
  },
  {
    path: '/consigne/:id/transfert',
    name: 'transfer',
    component: () => import('../views/TransferPage.vue'),
    props: true,
  },
  {
    path: '/consigne/:id',
    name: 'booking',
    component: () => import('../views/BookingPage.vue'),
    props: true,
  },
  { path: '/messages', name: 'messages', component: () => import('../views/MessagesPage.vue') },
  {
    path: '/messages/:shop',
    name: 'chat',
    component: () => import('../views/ChatPage.vue'),
    props: true,
  },
  { path: '/compte', name: 'account', component: () => import('../views/AccountPage.vue') },
  {
    path: '/compte/abonnement',
    name: 'plans',
    component: () => import('../views/PlansPage.vue'),
  },
  {
    path: '/compte/commandes',
    name: 'orders',
    component: () => import('../views/OrdersPage.vue'),
  },
  {
    path: '/compte/commandes/:id',
    name: 'order',
    component: () => import('../views/OrderPage.vue'),
    props: true,
  },
  {
    path: '/compte/avis/:order',
    name: 'review',
    component: () => import('../views/ReviewPage.vue'),
    props: true,
  },
  { path: '/:pathMatch(.*)*', redirect: '/accueil' },
]

export const router = createRouter({
  // The single-page demo runs embedded, where path-based URLs are not
  // available: navigation is kept in memory instead.
  history:
    import.meta.env.VITE_OFFLINE_MAP === 'true'
      ? createMemoryHistory()
      : createWebHistory(import.meta.env.BASE_URL),
  routes,
})
