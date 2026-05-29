import type { GameTimerState } from './gameTimer'
import { breakLengthSeconds, periodLengthSeconds } from './gameTimer'
import type { TimerConfig } from './timerConfig'

/** Total seconds of active period play in a full match (excludes breaks). */
export function totalPlayingSeconds(config: TimerConfig): number {
  return config.periods * periodLengthSeconds(config)
}

/**
 * Elapsed active period seconds from match start through the current timer snapshot.
 * Excludes breaks and time while idle; advances only during running period segments.
 */
export function elapsedPlayingSeconds(state: GameTimerState): number {
  const { config, runStatus, periodIndex, segment, remainingSeconds } = state
  const periodSec = periodLengthSeconds(config)

  if (runStatus === 'idle') return 0
  if (runStatus === 'ended') return totalPlayingSeconds(config)

  let elapsed = 0
  if (segment === 'period') {
    elapsed = (periodIndex - 1) * periodSec + (periodSec - remainingSeconds)
  } else if (segment === 'break') {
    elapsed = periodIndex * periodSec
  }

  return Math.max(0, Math.min(elapsed, totalPlayingSeconds(config)))
}

/** Seconds of period play remaining (not including upcoming breaks). */
export function remainingPlayingSeconds(state: GameTimerState): number {
  return Math.max(0, totalPlayingSeconds(state.config) - elapsedPlayingSeconds(state))
}
