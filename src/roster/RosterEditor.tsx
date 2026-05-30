import { useCallback, useRef, useState } from 'react'
import SetupScreenPanel, { SetupScreenBody, SetupScreenHeader } from '../SetupScreen'
import {
  MAX_PLAYER_NAME_LENGTH,
  MAX_ROSTER_NAME_LENGTH,
  MAX_SHIRT_NUMBER_LENGTH,
  addPlayerToRoster,
  deleteRoster,
  getRosterById,
  removePlayerFromRoster,
  updatePlayerInRoster,
  updateRosterName,
  type PlayerRecord,
} from '../storage/rosterStorage'
import { toggleUnavailable } from '../timer/playerAvailability'
import ToggleSwitch from './ToggleSwitch'

export type RosterEditorProps = {
  rosterId: string
  onBack: () => void
  onChanged: () => void
  /** Session-only unavailable flags for this game. */
  unavailableIds?: string[]
  onUnavailableChange?: (ids: string[]) => void
  /** Replaces the default "Back to list" label on the back control. */
  backLabel?: string
  /** When set, shows a primary action to leave the editor and start the game. */
  onContinueToGame?: () => void
  /** Disable destructive roster deletion when editing during an active game. */
  allowDeleteRoster?: boolean
}

function formatPlayerLine(p: PlayerRecord): string {
  const parts: string[] = []
  if (p.name.trim() !== '') parts.push(p.name.trim())
  if (p.shirtNumber.trim() !== '') parts.push(`#${p.shirtNumber.trim()}`)
  return parts.join(' ')
}

function IconPencil() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconX() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function RosterEditor({
  rosterId,
  onBack,
  onChanged,
  unavailableIds = [],
  onUnavailableChange,
  backLabel = 'Back to list',
  onContinueToGame,
  allowDeleteRoster = true,
}: RosterEditorProps) {
  const [rosterName, setRosterName] = useState(() => getRosterById(rosterId)?.name ?? '')
  const [playerName, setPlayerName] = useState('')
  const [playerShirt, setPlayerShirt] = useState('')
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const newPlayerNameInputRef = useRef<HTMLInputElement>(null)

  const roster = getRosterById(rosterId)

  const refreshLocal = useCallback(() => {
    const r = getRosterById(rosterId)
    if (r) setRosterName(r.name)
  }, [rosterId])

  const players = roster?.players ?? []

  function handleSaveRosterName() {
    setFormMessage(null)
    const r = updateRosterName(rosterId, rosterName)
    if (!r.ok) {
      if (r.error === 'empty_name') setFormMessage('Enter a roster name.')
      else if (r.error === 'duplicate_name') setFormMessage('Another roster already uses that name.')
      else if (r.error === 'name_too_long') setFormMessage('Name is too long.')
      else setFormMessage('Could not save.')
      return
    }
    onChanged()
    refreshLocal()
  }

  function handleAddPlayer() {
    setFormMessage(null)
    const r = addPlayerToRoster(rosterId, { name: playerName, shirtNumber: playerShirt })
    if (!r.ok) {
      if (r.error === 'empty_player') setFormMessage('Enter a name or shirt number.')
      else if (r.error === 'name_too_long') setFormMessage('Player name is too long.')
      else if (r.error === 'shirt_too_long') setFormMessage('Shirt number is too long.')
      else setFormMessage('Could not add player.')
      return
    }
    setPlayerName('')
    setPlayerShirt('')
    onChanged()
    refreshLocal()
    queueMicrotask(() => {
      newPlayerNameInputRef.current?.focus()
    })
  }

  function handleDeleteRoster() {
    deleteRoster(rosterId)
    onChanged()
    onBack()
  }

  if (!roster) {
    return (
      <div className="roster-editor" data-testid="roster-editor">
        <p>Roster not found.</p>
        <button type="button" className="btn-secondary" data-testid="roster-editor-back" onClick={onBack}>
          Back
        </button>
      </div>
    )
  }

  return (
    <SetupScreenPanel className="roster-editor" testId="roster-editor">
      <SetupScreenHeader>
       
        <h3 className="screen-title">Edit roster</h3>
      </SetupScreenHeader>

      <SetupScreenBody>
      <div className="field">
        <label htmlFor="roster-edit-name">Roster name</label>
        <input
          id="roster-edit-name"
          name="rosterName"
          type="text"
          autoComplete="off"
          data-testid="roster-name-input"
          maxLength={MAX_ROSTER_NAME_LENGTH}
          value={rosterName}
          onChange={(e) => setRosterName(e.target.value)}
        />
      </div>
      <button type="button" className="btn-secondary roster-save-name" onClick={handleSaveRosterName}>
        Save name
      </button>
      <button type="button" className="btn-secondary" onClick={onBack}>Back to roster list</button>
      <div className="roster-editor-players">
        <p className="roster-editor-section-label">Players</p>
        {onUnavailableChange ? (
          <p className="timer-config-lead roster-availability-hint">
            Mark players unavailable if they cannot play today. They will not appear on the bench
            or field during the match.
          </p>
        ) : null}
        <form
          className="roster-add-player"
          onSubmit={(e) => {
            e.preventDefault()
            handleAddPlayer()
          }}
        >
          <div className="roster-add-fields-row">
            <div className="field">
              <label htmlFor="player-name-input">Name</label>
              <input
                ref={newPlayerNameInputRef}
                id="player-name-input"
                data-testid="player-name-input"
                type="text"
                autoComplete="off"
                maxLength={MAX_PLAYER_NAME_LENGTH}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="player-shirt-input">Shirt</label>
              <input
                id="player-shirt-input"
                data-testid="player-shirt-input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={MAX_SHIRT_NUMBER_LENGTH}
                value={playerShirt}
                onChange={(e) => setPlayerShirt(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="cta roster-add-player-btn" data-testid="add-player-submit">
            Add player
          </button>
        </form>

        <ul className="roster-players-list" data-testid="roster-players-list" aria-label="Players in roster">
          {players.map((p) => (
            <li key={p.id} className="roster-player-card">
              {editingPlayerId === p.id ? (
                <RosterPlayerEditRow
                  player={p}
                  onCancel={() => setEditingPlayerId(null)}
                  onSave={(input) => {
                    const r = updatePlayerInRoster(rosterId, p.id, input)
                    if (!r.ok) {
                      setFormMessage('Could not update player.')
                      return
                    }
                    setEditingPlayerId(null)
                    onChanged()
                    refreshLocal()
                  }}
                />
              ) : (
                <div className="roster-player-card-main">
                  <div className="roster-player-card-info">
                    <span className="roster-player-line">{formatPlayerLine(p)}</span>
                    {onUnavailableChange ? (
                      <ToggleSwitch
                        id={`roster-unavail-${p.id}`}
                        checked={unavailableIds.includes(p.id)}
                        onChange={(checked) =>
                          onUnavailableChange(toggleUnavailable(unavailableIds, p.id, checked))
                        }
                        label="Unavailable today"
                        testId={`roster-unavailable-${p.id}`}
                      />
                    ) : null}
                  </div>
                  <div className="roster-player-card-actions">
                    <button
                      type="button"
                      className="roster-icon-btn"
                      aria-label="Edit player"
                      title="Edit"
                      onClick={() => setEditingPlayerId(p.id)}
                    >
                      <IconPencil />
                    </button>
                    <button
                      type="button"
                      className="roster-icon-btn danger"
                      aria-label="Remove player"
                      title="Remove"
                      onClick={() => {
                        removePlayerFromRoster(rosterId, p.id)
                        if (onUnavailableChange) {
                          onUnavailableChange(unavailableIds.filter((id) => id !== p.id))
                        }
                        onChanged()
                        refreshLocal()
                      }}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {formMessage ? <p className="field-error roster-editor-message">{formMessage}</p> : null}

      {onContinueToGame ? (
        <div className="roster-continue-wrap">
          <button
            type="button"
            className="cta roster-continue-game"
            data-testid="roster-continue-to-game"
            onClick={onContinueToGame}
          >
            Continue to game
          </button>
        </div>
      ) : null}

      {allowDeleteRoster ? (
        <div className="roster-editor-danger">
          <button type="button" className="btn-secondary danger-outline" onClick={handleDeleteRoster}>
            Delete roster
          </button>
        </div>
      ) : null}
      </SetupScreenBody>
    </SetupScreenPanel>
  )
}

function RosterPlayerEditRow({
  player,
  onSave,
  onCancel,
}: {
  player: PlayerRecord
  onSave: (input: { name: string; shirtNumber: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(player.name)
  const [shirt, setShirt] = useState(player.shirtNumber)
  const editNameId = `edit-player-name-${player.id}`
  const editShirtId = `edit-player-shirt-${player.id}`

  return (
    <div className="roster-player-edit-card">
      <span className="sr-only">Editing {formatPlayerLine(player)}</span>
      <div className="roster-add-fields-row roster-player-edit-fields">
        <div className="field">
          <label htmlFor={editNameId}>Name</label>
          <input
            id={editNameId}
            maxLength={MAX_PLAYER_NAME_LENGTH}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={editShirtId}>Shirt</label>
          <input
            id={editShirtId}
            maxLength={MAX_SHIRT_NUMBER_LENGTH}
            value={shirt}
            onChange={(e) => setShirt(e.target.value)}
          />
        </div>
      </div>
      <div className="roster-player-edit-actions">
        <button
          type="button"
          className="roster-icon-btn"
          aria-label="Save player"
          title="Save"
          onClick={() => onSave({ name, shirtNumber: shirt })}
        >
          <IconCheck />
        </button>
        <button
          type="button"
          className="roster-icon-btn danger"
          aria-label="Cancel editing"
          title="Cancel"
          onClick={onCancel}
        >
          <IconX />
        </button>
      </div>
    </div>
  )
}
