import { useMemo, useState } from 'react'
import {
  saveGameType,
  updateGameType,
} from '../storage/gameTypesStorage'
import {
  type RawTimerForm,
  formatMinutesForDisplay,
  parseAndValidateTimerForm,
  timerConfigToRawForm,
  type TimerConfig,
} from './timerConfig'

const DEFAULT_RAW: RawTimerForm = {
  periods: '4',
  periodDurationMinutes: '12',
  breakDurationMinutes: '2',
}

export type TimerConfigFormProps = {
  /** When set, save updates this record instead of creating one. */
  editingId?: string | null
  /** Seed timer fields (and optionally name via initialName). */
  initialRaw?: RawTimerForm
  initialName?: string
  onSaved?: () => void
  onCancel?: () => void
}

export default function TimerConfigForm({
  editingId = null,
  initialRaw,
  initialName = '',
  onSaved,
  onCancel,
}: TimerConfigFormProps) {
  const [raw, setRaw] = useState<RawTimerForm>(initialRaw ?? DEFAULT_RAW)
  const [gameTypeName, setGameTypeName] = useState(initialName)
  const [formMessage, setFormMessage] = useState<string | null>(null)

  const { valid, config, errors } = useMemo(() => parseAndValidateTimerForm(raw), [raw])

  function update<K extends keyof RawTimerForm>(key: K, value: string) {
    setRaw((prev) => ({ ...prev, [key]: value }))
  }

  function handleSaveGameType() {
    setFormMessage(null)
    if (!valid || !config) return

    if (editingId) {
      const result = updateGameType(editingId, gameTypeName, config)
      if (!result.ok) {
        if (result.error === 'duplicate_name') {
          setFormMessage('Another game type already uses that name.')
        } else if (result.error === 'empty_name') {
          setFormMessage('Enter a name for this game type.')
        } else {
          setFormMessage('Could not save changes.')
        }
        return
      }
    } else {
      const result = saveGameType(gameTypeName, config)
      if (!result.ok) {
        if (result.error === 'duplicate_name') {
          setFormMessage('A game type with that name already exists.')
        } else {
          setFormMessage('Enter a name for this game type.')
        }
        return
      }
    }

    setGameTypeName('')
    onSaved?.()
  }

  const saveDisabled = !valid || !config || gameTypeName.trim() === ''

  return (
    <form className="timer-config" noValidate onSubmit={(e) => e.preventDefault()}>
      <h2 className="timer-config-title">Set Up Game Type</h2>
      <p className="timer-config-lead">
        Name your setup, then set periods and timing for this match. You can change this later.
      </p>

      <div className="field">
        <label htmlFor="game-type-name">Game type name</label>
        <input
          id="game-type-name"
          name="gameTypeName"
          type="text"
          autoComplete="off"
          placeholder="e.g. Saturday league"
          value={gameTypeName}
          onChange={(e) => setGameTypeName(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="timer-periods">Number of periods</label>
        <input
          id="timer-periods"
          name="periods"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={raw.periods}
          onChange={(e) => update('periods', e.target.value)}
          aria-invalid={errors.periods ? true : undefined}
          aria-describedby={errors.periods ? 'timer-periods-error' : undefined}
        />
        {errors.periods ? (
          <p id="timer-periods-error" className="field-error" role="alert">
            {errors.periods}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="timer-period-mins">Period length (minutes or mm:ss)</label>
        <input
          id="timer-period-mins"
          name="periodDurationMinutes"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="e.g. 12 or 12:30"
          value={raw.periodDurationMinutes}
          onChange={(e) => update('periodDurationMinutes', e.target.value)}
          aria-invalid={errors.periodDurationMinutes ? true : undefined}
          aria-describedby={
            errors.periodDurationMinutes ? 'timer-period-mins-error' : undefined
          }
        />
        {errors.periodDurationMinutes ? (
          <p id="timer-period-mins-error" className="field-error" role="alert">
            {errors.periodDurationMinutes}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="timer-break-mins">Break length (minutes or mm:ss)</label>
        <input
          id="timer-break-mins"
          name="breakDurationMinutes"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="e.g. 2 or 1:30"
          value={raw.breakDurationMinutes}
          onChange={(e) => update('breakDurationMinutes', e.target.value)}
          aria-invalid={errors.breakDurationMinutes ? true : undefined}
          aria-describedby={
            errors.breakDurationMinutes ? 'timer-break-mins-error' : undefined
          }
        />
        {errors.breakDurationMinutes ? (
          <p id="timer-break-mins-error" className="field-error" role="alert">
            {errors.breakDurationMinutes}
          </p>
        ) : null}
      </div>

      <p className="timer-summary" data-testid="timer-summary" aria-live="polite">
        {valid && config ? (
          <>
            {config.periods} {config.periods === 1 ? 'period' : 'periods'} of{' '}
            {formatMinutesForDisplay(config.periodDurationMinutes)} minutes
            {config.breakDurationMinutes > 0
              ? `, ${formatMinutesForDisplay(config.breakDurationMinutes)}-minute breaks`
              : ', no breaks between periods'}
            .
          </>
        ) : (
          <>Adjust the values above to match your game structure.</>
        )}
      </p>

      <div className="game-type-actions setup-save-actions">
        <button
          type="button"
          className="btn-secondary"
          disabled={saveDisabled}
          onClick={handleSaveGameType}
        >
          Save game type
        </button>
      </div>

      {onCancel ? (
        <div className="setup-cancel-wrap">
          <button type="button" className="btn-text setup-back" onClick={onCancel}>
            Back
          </button>
        </div>
      ) : null}

      {formMessage ? (
        <p className="field-error game-types-message" role="alert">
          {formMessage}
        </p>
      ) : null}
    </form>
  )
}

/** Helper for parents that open the form from a saved template (Load). */
export function rawFormFromTimerConfig(config: TimerConfig): RawTimerForm {
  return timerConfigToRawForm(config)
}
