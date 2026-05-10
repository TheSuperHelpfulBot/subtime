import { useEffect, useMemo, useRef, useState } from 'react'
import { getRosterById, type PlayerRecord } from '../storage/rosterStorage'
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
  rosterId: string
  onLeave: () => void
}

const MAX_TICK_SECONDS = 1

function playerLabel(p: PlayerRecord): string {
  const name = p.name.trim()
  const num = p.shirtNumber.trim()
  if (name && num) return `${name} · #${num}`
  if (name) return name
  if (num) return `#${num}`
  return 'Player'
}

export default function GameScreen({ gameType, rosterId, onLeave }: GameScreenProps) {
  const [state, setState] = useState<GameTimerState>(() =>
    createIdleState(gameType.config),
  )
  const lastTickRef = useRef<number | null>(null)

  const roster = useMemo(() => getRosterById(rosterId), [rosterId])

  const [benchIds, setBenchIds] = useState<string[]>(() =>
    getRosterById(rosterId)?.players.map((p) => p.id) ?? [],
  )
  const [fieldIds, setFieldIds] = useState<string[]>([])

  useEffect(() => {
    const r = getRosterById(rosterId)
    if (r) {
      setBenchIds(r.players.map((p) => p.id))
      setFieldIds([])
    } else {
      setBenchIds([])
      setFieldIds([])
    }
  }, [gameType.id, rosterId])

  const playerById = useMemo(() => {
    const map = new Map<string, PlayerRecord>()
    roster?.players.forEach((p) => map.set(p.id, p))
    return map
  }, [roster])

  function moveToField(playerId: string) {
    if (!roster) return
    if (fieldIds.length >= gameType.onFieldCount) return
    setBenchIds((b) => b.filter((id) => id !== playerId))
    setFieldIds((f) => [...f, playerId])
  }

  function moveToBench(playerId: string) {
    setFieldIds((f) => f.filter((id) => id !== playerId))
    setBenchIds((b) => [...b, playerId])
  }

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

      {roster ? (
        <div className="game-roster-panel" data-testid="game-roster-panel">
          <p className="game-screen-roster-title">{roster.name}</p>
          <div className="game-roster-columns">
            <div className="game-roster-column" data-testid="bench-list">
              <p className="game-roster-column-title">Bench</p>
              <ul className="game-roster-ul" aria-label="Bench">
                {benchIds.map((id) => {
                  const p = playerById.get(id)
                  if (!p) return null
                  const full = fieldIds.length >= gameType.onFieldCount
                  return (
                    <li key={id} className="game-roster-li">
                      <span className="game-roster-player-text">{playerLabel(p)}</span>
                      <button
                        type="button"
                        className="btn-text game-roster-move"
                        disabled={full}
                        onClick={() => moveToField(id)}
                      >
                        To field
                      </button>
                    </li>
                  )
                })}
              </ul>
              {benchIds.length === 0 ? (
                <p className="game-roster-empty-col">Nobody on the bench.</p>
              ) : null}
            </div>
            <div className="game-roster-column" data-testid="on-field-list">
              <p className="game-roster-column-title">On field</p>
              <ul className="game-roster-ul" aria-label="On field">
                {fieldIds.map((id) => {
                  const p = playerById.get(id)
                  if (!p) return null
                  return (
                    <li key={id} className="game-roster-li">
                      <span className="game-roster-player-text">{playerLabel(p)}</span>
                      <button
                        type="button"
                        className="btn-text game-roster-move"
                        onClick={() => moveToBench(id)}
                      >
                        To bench
                      </button>
                    </li>
                  )
                })}
              </ul>
              {fieldIds.length === 0 ? (
                <p className="game-roster-empty-col">Nobody on field yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="game-screen-roster-placeholder"
          data-testid="roster-placeholder"
          aria-hidden
        >
          <p className="game-screen-roster-title">Roster</p>
          <p className="game-screen-roster-copy">
            This roster could not be loaded. Go back and choose a roster again.
          </p>
        </div>
      )}
    </main>
  )
}
