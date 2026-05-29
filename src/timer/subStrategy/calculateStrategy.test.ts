import { describe, expect, it } from 'vitest'
import { createIdleState, startMatch, tick } from '../gameTimer'
import type { TimerConfig } from '../timerConfig'
import { calculateStrategy } from './calculateStrategy'
import { DEFAULT_SUB_STRATEGY_CONFIG } from './types'
import type { GameState } from './types'

const CONFIG: TimerConfig = {
  periods: 1,
  periodDurationMinutes: 60,
  breakDurationMinutes: 0,
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  const rosterPlayerIds = overrides.rosterPlayerIds ?? Array.from({ length: 16 }, (_, i) => `p${i + 1}`)
  const playtimeSeconds: Record<string, number> = {}
  for (const id of rosterPlayerIds) playtimeSeconds[id] = 0

  return {
    config: { ...DEFAULT_SUB_STRATEGY_CONFIG, ...overrides.config },
    timer: startMatch(createIdleState(CONFIG)),
    onFieldCount: 11,
    rosterPlayerIds,
    fieldIds: rosterPlayerIds.slice(0, 11),
    benchIds: rosterPlayerIds.slice(11),
    unavailableIds: [],
    permanentlyOutIds: [],
    playtimeSeconds: { ...playtimeSeconds, ...overrides.playtimeSeconds },
    lastSubElapsedPlayingSeconds: overrides.lastSubElapsedPlayingSeconds ?? null,
    ...overrides,
  }
}

describe('calculateStrategy · targetTime', () => {
  it('uses totalGameSeconds × onFieldCount / activeSquadSize', () => {
    const state = makeState()
    const strategy = calculateStrategy(state)
    expect(strategy.targetTime).toBeCloseTo((3600 * 11) / 16, 5)
  })

  it('recalculates when players are unavailable', () => {
    const state = makeState({ unavailableIds: ['p16', 'p15'] })
    const strategy = calculateStrategy(state)
    expect(strategy.targetTime).toBeCloseTo((3600 * 11) / 14, 5)
    expect(strategy.warnings.some((w) => w.includes('unavailable'))).toBe(true)
  })
})

describe('calculateStrategy · tolerance', () => {
  it('uses the fairness imbalance scale at strictest setting', () => {
    const state = makeState({ config: { ...DEFAULT_SUB_STRATEGY_CONFIG, toleranceFactor: 0 } })
    const target = (3600 * 11) / 16
    expect(calculateStrategy(state).tolerance).toBeCloseTo(target * 0.005, 4)
  })
})

describe('calculateStrategy · multi-sub batch', () => {
  it('recommends whole-bench rotation when one window remains and bench is far behind', () => {
    const rosterPlayerIds = Array.from({ length: 16 }, (_, i) => `p${i + 1}`)
    const playtimeSeconds: Record<string, number> = {}
    for (let i = 0; i < 11; i += 1) playtimeSeconds[`p${i + 1}`] = 2400
    for (let i = 11; i < 16; i += 1) playtimeSeconds[`p${i + 1}`] = 0

    let timer = startMatch(createIdleState(CONFIG))
    // One sub window left (400s < 480s interval)
    timer = tick(timer, 3600 - 400)

    const state = makeState({
      rosterPlayerIds,
      fieldIds: rosterPlayerIds.slice(0, 11),
      benchIds: rosterPlayerIds.slice(11),
      playtimeSeconds,
      timer,
      config: {
        ...DEFAULT_SUB_STRATEGY_CONFIG,
        toleranceFactor: 3,
        rotationFrequencyFactor: 5,
      },
    })

    const strategy = calculateStrategy(state)
    expect(strategy.recommendedSubCount).toBe(5)
    expect(strategy.recommendedSubs).toHaveLength(5)
  })

  it('recommends few or no subs when squad is balanced within tolerance', () => {
    const rosterPlayerIds = Array.from({ length: 16 }, (_, i) => `p${i + 1}`)
    const target = (3600 * 11) / 16
    const playtimeSeconds: Record<string, number> = {}
    for (const id of rosterPlayerIds) playtimeSeconds[id] = target

    const state = makeState({ rosterPlayerIds, playtimeSeconds })
    const strategy = calculateStrategy(state)
    expect(strategy.recommendedSubCount).toBeLessThanOrEqual(1)
  })
})

describe('calculateStrategy · rolling subs', () => {
  it('never recommends permanently out players when rolling subs disabled', () => {
    const state = makeState({
      config: { ...DEFAULT_SUB_STRATEGY_CONFIG, unlimitedReturns: false },
      permanentlyOutIds: ['p12'],
      benchIds: ['p12', 'p13', 'p14', 'p15', 'p16'],
      playtimeSeconds: {
        ...Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`p${i + 1}`, i < 11 ? 3000 : 0])),
      },
    })
    const strategy = calculateStrategy(state)
    for (const sub of strategy.recommendedSubs) {
      expect(sub.onPlayerId).not.toBe('p12')
    }
  })
})
