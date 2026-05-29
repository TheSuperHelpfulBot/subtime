import { describe, expect, it } from 'vitest'
import { recordSubstitutionPermanentlyOut } from './recordSubstitution'
import { DEFAULT_SUB_STRATEGY_CONFIG } from './types'

describe('recordSubstitutionPermanentlyOut', () => {
  it('adds off player when unlimited returns disabled', () => {
    const config = { ...DEFAULT_SUB_STRATEGY_CONFIG, unlimitedReturns: false }
    expect(recordSubstitutionPermanentlyOut([], 'p1', config)).toEqual(['p1'])
  })

  it('does not duplicate ids', () => {
    const config = { ...DEFAULT_SUB_STRATEGY_CONFIG, unlimitedReturns: false }
    expect(recordSubstitutionPermanentlyOut(['p1'], 'p1', config)).toEqual(['p1'])
  })

  it('leaves list unchanged when unlimited returns enabled', () => {
    expect(
      recordSubstitutionPermanentlyOut(['p1'], 'p2', DEFAULT_SUB_STRATEGY_CONFIG),
    ).toEqual(['p1'])
  })
})
