/**
 * @file Current dispatch of the weekly packs (INTERNAL, operator and laundry
 * views): active packs, laundry availability from the partner state, and the
 * allocation of `packs.ts`. Reactive: it follows the declared availability.
 */
import type { DemoPack } from '@city-groom/demo-data'
import { computed } from 'vue'

import {
  DEFAULT_CAPACITY_SHIRTS,
  DEMO_ACTIVE_PACKS,
  PACK_CATEGORIES,
  allocatePacks,
  packQuantities,
  packsBoughtOnDevice,
} from './packs'
import { packCapacityOf } from './partnerState'
import { catalogue, partners } from './source'

export const weeklyPack = catalogue.packs[0] as DemoPack
export const perPack = packQuantities(weeklyPack)

/** Laundries able to process the pack, with their declared availability. */
export const packLaundries = computed(() =>
  partners
    .filter((p) => PACK_CATEGORIES.includes(p.category))
    .map((p) => ({
      code: p.code,
      name: p.name,
      capacityShirts: packCapacityOf(p.code) ?? DEFAULT_CAPACITY_SHIRTS,
    })),
)

/** Active packs: fictitious ones plus those bought on this device. */
export const activePacks = computed(() => DEMO_ACTIVE_PACKS + packsBoughtOnDevice())

/** Weekly allocation of the active packs to the laundries. */
export const packDispatch = computed(() =>
  allocatePacks(activePacks.value, packLaundries.value, perPack),
)
