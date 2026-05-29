import type { SubStrategyConfig } from './types'

/** After a field player is subbed off, track permanent exclusion when rolling subs are disabled. */
export function recordSubstitutionPermanentlyOut(
  permanentlyOutIds: readonly string[],
  offPlayerId: string,
  config: SubStrategyConfig,
): string[] {
  if (config.unlimitedReturns) return [...permanentlyOutIds]
  if (permanentlyOutIds.includes(offPlayerId)) return [...permanentlyOutIds]
  return [...permanentlyOutIds, offPlayerId]
}
