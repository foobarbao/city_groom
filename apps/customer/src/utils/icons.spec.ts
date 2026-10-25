import { barbellOutline, shirtOutline } from 'ionicons/icons'
import { describe, expect, it } from 'vitest'

import { catalogue } from '../services/catalogue'
import { CATEGORY_ICONS, orderIcon } from './icons'

describe('orderIcon', () => {
  it('uses the menu icons for Swap Sport and the weekly pack', () => {
    expect(orderIcon({ kind: 'exchange', shopCode: 'citypal' })).toEqual({ icon: barbellOutline })
    expect(orderIcon({ packId: 'p1', shopCode: 'citypal' })).toEqual({ icon: shirtOutline })
  })

  it("uses the pictogram of the shop's category", () => {
    const partner = catalogue.partners[0]!
    expect(orderIcon({ shopCode: partner.code })).toEqual({
      path: CATEGORY_ICONS[partner.category],
    })
  })

  it('falls back to the shirt for an unknown shop', () => {
    expect(orderIcon({ shopCode: 'unknown' })).toEqual({ icon: shirtOutline })
  })
})
