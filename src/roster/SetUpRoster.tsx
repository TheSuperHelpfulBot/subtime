import { useState } from 'react'
import type { GameTypeRecord } from '../storage/gameTypesStorage'
import { MAX_ROSTER_NAME_LENGTH, saveRoster } from '../storage/rosterStorage'
import RosterEditor from './RosterEditor'

type Step = { kind: 'name' } | { kind: 'edit'; rosterId: string }

export type SetUpRosterProps = {
  gameType: GameTypeRecord
  unavailableIds: string[]
  onUnavailableChange: (ids: string[]) => void
  onBack: () => void
  onComplete: (rosterId: string) => void
}

export default function SetUpRoster({
  gameType,
  unavailableIds,
  onUnavailableChange,
  onBack,
  onComplete,
}: SetUpRosterProps) {
  const [step, setStep] = useState<Step>({ kind: 'name' })
  const [newRosterName, setNewRosterName] = useState('')
  const [formMessage, setFormMessage] = useState<string | null>(null)

  function handleSaveName() {
    setFormMessage(null)
    const r = saveRoster(newRosterName)
    if (!r.ok) {
      if (r.error === 'empty_name') setFormMessage('Enter a roster name.')
      else if (r.error === 'duplicate_name') setFormMessage('A roster with that name already exists.')
      else if (r.error === 'name_too_long') setFormMessage('Name is too long.')
      else setFormMessage('Could not save roster.')
      return
    }
    setStep({ kind: 'edit', rosterId: r.roster.id })
  }

  if (step.kind === 'edit') {
    return (
      <RosterEditor
        rosterId={step.rosterId}
        unavailableIds={unavailableIds}
        onUnavailableChange={onUnavailableChange}
        onBack={onBack}
        onChanged={() => {}}
        backLabel="Back to game types"
        onContinueToGame={() => onComplete(step.rosterId)}
      />
    )
  }

  return (
    <div className="set-up-roster" data-testid="set-up-roster-screen">
      <button type="button" className="btn-text roster-flow-back" onClick={onBack}>
        Back to game types
      </button>

      <h2 className="load-saved-title">Set up a roster</h2>
      <p className="timer-config-lead">
        Create a squad for <strong>{gameType.name}</strong>. You can add players next, then continue to
        the game.
      </p>

      <div className="field">
        <label htmlFor="setup-roster-name">Roster name</label>
        <input
          id="setup-roster-name"
          data-testid="roster-name-input"
          type="text"
          autoComplete="off"
          maxLength={MAX_ROSTER_NAME_LENGTH}
          value={newRosterName}
          onChange={(e) => setNewRosterName(e.target.value)}
        />
      </div>
      {formMessage ? <p className="field-error">{formMessage}</p> : null}

      <button type="button" className="cta load-saved-create" data-testid="roster-save" onClick={handleSaveName}>
        Save and add players
      </button>
    </div>
  )
}
