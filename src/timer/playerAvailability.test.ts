import { describe, expect, it } from 'vitest'
import {
  activeSquadSize,
  applyUnavailableToLineup,
  filterAvailableRosterIds,
  isEligibleForField,
  isPlayerUnavailable,
  toggleUnavailable,
} from './playerAvailability'

describe('activeSquadSize', () => {
  it('subtracts unavailable players from roster count', () => {
    expect(activeSquadSize(['a', 'b', 'c', 'd'], ['b', 'x'])).toBe(3)
  })

  it('returns zero for empty roster', () => {
    expect(activeSquadSize([], [])).toBe(0)
  })
})

describe('filterAvailableRosterIds', () => {
  it('excludes unavailable ids', () => {
    expect(filterAvailableRosterIds(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c'])
  })
})

describe('isPlayerUnavailable', () => {
  it('reflects membership in unavailable list', () => {
    expect(isPlayerUnavailable('a', ['a'])).toBe(true)
    expect(isPlayerUnavailable('b', ['a'])).toBe(false)
  })
})

describe('toggleUnavailable', () => {
  it('adds and removes without duplicates', () => {
    expect(toggleUnavailable([], 'p1', true)).toEqual(['p1'])
    expect(toggleUnavailable(['p1'], 'p1', false)).toEqual([])
    expect(toggleUnavailable(['p1'], 'p2', true)).toEqual(['p1', 'p2'])
  })
})

describe('isEligibleForField', () => {
  it('rejects unavailable players', () => {
    expect(isEligibleForField('a', ['a'], [], true)).toBe(false)
  })

  it('rejects permanently out when rolling subs disabled', () => {
    expect(isEligibleForField('a', [], ['a'], false)).toBe(false)
    expect(isEligibleForField('a', [], ['a'], true)).toBe(true)
  })

  it('allows available players', () => {
    expect(isEligibleForField('a', [], [], false)).toBe(true)
  })
})

describe('applyUnavailableToLineup', () => {
  it('removes unavailable players from field and bench', () => {
    const result = applyUnavailableToLineup(['a', 'b'], ['c', 'b'], ['b'])
    expect(result.fieldIds).toEqual(['a'])
    expect(result.benchIds).toEqual(['c'])
  })

  it('drops unavailable players entirely when only on bench', () => {
    const result = applyUnavailableToLineup(['a'], ['a'], ['a'])
    expect(result.fieldIds).toEqual([])
    expect(result.benchIds).toEqual([])
  })
})
