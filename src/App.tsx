import { useState } from 'react'
import LoadSavedGameTypes from './timer/LoadSavedGameTypes'
import GameScreen from './timer/GameScreen'
import TimerConfigForm from './timer/TimerConfigForm'
import { writeJson } from './storage/appStorage'
import { getGameTypes, type GameTypeRecord } from './storage/gameTypesStorage'
import { timerConfigToRawForm } from './timer/timerConfig'

type Phase = 'welcome' | 'loadSaved' | 'setup' | 'game'

type SetupIntent =
  | { kind: 'create'; fromLoadSaved: boolean }
  | { kind: 'edit'; gameType: GameTypeRecord }

export default function App() {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [setupIntent, setSetupIntent] = useState<SetupIntent | null>(null)
  const [activeGameType, setActiveGameType] = useState<GameTypeRecord | null>(null)

  function handleGetStarted() {
    writeJson('onboarding', { startedAt: Date.now() })
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

  function openGame(gameType: GameTypeRecord) {
    setActiveGameType(gameType)
    setPhase('game')
  }

  function leaveGame() {
    setActiveGameType(null)
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

  if (phase === 'game' && activeGameType) {
    return (
      <GameScreen gameType={activeGameType} onLeave={leaveGame} />
    )
  }

  if (phase === 'loadSaved') {
    return (
      <main className="welcome">
        <div className="welcome-inner timer-layout">
          <LoadSavedGameTypes
            onCreateNew={openCreateNew}
            onEdit={openEdit}
            onStartGame={openGame}
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
