/**
 * Tests of the demo reading of a Google ID token.
 */
import { describe, expect, it } from 'vitest'

import { readGoogleProfileUnverified } from './googleIdentity'

const encode = (value: object): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

describe('readGoogleProfileUnverified', () => {
  it('reads the basic profile, accents included', () => {
    const token = `h.${encode({ email: 'a@b.fr', given_name: 'Élodie', family_name: 'M', picture: 'https://x/p' })}.s`
    expect(readGoogleProfileUnverified(token)).toEqual({
      email: 'a@b.fr',
      firstName: 'Élodie',
      lastName: 'M',
      pictureUrl: 'https://x/p',
    })
  })

  it('returns null for anything else', () => {
    expect(readGoogleProfileUnverified('nope')).toBeNull()
    expect(readGoogleProfileUnverified('a.%%%.c')).toBeNull()
    expect(readGoogleProfileUnverified(`h.${encode({ name: 'x' })}.s`)).toBeNull()
  })
})
