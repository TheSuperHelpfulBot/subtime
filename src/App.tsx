import { useState } from 'react'
import LoadSavedGameTypes from './timer/LoadSavedGameTypes'
import TimerConfigForm from './timer/TimerConfigForm'
import { writeJson } from './storage/appStorage'
import { getGameTypes, type GameTypeRecord } from './storage/gameTypesStorage'
import { timerConfigToRawForm } from './timer/timerConfig'

type Phase = 'welcome' | 'loadSaved' | 'setup'

type SetupIntent =
  | { kind: 'create'; fromLoadSaved: boolean }
  | { kind: 'edit'; gameType: GameTypeRecord }
  | { kind: 'template'; template: GameTypeRecord }

export default function App() {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [setupIntent, setSetupIntent] = useState<SetupIntent | null>(null)

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

  function openTemplate(gameType: GameTypeRecord) {
    setSetupIntent({ kind: 'template', template: gameType })
    setPhase('setup')
  }

  const showSetupBack =
    setupIntent != null &&
    (setupIntent.kind !== 'create' || setupIntent.fromLoadSaved)

  if (phase === 'setup' && setupIntent) {
    const editingId = setupIntent.kind === 'edit' ? setupIntent.gameType.id : null
    const initialRaw =
      setupIntent.kind === 'edit'
        ? timerConfigToRawForm(setupIntent.gameType.config)
        : setupIntent.kind === 'template'
          ? timerConfigToRawForm(setupIntent.template.config)
          : undefined
    const initialName =
      setupIntent.kind === 'edit'
        ? setupIntent.gameType.name
        : setupIntent.kind === 'template'
          ? ''
          : ''

    return (
      <main className="welcome">
        <div className="welcome-inner timer-layout">
          <TimerConfigForm
            key={
              setupIntent.kind === 'edit'
                ? `edit-${setupIntent.gameType.id}`
                : setupIntent.kind === 'template'
                  ? `tpl-${setupIntent.template.id}`
                  : setupIntent.fromLoadSaved
                    ? 'create-from-list'
                    : 'create-first'
            }
            editingId={editingId}
            initialRaw={initialRaw}
            initialName={initialName}
            onSaved={goToLoadSaved}
            onCancel={showSetupBack ? goToLoadSaved : undefined}
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
            onLoad={openTemplate}
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
