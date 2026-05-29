import { totalPlayingSeconds } from '../elapsedPlayingTime'
import { activeSquadSize } from '../playerAvailability'
import { computeFairnessImbalanceThreshold } from './fairnessThreshold'
import {
  computeIdealSubStintSeconds,
  computeRotationsPerGame,
  computeRotationsPerPeriod,
} from './rotationAim'
import { computeTargetTime } from './targetTime'
import type { GameState } from './types'

/** Fair on-field seconds each player should receive over one full rotation cycle. */
export function computeRotationPlayerTargetSeconds(state: GameState): number {
  const targetTime = computeTargetTime(state)
  const rotationsPerGame = computeRotationsPerGame(
    state.config.rotationFrequencyFactor,
    state.timer.config.periods,
  )
  return targetTime / Math.max(1, rotationsPerGame)
}

export function computeRotationStintTarget(state: GameState): number {
  const periodSec = Math.max(
    1,
    Math.round(state.timer.config.periodDurationMinutes * 60),
  )
  const squad = activeSquadSize(state.rosterPlayerIds, state.unavailableIds)
  const rotationsPerPeriod = computeRotationsPerPeriod(
    state.config.rotationFrequencyFactor,
    state.timer.config.periods,
  )
  return computeIdealSubStintSeconds(
    periodSec,
    state.onFieldCount,
    squad,
    rotationsPerPeriod,
  )
}

/**
 * Predicted imbalance for a sorted pair if no sub is made before the field stint ends.
 * Compare against targetTime × fairness scale to decide whether to recommend.
 */
export function predictedPairImbalance(
  offPlaytime: number,
  onPlaytime: number,
  stintTarget: number,
): number {
  if (stintTarget <= 0) {
    return Math.max(0, offPlaytime - onPlaytime)
  }

  if (offPlaytime >= stintTarget) {
    const spreadExcess = Math.max(0, offPlaytime - onPlaytime - stintTarget)
    const stintCompleteImbalance =
      onPlaytime < stintTarget ? Math.max(0, stintTarget - onPlaytime) : 0
    return Math.max(spreadExcess, stintCompleteImbalance)
  }

  const offStintInCycle = offPlaytime % stintTarget
  const delta = stintTarget - offStintInCycle
  const projectedSpread = offPlaytime + delta - onPlaytime
  return Math.max(0, projectedSpread - stintTarget)
}

export function pairShouldRecommendSub(
  offPlaytime: number,
  onPlaytime: number,
  stintTarget: number,
  imbalanceThreshold: number,
): boolean {
  return predictedPairImbalance(offPlaytime, onPlaytime, stintTarget) >= imbalanceThreshold
}

export function sortedSubPairs(
  fieldIds: readonly string[],
  benchIds: readonly string[],
  playtime: Record<string, number>,
): { offId: string; onId: string }[] {
  const sortedField = [...fieldIds].sort(
    (a, b) => (playtime[b] ?? 0) - (playtime[a] ?? 0),
  )
  const sortedBench = [...benchIds].sort(
    (a, b) => (playtime[a] ?? 0) - (playtime[b] ?? 0),
  )
  const count = Math.min(sortedField.length, sortedBench.length)
  const pairs: { offId: string; onId: string }[] = []
  for (let i = 0; i < count; i += 1) {
    pairs.push({ offId: sortedField[i]!, onId: sortedBench[i]! })
  }
  return pairs
}

export function recommendedPairsFromPrediction(
  state: GameState,
  fieldIds: readonly string[],
  benchIds: readonly string[],
): { offId: string; onId: string }[] {
  const playtime = state.playtimeSeconds
  const targetTime = computeTargetTime(state)
  if (targetTime <= 0) return []

  const threshold = computeFairnessImbalanceThreshold(
    targetTime,
    state.config.toleranceFactor,
  )
  const stintTarget = computeRotationStintTarget(state)

  return sortedSubPairs(fieldIds, benchIds, playtime).filter(({ offId, onId }) =>
    pairShouldRecommendSub(
      playtime[offId] ?? 0,
      playtime[onId] ?? 0,
      stintTarget,
      threshold,
    ),
  )
}

/** Seconds until the leading field player reaches the next ideal rotation point. */
export function secondsUntilIdealRotation(
  state: GameState,
  fieldIds: readonly string[],
): number | null {
  const stintTarget = computeRotationStintTarget(state)
  if (stintTarget <= 0 || fieldIds.length === 0) return null

  const playtime = state.playtimeSeconds
  let minWait = Infinity
  for (const id of fieldIds) {
    const pt = playtime[id] ?? 0
    if (pt >= stintTarget && pt % stintTarget === 0 && pt > 0) {
      return 0
    }
    const offStintInCycle = pt % stintTarget
    const wait = offStintInCycle === 0 && pt > 0 ? stintTarget : stintTarget - offStintInCycle
    minWait = Math.min(minWait, wait)
  }
  return minWait === Infinity ? null : minWait
}
