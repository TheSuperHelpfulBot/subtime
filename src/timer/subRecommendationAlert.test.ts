import { describe, expect, it } from 'vitest'
import { subRecommendationAlertTransition } from './subRecommendationAlert'

describe('subRecommendationAlertTransition', () => {
  it('signals start when recommendations first appear', () => {
    expect(subRecommendationAlertTransition(false, true)).toBe('start')
  })

  it('signals end when recommendations clear', () => {
    expect(subRecommendationAlertTransition(true, false)).toBe('end')
  })

  it('is silent when recommendations stay visible or stay hidden', () => {
    expect(subRecommendationAlertTransition(false, false)).toBeNull()
    expect(subRecommendationAlertTransition(true, true)).toBeNull()
  })
})
