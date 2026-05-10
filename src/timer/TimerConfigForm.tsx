import { useMemo, useState } from 'react'
import {
  DEFAULT_ON_FIELD_COUNT,
  saveGameType,
  updateGameType,
} from '../storage/gameTypesStorage'
import {
  type RawTimerForm,
  formatMinutesForDisplay,
  parseAndValidateTimerForm,
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
  /** Seed players-on-field when editing a saved game type. */
  initialOnFieldCount?: number
  onSaved?: () => void
  onCancel?: () => void
}

export default function TimerConfigForm({
  editingId = null,
  initialRaw,
  initialName = '',
  initialOnFieldCount,
  onSaved,
  onCancel,
}: TimerConfigFormProps) {
  const [raw, setRaw] = useState<RawTimerForm>(initialRaw ?? DEFAULT_RAW)
  const [gameTypeName, setGameTypeName] = useState(initialName)
  const [onFieldCountRaw, setOnFieldCountRaw] = useState(() =>
    initialOnFieldCount != null ? String(initialOnFieldCount) : String(DEFAULT_ON_FIELD_COUNT),
  )
  const [formMessage, setFormMessage] = useState<string | null>(null)

  const { valid, config, errors } = useMemo(() => parseAndValidateTimerForm(raw), [raw])

  const onFieldCountParsed = useMemo(() => {
    const n = Number.parseInt(onFieldCountRaw.trim(), 10)
    if (!Number.isInteger(n) || n < 1) return { ok: false as const }
    return { ok: true as const, value: n }
  }, [onFieldCountRaw])

  function update<K extends keyof RawTimerForm>(key: K, value: string) {
    setRaw((prev) => ({ ...prev, [key]: value }))
  }

  function handleSaveGameType() {
    setFormMessage(null)
    if (!valid || !config) return
    if (!onFieldCountParsed.ok) {
      setFormMessage('Enter a whole number of players on field (at least 1).')
      return
    }
    const playersOnField = onFieldCountParsed.value

    if (editingId) {
      const result = updateGameType(editingId, gameTypeName, config, playersOnField)
      if (!result.ok) {
        if (result.error === 'duplicate_name') {
          setFormMessage('Another game type already uses that name.')
        } else if (result.error === 'empty_name') {
          setFormMessage('Enter a name for this game type.')
        } else if (result.error === 'invalid_on_field_count') {
          setFormMessage('Players on field must be at least 1.')
        } else {
          setFormMessage('Could not save changes.')
        }
        return
      }
    } else {
      const result = saveGameType(gameTypeName, config, playersOnField)
      if (!result.ok) {
        if (result.error === 'duplicate_name') {
          setFormMessage('A game type with that name already exists.')
        } else if (result.error === 'invalid_on_field_count') {
          setFormMessage('Players on field must be at least 1.')
        } else {
          setFormMessage('Enter a name for this game type.')
        }
        return
      }
    }

    setGameTypeName('')
    onSaved?.()
  }

  const saveDisabled =
    !valid || !config || !onFieldCountParsed.ok || gameTypeName.trim() === ''

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
        <label htmlFor="game-type-on-field">Players on field</label>
        <input
          id="game-type-on-field"
          name="onFieldCount"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={onFieldCountRaw}
          onChange={(e) => setOnFieldCountRaw(e.target.value)}
          aria-invalid={!onFieldCountParsed.ok && onFieldCountRaw.trim() !== '' ? true : undefined}
          aria-describedby={
            !onFieldCountParsed.ok && onFieldCountRaw.trim() !== ''
              ? 'game-type-on-field-error'
              : undefined
          }
        />
        {!onFieldCountParsed.ok && onFieldCountRaw.trim() !== '' ? (
          <p id="game-type-on-field-error" className="field-error" role="alert">
            Enter a whole number of at least 1.
          </p>
        ) : null}
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

      {formMessage ? (
        <p className="field-error game-types-message" role="alert">
          {formMessage}
        </p>
      ) : null}

      {onCancel ? (
        <div className="setup-cancel-wrap">
          <button type="button" className="btn-text setup-back" onClick={onCancel}>
            Back
          </button>
        </div>
      ) : null}
    </form>
  )
}
