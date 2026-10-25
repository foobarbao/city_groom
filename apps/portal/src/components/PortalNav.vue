<script setup lang="ts">
/**
 * Side menu of the partner portal (docs/DESIGN.md "Partner portal
 * navigation"): brand, folding tree of the spaces and their pages
 * (`navigation.ts`), link to the customer app.
 *
 * Shown as a fixed column on wide screens and as a drawer behind the menu
 * button on narrow ones (Ionic split pane, `App.vue`). The groups leading to
 * the current page unfold on their own; the others keep the state the person
 * chose.
 */
import { IonContent, IonIcon, menuController } from '@ionic/vue'
import { openOutline, phonePortraitOutline } from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { operatorAlerts } from '../data/operator'
import { awaitsAnswer, threadsOf } from '../data/partnerState'
import { activity, lockers, partnerOrFirst } from '../data/source'
import { NavTree } from '@city-groom/ui'

import { NAVIGATION, trail } from '../navigation'

const { t } = useI18n()
const route = useRoute()

/** The customer app is a separate app, served next to the portal on the demo site. */
const customerUrl = import.meta.env.VITE_CUSTOMER_URL ?? 'http://localhost:5173/'

const routeName = computed(() => String(route.name ?? ''))
const shop = computed(() => {
  const code = typeof route.params.code === 'string' ? route.params.code : undefined
  return partnerOrFirst(code)?.code ?? ''
})
const alertCount = operatorAlerts(lockers, activity.orders).length
const badges = computed<Record<string, number>>(() => ({
  messages: shop.value ? threadsOf(shop.value).filter(awaitsAnswer).length : 0,
  alerts: alertCount,
}))

const open = ref<string[]>([])
watch(
  routeName,
  (name) => {
    for (const node of trail(name))
      if (node.kind === 'group' && !open.value.includes(node.id)) open.value.push(node.id)
  },
  { immediate: true },
)

function toggle(id: string): void {
  const index = open.value.indexOf(id)
  if (index === -1) open.value.push(id)
  else open.value.splice(index, 1)
}

/** On small screens the menu is a drawer: close it once a page is chosen. */
function navigated(): void {
  void menuController.close()
}
</script>

<template>
  <ion-content class="portal-nav">
    <nav class="nav" :aria-label="t('nav.label')">
      <router-link class="brand" to="/" @click="navigated">
        <span class="logo" aria-hidden="true">C</span>
        <span>
          <strong>{{ t('app.name') }}</strong>
          <span class="tag">{{ t('nav.demo') }}</span>
        </span>
      </router-link>
      <nav-tree
        :nodes="NAVIGATION"
        :depth="0"
        :route="routeName"
        :open="open"
        :params="{ code: shop }"
        :badges="badges"
        :translate="t"
        @toggle="toggle"
        @navigate="navigated"
      />
      <a class="external" :href="customerUrl">
        <ion-icon :icon="phonePortraitOutline" aria-hidden="true" />
        <span>{{ t('nav.customerApp') }}</span>
        <ion-icon class="out" :icon="openOutline" aria-hidden="true" />
      </a>
    </nav>
  </ion-content>
</template>

<style scoped>
.portal-nav {
  --background: var(--cg-glass);
}
.nav {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
  padding: 18px 12px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 10px;
  border-bottom: 1px solid var(--cg-surface-soft);
  color: var(--cg-ink);
  text-decoration: none;
}
.brand strong {
  display: block;
  font-size: 16px;
  font-weight: 700;
}
.tag {
  font-size: 12px;
  color: var(--cg-ink-soft);
}
.logo {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--cg-leaf), var(--cg-teal));
  color: #ffffff;
  font-weight: 700;
}
.external {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 10px;
  border-top: 1px solid var(--cg-surface-soft);
  color: var(--cg-ink-soft);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}
.external ion-icon {
  font-size: 18px;
}
.external .out {
  margin-left: auto;
  font-size: 14px;
}
</style>
