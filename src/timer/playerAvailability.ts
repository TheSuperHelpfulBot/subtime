/**
 * Session player availability (injured / absent today). Pure helpers — no persistence in v1.
 */

export function activeSquadSize(
  rosterPlayerIds: readonly string[],
  unavailableIds: readonly string[],
): number {
  const unavailable = new Set(unavailableIds)
  let count = 0
  for (const id of rosterPlayerIds) {
    if (!unavailable.has(id)) count += 1
  }
  return count
}

export function filterAvailableRosterIds(
  rosterPlayerIds: readonly string[],
  unavailableIds: readonly string[],
): string[] {
  const unavailable = new Set(unavailableIds)
  return rosterPlayerIds.filter((id) => !unavailable.has(id))
}

export function isPlayerUnavailable(
  playerId: string,
  unavailableIds: readonly string[],
): boolean {
  return unavailableIds.includes(playerId)
}

export function isEligibleForField(
  playerId: string,
  unavailableIds: readonly string[],
  permanentlyOutIds: readonly string[],
  unlimitedReturns: boolean,
): boolean {
  if (isPlayerUnavailable(playerId, unavailableIds)) return false
  if (!unlimitedReturns && permanentlyOutIds.includes(playerId)) return false
  return true
}

/** Toggle a player in the unavailable list (immutable return). */
export function toggleUnavailable(
  unavailableIds: readonly string[],
  playerId: string,
  unavailable: boolean,
): string[] {
  const set = new Set(unavailableIds)
  if (unavailable) {
    set.add(playerId)
  } else {
    set.delete(playerId)
  }
  return [...set]
}

/** Remove unavailable players from field and bench (hidden from the game lineup). */
export function applyUnavailableToLineup(
  fieldIds: readonly string[],
  benchIds: readonly string[],
  unavailableIds: readonly string[],
): { fieldIds: string[]; benchIds: string[] } {
  const unavailable = new Set(unavailableIds)
  return {
    fieldIds: fieldIds.filter((id) => !unavailable.has(id)),
    benchIds: benchIds.filter((id) => !unavailable.has(id)),
  }
}
