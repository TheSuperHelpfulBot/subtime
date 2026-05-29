import { describe, expect, it } from 'vitest'
import {
  isPlayerInRecommendedSubPair,
  recommendedSubPairsFromActions,
} from './recommendedSubPairs'

describe('recommendedSubPairsFromActions', () => {
  it('maps engine subs to off/on pairs in lineup order', () => {
    const pairs = recommendedSubPairsFromActions(
      [
        { offPlayerId: 'f1', onPlayerId: 'b1' },
        { offPlayerId: 'f2', onPlayerId: 'b2' },
      ],
      {
        fieldIds: ['f1', 'f2'],
        benchIds: ['b1', 'b2'],
        unavailableIds: [],
        permanentlyOutIds: [],
        unlimitedReturns: true,
      },
    )
    expect(pairs).toEqual([
      { offId: 'f1', onId: 'b1' },
      { offId: 'f2', onId: 'b2' },
    ])
  })

  it('skips subs when bench player cannot go on field', () => {
    const pairs = recommendedSubPairsFromActions(
      [{ offPlayerId: 'f1', onPlayerId: 'b1' }],
      {
        fieldIds: ['f1'],
        benchIds: ['b1'],
        unavailableIds: ['b1'],
        permanentlyOutIds: [],
        unlimitedReturns: true,
      },
    )
    expect(pairs).toEqual([])
  })

  it('skips subs when players are not on the expected side', () => {
    const pairs = recommendedSubPairsFromActions(
      [{ offPlayerId: 'f1', onPlayerId: 'b1' }],
      {
        fieldIds: ['b1'],
        benchIds: ['f1'],
        unavailableIds: [],
        permanentlyOutIds: [],
        unlimitedReturns: true,
      },
    )
    expect(pairs).toEqual([])
  })

  it('avoids duplicate use of the same field or bench player', () => {
    const pairs = recommendedSubPairsFromActions(
      [
        { offPlayerId: 'f1', onPlayerId: 'b1' },
        { offPlayerId: 'f1', onPlayerId: 'b2' },
      ],
      {
        fieldIds: ['f1'],
        benchIds: ['b1', 'b2'],
        unavailableIds: [],
        permanentlyOutIds: [],
        unlimitedReturns: true,
      },
    )
    expect(pairs).toEqual([{ offId: 'f1', onId: 'b1' }])
  })
})

describe('isPlayerInRecommendedSubPair', () => {
  it('returns true when player is in any pair', () => {
    expect(
      isPlayerInRecommendedSubPair('b2', [
        { offId: 'f1', onId: 'b1' },
        { offId: 'f2', onId: 'b2' },
      ]),
    ).toBe(true)
    expect(
      isPlayerInRecommendedSubPair('x', [{ offId: 'f1', onId: 'b1' }]),
    ).toBe(false)
  })
})
