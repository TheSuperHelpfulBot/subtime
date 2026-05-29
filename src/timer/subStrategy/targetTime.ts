import { activeSquadSize } from '../playerAvailability'
import { totalPlayingSeconds } from '../elapsedPlayingTime'
import type { GameState } from './types'

export function computeTargetTime(state: GameState): number {
  const squad = activeSquadSize(state.rosterPlayerIds, state.unavailableIds)
  if (squad <= 0) return 0
  const total = totalPlayingSeconds(state.timer.config)
  return (total * state.onFieldCount) / squad
}

export { computeTolerance } from './fairnessThreshold'
