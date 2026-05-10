import { describe, expect, it } from 'vitest'
import {
  formatMinutesForDisplay,
  parseAndValidateTimerForm,
  validateTimerConfig,
} from './timerConfig'

describe('validateTimerConfig', () => {
  it('accepts valid config', () => {
    const { valid, errors } = validateTimerConfig({
      periods: 4,
      periodDurationMinutes: 12,
      breakDurationMinutes: 2,
    })
    expect(valid).toBe(true)
    expect(errors).toEqual({})
  })

  it('rejects zero periods with a specific message', () => {
    const { valid, errors } = validateTimerConfig({
      periods: 0,
      periodDurationMinutes: 10,
      breakDurationMinutes: 2,
    })
    expect(valid).toBe(false)
    expect(errors.periods).toMatch(/at least one period/i)
  })

  it('rejects negative periods', () => {
    const { valid, errors } = validateTimerConfig({
      periods: -1,
      periodDurationMinutes: 10,
      breakDurationMinutes: 0,
    })
    expect(valid).toBe(false)
    expect(errors.periods).toBeTruthy()
  })

  it('rejects non-integer periods', () => {
    const { valid, errors } = validateTimerConfig({
      periods: 2.5 as unknown as number,
      periodDurationMinutes: 10,
      breakDurationMinutes: 0,
    })
    expect(valid).toBe(false)
    expect(errors.periods).toBeTruthy()
  })

  it('rejects zero or negative period duration', () => {
    expect(
      validateTimerConfig({
        periods: 2,
        periodDurationMinutes: 0,
        breakDurationMinutes: 1,
      }).valid,
    ).toBe(false)
    expect(
      validateTimerConfig({
        periods: 2,
        periodDurationMinutes: -5,
        breakDurationMinutes: 1,
      }).valid,
    ).toBe(false)
  })

  it('allows fractional period duration', () => {
    const { valid, errors } = validateTimerConfig({
      periods: 2,
      periodDurationMinutes: 10.2,
      breakDurationMinutes: 0,
    })
    expect(valid).toBe(true)
    expect(errors.periodDurationMinutes).toBeUndefined()
  })

  it('allows zero break duration', () => {
    const { valid, errors } = validateTimerConfig({
      periods: 3,
      periodDurationMinutes: 15,
      breakDurationMinutes: 0,
    })
    expect(valid).toBe(true)
    expect(errors.breakDurationMinutes).toBeUndefined()
  })

  it('rejects negative break duration', () => {
    const { valid, errors } = validateTimerConfig({
      periods: 2,
      periodDurationMinutes: 10,
      breakDurationMinutes: -1,
    })
    expect(valid).toBe(false)
    expect(errors.breakDurationMinutes).toBeTruthy()
  })

  it('allows fractional break duration', () => {
    const { valid, errors } = validateTimerConfig({
      periods: 2,
      periodDurationMinutes: 10,
      breakDurationMinutes: 1.5,
    })
    expect(valid).toBe(true)
    expect(errors.breakDurationMinutes).toBeUndefined()
  })

  it('accumulates multiple field errors', () => {
    const { valid, errors } = validateTimerConfig({
      periods: 0,
      periodDurationMinutes: 0,
      breakDurationMinutes: -1,
    })
    expect(valid).toBe(false)
    expect(errors.periods).toBeTruthy()
    expect(errors.periodDurationMinutes).toBeTruthy()
    expect(errors.breakDurationMinutes).toBeTruthy()
  })
})

describe('parseAndValidateTimerForm', () => {
  it('parses valid strings and passes validation', () => {
    const { valid, config, errors } = parseAndValidateTimerForm({
      periods: '4',
      periodDurationMinutes: '12',
      breakDurationMinutes: '2',
    })
    expect(valid).toBe(true)
    expect(config).toEqual({
      periods: 4,
      periodDurationMinutes: 12,
      breakDurationMinutes: 2,
    })
    expect(errors).toEqual({})
  })

  it('parses mm:ss strings as minutes plus seconds and passes validation', () => {
    const { valid, config, errors } = parseAndValidateTimerForm({
      periods: '4',
      periodDurationMinutes: '12:20',
      breakDurationMinutes: '2:50',
    })
    expect(valid).toBe(true)
    expect(config?.periods).toBe(4)
    expect(config?.periodDurationMinutes).toBeCloseTo(12 + 20 / 60, 10)
    expect(config?.breakDurationMinutes).toBeCloseTo(2 + 50 / 60, 10)
    expect(errors).toEqual({})
  })

  it('parses more mm:ss and decimal duration examples', () => {
    const a = parseAndValidateTimerForm({
      periods: '2',
      periodDurationMinutes: '15:00',
      breakDurationMinutes: '0:45',
    })
    expect(a.valid).toBe(true)
    expect(a.config?.periodDurationMinutes).toBe(15)
    expect(a.config?.breakDurationMinutes).toBeCloseTo(0.75, 10)

    const b = parseAndValidateTimerForm({
      periods: '1',
      periodDurationMinutes: '10.25',
      breakDurationMinutes: '.5',
    })
    expect(b.valid).toBe(true)
    expect(b.config?.periodDurationMinutes).toBe(10.25)
    expect(b.config?.breakDurationMinutes).toBe(0.5)

    const c = parseAndValidateTimerForm({
      periods: '3',
      periodDurationMinutes: '0:30',
      breakDurationMinutes: '12 : 05',
    })
    expect(c.valid).toBe(true)
    expect(c.config?.periodDurationMinutes).toBeCloseTo(0.5, 10)
    expect(c.config?.breakDurationMinutes).toBeCloseTo(12 + 5 / 60, 10)
  })

  it('rejects mm:ss when seconds are out of range', () => {
    const { valid, errors } = parseAndValidateTimerForm({
      periods: '2',
      periodDurationMinutes: '12:60',
      breakDurationMinutes: '0',
    })
    expect(valid).toBe(false)
    expect(errors.periodDurationMinutes).toMatch(/seconds/i)
  })

  it('reports empty fields', () => {
    const { valid, config } = parseAndValidateTimerForm({
      periods: '',
      periodDurationMinutes: '10',
      breakDurationMinutes: '0',
    })
    expect(valid).toBe(false)
    expect(config).toBeNull()
  })

  it('reports non-numeric input', () => {
    const { valid, errors } = parseAndValidateTimerForm({
      periods: 'x',
      periodDurationMinutes: '10',
      breakDurationMinutes: '0',
    })
    expect(valid).toBe(false)
    expect(errors.periods).toBeTruthy()
  })

  it('defers to schema rules after parse', () => {
    const { valid, errors } = parseAndValidateTimerForm({
      periods: '0',
      periodDurationMinutes: '10',
      breakDurationMinutes: '0',
    })
    expect(valid).toBe(false)
    expect(errors.periods).toMatch(/at least one period/i)
  })
})

describe('formatMinutesForDisplay', () => {
  it('formats integers and trimmed decimals', () => {
    expect(formatMinutesForDisplay(12)).toBe('12')
    expect(formatMinutesForDisplay(12.333333)).toBe('12.33')
    expect(formatMinutesForDisplay(2.833333)).toBe('2.83')
  })
})
