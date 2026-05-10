import { describe, expect, it } from 'vitest'
import type { TimerConfig } from './timerConfig'
import {
  breakLengthSeconds,
  createIdleState,
  formatClock,
  pause,
  periodLengthSeconds,
  resume,
  skipBackOneMinute,
  skipForwardOneMinute,
  startMatch,
  tick,
} from './gameTimer'

const shortGame: TimerConfig = {
  periods: 2,
  periodDurationMinutes: 1 / 60, // 1 second
  breakDurationMinutes: 1 / 120, // 0.5 second
}

describe('gameTimer', () => {
  it('createIdleState is idle with no segment', () => {
    const s = createIdleState(shortGame)
    expect(s.runStatus).toBe('idle')
    expect(s.segment).toBeNull()
    expect(s.remainingSeconds).toBe(0)
    expect(s.periodIndex).toBe(1)
  })

  it('startMatch begins period 1 running', () => {
    let s = createIdleState(shortGame)
    s = startMatch(s)
    expect(s.runStatus).toBe('running')
    expect(s.segment).toBe('period')
    expect(s.periodIndex).toBe(1)
    expect(s.remainingSeconds).toBe(periodLengthSeconds(shortGame))
  })

  it('tick advances countdown while running', () => {
    let s = startMatch(createIdleState(shortGame))
    const before = s.remainingSeconds
    s = tick(s, 0.25)
    expect(s.remainingSeconds).toBeCloseTo(before - 0.25, 5)
    expect(s.runStatus).toBe('running')
  })

  it('tick does not advance while paused', () => {
    let s = pause(startMatch(createIdleState(shortGame)))
    const before = s.remainingSeconds
    s = tick(s, 5)
    expect(s.remainingSeconds).toBe(before)
  })

  it('pause and resume toggle run status without changing remaining time', () => {
    let s = startMatch(createIdleState(shortGame))
    s = pause(s)
    expect(s.runStatus).toBe('paused')
    const rem = s.remainingSeconds
    s = resume(s)
    expect(s.runStatus).toBe('running')
    expect(s.remainingSeconds).toBe(rem)
  })

  it('period ends then break then period 2 for two-period config', () => {
    const cfg: TimerConfig = {
      periods: 2,
      periodDurationMinutes: 2 / 60, // 2 seconds
      breakDurationMinutes: 1 / 60, // 1 second
    }
    let s = startMatch(createIdleState(cfg))
    const pSec = periodLengthSeconds(cfg)
    const bSec = breakLengthSeconds(cfg)
    expect(pSec).toBe(2)
    expect(bSec).toBe(1)

    s = tick(s, pSec)
    expect(s.runStatus).toBe('running')
    expect(s.segment).toBe('break')
    expect(s.periodIndex).toBe(1)
    expect(s.remainingSeconds).toBe(bSec)

    s = tick(s, bSec)
    expect(s.segment).toBe('period')
    expect(s.periodIndex).toBe(2)
    expect(s.remainingSeconds).toBe(pSec)

    s = tick(s, pSec)
    expect(s.runStatus).toBe('ended')
    expect(s.segment).toBeNull()
  })

  it('skips break when break length is zero', () => {
    const cfg: TimerConfig = {
      periods: 2,
      periodDurationMinutes: 1 / 60,
      breakDurationMinutes: 0,
    }
    let s = startMatch(createIdleState(cfg))
    s = tick(s, periodLengthSeconds(cfg))
    expect(s.segment).toBe('period')
    expect(s.periodIndex).toBe(2)
  })

  it('single period ends match without break', () => {
    const cfg: TimerConfig = {
      periods: 1,
      periodDurationMinutes: 1 / 60,
      breakDurationMinutes: 5,
    }
    let s = startMatch(createIdleState(cfg))
    s = tick(s, periodLengthSeconds(cfg))
    expect(s.runStatus).toBe('ended')
  })

  it('skipForwardOneMinute subtracts one minute and can advance segments when shorter than a minute', () => {
    const cfg: TimerConfig = {
      periods: 2,
      periodDurationMinutes: 45 / 60,
      breakDurationMinutes: 0,
    }
    let s = startMatch(createIdleState(cfg))
    s = skipForwardOneMinute(s)
    expect(s.segment).toBe('period')
    expect(s.periodIndex).toBe(2)
    expect(s.remainingSeconds).toBeGreaterThan(0)
  })

  it('skipForwardOneMinute preserves paused state', () => {
    const cfg: TimerConfig = {
      periods: 2,
      periodDurationMinutes: 10,
      breakDurationMinutes: 0,
    }
    let s = pause(startMatch(createIdleState(cfg)))
    const before = s.remainingSeconds
    s = skipForwardOneMinute(s)
    expect(s.runStatus).toBe('paused')
    expect(s.remainingSeconds).toBe(before - 60)
  })

  it('skipBackOneMinute caps at segment length', () => {
    const cfg: TimerConfig = {
      periods: 2,
      periodDurationMinutes: 5,
      breakDurationMinutes: 0,
    }
    let s = startMatch(createIdleState(cfg))
    const max = periodLengthSeconds(cfg)
    s = skipBackOneMinute(s)
    expect(s.remainingSeconds).toBe(max)
    s = tick(s, max - 30)
    expect(s.remainingSeconds).toBe(30)
    s = skipBackOneMinute(s)
    expect(s.remainingSeconds).toBe(90)
    while (s.remainingSeconds < max) {
      s = skipBackOneMinute(s)
    }
    expect(s.remainingSeconds).toBe(max)
  })

  it('formatClock renders mm:ss', () => {
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(0)).toBe('0:00')
  })
})
