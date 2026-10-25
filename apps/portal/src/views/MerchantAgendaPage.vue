<script setup lang="ts">
/**
 * Merchant planning: the week day by day, with what is scheduled (courier
 * visits bringing items, work to do, handovers to the courier) and the
 * details of every order. Each task can be marked done from here.
 *
 * Google Agenda is synchronised (googleCalendar.ts): once connected, every
 * task is written in a "CityPal" calendar and kept up to date, including the
 * "done" check. Other calendars: .ics export and per-task links.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import MerchantShell from '../components/MerchantShell.vue'
import { type AgendaTask, TASK_MINUTES, buildAgenda, tasksOfDay } from '../data/agenda'
import {
  type CalendarEvent,
  googleCalendarUrl,
  outlookCalendarUrl,
  toIcs,
} from '../data/calendarExport'
import { clock, euros, longDay, shortDay } from '../data/format'
import { GOOGLE_CLIENT_ID, requestToken, revokeToken, validToken } from '../data/googleAuth'
import {
  CALENDAR_SCOPE,
  GoogleCalendarError,
  createCalendar,
  eventId,
  toGoogleEvent,
  upsertEvent,
} from '../data/googleCalendar'
import {
  googleCalendarOf,
  isTaskDone,
  markSynced,
  setGoogleCalendar,
  toggleTask,
} from '../data/partnerState'
import { activity, demoNow, partnerOrFirst, serviceName } from '../data/source'

const props = defineProps<{ code?: string }>()
const { t } = useI18n()

const DAYS = 7
const tz = activity.timezone
const dayOf = (d: Date): string => d.toLocaleDateString('sv-SE', { timeZone: tz })
const days = Array.from({ length: DAYS }, (_, i) =>
  dayOf(new Date(demoNow.getTime() + i * 86_400_000)),
)
const from = new Date(`${days[0]}T00:00:00Z`)
from.setTime(from.getTime() - 3 * 3_600_000) // includes the early hours of the first local day
const to = new Date(new Date(`${days[DAYS - 1]}T23:59:59Z`).getTime() + 3 * 3_600_000)

const shop = computed(() => partnerOrFirst(props.code))
const tasks = computed(() =>
  buildAgenda(
    activity.orders.filter((o) => o.merchant === shop.value?.code),
    from,
    to,
  ),
)
const selected = ref(days[0] as string)
const ofDay = computed(() => tasksOfDay(tasks.value, selected.value, tz))
const openCount = (day: string): number =>
  tasksOfDay(tasks.value, day, tz).filter((x) => !isTaskDone(x.id)).length
const expanded = ref<string | null>(null)

const items = (task: AgendaTask): number => task.orders.reduce((s, o) => s + o.items, 0)
function title(task: AgendaTask): string {
  const first = task.orders[0]
  if (task.kind === 'work' && first)
    return t('merchant.agenda.work', { count: first.items, service: serviceName(first.service) })
  return task.kind === 'arrival'
    ? t('merchant.agenda.arrival', items(task))
    : t('merchant.agenda.handover', items(task))
}
function event(task: AgendaTask): CalendarEvent {
  const end = new Date(task.at)
  const start = new Date(end.getTime() - (task.kind === 'work' ? TASK_MINUTES.work * 60_000 : 0))
  const finish = new Date(
    start.getTime() + (task.kind === 'work' ? TASK_MINUTES.work : TASK_MINUTES[task.kind]) * 60_000,
  )
  return {
    uid: `${shop.value?.code}-${task.id}`,
    start,
    end: finish,
    title: `CityPal · ${title(task)}`,
    description: task.orders
      .map((o) => `${o.id} · ${o.items} × ${serviceName(o.service)} (${o.size})`)
      .join('\n'),
  }
}

// --- Google Agenda sync ----------------------------------------------------

const googleLink = computed(() => (shop.value ? googleCalendarOf(shop.value.code) : null))
/** `pending`: changes made while the Google permission had expired. */
const syncStatus = ref<'idle' | 'syncing' | 'pending' | 'error'>('idle')
const syncedCount = ref(0)

function googleBody(task: AgendaTask): Record<string, unknown> {
  return toGoogleEvent(event(task), isTaskDone(task.id), tz)
}

/** Writes every task of the week; recreates the calendar if it was deleted. */
async function syncAll(token: string, retry = true): Promise<void> {
  const code = shop.value?.code
  if (!code) return
  let link = googleCalendarOf(code)
  if (!link) {
    setGoogleCalendar(code, await createCalendar(token, `CityPal · ${shop.value?.name}`, tz))
    link = googleCalendarOf(code)
  }
  if (!link) return
  try {
    for (const task of tasks.value)
      await upsertEvent(token, link.calendarId, eventId(code, task.id), googleBody(task))
  } catch (error) {
    // 404 / 403: the calendar was deleted in Google Agenda, or is not ours any more.
    if (retry && error instanceof GoogleCalendarError && [403, 404].includes(error.status)) {
      setGoogleCalendar(code, null)
      return syncAll(token, false)
    }
    throw error
  }
  syncedCount.value = tasks.value.length
  markSynced(code)
}

/** Connects or re-synchronises (from a click: Google may show its consent screen). */
async function syncGoogle(): Promise<void> {
  syncStatus.value = 'syncing'
  try {
    await syncAll(validToken() ?? (await requestToken(CALENDAR_SCOPE)))
    syncStatus.value = 'idle'
  } catch {
    syncStatus.value = 'error'
  }
}

function disconnectGoogle(): void {
  revokeToken()
  if (shop.value) setGoogleCalendar(shop.value.code, null)
  syncStatus.value = 'idle'
}

/** Marks a task done and, when connected, updates its Google Agenda event at once. */
function toggle(task: AgendaTask): void {
  toggleTask(task.id, task.kind === 'handover' ? task.orders.map((o) => o.id) : [])
  const link = googleLink.value
  const code = shop.value?.code
  if (!link || !code) return
  const token = validToken()
  if (!token) {
    syncStatus.value = 'pending'
    return
  }
  upsertEvent(token, link.calendarId, eventId(code, task.id), googleBody(task)).catch(() => {
    syncStatus.value = 'error'
  })
}

function exportWeek(): void {
  const blob = new Blob([toIcs(tasks.value.map(event))], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `citypal-planning-${shop.value?.code}.ics`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <merchant-shell :code="code" section="merchant-agenda">
    <div class="top">
      <p class="intro">{{ t('merchant.agenda.intro') }}</p>
      <button class="export" type="button" @click="exportWeek">
        📅 {{ t('merchant.agenda.export') }}
      </button>
    </div>

    <section class="card gsync" :class="{ on: googleLink }">
      <div class="gsync-text">
        <h2>{{ t('merchant.agenda.gsync.title') }}</h2>
        <p v-if="!GOOGLE_CLIENT_ID" class="note">{{ t('merchant.agenda.gsync.notConfigured') }}</p>
        <p v-else-if="!googleLink">{{ t('merchant.agenda.gsync.pitch') }}</p>
        <p v-else>
          {{
            googleLink.lastSyncAt
              ? t('merchant.agenda.gsync.synced', {
                  time: clock(googleLink.lastSyncAt),
                  count: syncedCount || tasks.length,
                })
              : t('merchant.agenda.gsync.connected')
          }}
        </p>
        <p v-if="syncStatus === 'pending'" class="warn">{{ t('merchant.agenda.gsync.pending') }}</p>
        <p v-if="syncStatus === 'error'" class="warn" role="alert">
          {{ t('merchant.agenda.gsync.error') }}
        </p>
      </div>
      <div class="gsync-actions">
        <button
          type="button"
          class="export"
          :disabled="!GOOGLE_CLIENT_ID || syncStatus === 'syncing'"
          @click="syncGoogle"
        >
          {{
            syncStatus === 'syncing'
              ? t('merchant.agenda.gsync.syncing')
              : googleLink
                ? t('merchant.agenda.gsync.syncNow')
                : t('merchant.agenda.gsync.connect')
          }}
        </button>
        <button v-if="googleLink" type="button" class="link" @click="disconnectGoogle">
          {{ t('merchant.agenda.gsync.disconnect') }}
        </button>
      </div>
    </section>

    <div class="week" role="tablist" :aria-label="t('merchant.agenda.week')">
      <button
        v-for="d in days"
        :key="d"
        type="button"
        role="tab"
        class="day"
        :class="{ active: d === selected }"
        :aria-selected="d === selected"
        @click="selected = d"
      >
        <span class="day-name">{{ shortDay(d) }}</span>
        <span class="day-count" :class="{ none: !openCount(d) }">{{
          t('merchant.agenda.open', openCount(d))
        }}</span>
      </button>
    </div>

    <section class="card">
      <h2>{{ longDay(`${selected}T12:00:00Z`) }}</h2>
      <p v-if="!ofDay.length" class="note">{{ t('merchant.agenda.nothing') }}</p>
      <ol class="timeline">
        <li
          v-for="task in ofDay"
          :key="task.id"
          class="task"
          :class="[task.kind, { done: isTaskDone(task.id) }]"
        >
          <span class="time">{{ clock(task.at) }}</span>
          <div class="task-body">
            <span class="kind">{{ t(`merchant.agenda.kinds.${task.kind}`) }}</span>
            <strong class="task-title">{{ title(task) }}</strong>
            <button
              class="details-toggle"
              type="button"
              :aria-expanded="expanded === task.id"
              @click="expanded = expanded === task.id ? null : task.id"
            >
              {{
                expanded === task.id
                  ? t('merchant.agenda.hide')
                  : t('merchant.agenda.details', task.orders.length)
              }}
            </button>
            <table v-if="expanded === task.id" class="details">
              <thead>
                <tr>
                  <th scope="col">{{ t('merchant.agenda.order') }}</th>
                  <th scope="col">{{ t('merchant.agenda.service') }}</th>
                  <th scope="col">{{ t('merchant.agenda.size') }}</th>
                  <th scope="col">{{ t('merchant.agenda.handoverCol') }}</th>
                  <th scope="col" class="num">{{ t('merchant.agenda.amount') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in task.orders" :key="o.id">
                  <td>{{ o.id }}</td>
                  <td>{{ o.items }} × {{ serviceName(o.service) }}</td>
                  <td>{{ o.size }}</td>
                  <td>
                    {{ o.returned_at ? `${shortDay(o.returned_at)} ${clock(o.returned_at)}` : '—' }}
                  </td>
                  <td class="num">{{ euros(Number.parseFloat(o.price_total)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="task-actions">
            <button
              type="button"
              class="done-btn"
              :aria-pressed="isTaskDone(task.id)"
              @click="toggle(task)"
            >
              {{
                isTaskDone(task.id)
                  ? `✓ ${t('merchant.agenda.done')}`
                  : t('merchant.agenda.markDone')
              }}
            </button>
            <span class="gcal">
              {{ t('merchant.agenda.addTo') }}
              <template v-if="!googleLink">
                <a :href="googleCalendarUrl(event(task))" target="_blank" rel="noopener">{{
                  t('merchant.agenda.google')
                }}</a>
                ·
              </template>
              <a :href="outlookCalendarUrl(event(task))" target="_blank" rel="noopener">{{
                t('merchant.agenda.outlook')
              }}</a>
            </span>
          </div>
        </li>
      </ol>
    </section>
    <section class="card sync">
      <h2>{{ t('merchant.agenda.syncTitle') }}</h2>
      <p>{{ t('merchant.agenda.syncImport') }}</p>
      <p class="note">{{ t('merchant.agenda.syncLater') }}</p>
      <router-link
        class="export connectors"
        :to="{ name: 'merchant-connectors', params: { code: shop?.code } }"
      >
        🔌 {{ t('merchant.agenda.connectors') }}
      </router-link>
    </section>
  </merchant-shell>
</template>

<style scoped>
.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.intro {
  margin: 0;
  color: var(--cg-ink-soft);
}
button {
  font: inherit;
  cursor: pointer;
}
.export {
  padding: 10px 18px;
  border: none;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-leaf);
  color: #ffffff;
  font-weight: 800;
}
.week {
  display: grid;
  grid-template-columns: repeat(7, minmax(84px, 1fr));
  gap: 8px;
  overflow-x: auto;
}
.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  border: 2px solid transparent;
  border-radius: var(--cg-radius-m);
  background: var(--cg-glass);
  backdrop-filter: var(--cg-glass-filter);
  box-shadow: var(--cg-shadow);
  color: var(--cg-ink);
}
.day.active {
  border-color: var(--cg-leaf);
  background: var(--cg-leaf-soft);
}
.day-name {
  font-weight: 800;
  text-transform: capitalize;
}
.day-count {
  padding: 2px 8px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-sun);
  font-size: 12px;
  font-weight: 800;
}
.day-count.none {
  background: var(--cg-surface-soft);
  color: var(--cg-ink-soft);
}
.timeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.task {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: start;
  gap: 12px;
  padding: 12px 14px;
  border-left: 6px solid var(--cg-leaf);
  border-radius: var(--cg-radius-m);
  background: var(--cg-surface);
}
.task.handover {
  border-left-color: var(--cg-sun);
}
.task.arrival {
  border-left-color: #6aa9d8;
}
.task.done {
  opacity: 0.55;
}
.time {
  font-size: 18px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}
.task-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.kind {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--cg-ink-soft);
}
.task-title {
  font-size: 16px;
}
.details-toggle {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  color: var(--cg-leaf);
  font-weight: 800;
}
.details {
  margin-top: 6px;
  border-collapse: collapse;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.details th,
.details td {
  padding: 4px 10px 4px 0;
  text-align: left;
  white-space: nowrap;
}
.details th {
  color: var(--cg-ink-soft);
}
.details .num {
  text-align: right;
}
.task-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.done-btn {
  padding: 8px 14px;
  border: 2px solid var(--cg-leaf);
  border-radius: var(--cg-radius-pill);
  background: transparent;
  color: var(--cg-leaf);
  font-weight: 800;
  white-space: nowrap;
}
.done-btn[aria-pressed='true'] {
  background: var(--cg-leaf);
  color: #ffffff;
}
.gcal {
  font-size: 12px;
  font-weight: 700;
  color: var(--cg-ink-soft);
}
.gsync {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.gsync.on {
  border: 2px solid var(--cg-leaf-soft);
}
.gsync h2,
.gsync p {
  margin: 0;
}
.gsync-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.gsync-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.export:disabled {
  opacity: 0.5;
  cursor: default;
}
.warn {
  color: #9a5b00;
  font-weight: 700;
}
.link {
  padding: 0;
  border: none;
  background: none;
  color: var(--cg-ink-soft);
  font-weight: 700;
  text-decoration: underline;
}
.gcal a {
  color: var(--cg-leaf);
}
.sync p {
  margin: 0;
}
.connectors {
  align-self: flex-start;
  text-decoration: none;
}
@media (max-width: 640px) {
  .task {
    grid-template-columns: 52px 1fr;
  }
  .task-actions {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
