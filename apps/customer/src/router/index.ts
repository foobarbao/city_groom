/**
 * @file Routes of the customer app. Paths are user-visible, hence in French.
 *
 * Every screen lives inside the tab bar (`TabsPage`); each tab has its own
 * history, as in native mobile apps.
 */
import { createMemoryHistory, createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

import HomePage from '../views/HomePage.vue'
import TabsPage from '../views/TabsPage.vue'

// Screens other than the home page are loaded on demand.
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: TabsPage,
    children: [
      { path: '', redirect: '/accueil' },
      { path: 'accueil', name: 'home', component: HomePage },
      { path: 'carte', name: 'map', component: () => import('../views/MapPage.vue') },
      {
        path: 'casiers/:code',
        name: 'locker',
        component: () => import('../views/LockerPage.vue'),
        props: true,
      },
      { path: 'boutiques', name: 'shops', component: () => import('../views/ShopsPage.vue') },
      {
        path: 'boutiques/:code',
        name: 'shop',
        component: () => import('../views/ShopPage.vue'),
        props: true,
      },
      { path: 'commander', name: 'checkout', component: () => import('../views/CheckoutPage.vue') },
      { path: 'consigne', name: 'consigne', component: () => import('../views/ConsignePage.vue') },
      {
        path: 'consigne/reserver',
        name: 'consigne-book',
        component: () => import('../views/ConsigneBookPage.vue'),
      },
      {
        path: 'consigne/:id',
        name: 'booking',
        component: () => import('../views/BookingPage.vue'),
        props: true,
      },
      { path: 'messages', name: 'messages', component: () => import('../views/MessagesPage.vue') },
      {
        path: 'messages/:shop',
        name: 'chat',
        component: () => import('../views/ChatPage.vue'),
        props: true,
      },
      { path: 'compte', name: 'account', component: () => import('../views/AccountPage.vue') },
      {
        path: 'compte/abonnement',
        name: 'plans',
        component: () => import('../views/PlansPage.vue'),
      },
      {
        path: 'compte/commandes',
        name: 'orders',
        component: () => import('../views/OrdersPage.vue'),
      },
      {
        path: 'compte/avis/:order',
        name: 'review',
        component: () => import('../views/ReviewPage.vue'),
        props: true,
      },
    ],
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
