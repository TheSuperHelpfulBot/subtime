import { useState } from 'react'
import LoadSavedRosters from './roster/LoadSavedRosters'
import SetUpRoster from './roster/SetUpRoster'
import GameScreen from './timer/GameScreen'
import LoadSavedGameTypes from './timer/LoadSavedGameTypes'
import TimerConfigForm from './timer/TimerConfigForm'
import { writeJson } from './storage/appStorage'
import type { GameTypeRecord } from './storage/gameTypesStorage'
import { getGameTypes } from './storage/gameTypesStorage'
import { getRosters } from './storage/rosterStorage'
import { timerConfigToRawForm } from './timer/timerConfig'

type Phase = 'welcome' | 'loadSaved' | 'setup' | 'rosterPick' | 'rosterSetup' | 'game'

type SetupIntent =
  | { kind: 'create'; fromLoadSaved: boolean }
  | { kind: 'edit'; gameType: GameTypeRecord }

export default function App() {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [setupIntent, setSetupIntent] = useState<SetupIntent | null>(null)
  const [pendingGameType, setPendingGameType] = useState<GameTypeRecord | null>(null)
  const [activeGameType, setActiveGameType] = useState<GameTypeRecord | null>(null)
  const [activeRosterId, setActiveRosterId] = useState<string | null>(null)

  function handleGetStarted() {
    writeJson('onboarding', { startedAt: Date.now() })
    setSetupIntent(null)
    if (getGameTypes().length === 0) {
      setSetupIntent({ kind: 'create', fromLoadSaved: false })
      setPhase('setup')
    } else {
      setPhase('loadSaved')
    }
  }

  function goToLoadSaved() {
    setSetupIntent(null)
    setPhase('loadSaved')
  }

  function openCreateNew() {
    setSetupIntent({ kind: 'create', fromLoadSaved: true })
    setPhase('setup')
  }

  function openEdit(gameType: GameTypeRecord) {
    setSetupIntent({ kind: 'edit', gameType })
    setPhase('setup')
  }

  function startGameFromList(gameType: GameTypeRecord) {
    setPendingGameType(gameType)
    if (getRosters().length > 0) {
      setPhase('rosterPick')
    } else {
      setPhase('rosterSetup')
    }
  }

  function openGameWithRoster(gameType: GameTypeRecord, rosterId: string) {
    setActiveGameType(gameType)
    setActiveRosterId(rosterId)
    setPendingGameType(null)
    setPhase('game')
  }

  function backFromRosterFlow() {
    setPendingGameType(null)
    setPhase('loadSaved')
  }

  function leaveGame() {
    setActiveGameType(null)
    setActiveRosterId(null)
    setPhase('loadSaved')
  }

  const showSetupBack =
    setupIntent != null &&
    (setupIntent.kind !== 'create' || setupIntent.fromLoadSaved)

  if (phase === 'setup' && setupIntent) {
    const editingId = setupIntent.kind === 'edit' ? setupIntent.gameType.id : null
    const initialRaw =
      setupIntent.kind === 'edit'
        ? timerConfigToRawForm(setupIntent.gameType.config)
        : undefined
    const initialName = setupIntent.kind === 'edit' ? setupIntent.gameType.name : ''
    const initialOnFieldCount =
      setupIntent.kind === 'edit' ? setupIntent.gameType.onFieldCount : undefined

    return (
      <main className="welcome">
        <div className="welcome-inner timer-layout">
          <TimerConfigForm
            key={
              setupIntent.kind === 'edit'
                ? `edit-${setupIntent.gameType.id}`
                : setupIntent.fromLoadSaved
                  ? 'create-from-list'
                  : 'create-first'
            }
            editingId={editingId}
            initialRaw={initialRaw}
            initialName={initialName}
            initialOnFieldCount={initialOnFieldCount}
            onSaved={goToLoadSaved}
            onCancel={showSetupBack ? goToLoadSaved : undefined}
          />
        </div>
      </main>
    )
  }

  if (phase === 'game' && activeGameType && activeRosterId) {
    return (
      <GameScreen gameType={activeGameType} rosterId={activeRosterId} onLeave={leaveGame} />
    )
  }

  if (phase === 'rosterPick' && pendingGameType) {
    return (
      <main className="welcome">
        <div className="welcome-inner timer-layout">
          <LoadSavedRosters
            gameType={pendingGameType}
            onBack={backFromRosterFlow}
            onChooseRoster={(rosterId) => openGameWithRoster(pendingGameType, rosterId)}
          />
        </div>
      </main>
    )
  }

  if (phase === 'rosterSetup' && pendingGameType) {
    return (
      <main className="welcome">
        <div className="welcome-inner timer-layout">
          <SetUpRoster
            gameType={pendingGameType}
            onBack={backFromRosterFlow}
            onComplete={(rosterId) => openGameWithRoster(pendingGameType, rosterId)}
          />
        </div>
      </main>
    )
  }

  if (phase === 'loadSaved') {
    return (
      <main className="welcome">
        <div className="welcome-inner timer-layout">
          <LoadSavedGameTypes
            onCreateNew={openCreateNew}
            onEdit={openEdit}
            onStartGame={startGameFromList}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="welcome">
      <div className="welcome-inner">
        <h1>Simple Subs</h1>
        <p className="tagline">Substitution scheduling made simple.</p>
        <button type="button" className="cta" onClick={handleGetStarted}>
          Get started
        </button>
      </div>
    </main>
  )
}
