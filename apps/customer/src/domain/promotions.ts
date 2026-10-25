/**
 * @file Promotions shown to a customer (docs/PRODUCT.md "Promotions"): the
 * catalogue's promotions they are eligible for, with the price of their
 * pack. Prices always come from the pack rules (`pack.ts`), never from the
 * promotion texts.
 */
import type { DemoPack, DemoPromotion } from '@city-groom/demo-data'

import { packPrice } from './pack'

/** A promotion ready to display. */
export interface ShownPromotion {
  promotion: DemoPromotion
  pack: DemoPack
  weeklyCents: number
  totalCents: number
}

/**
 * Promotions for a customer: their pack exists, the audience matches
 * ("first_purchase": never bought the pack) and the customer can buy it.
 */
export function eligiblePromotions(
  promotions: DemoPromotion[],
  packs: DemoPack[],
  plan: string,
  hasBought: (packCode: string) => boolean,
): ShownPromotion[] {
  return promotions.flatMap((promotion) => {
    const pack = packs.find((p) => p.code === promotion.pack)
    if (!pack) return []
    const bought = hasBought(pack.code)
    if (promotion.audience === 'first_purchase' && bought) return []
    const price = packPrice(pack, plan, bought)
    if (!price.available) return []
    return [{ promotion, pack, weeklyCents: price.weeklyCents, totalCents: price.totalCents }]
  })
}
