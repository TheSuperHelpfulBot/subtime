import { describe, expect, it } from 'vitest'
import { createIdleState, startMatch, tick } from '../gameTimer'
import type { TimerConfig } from '../timerConfig'
import { imbalanceThresholdMet, shouldRecommendSubstitutions } from './recommendationTiming'
import { DEFAULT_SUB_STRATEGY_CONFIG, type GameState } from './types'

const SHORT_GAME: TimerConfig = {
  periods: 1,
  periodDurationMinutes: 5,
  breakDurationMinutes: 0,
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  const rosterPlayerIds =
    overrides.rosterPlayerIds ?? Array.from({ length: 13 }, (_, i) => `p${i + 1}`)
  const playtimeSeconds: Record<string, number> = {}
  for (const id of rosterPlayerIds) playtimeSeconds[id] = 0

  let timer = startMatch(createIdleState(SHORT_GAME))
  timer = tick(timer, 30)

  return {
    config: { ...DEFAULT_SUB_STRATEGY_CONFIG, ...overrides.config },
    timer,
    onFieldCount: 5,
    rosterPlayerIds,
    fieldIds: rosterPlayerIds.slice(0, 5),
    benchIds: rosterPlayerIds.slice(5),
    unavailableIds: [],
    permanentlyOutIds: [],
    playtimeSeconds: { ...playtimeSeconds, ...overrides.playtimeSeconds },
    lastSubElapsedPlayingSeconds: overrides.lastSubElapsedPlayingSeconds ?? null,
    ...overrides,
  }
}

describe('shouldRecommendSubstitutions', () => {
  it('recommends once rotation stint pressure is predicted in a short game', () => {
    const rosterPlayerIds = Array.from({ length: 15 }, (_, i) => `p${i + 1}`)
    const playtimeSeconds: Record<string, number> = {}
    for (let i = 0; i < 10; i += 1) playtimeSeconds[`p${i + 1}`] = 80
    for (let i = 10; i < 15; i += 1) playtimeSeconds[`p${i + 1}`] = 0

    let timer = startMatch(
      createIdleState({ periods: 1, periodDurationMinutes: 4, breakDurationMinutes: 0 }),
    )
    timer = tick(timer, 80)

    const state = makeState({
      onFieldCount: 10,
      rosterPlayerIds,
      fieldIds: rosterPlayerIds.slice(0, 10),
      benchIds: rosterPlayerIds.slice(10),
      playtimeSeconds,
      timer,
    })
    expect(shouldRecommendSubstitutions(state)).toBe(true)
  })

  it('does not recommend at thirty seconds in a fifteen-player four-minute scenario', () => {
    const rosterPlayerIds = Array.from({ length: 15 }, (_, i) => `p${i + 1}`)
    const playtimeSeconds: Record<string, number> = {}
    for (let i = 0; i < 10; i += 1) playtimeSeconds[`p${i + 1}`] = 30
    for (let i = 10; i < 15; i += 1) playtimeSeconds[`p${i + 1}`] = 0

    let timer = startMatch(
      createIdleState({ periods: 1, periodDurationMinutes: 4, breakDurationMinutes: 0 }),
    )
    timer = tick(timer, 30)

    const state = makeState({
      onFieldCount: 10,
      rosterPlayerIds,
      fieldIds: rosterPlayerIds.slice(0, 10),
      benchIds: rosterPlayerIds.slice(10),
      playtimeSeconds,
      timer,
      config: {
        ...DEFAULT_SUB_STRATEGY_CONFIG,
        toleranceFactor: 0,
        rotationFrequencyFactor: 5,
      },
    })

    expect(shouldRecommendSubstitutions(state)).toBe(false)
  })

  it('does not recommend at ten seconds of equal field time in a four-minute scenario', () => {
    const rosterPlayerIds = Array.from({ length: 13 }, (_, i) => `p${i + 1}`)
    const playtimeSeconds: Record<string, number> = {}
    for (let i = 0; i < 10; i += 1) playtimeSeconds[`p${i + 1}`] = 10
    for (let i = 10; i < 13; i += 1) playtimeSeconds[`p${i + 1}`] = 0

    let timer = startMatch(
      createIdleState({ periods: 1, periodDurationMinutes: 4, breakDurationMinutes: 0 }),
    )
    timer = tick(timer, 10)

    const state = makeState({
      onFieldCount: 10,
      rosterPlayerIds,
      fieldIds: rosterPlayerIds.slice(0, 10),
      benchIds: rosterPlayerIds.slice(10),
      playtimeSeconds,
      timer,
      config: {
        ...DEFAULT_SUB_STRATEGY_CONFIG,
        toleranceFactor: 0,
        rotationFrequencyFactor: 5,
      },
    })

    expect(shouldRecommendSubstitutions(state)).toBe(false)
  })

  it('does not recommend early in stoppage-only mode before ideal rotation time', () => {
    const rosterPlayerIds = Array.from({ length: 13 }, (_, i) => `p${i + 1}`)
    const playtimeSeconds: Record<string, number> = {}
    for (let i = 0; i < 10; i += 1) playtimeSeconds[`p${i + 1}`] = 45
    for (let i = 10; i < 13; i += 1) playtimeSeconds[`p${i + 1}`] = 0

    let timer = startMatch(
      createIdleState({ periods: 1, periodDurationMinutes: 20, breakDurationMinutes: 0 }),
    )
    timer = tick(timer, 45)

    const state = makeState({
      onFieldCount: 10,
      rosterPlayerIds,
      fieldIds: rosterPlayerIds.slice(0, 10),
      benchIds: rosterPlayerIds.slice(10),
      playtimeSeconds,
      timer,
      config: {
        ...DEFAULT_SUB_STRATEGY_CONFIG,
        toleranceFactor: 10,
        stoppageOnly: true,
        meanStoppageIntervalSeconds: 60,
        rotationFrequencyFactor: 5,
      },
    })

    expect(shouldRecommendSubstitutions(state)).toBe(false)
  })
})

describe('imbalanceThresholdMet', () => {
  it('uses forward prediction rather than immediate spread alone', () => {
    const rosterPlayerIds = Array.from({ length: 13 }, (_, i) => `p${i + 1}`)
    const playtimeSeconds: Record<string, number> = {}
    for (let i = 0; i < 10; i += 1) playtimeSeconds[`p${i + 1}`] = 10
    for (let i = 10; i < 13; i += 1) playtimeSeconds[`p${i + 1}`] = 0

    const state = makeState({
      onFieldCount: 10,
      rosterPlayerIds,
      fieldIds: rosterPlayerIds.slice(0, 10),
      benchIds: rosterPlayerIds.slice(10),
      playtimeSeconds,
      config: { ...DEFAULT_SUB_STRATEGY_CONFIG, toleranceFactor: 0 },
    })
    expect(imbalanceThresholdMet(state)).toBe(false)
  })
})
