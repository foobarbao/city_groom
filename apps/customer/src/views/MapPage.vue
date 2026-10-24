<script setup lang="ts">
/**
 * Home screen: map of Grenoble with the lockers and their availability.
 * Tapping a locker opens its page.
 */
import type { LockerFeatureCollection } from '@city-groom/api-client'
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/vue'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { fetchLockers } from '../api/lockers'
import LockerMap from '../components/LockerMap.vue'
import { useErrorMessage } from '../composables/useErrorMessage'

const { t } = useI18n()
const router = useIonRouter()
const toMessage = useErrorMessage()

const lockers = ref<LockerFeatureCollection | null>(null)
const error = ref<string | null>(null)

async function load(): Promise<void> {
  error.value = null
  try {
    lockers.value = await fetchLockers()
  } catch (e) {
    error.value = toMessage(e)
  }
}

onMounted(load)
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ t('map.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :scroll-y="false">
      <div v-if="error" class="state">
        <ion-text color="danger">
          <p>{{ error }}</p>
        </ion-text>
        <ion-button @click="load">{{ t('errors.retry') }}</ion-button>
      </div>
      <div v-else-if="!lockers" class="state">
        <ion-spinner />
        <p>{{ t('map.loading') }}</p>
      </div>
      <template v-else>
        <locker-map :lockers="lockers" @select="(code) => router.push(`/casiers/${code}`)" />
        <p class="notice">{{ t('app.simulatedNotice') }}</p>
      </template>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
  text-align: center;
}
.notice {
  position: absolute;
  left: 8px;
  top: 8px;
  margin: 0;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  background: rgb(255 255 255 / 85%);
  color: #264653;
}
</style>
