import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { getRosterById, type PlayerRecord } from '../storage/rosterStorage'
import type { GameTypeRecord } from '../storage/gameTypesStorage'
import {
  createZeroPlaytime,
  isStartingLineupComplete,
  playtimeBarPercentsForRoster,
  splitInitialLineup,
  swapFieldWithBench,
  swapTwoOnBench,
  swapTwoOnField,
  tickPlaytime,
  type PlaytimeSeconds,
} from './substitutionPlaytime'
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
  const stateRef = useRef<GameTimerState>(state)
  stateRef.current = state

  const roster = useMemo(() => getRosterById(rosterId), [rosterId])

  const [benchIds, setBenchIds] = useState<string[]>(() => {
    const r = getRosterById(rosterId)
    if (!r) return []
    return splitInitialLineup(
      r.players.map((p) => p.id),
      gameType.onFieldCount,
    ).benchIds
  })
  const [fieldIds, setFieldIds] = useState<string[]>(() => {
    const r = getRosterById(rosterId)
    if (!r) return []
    return splitInitialLineup(
      r.players.map((p) => p.id),
      gameType.onFieldCount,
    ).fieldIds
  })
  const fieldIdsRef = useRef(fieldIds)
  fieldIdsRef.current = fieldIds

  const [playtime, setPlaytime] = useState<PlaytimeSeconds>(() =>
    createZeroPlaytime(getRosterById(rosterId)?.players.map((p) => p.id) ?? []),
  )

  useEffect(() => {
    const r = getRosterById(rosterId)
    if (r) {
      const ids = r.players.map((p) => p.id)
      const { fieldIds: f, benchIds: b } = splitInitialLineup(ids, gameType.onFieldCount)
      setFieldIds(f)
      setBenchIds(b)
      setPlaytime(createZeroPlaytime(ids))
    } else {
      setBenchIds([])
      setFieldIds([])
      setPlaytime({})
    }
  }, [gameType.id, gameType.onFieldCount, rosterId])

  const playerById = useMemo(() => {
    const map = new Map<string, PlayerRecord>()
    roster?.players.forEach((p) => map.set(p.id, p))
    return map
  }, [roster])

  const rosterPlayerIds = useMemo(() => roster?.players.map((p) => p.id) ?? [], [roster])

  /** One shared map of bar widths (bench + field): denominator = max cumulative time on roster. */
  const { percentByPlayerId } = useMemo(
    () => playtimeBarPercentsForRoster(playtime, rosterPlayerIds),
    [playtime, rosterPlayerIds],
  )

  const lineupReady = isStartingLineupComplete(fieldIds.length, gameType.onFieldCount)

  /** Drop on empty space in the same column: send to bottom of that list. */
  function moveToEndOfBench(playerId: string) {
    setBenchIds((b) => {
      if (!b.includes(playerId)) return b
      return [...b.filter((id) => id !== playerId), playerId]
    })
  }

  function moveToEndOfField(playerId: string) {
    setFieldIds((f) => {
      if (!f.includes(playerId)) return f
      return [...f.filter((id) => id !== playerId), playerId]
    })
  }

  function applyBenchToFieldDrop(fieldPlayerId: string, benchPlayerId: string) {
    const r = swapFieldWithBench({ fieldIds, benchIds }, fieldPlayerId, benchPlayerId)
    if (!r.ok) return
    setFieldIds(r.lineup.fieldIds)
    setBenchIds(r.lineup.benchIds)
  }

  function applyFieldToFieldDrop(fieldTargetId: string, fieldSourceId: string) {
    const r = swapTwoOnField({ fieldIds, benchIds }, fieldSourceId, fieldTargetId)
    if (!r.ok) return
    setFieldIds(r.lineup.fieldIds)
    setBenchIds(r.lineup.benchIds)
  }

  function applySwapTwoBench(benchA: string, benchB: string) {
    const r = swapTwoOnBench(benchIds, benchA, benchB)
    if (!r.ok) return
    setBenchIds(r.benchIds)
  }

  function handleBenchColumnChromeDrop(e: DragEvent) {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (!draggedId) return
    if (fieldIds.includes(draggedId)) {
      setFieldIds((f) => f.filter((id) => id !== draggedId))
      setBenchIds((b) => [...b, draggedId])
      return
    }
    if (benchIds.includes(draggedId)) moveToEndOfBench(draggedId)
  }

  function handleFieldColumnChromeDrop(e: DragEvent) {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (!draggedId) return
    if (benchIds.includes(draggedId)) {
      if (fieldIds.length < gameType.onFieldCount) {
        setBenchIds((b) => b.filter((id) => id !== draggedId))
        setFieldIds((f) => [...f, draggedId])
      }
      return
    }
    if (fieldIds.includes(draggedId)) moveToEndOfField(draggedId)
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
        const snap = stateRef.current
        setState((s) => tick(s, delta))
        setPlaytime((p) =>
          tickPlaytime(p, fieldIdsRef.current, delta, {
            runStatus: snap.runStatus,
            segment: snap.segment,
          }),
        )
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
            {showStart && !lineupReady ? (
              <p className="game-lineup-warning" data-testid="lineup-count-warning" role="status">
                Expected {gameType.onFieldCount} on field for this game type; you have {fieldIds.length}.
                You can still start when ready.
              </p>
            ) : null}

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
              <div
                className="game-roster-column-drop"
                data-testid="bench-column-drop"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={handleBenchColumnChromeDrop}
              >
                <ul
                  className="game-roster-ul"
                  aria-label="Bench"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                >
                  {benchIds.map((id) => {
                    const p = playerById.get(id)
                    if (!p) return null
                    const sec = playtime[id] ?? 0
                    const pct = percentByPlayerId[id] ?? 0
                    return (
                      <li
                        key={id}
                        className="game-player-card game-player-card-draggable"
                        data-testid={`game-player-bench-${id}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', id)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.dataTransfer.dropEffect = 'move'
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const draggedId = e.dataTransfer.getData('text/plain')
                          if (!draggedId || draggedId === id) return
                          if (fieldIds.includes(draggedId)) {
                            applyBenchToFieldDrop(draggedId, id)
                            return
                          }
                          if (benchIds.includes(draggedId)) {
                            applySwapTwoBench(draggedId, id)
                          }
                        }}
                      >
                        <div className="game-player-card-body">
                          <div className="game-player-card-main">
                            <span className="game-roster-player-text">{playerLabel(p)}</span>
                            <span className="game-player-time game-player-time-bench">
                              {formatClock(Math.floor(sec))}
                            </span>
                          </div>
                          <div className="game-player-card-actions">
                            <span className="game-player-drag-affordance" aria-hidden>
                              ⠿
                            </span>
                          </div>
                        </div>
                        <div className="game-player-card-meter" aria-hidden>
                          <div
                            className="game-player-card-meter-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
                {benchIds.length === 0 ? (
                  <p
                    className="game-roster-empty-col"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                    }}
                  >
                    Nobody on the bench. Drag players here.
                  </p>
                ) : null}
                <div
                  className="game-roster-drop-gutter"
                  data-testid="bench-drop-gutter"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                />
              </div>
            </div>
            <div className="game-roster-column" data-testid="on-field-list">
              <p className="game-roster-column-title">On field</p>
              <div
                className="game-roster-column-drop"
                data-testid="on-field-column-drop"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={handleFieldColumnChromeDrop}
              >
                <ul
                  className="game-roster-ul"
                  aria-label="On field"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                >
                  {fieldIds.map((id) => {
                    const p = playerById.get(id)
                    if (!p) return null
                    const sec = playtime[id] ?? 0
                    const pct = percentByPlayerId[id] ?? 0
                    return (
                      <li
                        key={id}
                        className="game-player-card game-player-card-draggable"
                        data-testid={`game-player-field-${id}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', id)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.dataTransfer.dropEffect = 'move'
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const draggedId = e.dataTransfer.getData('text/plain')
                          if (!draggedId) return
                          if (benchIds.includes(draggedId)) {
                            applyBenchToFieldDrop(id, draggedId)
                            return
                          }
                          if (fieldIds.includes(draggedId) && draggedId !== id) {
                            applyFieldToFieldDrop(id, draggedId)
                          }
                        }}
                      >
                        <div className="game-player-card-body" data-testid="player-drop-target">
                          <div className="game-player-card-main">
                            <span className="game-roster-player-text">{playerLabel(p)}</span>
                            <span
                              className="game-player-time"
                              data-testid={`player-on-field-seconds-${id}`}
                            >
                              {formatClock(Math.floor(sec))}
                            </span>
                          </div>
                          <div className="game-player-card-actions">
                            <span className="game-player-drag-affordance" aria-hidden>
                              ⠿
                            </span>
                          </div>
                        </div>
                        <div className="game-player-card-meter" aria-hidden>
                          <div
                            className="game-player-card-meter-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
                {fieldIds.length === 0 ? (
                  <p
                    className="game-roster-empty-col"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                    }}
                  >
                    Nobody on field yet. Drag players here.
                  </p>
                ) : null}
                <div
                  className="game-roster-drop-gutter"
                  data-testid="field-drop-gutter"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                />
              </div>
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
