import { readJson, writeJson } from './appStorage'

const KEY = 'rosters'

/** Roster display name max length (mobile-friendly lists). */
export const MAX_ROSTER_NAME_LENGTH = 40
/** Player name max length for bench / on-field columns. */
export const MAX_PLAYER_NAME_LENGTH = 24
/** Shirt number max length (e.g. "10", "12"). */
export const MAX_SHIRT_NUMBER_LENGTH = 4

export type PlayerRecord = {
  id: string
  name: string
  shirtNumber: string
}

export type RosterRecord = {
  id: string
  name: string
  players: PlayerRecord[]
}

type Persisted = { items: RosterRecord[] }

export type SaveRosterError = 'empty_name' | 'duplicate_name' | 'name_too_long' | 'not_found'

export type SaveRosterResult =
  | { ok: true; roster: RosterRecord }
  | { ok: false; error: SaveRosterError }

export type PlayerMutationError =
  | SaveRosterError
  | 'empty_player'
  | 'name_too_long'
  | 'shirt_too_long'
  | 'player_not_found'

export type AddPlayerResult =
  | { ok: true; player: PlayerRecord }
  | { ok: false; error: PlayerMutationError }

export type UpdatePlayerResult =
  | { ok: true; player: PlayerRecord }
  | { ok: false; error: PlayerMutationError }

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function normalizeName(name: string): string {
  return name.trim()
}

function namesConflict(a: string, b: string): boolean {
  return normalizeName(a).toLowerCase() === normalizeName(b).toLowerCase()
}

function loadItems(): RosterRecord[] {
  const data = readJson<Persisted | null>(KEY, null)
  if (!data || !Array.isArray(data.items)) return []
  return data.items.map((row) => ({
    id: (row as RosterRecord).id,
    name: (row as RosterRecord).name,
    players: Array.isArray((row as RosterRecord).players) ? (row as RosterRecord).players : [],
  }))
}

function persist(items: RosterRecord[]): void {
  writeJson(KEY, { items })
}

export function getRosters(): RosterRecord[] {
  return loadItems()
}

export function getRosterById(id: string): RosterRecord | null {
  return loadItems().find((r) => r.id === id) ?? null
}

export function saveRoster(name: string): SaveRosterResult {
  const n = normalizeName(name)
  if (n === '') {
    return { ok: false, error: 'empty_name' }
  }
  if (n.length > MAX_ROSTER_NAME_LENGTH) {
    return { ok: false, error: 'name_too_long' }
  }
  const items = loadItems()
  if (items.some((r) => namesConflict(r.name, n))) {
    return { ok: false, error: 'duplicate_name' }
  }
  const roster: RosterRecord = {
    id: newId(),
    name: n,
    players: [],
  }
  persist([...items, roster])
  return { ok: true, roster }
}

export function updateRosterName(id: string, name: string): SaveRosterResult {
  const n = normalizeName(name)
  if (n === '') {
    return { ok: false, error: 'empty_name' }
  }
  if (n.length > MAX_ROSTER_NAME_LENGTH) {
    return { ok: false, error: 'name_too_long' }
  }
  const items = loadItems()
  if (!items.some((r) => r.id === id)) {
    return { ok: false, error: 'not_found' }
  }
  if (items.some((r) => r.id !== id && namesConflict(r.name, n))) {
    return { ok: false, error: 'duplicate_name' }
  }
  const next = items.map((r) => (r.id === id ? { ...r, name: n } : r))
  persist(next)
  const roster = next.find((r) => r.id === id)
  return { ok: true, roster: roster! }
}

export function deleteRoster(id: string): void {
  const items = loadItems().filter((r) => r.id !== id)
  persist(items)
}

export type PlayerInput = {
  name: string
  shirtNumber: string
}

function validatePlayerInput(raw: PlayerInput): PlayerMutationError | null {
  const name = raw.name.trim()
  const shirtNumber = raw.shirtNumber.trim()
  if (name.length > MAX_PLAYER_NAME_LENGTH) {
    return 'name_too_long'
  }
  if (shirtNumber.length > MAX_SHIRT_NUMBER_LENGTH) {
    return 'shirt_too_long'
  }
  if (name === '' && shirtNumber === '') {
    return 'empty_player'
  }
  return null
}

export function addPlayerToRoster(rosterId: string, input: PlayerInput): AddPlayerResult {
  const err = validatePlayerInput(input)
  if (err) {
    return { ok: false, error: err }
  }
  const items = loadItems()
  const idx = items.findIndex((r) => r.id === rosterId)
  if (idx === -1) {
    return { ok: false, error: 'not_found' }
  }
  const name = input.name.trim()
  const shirtNumber = input.shirtNumber.trim()
  const player: PlayerRecord = {
    id: newId(),
    name,
    shirtNumber,
  }
  const roster = items[idx]
  const nextRoster: RosterRecord = {
    ...roster,
    players: [...roster.players, player],
  }
  const next = [...items]
  next[idx] = nextRoster
  persist(next)
  return { ok: true, player }
}

export function removePlayerFromRoster(rosterId: string, playerId: string): void {
  const items = loadItems()
  const idx = items.findIndex((r) => r.id === rosterId)
  if (idx === -1) return
  const roster = items[idx]
  const nextRoster: RosterRecord = {
    ...roster,
    players: roster.players.filter((p) => p.id !== playerId),
  }
  const next = [...items]
  next[idx] = nextRoster
  persist(next)
}

export function updatePlayerInRoster(
  rosterId: string,
  playerId: string,
  input: PlayerInput,
): UpdatePlayerResult {
  const err = validatePlayerInput(input)
  if (err) {
    return { ok: false, error: err }
  }
  const items = loadItems()
  const rIdx = items.findIndex((r) => r.id === rosterId)
  if (rIdx === -1) {
    return { ok: false, error: 'not_found' }
  }
  const roster = items[rIdx]
  const pIdx = roster.players.findIndex((p) => p.id === playerId)
  if (pIdx === -1) {
    return { ok: false, error: 'player_not_found' }
  }
  const name = input.name.trim()
  const shirtNumber = input.shirtNumber.trim()
  const player: PlayerRecord = {
    ...roster.players[pIdx],
    name,
    shirtNumber,
  }
  const nextPlayers = [...roster.players]
  nextPlayers[pIdx] = player
  const nextRoster: RosterRecord = { ...roster, players: nextPlayers }
  const next = [...items]
  next[rIdx] = nextRoster
  persist(next)
  return { ok: true, player }
}
