import { isEligibleForField } from './playerAvailability'

export type RecommendedSubPair = {
  offId: string
  onId: string
}

export type RecommendedSubPairInput = {
  offPlayerId: string
  onPlayerId: string
}

export type RecommendedSubPairsContext = {
  fieldIds: readonly string[]
  benchIds: readonly string[]
  unavailableIds: readonly string[]
  permanentlyOutIds: readonly string[]
  unlimitedReturns: boolean
}

/** Engine recommendations that still apply to the current lineup and eligibility rules. */
export function recommendedSubPairsFromActions(
  subs: readonly RecommendedSubPairInput[],
  context: RecommendedSubPairsContext,
): RecommendedSubPair[] {
  const fieldSet = new Set(context.fieldIds)
  const benchSet = new Set(context.benchIds)
  const usedOff = new Set<string>()
  const usedOn = new Set<string>()
  const pairs: RecommendedSubPair[] = []

  for (const sub of subs) {
    const { offPlayerId, onPlayerId } = sub
    if (!fieldSet.has(offPlayerId) || !benchSet.has(onPlayerId)) continue
    if (usedOff.has(offPlayerId) || usedOn.has(onPlayerId)) continue
    if (
      !isEligibleForField(
        onPlayerId,
        context.unavailableIds,
        context.permanentlyOutIds,
        context.unlimitedReturns,
      )
    ) {
      continue
    }
    pairs.push({ offId: offPlayerId, onId: onPlayerId })
    usedOff.add(offPlayerId)
    usedOn.add(onPlayerId)
  }

  return pairs
}

export function isPlayerInRecommendedSubPair(
  playerId: string,
  pairs: readonly RecommendedSubPair[],
): boolean {
  for (const pair of pairs) {
    if (pair.offId === playerId || pair.onId === playerId) return true
  }
  return false
}
