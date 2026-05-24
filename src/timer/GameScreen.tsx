import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
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
const POINTER_DRAG_THRESHOLD_PX = 4

type DropZone = 'bench' | 'field'

type PointerDragSession = {
  playerId: string
  pointerId: number
  startX: number
  startY: number
  hasMoved: boolean
}

type PointerDropPreview =
  | { kind: 'player'; playerId: string }
  | { kind: 'zone'; zone: DropZone }
  | null

function playerLabel(p: PlayerRecord): string {
  const name = p.name.trim()
  const num = p.shirtNumber.trim()
  if (name && num) return `${name} · #${num}`
  if (name) return name
  if (num) return `#${num}`
  return 'Player'
}

function closestHTMLElement(element: Element | null, selector: string): HTMLElement | null {
  return element?.closest(selector) as HTMLElement | null
}

function isDropZone(value: string | undefined): value is DropZone {
  return value === 'bench' || value === 'field'
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
  const benchIdsRef = useRef(benchIds)
  benchIdsRef.current = benchIds
  const pointerDragRef = useRef<PointerDragSession | null>(null)
  const cleanupPointerDragRef = useRef<(() => void) | null>(null)
  const [pointerDraggingPlayerId, setPointerDraggingPlayerId] = useState<string | null>(null)
  const [pointerDropPreview, setPointerDropPreview] = useState<PointerDropPreview>(null)

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

  function clearPointerDrag() {
    cleanupPointerDragRef.current?.()
    cleanupPointerDragRef.current = null
    pointerDragRef.current = null
    setPointerDraggingPlayerId(null)
    setPointerDropPreview(null)
  }

  function dropPreviewForElement(playerId: string, element: Element | null): PointerDropPreview {
    const playerCard = closestHTMLElement(element, '[data-game-player-card="true"]')
    const targetPlayerId = playerCard?.dataset.playerId
    const targetZone = playerCard?.dataset.playerZone

    if (targetPlayerId && targetPlayerId !== playerId && isDropZone(targetZone)) {
      const draggingFromField = fieldIdsRef.current.includes(playerId)
      const draggingFromBench = benchIdsRef.current.includes(playerId)
      if (targetZone === 'bench' && (draggingFromField || draggingFromBench)) {
        return { kind: 'player', playerId: targetPlayerId }
      }
      if (targetZone === 'field' && (draggingFromBench || draggingFromField)) {
        return { kind: 'player', playerId: targetPlayerId }
      }
    }

    const rosterZone = closestHTMLElement(element, '[data-game-roster-zone]')?.dataset
      .gameRosterZone
    if (!isDropZone(rosterZone)) return null

    if (rosterZone === 'bench') {
      if (fieldIdsRef.current.includes(playerId) || benchIdsRef.current.includes(playerId)) {
        return { kind: 'zone', zone: rosterZone }
      }
      return null
    }

    if (fieldIdsRef.current.includes(playerId)) return { kind: 'zone', zone: rosterZone }
    if (benchIdsRef.current.includes(playerId) && fieldIdsRef.current.length < gameType.onFieldCount) {
      return { kind: 'zone', zone: rosterZone }
    }
    return null
  }

  function applyPointerDrop(playerId: string, clientX: number, clientY: number) {
    const element = document.elementFromPoint(clientX, clientY)
    const playerCard = closestHTMLElement(element, '[data-game-player-card="true"]')
    const targetPlayerId = playerCard?.dataset.playerId
    const targetZone = playerCard?.dataset.playerZone

    if (targetPlayerId && targetPlayerId !== playerId && isDropZone(targetZone)) {
      if (targetZone === 'bench') {
        if (fieldIdsRef.current.includes(playerId)) {
          applyBenchToFieldDrop(playerId, targetPlayerId)
          return
        }
        if (benchIdsRef.current.includes(playerId)) {
          applySwapTwoBench(playerId, targetPlayerId)
          return
        }
      }

      if (targetZone === 'field') {
        if (benchIdsRef.current.includes(playerId)) {
          applyBenchToFieldDrop(targetPlayerId, playerId)
          return
        }
        if (fieldIdsRef.current.includes(playerId)) {
          applyFieldToFieldDrop(targetPlayerId, playerId)
          return
        }
      }
    }

    const rosterZone = closestHTMLElement(element, '[data-game-roster-zone]')?.dataset
      .gameRosterZone
    if (!isDropZone(rosterZone)) return

    if (rosterZone === 'bench') {
      if (fieldIdsRef.current.includes(playerId)) {
        setFieldIds((f) => f.filter((id) => id !== playerId))
        setBenchIds((b) => [...b, playerId])
        return
      }
      if (benchIdsRef.current.includes(playerId)) moveToEndOfBench(playerId)
      return
    }

    if (benchIdsRef.current.includes(playerId)) {
      if (fieldIdsRef.current.length < gameType.onFieldCount) {
        setBenchIds((b) => b.filter((id) => id !== playerId))
        setFieldIds((f) => [...f, playerId])
      }
      return
    }
    if (fieldIdsRef.current.includes(playerId)) moveToEndOfField(playerId)
  }

  function handlePlayerPointerDown(
    e: ReactPointerEvent<HTMLLIElement>,
    playerId: string,
  ) {
    if (!e.isPrimary || e.pointerType === 'mouse') return

    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Some pointer sources cannot be captured, but document listeners still track the drag.
    }
    clearPointerDrag()

    pointerDragRef.current = {
      playerId,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
    }
    setPointerDraggingPlayerId(playerId)

    const handlePointerMove = (event: PointerEvent) => {
      const session = pointerDragRef.current
      if (!session || event.pointerId !== session.pointerId) return

      const dx = event.clientX - session.startX
      const dy = event.clientY - session.startY
      if (Math.hypot(dx, dy) >= POINTER_DRAG_THRESHOLD_PX) {
        session.hasMoved = true
      }
      if (session.hasMoved) {
        event.preventDefault()
        setPointerDropPreview(
          dropPreviewForElement(
            session.playerId,
            document.elementFromPoint(event.clientX, event.clientY),
          ),
        )
      }
    }

    const handlePointerUp = (event: PointerEvent) => {
      const session = pointerDragRef.current
      if (!session || event.pointerId !== session.pointerId) return

      event.preventDefault()
      if (session.hasMoved) {
        applyPointerDrop(session.playerId, event.clientX, event.clientY)
      }
      clearPointerDrag()
    }

    const handlePointerCancel = (event: PointerEvent) => {
      const session = pointerDragRef.current
      if (!session || event.pointerId !== session.pointerId) return
      clearPointerDrag()
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('pointercancel', handlePointerCancel)
    cleanupPointerDragRef.current = () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('pointercancel', handlePointerCancel)
    }
  }

  function playerCardClassName(playerId: string) {
    return [
      'game-player-card',
      'game-player-card-draggable',
      pointerDraggingPlayerId === playerId ? 'game-player-card-pointer-dragging' : '',
      pointerDropPreview?.kind === 'player' && pointerDropPreview.playerId === playerId
        ? 'game-player-card-drop-target'
        : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  function columnDropClassName(zone: DropZone) {
    return [
      'game-roster-column-drop',
      pointerDropPreview?.kind === 'zone' && pointerDropPreview.zone === zone
        ? 'game-roster-column-drop-target'
        : '',
    ]
      .filter(Boolean)
      .join(' ')
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

  useEffect(
    () => () => {
      cleanupPointerDragRef.current?.()
      cleanupPointerDragRef.current = null
      pointerDragRef.current = null
    },
    [],
  )

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
            <div className="game-roster-column" data-testid="bench-list" data-game-roster-zone="bench">
              <p className="game-roster-column-title">Bench</p>
              <div
                className={columnDropClassName('bench')}
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
                        className={playerCardClassName(id)}
                        data-testid={`game-player-bench-${id}`}
                        data-game-player-card="true"
                        data-player-id={id}
                        data-player-zone="bench"
                        draggable
                        onPointerDown={(e) => handlePlayerPointerDown(e, id)}
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
            <div className="game-roster-column" data-testid="on-field-list" data-game-roster-zone="field">
              <p className="game-roster-column-title">On field</p>
              <div
                className={columnDropClassName('field')}
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
                        className={playerCardClassName(id)}
                        data-testid={`game-player-field-${id}`}
                        data-game-player-card="true"
                        data-player-id={id}
                        data-player-zone="field"
                        draggable
                        onPointerDown={(e) => handlePlayerPointerDown(e, id)}
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
