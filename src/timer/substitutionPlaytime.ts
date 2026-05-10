/**
 * Pure helpers for substitution flow and per-player on-field time (Milestone 7).
 */

export type GameRunStatus = 'idle' | 'running' | 'paused' | 'ended'

/** Segment relevant to whether clock time counts toward player minutes (active play vs break). */
export type SegmentForPlaytime = 'period' | 'break' | null

/** Cumulative seconds spent on field during active period play. */
export type PlaytimeSeconds = Record<string, number>

export type LineupLists = {
  fieldIds: string[]
  benchIds: string[]
}

export function createZeroPlaytime(playerIds: readonly string[]): PlaytimeSeconds {
  const out: PlaytimeSeconds = {}
  for (const id of playerIds) out[id] = 0
  return out
}

export function isStartingLineupComplete(fieldPlayerCount: number, requiredOnField: number): boolean {
  return requiredOnField >= 1 && fieldPlayerCount === requiredOnField
}

/** First `onFieldCount` roster ids start on field (in roster order); remainder on bench. Caps at roster size. */
export function splitInitialLineup(
  rosterPlayerIdsInOrder: readonly string[],
  onFieldCount: number,
): LineupLists {
  const n = rosterPlayerIdsInOrder.length
  const k = Math.min(Math.max(0, onFieldCount), n)
  return {
    fieldIds: rosterPlayerIdsInOrder.slice(0, k),
    benchIds: rosterPlayerIdsInOrder.slice(k),
  }
}

/** Highest cumulative on-field seconds among every roster player (single scale for all bars). */
export function maxPlaytimeAcrossRoster(
  playtime: PlaytimeSeconds,
  rosterPlayerIds: readonly string[],
): number {
  let m = 0
  for (const id of rosterPlayerIds) {
    const v = playtime[id] ?? 0
    if (v > m) m = v
  }
  return m
}

/** Width 0–100 for a meter vs the roster-wide maximum (bench + on-field share one scale). */
export function playtimeBarFillPercent(playerSeconds: number, globalMaxSeconds: number): number {
  if (globalMaxSeconds <= 0) return 0
  return Math.min(100, (playerSeconds / globalMaxSeconds) * 100)
}

export type PlaytimeBarPercents = {
  /** Roster-wide max cumulative on-field seconds (denominator for every bar). */
  globalMaxSeconds: number
  /** Fill width 0–100 for each roster player vs globalMaxSeconds. */
  percentByPlayerId: Record<string, number>
}

/** Single scale for all roster rows: max seconds among players, then each player's % of that max. */
export function playtimeBarPercentsForRoster(
  playtime: PlaytimeSeconds,
  rosterPlayerIds: readonly string[],
): PlaytimeBarPercents {
  const globalMaxSeconds = maxPlaytimeAcrossRoster(playtime, rosterPlayerIds)
  const percentByPlayerId: Record<string, number> = {}
  for (const id of rosterPlayerIds) {
    percentByPlayerId[id] = playtimeBarFillPercent(playtime[id] ?? 0, globalMaxSeconds)
  }
  return { globalMaxSeconds, percentByPlayerId }
}

/** Width 0–100 vs max of the given snapshot list (same semantics as roster-wide max when list is exhaustive). */
export function playtimeMeterPercent(playerSeconds: number, rosterSeconds: readonly number[]): number {
  const max = rosterSeconds.length === 0 ? 0 : Math.max(0, ...rosterSeconds)
  return playtimeBarFillPercent(playerSeconds, max)
}

/**
 * Advance cumulative on-field seconds for players currently on the field.
 * Counts only when the match clock is running during a period (not during breaks, idle, paused, or ended).
 */
export function tickPlaytime(
  playtime: PlaytimeSeconds,
  fieldPlayerIds: readonly string[],
  deltaSeconds: number,
  opts: { runStatus: GameRunStatus; segment: SegmentForPlaytime },
): PlaytimeSeconds {
  if (deltaSeconds <= 0) return { ...playtime }
  if (opts.runStatus !== 'running') return { ...playtime }
  if (opts.segment !== 'period') return { ...playtime }

  const next = { ...playtime }
  for (const id of fieldPlayerIds) {
    next[id] = (next[id] ?? 0) + deltaSeconds
  }
  return next
}

export type SwapPlayersResult =
  | { ok: true; lineup: LineupLists }
  | {
      ok: false
      error:
        | 'field_player_not_on_field'
        | 'bench_player_not_on_bench'
        | 'same_player'
        | 'player_not_on_field'
    }

/** Bench player replaces a field player (classic substitution). */
export function swapFieldWithBench(
  lineup: LineupLists,
  fieldPlayerId: string,
  benchPlayerId: string,
): SwapPlayersResult {
  if (fieldPlayerId === benchPlayerId) return { ok: false, error: 'same_player' }
  const fi = lineup.fieldIds.indexOf(fieldPlayerId)
  if (fi === -1) return { ok: false, error: 'field_player_not_on_field' }
  if (!lineup.benchIds.includes(benchPlayerId)) return { ok: false, error: 'bench_player_not_on_bench' }

  const fieldIds = [...lineup.fieldIds]
  fieldIds[fi] = benchPlayerId
  const benchIds = lineup.benchIds.filter((id) => id !== benchPlayerId).concat(fieldPlayerId)
  return { ok: true, lineup: { fieldIds, benchIds } }
}

/** Swap two players who are both on the field (e.g. drag-reorder / interchange). */
export function swapTwoOnField(lineup: LineupLists, playerA: string, playerB: string): SwapPlayersResult {
  if (playerA === playerB) return { ok: false, error: 'same_player' }
  const i = lineup.fieldIds.indexOf(playerA)
  const j = lineup.fieldIds.indexOf(playerB)
  if (i === -1 || j === -1) return { ok: false, error: 'player_not_on_field' }
  const fieldIds = [...lineup.fieldIds]
  ;[fieldIds[i], fieldIds[j]] = [fieldIds[j], fieldIds[i]]
  return { ok: true, lineup: { fieldIds, benchIds: [...lineup.benchIds] } }
}

export type SwapBenchPlayersResult =
  | { ok: true; benchIds: string[] }
  | { ok: false; error: 'same_player' | 'player_not_on_bench' }

/** Swap two players who are both on the bench (drag onto another bench player). */
export function swapTwoOnBench(
  benchIds: readonly string[],
  playerA: string,
  playerB: string,
): SwapBenchPlayersResult {
  if (playerA === playerB) return { ok: false, error: 'same_player' }
  const i = benchIds.indexOf(playerA)
  const j = benchIds.indexOf(playerB)
  if (i === -1 || j === -1) return { ok: false, error: 'player_not_on_bench' }
  const next = [...benchIds]
  ;[next[i], next[j]] = [next[j], next[i]]
  return { ok: true, benchIds: next }
}
