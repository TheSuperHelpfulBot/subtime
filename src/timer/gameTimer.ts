import type { TimerConfig } from './timerConfig'

export type GameTimerRunStatus = 'idle' | 'running' | 'paused' | 'ended'

export type GameTimerSegmentKind = 'period' | 'break'

export type GameTimerState = {
  config: TimerConfig
  runStatus: GameTimerRunStatus
  /** During a period: 1..N. During a break after period k: k (same k). */
  periodIndex: number
  segment: GameTimerSegmentKind | null
  /** Whole seconds left in the current segment. */
  remainingSeconds: number
}

export function periodLengthSeconds(config: TimerConfig): number {
  return Math.max(1, Math.round(config.periodDurationMinutes * 60))
}

export function breakLengthSeconds(config: TimerConfig): number {
  return Math.max(0, Math.round(config.breakDurationMinutes * 60))
}

export function createIdleState(config: TimerConfig): GameTimerState {
  return {
    config,
    runStatus: 'idle',
    periodIndex: 1,
    segment: null,
    remainingSeconds: 0,
  }
}

export function startMatch(state: GameTimerState): GameTimerState {
  if (state.runStatus !== 'idle') {
    return state
  }
  return {
    ...state,
    runStatus: 'running',
    periodIndex: 1,
    segment: 'period',
    remainingSeconds: periodLengthSeconds(state.config),
  }
}

export function pause(state: GameTimerState): GameTimerState {
  if (state.runStatus !== 'running') {
    return state
  }
  return { ...state, runStatus: 'paused' }
}

export function resume(state: GameTimerState): GameTimerState {
  if (state.runStatus !== 'paused') {
    return state
  }
  return { ...state, runStatus: 'running' }
}

function completeCurrentSegment(state: GameTimerState, carrySeconds: number): GameTimerState {
  const { config } = state
  const periodSec = periodLengthSeconds(config)
  const breakSec = breakLengthSeconds(config)

  if (state.segment === 'period') {
    const p = state.periodIndex
    if (p < config.periods) {
      if (breakSec > 0) {
        return {
          ...state,
          segment: 'break',
          periodIndex: p,
          remainingSeconds: Math.max(0, breakSec - carrySeconds),
          runStatus: state.runStatus,
        }
      }
      return {
        ...state,
        segment: 'period',
        periodIndex: p + 1,
        remainingSeconds: Math.max(0, periodSec - carrySeconds),
        runStatus: state.runStatus,
      }
    }
    return {
      ...state,
      runStatus: 'ended',
      segment: null,
      remainingSeconds: 0,
    }
  }

  // break after period `periodIndex`
  const p = state.periodIndex
  return {
    ...state,
    segment: 'period',
    periodIndex: p + 1,
    remainingSeconds: Math.max(0, periodSec - carrySeconds),
    runStatus: state.runStatus,
  }
}

export function tick(state: GameTimerState, deltaSeconds: number): GameTimerState {
  if (state.runStatus !== 'running' || deltaSeconds <= 0) {
    return state
  }

  let next: GameTimerState = { ...state }
  let remaining = next.remainingSeconds - deltaSeconds

  while (remaining <= 0 && next.runStatus === 'running') {
    const carry = -remaining
    next = completeCurrentSegment(next, carry)
    if (next.runStatus === 'ended') {
      return next
    }
    remaining = next.remainingSeconds
  }

  if (next.runStatus === 'running') {
    next = { ...next, remainingSeconds: remaining }
  }
  return next
}

function currentSegmentMaxSeconds(state: GameTimerState): number {
  if (state.segment === 'period') {
    return periodLengthSeconds(state.config)
  }
  if (state.segment === 'break') {
    return breakLengthSeconds(state.config)
  }
  return 0
}

/** Subtract one minute from the active segment; may advance segments (same rules as time passing). */
export function skipForwardOneMinute(state: GameTimerState): GameTimerState {
  if (state.runStatus !== 'running' && state.runStatus !== 'paused') {
    return state
  }
  const wasPaused = state.runStatus === 'paused'
  const after = tick({ ...state, runStatus: 'running' }, 60)
  if (wasPaused && after.runStatus === 'running') {
    return { ...after, runStatus: 'paused' }
  }
  return after
}

/** Add one minute to the active segment, capped at the segment length. */
export function skipBackOneMinute(state: GameTimerState): GameTimerState {
  if (state.runStatus !== 'running' && state.runStatus !== 'paused') {
    return state
  }
  if (state.segment === null) {
    return state
  }
  const cap = currentSegmentMaxSeconds(state)
  return {
    ...state,
    remainingSeconds: Math.min(cap, state.remainingSeconds + 60),
  }
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}
