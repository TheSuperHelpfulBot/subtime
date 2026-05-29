export type SubRecommendationAlert = 'start' | 'end'

export function subRecommendationAlertTransition(
  hadPairs: boolean,
  hasPairs: boolean,
): SubRecommendationAlert | null {
  if (!hadPairs && hasPairs) return 'start'
  if (hadPairs && !hasPairs) return 'end'
  return null
}
