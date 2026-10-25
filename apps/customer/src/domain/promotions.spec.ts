/**
 * Tests of the promotions shown to a customer.
 */
import type { DemoPack, DemoPromotion } from '@city-groom/demo-data'
import { describe, expect, it } from 'vitest'

import { eligiblePromotions } from './promotions'

const pack: DemoPack = {
  code: 'weekly_shirts',
  name: 'Pack semaine',
  kind: 'weekly_pack',
  items: [{ service: 'shirt_ironing', quantity: 5 }],
  weeks_per_purchase: 4,
  welcome_weekly_price: '10.00',
  weekly_prices: { plus: '20.00' },
  size: 'XL',
  turnaround_rounds: 3,
}
const welcome: DemoPromotion = {
  code: 'welcome',
  pack: 'weekly_shirts',
  audience: 'first_purchase',
  badge: 'Offre de bienvenue',
  title: 't',
  text: 'x',
  theme: 'sun',
}

describe('promotions', () => {
  it('shows the welcome offer with the welcome price to new customers', () => {
    const shown = eligiblePromotions([welcome], [pack], 'free', () => false)
    expect(shown).toHaveLength(1)
    expect(shown[0]).toMatchObject({ weeklyCents: 1000, totalCents: 4000 })
  })

  it('hides it once the pack was bought, and hides unknown packs', () => {
    expect(eligiblePromotions([welcome], [pack], 'plus', () => true)).toEqual([])
    expect(eligiblePromotions([{ ...welcome, pack: 'nope' }], [pack], 'free', () => false)).toEqual(
      [],
    )
  })

  it('shows "all" promotions with the price, or "from" the subscriber price', () => {
    const all = { ...welcome, audience: 'all' as const }
    expect(eligiblePromotions([all], [pack], 'plus', () => true)[0]).toMatchObject({
      available: true,
      weeklyCents: 2000,
    })
    expect(eligiblePromotions([all], [pack], 'free', () => true)[0]).toMatchObject({
      available: false,
      weeklyCents: 2000,
    })
  })
})
