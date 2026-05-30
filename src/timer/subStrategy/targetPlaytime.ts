import { totalPlayingSeconds } from '../elapsedPlayingTime'
import { periodLengthSeconds } from '../gameTimer'
import { activeSquadSize } from '../playerAvailability'
import type { TimerConfig } from '../timerConfig'
import {
  computeIdealSubStintSeconds,
  computeRotationsPerPeriod,
} from './rotationAim'
import type { SubStrategyConfig } from './types'

export type TargetPlaytimeInput = {
  timerConfig: TimerConfig
  onFieldCount: number
  rosterPlayerIds: readonly string[]
  unavailableIds: readonly string[]
}

/** Fair total on-field seconds each available player should receive over the match. */
export function computeTargetPlaytimeSeconds(input: TargetPlaytimeInput): number {
  const squad = activeSquadSize(input.rosterPlayerIds, input.unavailableIds)
  if (squad <= 0) return 0
  const total = totalPlayingSeconds(input.timerConfig)
  return (total * input.onFieldCount) / squad
}

export type SubStrategyTargetSummary = {
  targetPlaytimeSeconds: number
  typicalStintSeconds: number | null
  activeSquadSize: number
  totalPlayingSeconds: number
  unavailableCount: number
}

export function deriveSubStrategyTargets(
  input: TargetPlaytimeInput & { config: SubStrategyConfig },
): SubStrategyTargetSummary {
  const activeSquad = activeSquadSize(input.rosterPlayerIds, input.unavailableIds)
  const totalPlaying = totalPlayingSeconds(input.timerConfig)
  const targetPlaytimeSeconds = computeTargetPlaytimeSeconds(input)

  let typicalStintSeconds: number | null = null
  if (input.config.unlimitedReturns && activeSquad > input.onFieldCount) {
    const periodSec = periodLengthSeconds(input.timerConfig)
    const rotationsPerPeriod = computeRotationsPerPeriod(
      input.config.rotationFrequencyFactor,
      input.timerConfig.periods,
    )
    typicalStintSeconds = computeIdealSubStintSeconds(
      periodSec,
      input.onFieldCount,
      activeSquad,
      rotationsPerPeriod,
    )
  }

  return {
    targetPlaytimeSeconds,
    typicalStintSeconds,
    activeSquadSize: activeSquad,
    totalPlayingSeconds: totalPlaying,
    unavailableCount: input.unavailableIds.length,
  }
}
