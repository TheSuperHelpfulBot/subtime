import { useEffect, useRef, useState } from 'react'
import type { GameTypeRecord } from '../storage/gameTypesStorage'
import {
  createIdleState,
  formatClock,
  pause,
  periodLengthSeconds,
  resume,
  skipBackOneMinute,
  skipForwardOneMinute,
  startMatch,
  tick,
  type GameTimerState,
} from './gameTimer'

export type GameScreenProps = {
  gameType: GameTypeRecord
  onLeave: () => void
}

const MAX_TICK_SECONDS = 1

export default function GameScreen({ gameType, onLeave }: GameScreenProps) {
  const [state, setState] = useState<GameTimerState>(() =>
    createIdleState(gameType.config),
  )
  const lastTickRef = useRef<number | null>(null)

  useEffect(() => {
    if (state.runStatus !== 'running') {
      lastTickRef.current = null
      return
    }

    let frame = 0
    const loop = (now: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = now
        frame = requestAnimationFrame(loop)
        return
      }
      const rawDelta = (now - lastTickRef.current) / 1000
      lastTickRef.current = now
      const delta = Math.min(Math.max(0, rawDelta), MAX_TICK_SECONDS)
      if (delta > 0) {
        setState((s) => tick(s, delta))
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [state.runStatus])

  const segmentLabel = (() => {
    if (state.runStatus === 'idle') return 'Ready'
    if (state.runStatus === 'ended') return 'Match ended'
    if (state.segment === 'break') return 'Break'
    if (state.segment === 'period') {
      return `Period ${state.periodIndex} of ${state.config.periods}`
    }
    return ''
  })()

  const clock =
    state.runStatus === 'idle'
      ? formatClock(periodLengthSeconds(state.config))
      : state.runStatus === 'ended'
        ? formatClock(0)
        : formatClock(state.remainingSeconds)

  const canAdjust =
    state.runStatus === 'running' || state.runStatus === 'paused'

  const showStart = state.runStatus === 'idle'
  const showPause = state.runStatus === 'running'
  const showResume = state.runStatus === 'paused'

  return (
    <main className="game-screen" data-testid="game-screen">
      <div className="game-screen-timer-zone">
        <div className="game-screen-timer-inner">
          <p className="game-screen-eyebrow">{gameType.name}</p>
          <p className="game-screen-segment" data-testid="timer-segment-label">
            {segmentLabel}
          </p>
          <p
            className="game-screen-clock"
            data-testid="timer-readout"
            aria-live="polite"
          >
            {clock}
          </p>

          <div className="game-screen-controls">
            {showStart ? (
              <button
                type="button"
                className="cta game-screen-primary"
                data-testid="timer-start"
                onClick={() => setState((s) => startMatch(s))}
              >
                Start game
              </button>
            ) : null}

            {showPause ? (
              <button
                type="button"
                className="btn-secondary"
                data-testid="timer-pause"
                onClick={() => setState((s) => pause(s))}
              >
                Pause
              </button>
            ) : null}

            {showResume ? (
              <button
                type="button"
                className="cta game-screen-primary"
                data-testid="timer-resume"
                onClick={() => setState((s) => resume(s))}
              >
                Resume
              </button>
            ) : null}

            <div className="game-screen-skip-row">
              <button
                type="button"
                className="btn-secondary"
                data-testid="timer-skip-back"
                disabled={!canAdjust || state.runStatus === 'ended'}
                onClick={() => setState((s) => skipBackOneMinute(s))}
              >
                Skip back 1 min
              </button>
              <button
                type="button"
                className="btn-secondary"
                data-testid="timer-skip-forward"
                disabled={!canAdjust || state.runStatus === 'ended'}
                onClick={() => setState((s) => skipForwardOneMinute(s))}
              >
                Skip forward 1 min
              </button>
            </div>

            <button
              type="button"
              className="btn-text game-screen-leave"
              data-testid="game-back-to-types"
              onClick={onLeave}
            >
              Back to game types
            </button>
          </div>
        </div>
      </div>

      <div
        className="game-screen-roster-placeholder"
        data-testid="roster-placeholder"
        aria-hidden
      >
        <p className="game-screen-roster-title">Roster</p>
        <p className="game-screen-roster-copy">
          Player roster and substitutions will appear here in a future milestone.
        </p>
      </div>
    </main>
  )
}
