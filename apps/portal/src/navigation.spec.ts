/**
 * Tests of the portal navigation tree.
 */
import { describe, expect, it } from 'vitest'

import fr from './i18n/fr'
import { navDepth } from '@city-groom/ui'

import { NAVIGATION, type NavNode, labels, trail } from './navigation'

const has = (key: string): boolean =>
  key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], fr) !==
  undefined

describe('portal navigation', () => {
  it('finds the path to a nested page', () => {
    expect(trail('merchant-rounds').map((n) => n.id)).toEqual([
      'merchant',
      'merchant-activity',
      'merchant-rounds',
    ])
  })

  it('highlights the list item on its detail page', () => {
    expect(trail('operator-locker').map((n) => n.id)).toEqual([
      'operator',
      'operator-network',
      'operator-lockers',
    ])
  })

  it('returns nothing for a route outside the menu', () => {
    expect(trail('unknown')).toEqual([])
  })

  it('never nests deeper than three levels', () => {
    expect(navDepth(NAVIGATION)).toBeLessThanOrEqual(3)
  })

  it('has a French label for every entry and unique ids', () => {
    expect(labels().filter((key) => !has(key))).toEqual([])
    const ids: string[] = []
    const walk = (nodes: NavNode[]): void =>
      nodes.forEach((n) => {
        ids.push(n.id)
        if (n.kind === 'group') walk(n.children)
      })
    walk(NAVIGATION)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
