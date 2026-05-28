import type { PlaytimeSeconds } from './substitutionPlaytime'

export type RosterLineupSyncInput = {
  fieldIds: readonly string[]
  benchIds: readonly string[]
  playtime: PlaytimeSeconds
  rosterPlayerIds: readonly string[]
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
}: RosterLineupSyncInput): RosterLineupSyncResult {
  const rosterIds = new Set(rosterPlayerIds)
  const field = fieldIds.filter((id) => rosterIds.has(id))
  const bench = benchIds.filter((id) => rosterIds.has(id))
  const placedIds = new Set([...field, ...bench])

  for (const id of rosterPlayerIds) {
    if (!placedIds.has(id)) {
      bench.push(id)
      placedIds.add(id)
    }
  }

  const nextPlaytime: PlaytimeSeconds = {}
  for (const id of rosterPlayerIds) {
    nextPlaytime[id] = playtime[id] ?? 0
  }

  return {
    fieldIds: field,
    benchIds: bench,
    playtime: nextPlaytime,
  }
}
