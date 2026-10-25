<script setup lang="ts">
/**
 * Connectors of the merchant planning: every way to bring it into the tools
 * the merchant already uses — calendars, planners, to-do lists — grouped by
 * kind of tool, with an honest status (works now, simulated, coming).
 *
 * DEMO: the subscription address is fictitious and the webhook address is
 * only stored on this device; nothing leaves the browser (connectors.ts).
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import MerchantShell from '../components/MerchantShell.vue'
import { buildAgenda } from '../data/agenda'
import { CONNECTORS, type Connector, demoFeedUrl, webhookPayload } from '../data/connectors'
import { setWebhook, webhookOf } from '../data/partnerState'
import { activity, demoNow, partnerOrFirst, serviceName } from '../data/source'

const props = defineProps<{ code?: string }>()
const { t } = useI18n()

const shop = computed(() => partnerOrFirst(props.code))
const GROUPS: Connector['group'][] = ['calendar', 'planner', 'automation']
const ofGroup = (group: Connector['group']): Connector[] =>
  CONNECTORS.filter((c) => c.group === group)

const feedUrl = computed(() => demoFeedUrl(shop.value?.code ?? ''))
const copied = ref(false)
async function copyFeed(): Promise<void> {
  try {
    await navigator.clipboard.writeText(feedUrl.value)
    copied.value = true
  } catch {
    copied.value = false // clipboard refused: the address stays selectable
  }
}

const hookDraft = ref('')
const hookSaved = computed(() => webhookOf(shop.value?.code ?? ''))
const hookValid = computed(() => /^https:\/\/\S+$/.test(hookDraft.value.trim()))
function saveHook(): void {
  if (shop.value && hookValid.value) setWebhook(shop.value.code, hookDraft.value.trim())
  hookDraft.value = ''
}

/** Example body: the next task of this shop, as the webhook would receive it. */
const example = computed(() => {
  const code = shop.value?.code ?? ''
  const week = new Date(demoNow.getTime() + 7 * 86_400_000)
  const task = buildAgenda(
    activity.orders.filter((o) => o.merchant === code),
    demoNow,
    week,
  )[0]
  if (!task) return null
  // Same titles as on the planning screen.
  const first = task.orders[0]
  const items = task.orders.reduce((sum, o) => sum + o.items, 0)
  const title =
    task.kind === 'work' && first
      ? t('merchant.agenda.work', { count: first.items, service: serviceName(first.service) })
      : t(`merchant.agenda.${task.kind === 'arrival' ? 'arrival' : 'handover'}`, items)
  return JSON.stringify(webhookPayload(code, task, 'agenda.task.scheduled', title), null, 2)
})
</script>

<template>
  <merchant-shell :code="code" section="merchant-agenda">
    <p class="intro">{{ t('merchant.connectors.intro') }}</p>

    <section v-for="group in GROUPS" :key="group" class="card">
      <h2>{{ t(`merchant.connectors.groups.${group}`) }}</h2>
      <p class="note">{{ t(`merchant.connectors.groupsHint.${group}`) }}</p>
      <ul class="list">
        <li v-for="c in ofGroup(group)" :key="c.id" class="connector">
          <div class="head">
            <strong>{{ t(`merchant.connectors.items.${c.id}.name`) }}</strong>
            <span class="status" :class="c.status">{{
              t(`merchant.connectors.status.${c.status}`)
            }}</span>
          </div>
          <p>{{ t(`merchant.connectors.items.${c.id}.text`) }}</p>

          <router-link
            v-if="c.status === 'ready'"
            class="action"
            :to="{ name: 'merchant-agenda', params: { code: shop?.code } }"
          >
            {{ t('merchant.connectors.openPlanning') }}
          </router-link>

          <div v-else-if="c.id === 'icalFeed'" class="feed">
            <input :value="feedUrl" readonly :aria-label="t('merchant.connectors.feedLabel')" />
            <button type="button" @click="copyFeed">
              {{ copied ? t('merchant.connectors.copied') : t('merchant.connectors.copy') }}
            </button>
          </div>

          <form v-else-if="c.id === 'webhook'" class="hook" @submit.prevent="saveHook">
            <p v-if="hookSaved" class="saved">
              ✓ {{ t('merchant.connectors.hookSaved', { url: hookSaved }) }}
              <button type="button" class="link" @click="shop && setWebhook(shop.code, '')">
                {{ t('merchant.connectors.hookRemove') }}
              </button>
            </p>
            <div class="feed">
              <input
                v-model="hookDraft"
                type="url"
                inputmode="url"
                placeholder="https://hooks.zapier.com/…"
                :aria-label="t('merchant.connectors.hookLabel')"
              />
              <button type="submit" :disabled="!hookValid">
                {{ t('merchant.connectors.hookSave') }}
              </button>
            </div>
            <details v-if="example">
              <summary>{{ t('merchant.connectors.payload') }}</summary>
              <pre>{{ example }}</pre>
            </details>
          </form>
        </li>
      </ul>
    </section>
    <p class="note">{{ t('merchant.connectors.demo') }}</p>
  </merchant-shell>
</template>

<style scoped>
.intro {
  margin: 0;
  color: var(--cg-ink-soft);
}
.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.connector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-surface);
}
.connector p {
  margin: 0;
  font-size: 14px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.status {
  flex: none;
  padding: 2px 10px;
  border-radius: var(--cg-radius-pill);
  font-size: 12px;
  font-weight: 600;
}
.status.ready {
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
}
.status.simulated {
  background: var(--cg-sun-soft);
  color: var(--cg-ink);
}
.status.planned {
  background: var(--cg-surface-soft);
  color: var(--cg-ink-soft);
}
.action {
  align-self: flex-start;
  color: var(--cg-leaf);
  font-weight: 600;
}
.feed {
  display: flex;
  gap: 6px;
}
input {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border: 1px solid var(--cg-locker-door-edge);
  border-radius: var(--cg-radius-s);
  background: var(--cg-ground);
  color: var(--cg-ink);
  font: inherit;
  font-size: 13px;
}
button {
  font: inherit;
  cursor: pointer;
}
.feed button {
  padding: 8px 14px;
  border: none;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-leaf);
  color: #ffffff;
  font-weight: 600;
}
.feed button:disabled {
  opacity: 0.5;
  cursor: default;
}
.hook {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.saved {
  overflow-wrap: anywhere;
  color: var(--cg-pine);
}
.link {
  padding: 0;
  border: none;
  background: none;
  color: var(--cg-leaf);
  font-weight: 600;
}
summary {
  font-size: 13px;
  font-weight: 600;
  color: var(--cg-leaf);
  cursor: pointer;
}
pre {
  max-height: 260px;
  overflow: auto;
  padding: 10px;
  border-radius: var(--cg-radius-s);
  background: var(--cg-surface-soft);
  font-size: 12px;
}
</style>
