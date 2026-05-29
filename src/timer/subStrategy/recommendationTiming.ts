import { isEligibleForField } from '../playerAvailability'
import {
  computeRotationStintTarget,
  predictedPairImbalance,
  recommendedPairsFromPrediction,
  sortedSubPairs,
} from './predictRotation'
import type { GameState } from './types'

function eligibleFieldIds(state: GameState): string[] {
  return state.fieldIds.filter((id) => !state.unavailableIds.includes(id))
}

function eligibleBenchIds(state: GameState): string[] {
  return state.benchIds.filter((id) =>
    isEligibleForField(
      id,
      state.unavailableIds,
      state.permanentlyOutIds,
      state.config.unlimitedReturns,
    ),
  )
}

/** True when rotation-aware predicted imbalance exceeds the fairness threshold for any pair. */
export function shouldRecommendSubstitutions(state: GameState): boolean {
  if (state.timer.runStatus === 'idle' || state.timer.runStatus === 'ended') {
    return false
  }

  const pairs = recommendedPairsFromPrediction(
    state,
    eligibleFieldIds(state),
    eligibleBenchIds(state),
  )
  return pairs.length > 0
}

/** Largest predicted pair imbalance across sorted pairs (for warnings). */
export function measureLineupImbalance(
  state: GameState,
  fieldIds: readonly string[],
  benchIds: readonly string[],
): number {
  const stintTarget = computeRotationStintTarget(state)
  const playtime = state.playtimeSeconds
  let max = 0
  for (const { offId, onId } of sortedSubPairs(fieldIds, benchIds, playtime)) {
    max = Math.max(
      max,
      predictedPairImbalance(playtime[offId] ?? 0, playtime[onId] ?? 0, stintTarget),
    )
  }
  return max
}

export function imbalanceThresholdMet(state: GameState): boolean {
  return shouldRecommendSubstitutions(state)
}
