<script setup lang="ts">
/**
 * Side menu of the customer app (docs/DESIGN.md "Navigation"): name, signed-in
 * person, folding tree of the screens (`navigation.ts`) with counters
 * (quotes to answer, active consigne bookings).
 *
 * A fixed column on wide screens, a drawer behind the menu button on phones
 * (Ionic split pane, `App.vue`). The groups leading to the current screen
 * unfold on their own. Below the screens, the "Installer l'application"
 * button while the app runs in a browser tab.
 */
import { BrandMark, NavTree } from '@city-groom/ui'
import { IonContent, menuController } from '@ionic/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { NAVIGATION, trail } from '../navigation'
import InstallAppButton from './InstallAppButton.vue'
import { useAccountStore } from '../stores/account'

const { t } = useI18n()
const route = useRoute()
const account = useAccountStore()

const routeName = computed(() => String(route.name ?? ''))
const badges = computed<Record<string, number>>(() => ({
  quotes: account.pendingQuotes.length,
  bookings: account.activeBookings.length,
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

/** On phones the menu is a drawer: close it once a screen is chosen. */
function navigated(): void {
  void menuController.close()
}
</script>

<template>
  <ion-content class="app-nav">
    <nav class="nav" :aria-label="t('nav.label')">
      <router-link class="brand" to="/accueil" @click="navigated">
        <brand-mark :size="32" />
        <span>
          <strong>{{ t('app.name') }}</strong>
          <span class="who">{{
            account.state.signedIn ? account.state.name : t('nav.guest')
          }}</span>
        </span>
      </router-link>
      <nav-tree
        :nodes="NAVIGATION"
        :depth="0"
        :route="routeName"
        :open="open"
        :params="{}"
        :badges="badges"
        :translate="t"
        @toggle="toggle"
        @navigate="navigated"
      />
      <install-app-button variant="compact" />
    </nav>
  </ion-content>
</template>

<style scoped>
.app-nav {
  --background: var(--cg-glass);
}
.nav {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: calc(16px + env(safe-area-inset-top, 0px)) 12px 16px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 12px;
  border-bottom: 1px solid var(--cg-surface-soft);
  color: var(--cg-ink);
  text-decoration: none;
}
.brand strong {
  display: block;
  font-size: 16px;
  font-weight: 700;
}
.who {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
</style>
