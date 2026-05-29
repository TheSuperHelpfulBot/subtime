import { describe, expect, it } from 'vitest'
import { createIdleState, startMatch, tick } from '../gameTimer'
import {
  computeRotationStintTarget,
  pairShouldRecommendSub,
  predictedPairImbalance,
  recommendedPairsFromPrediction,
} from './predictRotation'
import { DEFAULT_SUB_STRATEGY_CONFIG, type GameState } from './types'

const FOUR_MINUTE_GAME = {
  periods: 1,
  periodDurationMinutes: 4,
  breakDurationMinutes: 0,
}

function makeState(
  squadSize: number,
  onFieldCount: number,
  playtimeSeconds: Record<string, number>,
): GameState {
  const rosterPlayerIds = Array.from({ length: squadSize }, (_, i) => `p${i + 1}`)
  let timer = startMatch(createIdleState(FOUR_MINUTE_GAME))
  timer = tick(timer, 10)

  return {
    config: {
      ...DEFAULT_SUB_STRATEGY_CONFIG,
      toleranceFactor: 0,
      rotationFrequencyFactor: 5,
      unlimitedReturns: true,
      stoppageOnly: false,
    },
    timer,
    onFieldCount,
    rosterPlayerIds,
    fieldIds: rosterPlayerIds.slice(0, onFieldCount),
    benchIds: rosterPlayerIds.slice(onFieldCount),
    unavailableIds: [],
    permanentlyOutIds: [],
    playtimeSeconds,
    lastSubElapsedPlayingSeconds: null,
  }
}

describe('predictedPairImbalance', () => {
  it('does not predict imbalance before a rotation stint completes', () => {
    const stintTarget = 80
    expect(predictedPairImbalance(30, 0, stintTarget)).toBe(0)
    expect(pairShouldRecommendSub(30, 0, stintTarget, 0.92)).toBe(false)
  })

  it('predicts imbalance once the stint target is reached', () => {
    const stintTarget = 80
    expect(predictedPairImbalance(80, 0, stintTarget)).toBeGreaterThan(0)
    expect(pairShouldRecommendSub(80, 0, stintTarget, 0.92)).toBe(true)
  })
})

describe('recommendedPairsFromPrediction · fifteen player scenario', () => {
  it('targets first sub near eighty seconds for one rotation per period', () => {
    const stateAt30 = makeState(
      15,
      10,
      Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`p${i + 1}`, i < 10 ? 30 : 0])),
    )
    expect(computeRotationStintTarget(stateAt30)).toBeCloseTo(80, 5)
    expect(
      recommendedPairsFromPrediction(stateAt30, stateAt30.fieldIds, stateAt30.benchIds),
    ).toEqual([])

    const stateAt80 = makeState(
      15,
      10,
      Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`p${i + 1}`, i < 10 ? 80 : 0])),
    )
    expect(
      recommendedPairsFromPrediction(stateAt80, stateAt80.fieldIds, stateAt80.benchIds).length,
    ).toBeGreaterThan(0)
  })
})
