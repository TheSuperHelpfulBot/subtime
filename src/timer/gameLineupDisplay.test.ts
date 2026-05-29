import { describe, expect, it } from 'vitest'
import type { PlaytimeSeconds } from './substitutionPlaytime'
import {
  getTopRecommendedSubPair,
  sortIdsByPlaytime,
} from './gameLineupDisplay'

describe('sortIdsByPlaytime', () => {
  const playtime: PlaytimeSeconds = {
    a: 100,
    b: 50,
    c: 50,
    d: 0,
  }

  it('sorts ascending by on-field seconds (least time first)', () => {
    expect(sortIdsByPlaytime(['a', 'b', 'c', 'd'], playtime, 'asc')).toEqual([
      'd',
      'b',
      'c',
      'a',
    ])
  })

  it('sorts descending by on-field seconds (most time first)', () => {
    expect(sortIdsByPlaytime(['a', 'b', 'c', 'd'], playtime, 'desc')).toEqual([
      'a',
      'b',
      'c',
      'd',
    ])
  })

  it('treats missing playtime entries as zero seconds', () => {
    expect(sortIdsByPlaytime(['x', 'a'], playtime, 'desc')).toEqual(['a', 'x'])
  })

  it('preserves original order among tied playtimes (stable sort)', () => {
    expect(sortIdsByPlaytime(['c', 'b'], playtime, 'asc')).toEqual(['c', 'b'])
    expect(sortIdsByPlaytime(['b', 'c'], playtime, 'asc')).toEqual(['b', 'c'])
  })

  it('does not mutate the input id list', () => {
    const ids = ['b', 'a']
    sortIdsByPlaytime(ids, playtime, 'desc')
    expect(ids).toEqual(['b', 'a'])
  })

  it('returns a new array when order is already correct', () => {
    const sorted = sortIdsByPlaytime(['d', 'b', 'a'], playtime, 'asc')
    expect(sorted).toEqual(['d', 'b', 'a'])
    expect(sorted).not.toBe(['d', 'b', 'a'])
  })
})

describe('getTopRecommendedSubPair', () => {
  const playtime: PlaytimeSeconds = {
    f1: 120,
    f2: 80,
    b1: 10,
    b2: 40,
  }

  it('returns the field player with most time and bench player with least time', () => {
    expect(
      getTopRecommendedSubPair(
        ['f2', 'f1'],
        ['b2', 'b1'],
        playtime,
      ),
    ).toEqual({ offId: 'f1', onId: 'b1' })
  })

  it('ignores lineup array order and uses playtime only', () => {
    expect(
      getTopRecommendedSubPair(
        ['f1', 'f2'],
        ['b1', 'b2'],
        playtime,
      ),
    ).toEqual({ offId: 'f1', onId: 'b1' })
  })

  it('returns null when the field is empty', () => {
    expect(getTopRecommendedSubPair([], ['b1'], playtime)).toBeNull()
  })

  it('returns null when the bench is empty', () => {
    expect(getTopRecommendedSubPair(['f1'], [], playtime)).toBeNull()
  })

  it('returns null when both columns are empty', () => {
    expect(getTopRecommendedSubPair([], [], playtime)).toBeNull()
  })
})
