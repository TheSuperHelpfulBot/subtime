import { beforeEach, describe, expect, it } from 'vitest'
import { readJson, writeJson } from './appStorage'

describe('appStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips JSON under the simple-subs prefix', () => {
    writeJson('onboarding', { startedAt: 42 })
    expect(readJson('onboarding', { startedAt: 0 })).toEqual({ startedAt: 42 })
  })

  it('returns fallback when the key is missing', () => {
    expect(readJson('nothing', 'fallback')).toBe('fallback')
  })

  it('returns fallback when stored value is not valid JSON', () => {
    localStorage.setItem('simple-subs:broken', '{')
    expect(readJson('broken', false)).toBe(false)
  })
})
