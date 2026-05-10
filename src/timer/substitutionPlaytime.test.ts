import { describe, expect, it } from 'vitest'
import {
  createZeroPlaytime,
  isStartingLineupComplete,
  maxPlaytimeAcrossRoster,
  playtimeBarFillPercent,
  playtimeBarPercentsForRoster,
  playtimeMeterPercent,
  splitInitialLineup,
  swapFieldWithBench,
  swapTwoOnBench,
  swapTwoOnField,
  tickPlaytime,
  type PlaytimeSeconds,
} from './substitutionPlaytime'

describe('isStartingLineupComplete', () => {
  it('is true only when the field count matches the sport slot count', () => {
    expect(isStartingLineupComplete(0, 5)).toBe(false)
    expect(isStartingLineupComplete(4, 5)).toBe(false)
    expect(isStartingLineupComplete(5, 5)).toBe(true)
    expect(isStartingLineupComplete(6, 5)).toBe(false)
  })

  it('is false when required slot count is invalid', () => {
    expect(isStartingLineupComplete(0, 0)).toBe(false)
  })
})

describe('createZeroPlaytime', () => {
  it('initializes every roster player id to zero seconds', () => {
    expect(createZeroPlaytime(['a', 'b'])).toEqual({ a: 0, b: 0 })
  })
})

describe('splitInitialLineup', () => {
  it('puts the first onFieldCount players on field and the rest on bench', () => {
    const ids = ['p1', 'p2', 'p3', 'p4']
    expect(splitInitialLineup(ids, 2)).toEqual({
      fieldIds: ['p1', 'p2'],
      benchIds: ['p3', 'p4'],
    })
  })

  it('caps at roster size when onFieldCount is larger', () => {
    expect(splitInitialLineup(['a', 'b'], 11)).toEqual({
      fieldIds: ['a', 'b'],
      benchIds: [],
    })
  })

  it('handles an empty roster', () => {
    expect(splitInitialLineup([], 5)).toEqual({ fieldIds: [], benchIds: [] })
  })
})

describe('maxPlaytimeAcrossRoster + playtimeBarFillPercent', () => {
  it('uses every roster id so bench and field share one denominator', () => {
    const ids = ['onField', 'bench']
    const pt = { onField: 120, bench: 30 }
    const globalMax = maxPlaytimeAcrossRoster(pt, ids)
    expect(globalMax).toBe(120)
    expect(playtimeBarFillPercent(120, globalMax)).toBe(100)
    expect(playtimeBarFillPercent(30, globalMax)).toBe(25)
    expect(playtimeBarFillPercent(0, globalMax)).toBe(0)
  })

  it('returns 0 fill when the roster max is zero', () => {
    expect(playtimeBarFillPercent(0, 0)).toBe(0)
    expect(maxPlaytimeAcrossRoster({}, ['a', 'b'])).toBe(0)
  })
})

describe('playtimeBarPercentsForRoster', () => {
  it('assigns the leader 100% and scales everyone else to the same roster max', () => {
    const ids = ['alex', 'blake', 'casey']
    const pt = { alex: 120, blake: 60, casey: 0 }
    const { globalMaxSeconds, percentByPlayerId } = playtimeBarPercentsForRoster(pt, ids)
    expect(globalMaxSeconds).toBe(120)
    expect(percentByPlayerId.alex).toBe(100)
    expect(percentByPlayerId.blake).toBe(50)
    expect(percentByPlayerId.casey).toBe(0)
  })

  it('when the roster max increases, every bar rescales against the new max', () => {
    const ids = ['a', 'b']
    let pt: PlaytimeSeconds = { a: 50, b: 40 }
    let bars = playtimeBarPercentsForRoster(pt, ids)
    expect(bars.globalMaxSeconds).toBe(50)
    expect(bars.percentByPlayerId.a).toBe(100)
    expect(bars.percentByPlayerId.b).toBe(80)

    pt = tickPlaytime(pt, ['b'], 30, { runStatus: 'running', segment: 'period' })
    bars = playtimeBarPercentsForRoster(pt, ids)
    expect(bars.globalMaxSeconds).toBe(70)
    expect(bars.percentByPlayerId.a).toBeCloseTo((50 / 70) * 100, 5)
    expect(bars.percentByPlayerId.b).toBe(100)
  })

  it('ties share the same percent (100%)', () => {
    const ids = ['x', 'y']
    const pt = { x: 90, y: 90 }
    const { percentByPlayerId } = playtimeBarPercentsForRoster(pt, ids)
    expect(percentByPlayerId.x).toBe(100)
    expect(percentByPlayerId.y).toBe(100)
  })
})

describe('playtimeMeterPercent', () => {
  it('scales each player to the roster maximum', () => {
    expect(playtimeMeterPercent(60, [60, 30, 0])).toBe(100)
    expect(playtimeMeterPercent(30, [60, 30, 0])).toBe(50)
    expect(playtimeMeterPercent(0, [60, 30, 0])).toBe(0)
  })

  it('returns 0 when no one has time yet', () => {
    expect(playtimeMeterPercent(0, [0, 0])).toBe(0)
  })

  it('returns 0 for an empty roster snapshot', () => {
    expect(playtimeMeterPercent(10, [])).toBe(0)
  })
})

describe('tickPlaytime', () => {
  const base = createZeroPlaytime(['f1', 'f2', 'b1'])

  it('accumulates elapsed seconds for each player on the field during a running period', () => {
    const next = tickPlaytime(base, ['f1', 'f2'], 10, {
      runStatus: 'running',
      segment: 'period',
    })
    expect(next.f1).toBe(10)
    expect(next.f2).toBe(10)
    expect(next.b1).toBe(0)
  })

  it('does not accumulate when the match is paused', () => {
    const next = tickPlaytime(base, ['f1'], 5, { runStatus: 'paused', segment: 'period' })
    expect(next.f1).toBe(0)
  })

  it('does not accumulate when idle or ended', () => {
    expect(tickPlaytime(base, ['f1'], 5, { runStatus: 'idle', segment: null }).f1).toBe(0)
    expect(tickPlaytime(base, ['f1'], 5, { runStatus: 'ended', segment: null }).f1).toBe(0)
  })

  it('does not accumulate during a break segment even if status were running', () => {
    const next = tickPlaytime(base, ['f1', 'f2'], 10, {
      runStatus: 'running',
      segment: 'break',
    })
    expect(next.f1).toBe(0)
    expect(next.f2).toBe(0)
  })

  it('does not accumulate when there is no active segment', () => {
    const next = tickPlaytime(base, ['f1'], 3, { runStatus: 'running', segment: null })
    expect(next.f1).toBe(0)
  })

  it('ignores non-positive delta', () => {
    const next = tickPlaytime(base, ['f1'], 0, { runStatus: 'running', segment: 'period' })
    expect(next.f1).toBe(0)
  })

  it('accumulates across ticks without resetting prior totals', () => {
    let p = base
    p = tickPlaytime(p, ['f1'], 2, { runStatus: 'running', segment: 'period' })
    p = tickPlaytime(p, ['f1'], 3, { runStatus: 'running', segment: 'period' })
    expect(p.f1).toBe(5)
  })

  it('only adds time for players currently listed on field', () => {
    let p = tickPlaytime(base, ['f1'], 4, { runStatus: 'running', segment: 'period' })
    p = tickPlaytime(p, ['f2'], 6, { runStatus: 'running', segment: 'period' })
    expect(p.f1).toBe(4)
    expect(p.f2).toBe(6)
  })
})

describe('swapFieldWithBench', () => {
  const lineup: import('./substitutionPlaytime').LineupLists = {
    fieldIds: ['a', 'b'],
    benchIds: ['c', 'd'],
  }

  it('moves the bench player onto the field slot and sends the field player to the bench', () => {
    const r = swapFieldWithBench(lineup, 'a', 'c')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.lineup.fieldIds).toEqual(['c', 'b'])
    expect(r.lineup.benchIds).toEqual(expect.arrayContaining(['a', 'd']))
    expect(r.lineup.benchIds).toHaveLength(2)
  })

  it('rejects when the field player is not on the field', () => {
    const r = swapFieldWithBench(lineup, 'x', 'c')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toBe('field_player_not_on_field')
  })

  it('rejects when the bench player is not on the bench', () => {
    const r = swapFieldWithBench(lineup, 'a', 'x')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toBe('bench_player_not_on_bench')
  })

  it('rejects when both ids are the same', () => {
    const r = swapFieldWithBench(lineup, 'a', 'a')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toBe('same_player')
  })
})

describe('swapTwoOnBench', () => {
  const bench = ['c', 'd', 'e']

  it('swaps two bench players in place', () => {
    const r = swapTwoOnBench(bench, 'c', 'e')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.benchIds).toEqual(['e', 'd', 'c'])
  })

  it('rejects when either id is not on the bench', () => {
    expect(swapTwoOnBench(bench, 'c', 'x').ok).toBe(false)
  })

  it('rejects when both ids are the same', () => {
    const r = swapTwoOnBench(bench, 'd', 'd')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toBe('same_player')
  })
})

describe('swapTwoOnField', () => {
  const lineup: import('./substitutionPlaytime').LineupLists = {
    fieldIds: ['x', 'y', 'z'],
    benchIds: ['u'],
  }

  it('swaps two on-field players in place', () => {
    const r = swapTwoOnField(lineup, 'x', 'z')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.lineup.fieldIds).toEqual(['z', 'y', 'x'])
    expect(r.lineup.benchIds).toEqual(['u'])
  })

  it('rejects when either player is not on the field', () => {
    expect(swapTwoOnField(lineup, 'x', 'u').ok).toBe(false)
    expect(swapTwoOnField(lineup, 'u', 'x').ok).toBe(false)
  })

  it('rejects when both ids are the same', () => {
    const r = swapTwoOnField(lineup, 'y', 'y')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toBe('same_player')
  })
})
