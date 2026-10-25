/**
 * @file Every mission photo carries the credit its licence requires.
 */
import { describe, expect, it } from 'vitest'

import { missionPhotos } from './missionPhotos'

describe('missionPhotos', () => {
  it('credits the author, licence and source of every photo', () => {
    for (const photo of missionPhotos) {
      expect(photo.author).not.toBe('')
      expect(photo.license).not.toBe('')
      expect(photo.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\//)
      expect(photo.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
    }
  })

  it('uses each file once', () => {
    const files = missionPhotos.map((photo) => photo.file)
    expect(new Set(files).size).toBe(files.length)
  })
})
