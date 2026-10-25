/**
 * Tests of the shop catalogue: search, ranking, grouping, prices, reviews.
 */
import type { SubscriptionPlan } from '@city-groom/demo-data'
import { describe, expect, it } from 'vitest'

import { consignePrice } from './pricing'
import { canReview, isValidRating, withRatings } from './reviews'
import { type Shop, buildIndex, groupByCategory, normalize, searchShops } from './shops'

function shop(overrides: Partial<Shop>): Shop {
  return {
    code: 'x',
    name: 'X',
    category: 'shoe_repair',
    partner: false,
    longitude: 5.72,
    latitude: 45.19,
    address: '',
    openingHours: '',
    website: '',
    services: [],
    rating: null,
    ...overrides,
  }
}

const SHOPS = [
  shop({ code: 'a', name: 'Cordonnerie Sainte-Claire', address: 'rue Lafayette' }),
  shop({
    code: 'b',
    name: 'Démo · Cordonnerie',
    partner: true,
    services: ['heel_repair'],
    rating: { average: 4.6, count: 12 },
  }),
  shop({ code: 'c', name: 'Pressing Hoche', category: 'dry_cleaning' }),
]
const LABELS: Record<string, string> = { shoe_repair: 'Cordonnerie', dry_cleaning: 'Pressing' }
const index = buildIndex(
  SHOPS,
  (c) => LABELS[c] ?? c,
  (s) => (s === 'heel_repair' ? 'Talons refaits' : s),
)

describe('shop search', () => {
  it('ignores case, accents and punctuation', () => {
    expect(normalize('Démo · Sainte-Claire')).toBe('demo sainte claire')
  })

  it('matches name, category, service and street by word prefix', () => {
    expect(searchShops(index, 'claire').map((s) => s.code)).toEqual(['a'])
    expect(searchShops(index, 'talon').map((s) => s.code)).toEqual(['b'])
    expect(searchShops(index, 'lafay').map((s) => s.code)).toEqual(['a'])
    expect(searchShops(index, 'pressing').map((s) => s.code)).toEqual(['c'])
    expect(searchShops(index, 'cordo zzz')).toEqual([])
  })

  it('lists partners first, best rated first', () => {
    expect(searchShops(index, 'cordonnerie').map((s) => s.code)).toEqual(['b', 'a'])
    expect(searchShops(index, '').map((s) => s.code)).toEqual(['b', 'a', 'c'])
  })

  it('groups by category in the given order', () => {
    const groups = groupByCategory(SHOPS, ['dry_cleaning', 'shoe_repair', 'laundry'])
    expect(groups.map((g) => [g.category, g.shops.map((s) => s.code)])).toEqual([
      ['dry_cleaning', ['c']],
      ['shoe_repair', ['b', 'a']],
    ])
  })
})

describe('consigne prices', () => {
  const plan = (discount: string): SubscriptionPlan => ({
    code: 'p',
    name: 'P',
    monthly_price: '0',
    consigne_discount: discount,
    transfers_included: 0,
    perks: [],
  })
  const prices = { S: '2.00', L: '4.00' }

  it('applies the plan discount, in cents', () => {
    expect(consignePrice(prices, 'L', plan('0'))).toEqual({ baseCents: 400, cents: 400 })
    expect(consignePrice(prices, 'L', plan('0.5'))).toEqual({ baseCents: 400, cents: 200 })
    expect(consignePrice(prices, 'XL', plan('0'))).toBeNull()
  })
})

describe('reviews', () => {
  it('allows one review per collected order', () => {
    expect(canReview({ id: 'o1', status: 'picked_up' }, new Set())).toBe(true)
    expect(canReview({ id: 'o1', status: 'picked_up' }, new Set(['o1']))).toBe(false)
    expect(canReview({ id: 'o2', status: 'at_merchant' }, new Set())).toBe(false)
    // Weekly pack orders are not tied to one shop.
    expect(canReview({ id: 'o3', status: 'picked_up', packId: 'P-1' }, new Set())).toBe(false)
  })

  it('accepts whole ratings from 1 to 5 and updates the average', () => {
    expect([0, 1, 4.5, 5, 6].map(isValidRating)).toEqual([false, true, false, true, false])
    expect(withRatings({ average: 4, count: 3 }, [5])).toEqual({ average: 4.3, count: 4 })
  })
})

describe('service search', async () => {
  const { matchServices, rankProviders } = await import('./shops')
  const services = [
    { code: 'shirt_ironing', name: 'Repassage chemise', category: 'dry_cleaning' },
    { code: 'trouser_ironing', name: 'Repassage pantalon', category: 'dry_cleaning' },
    {
      code: 'sole_replacement',
      name: 'Ressemelage',
      category: 'shoe_repair',
      keywords: ['semelle', 'chaussures'],
    },
  ]

  it('finds service types by word prefix, ignoring accents', () => {
    expect(matchServices(services, 'repass').map((s) => s.code)).toEqual([
      'shirt_ironing',
      'trouser_ironing',
    ])
    expect(matchServices(services, 'repassage pant').map((s) => s.code)).toEqual([
      'trouser_ironing',
    ])
    expect(matchServices(services, 'RESSEM').map((s) => s.code)).toEqual(['sole_replacement'])
    expect(matchServices(services, 'semelle').map((s) => s.code)).toEqual(['sole_replacement'])
    expect(matchServices(services, '')).toEqual([])
  })

  it('ranks providers by rating, then price', () => {
    const a = shop({ code: 'a', rating: { average: 4.2, count: 3 } })
    const b = shop({ code: 'b', rating: { average: 4.8, count: 9 } })
    const c = shop({ code: 'c', rating: { average: 4.8, count: 1 } })
    const ranked = rankProviders([
      { shop: a, offer: { priceCents: 300 } },
      { shop: b, offer: { priceCents: 500 } },
      { shop: c, offer: { priceCents: 400 } },
    ])
    expect(ranked.map((p) => p.shop.code)).toEqual(['c', 'b', 'a'])
  })
})
