import { computeTargetPlaytimeSeconds } from './targetPlaytime'
import type { GameState } from './types'

export function computeTargetTime(state: GameState): number {
  return computeTargetPlaytimeSeconds({
    timerConfig: state.timer.config,
    onFieldCount: state.onFieldCount,
    rosterPlayerIds: state.rosterPlayerIds,
    unavailableIds: state.unavailableIds,
  })
}

export { computeTolerance } from './fairnessThreshold'
