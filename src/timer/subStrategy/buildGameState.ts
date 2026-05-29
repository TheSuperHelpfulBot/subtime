import type { GameTimerState } from '../gameTimer'
import type { PlaytimeSeconds } from '../substitutionPlaytime'
import type { GameState, SubStrategyConfig } from './types'

export type BuildGameStateInput = {
  config: SubStrategyConfig
  timer: GameTimerState
  onFieldCount: number
  rosterPlayerIds: readonly string[]
  fieldIds: readonly string[]
  benchIds: readonly string[]
  unavailableIds: readonly string[]
  permanentlyOutIds: readonly string[]
  playtimeSeconds: PlaytimeSeconds
  lastSubElapsedPlayingSeconds?: number | null
}

export function buildGameState(input: BuildGameStateInput): GameState {
  return {
    config: input.config,
    timer: input.timer,
    onFieldCount: input.onFieldCount,
    rosterPlayerIds: [...input.rosterPlayerIds],
    fieldIds: [...input.fieldIds],
    benchIds: [...input.benchIds],
    unavailableIds: [...input.unavailableIds],
    permanentlyOutIds: [...input.permanentlyOutIds],
    playtimeSeconds: { ...input.playtimeSeconds },
    lastSubElapsedPlayingSeconds: input.lastSubElapsedPlayingSeconds ?? null,
  }
}
