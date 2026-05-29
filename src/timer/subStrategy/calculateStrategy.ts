import { activeSquadSize } from '../playerAvailability'
import {
  elapsedPlayingSeconds,
  remainingPlayingSeconds,
  totalPlayingSeconds,
} from '../elapsedPlayingTime'
import { isEligibleForField } from '../playerAvailability'
import { computeFairnessImbalanceThreshold } from './fairnessThreshold'
import { computeRotationsPerPeriod } from './rotationAim'
import {
  computeRotationStintTarget,
  recommendedPairsFromPrediction,
  secondsUntilIdealRotation,
} from './predictRotation'
import { shouldRecommendSubstitutions } from './recommendationTiming'
import { computeTargetTime } from './targetTime'
import type { GameState, SubAction, SubStrategy } from './types'

function playtimeOf(state: GameState, id: string): number {
  return state.playtimeSeconds[id] ?? 0
}

function periodLengthSeconds(state: GameState): number {
  return Math.max(1, Math.round(state.timer.config.periodDurationMinutes * 60))
}

function nextRotationWindowSeconds(state: GameState, elapsed: number, total: number): number | null {
  const eligibleField = state.fieldIds.filter((id) => !state.unavailableIds.includes(id))

  if (state.config.stoppageOnly) {
    const wait = secondsUntilIdealRotation(state, eligibleField)
    if (wait === null) return null
    return Math.min(total, elapsed + wait)
  }

  const rotationsPerPeriod = computeRotationsPerPeriod(
    state.config.rotationFrequencyFactor,
    state.timer.config.periods,
  )
  const cadence = periodLengthSeconds(state) / Math.max(rotationsPerPeriod, 0.001)
  if (cadence <= 0 || elapsed >= total) return null
  const next = Math.ceil(elapsed / cadence) * cadence
  return next >= total ? null : next
}

function urgencyFor(
  remainingSeconds: number,
  cadenceSeconds: number,
  onPlaytime: number,
  targetTime: number,
  secondsUntilWindow: number,
): SubAction['urgency'] {
  const timeLeftOnField = remainingSeconds - secondsUntilWindow
  const cannotReachTarget = onPlaytime + Math.max(0, timeLeftOnField) < targetTime - 1
  if (remainingSeconds <= cadenceSeconds || cannotReachTarget) return 'now'
  if (remainingSeconds <= cadenceSeconds * 2) return 'soon'
  return 'planned'
}

function buildWarnings(
  state: GameState,
  targetTime: number,
  tolerance: number,
  eligibleBench: string[],
): string[] {
  const warnings: string[] = []
  const unavailableCount = state.unavailableIds.length
  if (unavailableCount > 0) {
    warnings.push(
      `${unavailableCount} player${unavailableCount === 1 ? '' : 's'} unavailable — fair on-field target recalculated.`,
    )
  }

  const squad = activeSquadSize(state.rosterPlayerIds, state.unavailableIds)
  if (squad < state.onFieldCount) {
    warnings.push(
      `Only ${squad} available player${squad === 1 ? '' : 's'} for ${state.onFieldCount} on-field slots.`,
    )
  }

  if (eligibleBench.length === 0 && state.fieldIds.length >= state.onFieldCount) {
    warnings.push('No eligible bench players for substitutions.')
  }

  const remaining = remainingPlayingSeconds(state.timer)
  for (const id of state.rosterPlayerIds) {
    if (state.unavailableIds.includes(id)) continue
    const pt = playtimeOf(state, id)
    const maxPossible = pt + remaining
    if (maxPossible < targetTime - tolerance) {
      warnings.push(
        `Player cannot reach fair on-field target even with all remaining match time.`,
      )
      break
    }
  }

  const eligibleField = state.fieldIds.filter((id) => !state.unavailableIds.includes(id))
  if (eligibleField.length > 0 && eligibleBench.length > 0) {
    const stintTarget = computeRotationStintTarget(state)
    const maxField = Math.max(...eligibleField.map((id) => playtimeOf(state, id)))
    const minBench = Math.min(...eligibleBench.map((id) => playtimeOf(state, id)))
    if (maxField - minBench > stintTarget && remaining <= periodLengthSeconds(state)) {
      warnings.push('Limited time left — consider a larger rotation at the next opportunity.')
    }
  }

  return warnings
}

function projectGameTimes(
  state: GameState,
  subs: SubAction[],
  nextWindow: number | null,
): Record<string, number> {
  const projected: Record<string, number> = {}
  for (const id of state.rosterPlayerIds) {
    projected[id] = playtimeOf(state, id)
  }

  const elapsed = elapsedPlayingSeconds(state.timer)
  const remaining = remainingPlayingSeconds(state.timer)
  const delta =
    nextWindow === null ? 0 : Math.max(0, Math.min(nextWindow - elapsed, remaining))
  const afterWindow = Math.max(0, remaining - delta)

  for (const id of state.fieldIds) {
    projected[id] = (projected[id] ?? 0) + delta
  }

  const onFieldAfter = new Set(state.fieldIds)
  for (const sub of subs) {
    onFieldAfter.delete(sub.offPlayerId)
    onFieldAfter.add(sub.onPlayerId)
  }

  for (const sub of subs) {
    projected[sub.onPlayerId] = (projected[sub.onPlayerId] ?? 0) + afterWindow
  }

  return projected
}

function buildRecommendedSubs(
  state: GameState,
  eligibleField: string[],
  eligibleBench: string[],
  remaining: number,
  cadenceSeconds: number,
  targetTime: number,
  secondsUntilWindow: number,
): SubAction[] {
  return recommendedPairsFromPrediction(state, eligibleField, eligibleBench).map(
    ({ offId, onId }) => ({
      offPlayerId: offId,
      onPlayerId: onId,
      urgency: urgencyFor(
        remaining,
        cadenceSeconds,
        playtimeOf(state, onId),
        targetTime,
        secondsUntilWindow,
      ),
    }),
  )
}

export function calculateStrategy(state: GameState): SubStrategy {
  const targetTime = computeTargetTime(state)
  const tolerance = computeFairnessImbalanceThreshold(targetTime, state.config.toleranceFactor)
  const total = totalPlayingSeconds(state.timer.config)
  const elapsed = elapsedPlayingSeconds(state.timer)
  const remaining = remainingPlayingSeconds(state.timer)

  const nextSubWindow =
    state.timer.runStatus === 'ended'
      ? null
      : nextRotationWindowSeconds(state, elapsed, total)

  const rotationsPerPeriod = computeRotationsPerPeriod(
    state.config.rotationFrequencyFactor,
    state.timer.config.periods,
  )
  const cadenceSeconds = periodLengthSeconds(state) / Math.max(rotationsPerPeriod, 0.001)

  const eligibleBench = state.benchIds.filter((id) =>
    isEligibleForField(
      id,
      state.unavailableIds,
      state.permanentlyOutIds,
      state.config.unlimitedReturns,
    ),
  )

  const eligibleField = state.fieldIds.filter(
    (id) => !state.unavailableIds.includes(id),
  )

  const secondsUntilWindow =
    nextSubWindow === null ? remaining : Math.max(0, nextSubWindow - elapsed)

  const recommendedSubs = shouldRecommendSubstitutions(state)
    ? buildRecommendedSubs(
        state,
        eligibleField,
        eligibleBench,
        remaining,
        cadenceSeconds,
        targetTime,
        secondsUntilWindow,
      )
    : []

  const warnings = buildWarnings(state, targetTime, tolerance, eligibleBench)
  const projectedGameTimes = projectGameTimes(state, recommendedSubs, nextSubWindow)

  return {
    nextSubWindow,
    targetTime,
    tolerance,
    recommendedSubCount: recommendedSubs.length,
    recommendedSubs,
    projectedGameTimes,
    warnings,
  }
}
