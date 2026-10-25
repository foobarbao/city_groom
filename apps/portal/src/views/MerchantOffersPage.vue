<script setup lang="ts">
/**
 * Merchant offers: what the shop sells through CityPal. A few gestures to
 * create or edit an offer: photo, title, service type (how customers find
 * it), description, price, locker size and turnaround; offers can be hidden
 * without being deleted.
 *
 * DEMO: offers are stored on the device and shown in the customer app on the
 * same device (`@city-groom/demo-data`, offers.ts).
 * PROD: offers and photos are stored by the API.
 */
import { type Offer, loadOffers, offersOf, saveOffers } from '@city-groom/demo-data'
import { downscalePhoto } from '@city-groom/ui'
import { IonIcon } from '@ionic/vue'
import { cameraOutline, storefrontOutline } from 'ionicons/icons'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import MerchantShell from '../components/MerchantShell.vue'
import { euros } from '../data/format'
import { catalogue, partnerOrFirst } from '../data/source'
import { reveal } from '../data/scroll'

const props = defineProps<{ code?: string }>()
const { t } = useI18n()

const ROUNDS_PER_DAY = catalogue.round_times.length
const SIZES = ['S', 'M', 'L', 'XL']

const shop = computed(() => partnerOrFirst(props.code))
const saved = reactive(loadOffers())
const offers = computed<Offer[]>(() =>
  shop.value ? offersOf(shop.value, catalogue.services, saved) : [],
)
/** Service types of the shop's category first, then every other one. */
const serviceTypes = computed(() => [
  ...catalogue.services.filter((s) => s.category === shop.value?.category),
  ...catalogue.services.filter((s) => s.category !== shop.value?.category),
])
const serviceName = (code: string): string =>
  catalogue.services.find((s) => s.code === code)?.name ?? code

/** Offer being edited (a copy), or null. */
const draft = ref<Offer | null>(null)
const isNew = ref(false)
const storageFull = ref(false)
const editor = ref<HTMLElement | null>(null)
const priceEuros = computed({
  get: () => (draft.value ? draft.value.priceCents / 100 : 0),
  set: (value: number) => {
    if (draft.value) draft.value.priceCents = Math.round((Number(value) || 0) * 100)
  },
})
const canSave = computed(
  () => !!draft.value && draft.value.title.trim() !== '' && draft.value.priceCents > 0,
)

function persist(list: Offer[]): void {
  if (!shop.value) return
  saved[shop.value.code] = list
  storageFull.value = !saveOffers({ ...saved })
}

function create(): void {
  const first = serviceTypes.value[0]
  isNew.value = true
  draft.value = {
    id: `${shop.value?.code}-${Date.now().toString(36)}`,
    service: first?.code ?? '',
    title: '',
    description: '',
    priceCents: first ? Math.round(Number.parseFloat(first.price) * 100) : 0,
    size: first?.size ?? 'M',
    turnaroundRounds: ROUNDS_PER_DAY,
    photo: null,
    active: true,
  }
  void reveal(editor.value)
}

function edit(offer: Offer): void {
  isNew.value = false
  draft.value = { ...offer }
  void reveal(editor.value)
}

function save(): void {
  if (!draft.value || !canSave.value) return
  const offer = {
    ...draft.value,
    title: draft.value.title.trim(),
    description: draft.value.description.trim(),
  }
  persist(
    isNew.value
      ? [offer, ...offers.value]
      : offers.value.map((o) => (o.id === offer.id ? offer : o)),
  )
  draft.value = null
}

function remove(): void {
  if (!draft.value) return
  const id = draft.value.id
  persist(offers.value.filter((o) => o.id !== id))
  draft.value = null
}

function toggle(offer: Offer): void {
  persist(offers.value.map((o) => (o.id === offer.id ? { ...o, active: !o.active } : o)))
}

async function onPhoto(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file && draft.value) draft.value.photo = await downscalePhoto(file)
}
</script>

<template>
  <merchant-shell :code="code" section="merchant-services">
    <div class="top">
      <p class="intro">{{ t('merchant.offers.intro') }}</p>
      <button class="primary" type="button" @click="create">
        + {{ t('merchant.offers.new') }}
      </button>
    </div>
    <p v-if="storageFull" class="card warn">{{ t('merchant.offers.storageFull') }}</p>

    <section v-if="draft" ref="editor" class="card editor">
      <h2>{{ isNew ? t('merchant.offers.new') : t('merchant.offers.edit') }}</h2>
      <div class="editor-grid">
        <label class="photo-drop">
          <input type="file" accept="image/*" class="hidden" @change="onPhoto" />
          <img v-if="draft.photo" :src="draft.photo" :alt="t('merchant.offers.photo')" />
          <span v-else class="placeholder"
            ><ion-icon :icon="cameraOutline" aria-hidden="true" />
            {{ t('merchant.offers.addPhoto') }}</span
          >
        </label>
        <div class="fields">
          <label>
            {{ t('merchant.offers.title') }}
            <input
              v-model="draft.title"
              type="text"
              maxlength="60"
              :placeholder="t('merchant.offers.titleHint')"
            />
          </label>
          <label>
            {{ t('merchant.offers.service') }}
            <select v-model="draft.service">
              <option v-for="s in serviceTypes" :key="s.code" :value="s.code">{{ s.name }}</option>
            </select>
            <span class="hint">{{ t('merchant.offers.serviceHint') }}</span>
          </label>
          <label>
            {{ t('merchant.offers.description') }}
            <textarea
              v-model="draft.description"
              rows="3"
              maxlength="300"
              :placeholder="t('merchant.offers.descriptionHint')"
            />
          </label>
          <div class="row3">
            <label>
              {{ t('merchant.offers.price') }}
              <input
                v-model.number="priceEuros"
                type="number"
                min="0"
                step="0.5"
                inputmode="decimal"
              />
            </label>
            <label>
              {{ t('merchant.offers.size') }}
              <select v-model="draft.size">
                <option v-for="s in SIZES" :key="s" :value="s">
                  {{ t(`merchant.offers.sizes.${s}`) }}
                </option>
              </select>
            </label>
            <label>
              {{ t('merchant.offers.turnaround') }}
              <select v-model.number="draft.turnaroundRounds">
                <option v-for="d in [1, 2, 3, 5]" :key="d" :value="d * ROUNDS_PER_DAY">
                  {{ t('merchant.services.days', d) }}
                </option>
              </select>
            </label>
          </div>
          <label class="switch">
            <input v-model="draft.active" type="checkbox" />
            {{ t('merchant.offers.visible') }}
          </label>
        </div>
      </div>
      <div class="buttons">
        <button v-if="!isNew" class="danger" type="button" @click="remove">
          {{ t('merchant.offers.delete') }}
        </button>
        <span class="spacer" />
        <button class="secondary" type="button" @click="draft = null">
          {{ t('merchant.offers.cancel') }}
        </button>
        <button class="primary" type="button" :disabled="!canSave" @click="save">
          {{ t('merchant.offers.save') }}
        </button>
      </div>
    </section>

    <div class="offers">
      <article v-for="o in offers" :key="o.id" class="card offer" :class="{ off: !o.active }">
        <div class="thumb">
          <img v-if="o.photo" :src="o.photo" :alt="o.title" />
          <ion-icon v-else :icon="storefrontOutline" aria-hidden="true" />
        </div>
        <div class="offer-body">
          <strong class="offer-title">{{ o.title }}</strong>
          <span class="muted">{{ serviceName(o.service) }}</span>
          <span v-if="o.description" class="desc">{{ o.description }}</span>
          <span class="facts">
            <strong>{{ euros(o.priceCents / 100) }}</strong> ·
            {{
              t(
                'merchant.services.days',
                Math.max(1, Math.round(o.turnaroundRounds / ROUNDS_PER_DAY)),
              )
            }}
            ·
            {{ t('merchant.offers.sizeShort', { size: o.size }) }}
          </span>
        </div>
        <div class="offer-actions">
          <label class="switch small">
            <input type="checkbox" :checked="o.active" @change="toggle(o)" />
            {{ o.active ? t('merchant.offers.online') : t('merchant.offers.hidden') }}
          </label>
          <button class="secondary" type="button" @click="edit(o)">
            {{ t('merchant.offers.edit') }}
          </button>
        </div>
      </article>
    </div>
    <p class="note">{{ t('merchant.offers.demo') }}</p>
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
  padding: 10px 18px;
  border: none;
  border-radius: var(--cg-radius-pill);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.primary {
  background: var(--cg-leaf);
  color: #ffffff;
}
.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.secondary {
  background: var(--cg-surface-soft);
  color: var(--cg-ink);
}
.danger {
  background: transparent;
  color: #b3401f;
}
.warn {
  background: var(--cg-sun-soft);
}
.editor {
  border: 2px solid var(--cg-leaf);
}
.editor-grid {
  display: grid;
  grid-template-columns: minmax(200px, 260px) 1fr;
  gap: 18px;
}
@media (max-width: 720px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
}
.photo-drop {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  border: 2px dashed var(--cg-locker-door-edge);
  border-radius: var(--cg-radius-m);
  background: var(--cg-surface-soft);
  overflow: hidden;
  cursor: pointer;
}
.photo-drop img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.placeholder {
  font-weight: 600;
  color: var(--cg-ink-soft);
}
.hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fields label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--cg-ink-soft);
}
.fields input[type='text'],
.fields input[type='number'],
.fields select,
.fields textarea {
  padding: 10px 12px;
  border: 1px solid var(--cg-locker-door-edge);
  border-radius: var(--cg-radius-s);
  background: var(--cg-surface);
  color: var(--cg-ink);
  font: inherit;
  font-size: 15px;
  font-weight: 400;
}
.hint {
  font-weight: 400;
}
.row3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.switch {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 8px;
  color: var(--cg-ink) !important;
}
.switch input {
  width: 20px;
  height: 20px;
  accent-color: var(--cg-leaf);
}
.switch.small {
  font-size: 13px;
  font-weight: 600;
}
.buttons {
  display: flex;
  gap: 8px;
}
.spacer {
  flex: 1;
}
.offers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
  gap: 14px;
}
.offer {
  display: grid !important;
  grid-template-columns: 84px 1fr;
  gap: 12px !important;
}
.offer.off {
  opacity: 0.6;
}
.thumb {
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  border-radius: var(--cg-radius-m);
  background: var(--cg-leaf-soft);
  overflow: hidden;
  font-size: 30px;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.offer-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.offer-title {
  font-size: 16px;
}
.desc {
  font-size: 13px;
}
.facts {
  font-size: 13px;
}
.offer-actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.muted {
  font-size: 13px;
  color: var(--cg-ink-soft);
}
</style>
