import { describe, expect, it } from 'vitest'
import {
  createIdleState,
  startMatch,
  tick,
  type GameTimerState,
} from './gameTimer'
import { elapsedPlayingSeconds, totalPlayingSeconds } from './elapsedPlayingTime'

const CONFIG = { periods: 2, periodDurationMinutes: 10, breakDurationMinutes: 2 }

describe('elapsedPlayingTime', () => {
  it('totals period seconds only', () => {
    expect(totalPlayingSeconds(CONFIG)).toBe(1200)
  })

  it('tracks elapsed through a running period', () => {
    let state: GameTimerState = startMatch(createIdleState(CONFIG))
    state = tick(state, 120)
    expect(elapsedPlayingSeconds(state)).toBe(120)
  })

  it('is zero while idle', () => {
    expect(elapsedPlayingSeconds(createIdleState(CONFIG))).toBe(0)
  })
})
