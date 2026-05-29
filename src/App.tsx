import { useState, type ReactElement } from 'react'
import AppChrome from './AppChrome'
import LoadSavedRosters from './roster/LoadSavedRosters'
import SetUpRoster from './roster/SetUpRoster'
import GameScreen from './timer/GameScreen'
import LoadSavedGameTypes from './timer/LoadSavedGameTypes'
import SubStrategySetup from './timer/SubStrategySetup'
import TimerConfigForm from './timer/TimerConfigForm'
import { writeJson } from './storage/appStorage'
import type { GameTypeRecord } from './storage/gameTypesStorage'
import { getGameTypes } from './storage/gameTypesStorage'
import { getRosters } from './storage/rosterStorage'
import {
  DEFAULT_SUB_STRATEGY_CONFIG,
  type SubStrategyConfig,
} from './timer/subStrategy/types'
import { timerConfigToRawForm } from './timer/timerConfig'

type Phase =
  | 'welcome'
  | 'loadSaved'
  | 'setup'
  | 'rosterPick'
  | 'rosterSetup'
  | 'strategySetup'
  | 'game'

type SetupIntent =
  | { kind: 'create'; fromLoadSaved: boolean }
  | { kind: 'edit'; gameType: GameTypeRecord }

function withAppChrome(screen: ReactElement) {
  return (
    <>
      <AppChrome />
      {screen}
    </>
  )
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [setupIntent, setSetupIntent] = useState<SetupIntent | null>(null)
  const [pendingGameType, setPendingGameType] = useState<GameTypeRecord | null>(null)
  const [activeGameType, setActiveGameType] = useState<GameTypeRecord | null>(null)
  const [activeRosterId, setActiveRosterId] = useState<string | null>(null)
  const [subStrategyConfig, setSubStrategyConfig] = useState<SubStrategyConfig>(
    DEFAULT_SUB_STRATEGY_CONFIG,
  )
  const [unavailablePlayerIds, setUnavailablePlayerIds] = useState<string[]>([])

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

  function openStrategySetup(gameType: GameTypeRecord, rosterId: string) {
    setPendingGameType(gameType)
    setActiveGameType(gameType)
    setActiveRosterId(rosterId)
    setSubStrategyConfig(DEFAULT_SUB_STRATEGY_CONFIG)
    setUnavailablePlayerIds([])
    setPhase('strategySetup')
  }

  function startGameFromStrategy(config: SubStrategyConfig) {
    setSubStrategyConfig(config)
    setPendingGameType(null)
    setPhase('game')
  }

  function backFromStrategySetup() {
    setActiveGameType(null)
    setActiveRosterId(null)
    setPendingGameType(null)
    setPhase('loadSaved')
  }

  function backFromRosterFlow() {
    setPendingGameType(null)
    setPhase('loadSaved')
  }

  function leaveGame() {
    setActiveGameType(null)
    setActiveRosterId(null)
    setSubStrategyConfig(DEFAULT_SUB_STRATEGY_CONFIG)
    setUnavailablePlayerIds([])
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

    return withAppChrome(
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
      </main>,
    )
  }

  if (phase === 'game' && activeGameType && activeRosterId) {
    return withAppChrome(
      <GameScreen
        gameType={activeGameType}
        rosterId={activeRosterId}
        subStrategyConfig={subStrategyConfig}
        unavailableIds={unavailablePlayerIds}
        onConfigChange={setSubStrategyConfig}
        onUnavailableChange={setUnavailablePlayerIds}
        onLeave={leaveGame}
      />,
    )
  }

  if (phase === 'strategySetup' && activeGameType && activeRosterId) {
    return withAppChrome(
      <main className="welcome">
        <div className="welcome-inner timer-layout">
          <SubStrategySetup
            gameType={activeGameType}
            rosterId={activeRosterId}
            onBack={backFromStrategySetup}
            onStartGame={startGameFromStrategy}
          />
        </div>
      </main>,
    )
  }

  if (phase === 'rosterPick' && pendingGameType) {
    return withAppChrome(
      <main className="welcome">
        <div className="welcome-inner timer-layout">
          <LoadSavedRosters
            gameType={pendingGameType}
            unavailableIds={unavailablePlayerIds}
            onUnavailableChange={setUnavailablePlayerIds}
            onBack={backFromRosterFlow}
            onChooseRoster={(rosterId) => openStrategySetup(pendingGameType, rosterId)}
          />
        </div>
      </main>,
    )
  }

  if (phase === 'rosterSetup' && pendingGameType) {
    return withAppChrome(
      <main className="welcome">
        <div className="welcome-inner timer-layout">
          <SetUpRoster
            gameType={pendingGameType}
            unavailableIds={unavailablePlayerIds}
            onUnavailableChange={setUnavailablePlayerIds}
            onBack={backFromRosterFlow}
            onComplete={(rosterId) => openStrategySetup(pendingGameType, rosterId)}
          />
        </div>
      </main>,
    )
  }

  if (phase === 'loadSaved') {
    return withAppChrome(
      <main className="welcome">
        <div className="welcome-inner timer-layout">
          <LoadSavedGameTypes
            onCreateNew={openCreateNew}
            onEdit={openEdit}
            onStartGame={startGameFromList}
          />
        </div>
      </main>,
    )
  }

  return withAppChrome(
    <main className="welcome">
      <div className="welcome-inner">
        <h1>Simple Subs</h1>
        <p className="tagline">Substitution scheduling made simple.</p>
        <button type="button" className="cta" onClick={handleGetStarted}>
          Get started
        </button>
      </div>
    </main>,
  )
}
