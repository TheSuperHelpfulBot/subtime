export type TimerConfigFields = 'periods' | 'periodDurationMinutes' | 'breakDurationMinutes'

export type TimerConfig = {
  periods: number
  periodDurationMinutes: number
  breakDurationMinutes: number
}

export type TimerConfigErrors = Partial<Record<TimerConfigFields, string>>

export type RawTimerForm = {
  periods: string
  periodDurationMinutes: string
  breakDurationMinutes: string
}

function parseRequiredPositiveIntegerPeriods(raw: string, label: string): number | string {
  const t = raw.trim()
  if (t === '') {
    return `Enter ${label}.`
  }
  const n = Number(t)
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return `Use a whole number for ${label}.`
  }
  return n
}

/** Plain decimal minutes (e.g. `12.25`) or clock-style `mm:ss` (minutes and seconds). */
function parseDurationMinutes(raw: string, label: string): number | string {
  const t = raw.trim()
  if (t === '') {
    return `Enter ${label}.`
  }

  if (t.includes(':')) {
    const parts = t.split(':').map((p) => p.trim())
    if (parts.length !== 2 || parts.some((p) => p === '')) {
      return `Use a number or mm:ss for ${label}.`
    }
    const minutePart = Number(parts[0])
    const secondPart = Number(parts[1])
    if (!Number.isFinite(minutePart) || !Number.isFinite(secondPart)) {
      return `Use a number or mm:ss for ${label}.`
    }
    if (!Number.isInteger(minutePart) || minutePart < 0) {
      return `Minutes in ${label} must be a whole number, zero or more.`
    }
    if (!Number.isInteger(secondPart) || secondPart < 0 || secondPart > 59) {
      return `Seconds in ${label} must be between 0 and 59.`
    }
    return minutePart + secondPart / 60
  }

  const n = Number(t)
  if (!Number.isFinite(n)) {
    return `Use a number or mm:ss for ${label}.`
  }
  return n
}

/** Parses form strings into numbers, then applies validateTimerConfig. */
export function parseAndValidateTimerForm(raw: RawTimerForm): {
  valid: boolean
  config: TimerConfig | null
  errors: TimerConfigErrors
} {
  const errors: TimerConfigErrors = {}

  const periodsResult = parseRequiredPositiveIntegerPeriods(raw.periods, 'periods')
  const periodDurResult = parseDurationMinutes(raw.periodDurationMinutes, 'period length')
  const breakDurResult = parseDurationMinutes(raw.breakDurationMinutes, 'break length')

  const periods = typeof periodsResult === 'string' ? undefined : periodsResult
  const periodDurationMinutes =
    typeof periodDurResult === 'string' ? undefined : periodDurResult
  const breakDurationMinutes =
    typeof breakDurResult === 'string' ? undefined : breakDurResult

  if (typeof periodsResult === 'string') errors.periods = periodsResult
  if (typeof periodDurResult === 'string') errors.periodDurationMinutes = periodDurResult
  if (typeof breakDurResult === 'string') errors.breakDurationMinutes = breakDurResult

  if (
    periods === undefined ||
    periodDurationMinutes === undefined ||
    breakDurationMinutes === undefined
  ) {
    return { valid: false, config: null, errors }
  }

  const config: TimerConfig = { periods, periodDurationMinutes, breakDurationMinutes }
  const schema = validateTimerConfig(config)
  return {
    valid: schema.valid,
    config: schema.valid ? config : null,
    errors: schema.valid ? {} : { ...errors, ...schema.errors },
  }
}

function isPositiveInteger(n: number): boolean {
  return Number.isInteger(n) && n >= 1
}

function isPositiveMinutes(n: number): boolean {
  return Number.isFinite(n) && n > 0
}

function isNonNegativeMinutes(n: number): boolean {
  return Number.isFinite(n) && n >= 0
}

/** Validates raw numeric fields. Use after parsing from inputs. */
export function validateTimerConfig(input: TimerConfig): {
  valid: boolean
  errors: TimerConfigErrors
} {
  const errors: TimerConfigErrors = {}

  if (!isPositiveInteger(input.periods)) {
    errors.periods =
      input.periods === 0
        ? 'Enter at least one period.'
        : 'Periods must be a whole number of at least 1.'
  }

  if (!isPositiveMinutes(input.periodDurationMinutes)) {
    errors.periodDurationMinutes = 'Period length must be greater than zero.'
  }

  if (!isNonNegativeMinutes(input.breakDurationMinutes)) {
    errors.breakDurationMinutes = 'Break length must be zero or more.'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/** Converts a validated config back to raw form strings for inputs. */
export function timerConfigToRawForm(config: TimerConfig): RawTimerForm {
  return {
    periods: String(config.periods),
    periodDurationMinutes: formatMinutesForDisplay(config.periodDurationMinutes),
    breakDurationMinutes: formatMinutesForDisplay(config.breakDurationMinutes),
  }
}

/** Rounds for UI display (floating-point minutes). */
export function formatMinutesForDisplay(minutes: number): string {
  if (!Number.isFinite(minutes)) {
    return ''
  }
  const rounded = Math.round(minutes * 100) / 100
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/\.?0+$/, '')
}
