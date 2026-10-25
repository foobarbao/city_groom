/**
 * Every literal translation key used in the code exists in the French
 * messages (a missing key shows up as raw text such as "consigne.how.step2b").
 * Keys built at runtime (template literals) are not covered.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import fr from './fr'

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.(vue|ts)$/.test(name) && !name.endsWith('.spec.ts') ? [path] : []
  })
}

const has = (key: string): boolean =>
  key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], fr) !==
  undefined

describe('French messages', () => {
  it('contain every literal key used in the code', () => {
    const missing = new Set<string>()
    for (const file of files(join(__dirname, '..'))) {
      for (const match of readFileSync(file, 'utf8').matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) {
        if (!has(match[1] as string)) missing.add(`${match[1]} (${file.split('/src/')[1]})`)
      }
    }
    expect([...missing]).toEqual([])
  })
})
