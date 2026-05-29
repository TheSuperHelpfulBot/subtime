import type { GameTimerState } from '../gameTimer'
import type { PlaytimeSeconds } from '../substitutionPlaytime'

export type SubStrategyConfig = {
  /** 0 = fair, 10 = flexible — controls imbalance threshold scale. */
  toleranceFactor: number
  /** 0 = one rotation per game, 5 = per period, 10 = two rotations per period. */
  rotationFrequencyFactor: number
  /** When true, subbed-off players may return (unlimited re-entry). */
  unlimitedReturns: boolean
  /** When true, subs only at stoppages (not on the fly). */
  stoppageOnly: boolean
  /** Expected mean seconds between stoppages when `stoppageOnly` (0–120). */
  meanStoppageIntervalSeconds: number
}

export const DEFAULT_SUB_STRATEGY_CONFIG: SubStrategyConfig = {
  toleranceFactor: 0,
  rotationFrequencyFactor: 5,
  unlimitedReturns: true,
  stoppageOnly: false,
  meanStoppageIntervalSeconds: 60,
}

/** @deprecated Legacy field names from earlier config shape. */
export type LegacySubStrategyConfig = {
  toleranceFactor?: number
  subWindowIntervalSeconds?: number
  rollingSubsAllowed?: boolean
}

export function normalizeSubStrategyConfig(
  config: Partial<SubStrategyConfig> & LegacySubStrategyConfig,
): SubStrategyConfig {
  const defaults = DEFAULT_SUB_STRATEGY_CONFIG
  const unlimitedReturns =
    config.unlimitedReturns ??
    (config.rollingSubsAllowed !== undefined
      ? config.rollingSubsAllowed
      : defaults.unlimitedReturns)

  return {
    toleranceFactor: Math.max(0, Math.min(10, config.toleranceFactor ?? defaults.toleranceFactor)),
    rotationFrequencyFactor: Math.max(
      0,
      Math.min(10, config.rotationFrequencyFactor ?? defaults.rotationFrequencyFactor),
    ),
    unlimitedReturns,
    stoppageOnly: config.stoppageOnly ?? defaults.stoppageOnly,
    meanStoppageIntervalSeconds: Math.max(
      0,
      Math.min(120, config.meanStoppageIntervalSeconds ?? defaults.meanStoppageIntervalSeconds),
    ),
  }
}

export type SubAction = {
  offPlayerId: string
  onPlayerId: string
  urgency: 'now' | 'soon' | 'planned'
}

export type SubStrategy = {
  nextSubWindow: number | null
  targetTime: number
  tolerance: number
  recommendedSubCount: number
  recommendedSubs: SubAction[]
  projectedGameTimes: Record<string, number>
  warnings: string[]
}

export type GameState = {
  config: SubStrategyConfig
  timer: GameTimerState
  onFieldCount: number
  rosterPlayerIds: string[]
  fieldIds: string[]
  benchIds: string[]
  unavailableIds: string[]
  permanentlyOutIds: string[]
  playtimeSeconds: PlaytimeSeconds
  /** Elapsed active period seconds when the last sub was applied, or null at kick-off. */
  lastSubElapsedPlayingSeconds: number | null
}
