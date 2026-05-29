import { applyUnavailableToLineup } from './playerAvailability'
import type { PlaytimeSeconds } from './substitutionPlaytime'

export type RosterLineupSyncInput = {
  fieldIds: readonly string[]
  benchIds: readonly string[]
  playtime: PlaytimeSeconds
  rosterPlayerIds: readonly string[]
  unavailableIds?: readonly string[]
}

export type RosterLineupSyncResult = {
  fieldIds: string[]
  benchIds: string[]
  playtime: PlaytimeSeconds
}

export function syncLineupWithRoster({
  fieldIds,
  benchIds,
  playtime,
  rosterPlayerIds,
  unavailableIds = [],
}: RosterLineupSyncInput): RosterLineupSyncResult {
  const unavailable = new Set(unavailableIds)
  const rosterIds = new Set(rosterPlayerIds)
  const field = fieldIds.filter((id) => rosterIds.has(id))
  const bench = benchIds.filter((id) => rosterIds.has(id))
  const placedIds = new Set([...field, ...bench])

  for (const id of rosterPlayerIds) {
    if (!placedIds.has(id) && !unavailable.has(id)) {
      bench.push(id)
      placedIds.add(id)
    }
  }

  const nextPlaytime: PlaytimeSeconds = {}
  for (const id of rosterPlayerIds) {
    nextPlaytime[id] = playtime[id] ?? 0
  }

  const enforced = applyUnavailableToLineup(field, bench, unavailableIds)

  return {
    fieldIds: enforced.fieldIds,
    benchIds: enforced.benchIds,
    playtime: nextPlaytime,
  }
}
