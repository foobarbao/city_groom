<script setup lang="ts">
/**
 * Merchant services: which services are offered through CityPal, at which
 * price and with which turnaround (in days, i.e. rounds).
 *
 * DEMO: settings stay on the device; prices start from placeholders.
 * PROD: offers are stored by the API and shown to customers.
 */
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import MerchantShell from '../components/MerchantShell.vue'
import { type ServiceSetting, partnerState } from '../data/partnerState'
import { catalogue, partnerOrFirst } from '../data/source'

const props = defineProps<{ code?: string }>()
const { t } = useI18n()

const ROUNDS_PER_DAY = catalogue.round_times.length
const shop = computed(() => partnerOrFirst(props.code))
const services = computed(() =>
  catalogue.services.filter((s) => s.category === shop.value?.category),
)

// Settings start from the catalogue the first time a shop is opened.
watch(
  shop,
  (value) => {
    if (!value) return
    const all = (partnerState.services[value.code] ??= {})
    for (const service of services.value) {
      all[service.code] ??= {
        active: value.services.includes(service.code),
        priceCents: Math.round(Number.parseFloat(service.price) * 100),
        turnaroundRounds: service.turnaround_rounds,
      }
    }
  },
  { immediate: true },
)

/** Settings of a service of the current shop. */
const setting = (code: string): ServiceSetting =>
  partnerState.services[shop.value?.code ?? '']?.[code] as ServiceSetting
const activeCount = computed(() => services.value.filter((s) => setting(s.code).active).length)
</script>

<template>
  <merchant-shell :code="code" section="merchant-services">
    <p class="intro">{{ t('merchant.services.intro') }}</p>
    <section class="card">
      <h2>{{ t('merchant.services.title', { count: activeCount, total: services.length }) }}</h2>
      <ul class="plain-list">
        <li
          v-for="s in services"
          :key="s.code"
          class="service"
          :class="{ off: !setting(s.code).active }"
        >
          <label class="switch">
            <input v-model="setting(s.code).active" type="checkbox" />
            <strong>{{ s.name }}</strong>
          </label>
          <label class="field">
            {{ t('merchant.services.price') }}
            <span class="euro">
              <input
                type="number"
                min="0"
                step="0.5"
                inputmode="decimal"
                :value="setting(s.code).priceCents / 100"
                :disabled="!setting(s.code).active"
                @change="
                  setting(s.code).priceCents = Math.round(
                    Number(($event.target as HTMLInputElement).value) * 100,
                  )
                "
              />
              €
            </span>
          </label>
          <label class="field">
            {{ t('merchant.services.turnaround') }}
            <select
              v-model.number="setting(s.code).turnaroundRounds"
              :disabled="!setting(s.code).active"
            >
              <option v-for="d in [1, 2, 3, 5]" :key="d" :value="d * ROUNDS_PER_DAY">
                {{ t('merchant.services.days', d) }}
              </option>
            </select>
          </label>
          <span class="muted">{{ t('merchant.services.size', { size: s.size }) }}</span>
        </li>
      </ul>
      <p class="note">{{ t('merchant.services.demo') }}</p>
    </section>
  </merchant-shell>
</template>

<style scoped>
.intro {
  margin: 0;
  color: var(--cg-ink-soft);
}
.service {
  display: grid !important;
  grid-template-columns: minmax(180px, 2fr) 1fr 1fr auto;
  align-items: center;
  gap: 12px !important;
}
@media (max-width: 720px) {
  .service {
    grid-template-columns: 1fr 1fr;
  }
}
.service.off {
  opacity: 0.6;
}
.switch {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.switch input {
  width: 22px;
  height: 22px;
  accent-color: var(--cg-leaf);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--cg-ink-soft);
}
.field input,
.field select {
  padding: 8px 10px;
  border: 1px solid var(--cg-locker-door-edge);
  border-radius: var(--cg-radius-s);
  background: var(--cg-surface);
  color: var(--cg-ink);
  font: inherit;
  font-size: 15px;
}
.euro {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--cg-ink);
}
.euro input {
  width: 90px;
}
.muted {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
</style>
