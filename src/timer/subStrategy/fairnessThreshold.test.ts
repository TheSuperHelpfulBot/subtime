import { describe, expect, it } from 'vitest'
import { computeFairnessImbalanceThreshold } from './fairnessThreshold'

describe('computeFairnessImbalanceThreshold', () => {
  it('uses 0.5% of target at fairness 0', () => {
    expect(computeFairnessImbalanceThreshold(1000, 0)).toBeCloseTo(5, 5)
  })

  it('uses 95.5% of target at fairness 10', () => {
    expect(computeFairnessImbalanceThreshold(1000, 10)).toBeCloseTo(955, 5)
  })
})
