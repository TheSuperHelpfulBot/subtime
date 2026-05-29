import { describe, expect, it } from 'vitest'
import { shouldKeepScreenAwake } from './screenWakeLock'

describe('shouldKeepScreenAwake', () => {
  it('is true only while the clock is running', () => {
    expect(shouldKeepScreenAwake('running')).toBe(true)
    expect(shouldKeepScreenAwake('idle')).toBe(false)
    expect(shouldKeepScreenAwake('paused')).toBe(false)
    expect(shouldKeepScreenAwake('ended')).toBe(false)
  })
})
