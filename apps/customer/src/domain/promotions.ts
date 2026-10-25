/**
 * @file Promotions shown to a customer (docs/PRODUCT.md "Promotions"): the
 * catalogue's promotions they are eligible for, with the price of their
 * pack. Prices always come from the pack rules (`pack.ts`), never from the
 * promotion texts.
 */
import type { DemoPack, DemoPromotion } from '@city-groom/demo-data'

import { lowestPlanWeeklyCents, packPrice } from './pack'

/**
 * A promotion ready to display: with the customer's price when they can
 * buy, else with the lowest subscriber price ("dès … avec un abonnement").
 */
export interface ShownPromotion {
  promotion: DemoPromotion
  pack: DemoPack
  available: boolean
  weeklyCents: number
  totalCents: number
}

/**
 * Promotions for a customer: their pack exists and the audience matches
 * ("first_purchase": never bought the pack). A promotion the customer
 * cannot buy yet (subscription required) is kept for "all" audiences, to
 * show the offer, and dropped for "first_purchase" ones.
 */
export function eligiblePromotions(
  promotions: DemoPromotion[],
  packs: DemoPack[],
  plan: string,
  hasBought: (packCode: string) => boolean,
): ShownPromotion[] {
  return promotions.flatMap((promotion): ShownPromotion[] => {
    const pack = packs.find((p) => p.code === promotion.pack)
    if (!pack) return []
    const bought = hasBought(pack.code)
    if (promotion.audience === 'first_purchase' && bought) return []
    const price = packPrice(pack, plan, bought)
    if (price.available) {
      return [
        {
          promotion,
          pack,
          available: true,
          weeklyCents: price.weeklyCents,
          totalCents: price.totalCents,
        },
      ]
    }
    const lowest = lowestPlanWeeklyCents(pack)
    if (promotion.audience !== 'all' || lowest === null) return []
    return [{ promotion, pack, available: false, weeklyCents: lowest, totalCents: lowest }]
  })
}
