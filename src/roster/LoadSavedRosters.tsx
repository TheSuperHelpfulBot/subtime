import { useCallback, useState } from 'react'
import type { GameTypeRecord } from '../storage/gameTypesStorage'
import {
  getRosters,
  MAX_ROSTER_NAME_LENGTH,
  saveRoster,
  type RosterRecord,
} from '../storage/rosterStorage'
import RosterEditor from './RosterEditor'

type ViewMode =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'edit'; rosterId: string }

export type LoadSavedRostersProps = {
  gameType: GameTypeRecord
  unavailableIds: string[]
  onUnavailableChange: (ids: string[]) => void
  onBack: () => void
  onChooseRoster: (rosterId: string) => void
}

export default function LoadSavedRosters({
  gameType,
  unavailableIds,
  onUnavailableChange,
  onBack,
  onChooseRoster,
}: LoadSavedRostersProps) {
  const [items, setItems] = useState<RosterRecord[]>(() => getRosters())
  const [view, setView] = useState<ViewMode>({ kind: 'list' })
  const [newRosterName, setNewRosterName] = useState('')
  const [formMessage, setFormMessage] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setItems(getRosters())
  }, [])

  function handleCreateRoster() {
    setFormMessage(null)
    const r = saveRoster(newRosterName)
    if (!r.ok) {
      if (r.error === 'empty_name') setFormMessage('Enter a roster name.')
      else if (r.error === 'duplicate_name') setFormMessage('A roster with that name already exists.')
      else if (r.error === 'name_too_long') setFormMessage('Name is too long.')
      else setFormMessage('Could not save roster.')
      return
    }
    setNewRosterName('')
    refresh()
    setView({ kind: 'edit', rosterId: r.roster.id })
  }

  if (view.kind === 'edit') {
    return (
      <RosterEditor
        rosterId={view.rosterId}
        unavailableIds={unavailableIds}
        onUnavailableChange={onUnavailableChange}
        onBack={() => {
          refresh()
          setView({ kind: 'list' })
        }}
        onChanged={refresh}
        backLabel="Back to roster list"
      />
    )
  }

  return (
    <div className="load-saved-rosters" data-testid="load-saved-rosters-screen">
      <button type="button" className="btn-text roster-flow-back" onClick={onBack}>
        Back to game types
      </button>

      <h2 className="load-saved-title">Choose a roster</h2>
      <p className="timer-config-lead">
        Pick a squad for <strong>{gameType.name}</strong>, or create a new one.
      </p>

      {view.kind === 'create' ? (
        <div className="roster-create-form">
          <div className="field">
            <label htmlFor="picker-roster-name">Roster name</label>
            <input
              id="picker-roster-name"
              data-testid="roster-name-input"
              type="text"
              autoComplete="off"
              maxLength={MAX_ROSTER_NAME_LENGTH}
              value={newRosterName}
              onChange={(e) => setNewRosterName(e.target.value)}
            />
          </div>
          {formMessage ? <p className="field-error">{formMessage}</p> : null}
          <div className="roster-create-actions">
            <button type="button" className="cta" data-testid="roster-save" onClick={handleCreateRoster}>
              Save and edit roster
            </button>
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                setFormMessage(null)
                setView({ kind: 'list' })
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <button type="button" className="btn-secondary roster-new" onClick={() => setView({ kind: 'create' })}>
            New roster
          </button>

          {items.length > 0 ? (
            <ul className="roster-list" data-testid="rosters-list" aria-label="Saved rosters">
              {items.map((r) => (
                <li key={r.id} className="roster-list-item" data-testid={`saved-roster-${r.id}`}>
                  <div className="roster-picker-row">
                    <span className="roster-list-name">{r.name}</span>
                    <div className="roster-picker-actions">
                      <button
                        type="button"
                        className="cta roster-use-btn"
                        data-testid={`use-roster-${r.id}`}
                        onClick={() => onChooseRoster(r.id)}
                      >
                        Use for this game
                      </button>
                      <button
                        type="button"
                        className="btn-text"
                        aria-label={`Edit ${r.name}`}
                        onClick={() => setView({ kind: 'edit', rosterId: r.id })}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="game-types-empty" data-testid="rosters-empty">
              No rosters yet. Create one above.
            </p>
          )}
        </>
      )}
    </div>
  )
}
