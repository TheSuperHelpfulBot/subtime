import type { PlaytimeSeconds } from './substitutionPlaytime'

export type PlaytimeSortOrder = 'asc' | 'desc'

function secondsFor(id: string, playtime: PlaytimeSeconds): number {
  return playtime[id] ?? 0
}

/** Display order for roster columns (does not mutate `ids`). */
export function sortIdsByPlaytime(
  ids: readonly string[],
  playtime: PlaytimeSeconds,
  order: PlaytimeSortOrder,
): string[] {
  const indexed = ids.map((id, index) => ({
    id,
    index,
    seconds: secondsFor(id, playtime),
  }))
  indexed.sort((a, b) => {
    if (a.seconds !== b.seconds) {
      return order === 'asc' ? a.seconds - b.seconds : b.seconds - a.seconds
    }
    return a.index - b.index
  })
  return indexed.map((entry) => entry.id)
}

/** Phase 0 heuristic: most on-field time off, least on-field time on. */
export function getTopRecommendedSubPair(
  fieldIds: readonly string[],
  benchIds: readonly string[],
  playtime: PlaytimeSeconds,
): { offId: string; onId: string } | null {
  if (fieldIds.length === 0 || benchIds.length === 0) return null
  const sortedField = sortIdsByPlaytime(fieldIds, playtime, 'desc')
  const sortedBench = sortIdsByPlaytime(benchIds, playtime, 'asc')
  return { offId: sortedField[0]!, onId: sortedBench[0]! }
}
