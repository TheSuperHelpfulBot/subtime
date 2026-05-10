import type { TimerConfig } from '../timer/timerConfig'
import { readJson, writeJson } from './appStorage'

const KEY = 'gameTypes'

export type GameTypeRecord = {
  id: string
  name: string
  config: TimerConfig
}

type Persisted = { items: GameTypeRecord[] }

export type SaveGameTypeError = 'empty_name' | 'duplicate_name' | 'not_found'

export type SaveGameTypeResult =
  | { ok: true; gameType: GameTypeRecord }
  | { ok: false; error: SaveGameTypeError }

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

function loadItems(): GameTypeRecord[] {
  const data = readJson<Persisted | null>(KEY, null)
  if (!data || !Array.isArray(data.items)) return []
  return data.items
}

function persist(items: GameTypeRecord[]): void {
  writeJson(KEY, { items })
}

export function getGameTypes(): GameTypeRecord[] {
  return loadItems()
}

export function saveGameType(name: string, config: TimerConfig): SaveGameTypeResult {
  const n = normalizeName(name)
  if (n === '') {
    return { ok: false, error: 'empty_name' }
  }
  const items = loadItems()
  if (items.some((g) => namesConflict(g.name, n))) {
    return { ok: false, error: 'duplicate_name' }
  }
  const gameType: GameTypeRecord = {
    id: newId(),
    name: n,
    config: {
      periods: config.periods,
      periodDurationMinutes: config.periodDurationMinutes,
      breakDurationMinutes: config.breakDurationMinutes,
    },
  }
  persist([...items, gameType])
  return { ok: true, gameType }
}

export function updateGameType(id: string, name: string, config: TimerConfig): SaveGameTypeResult {
  const n = normalizeName(name)
  if (n === '') {
    return { ok: false, error: 'empty_name' }
  }
  const items = loadItems()
  if (!items.some((g) => g.id === id)) {
    return { ok: false, error: 'not_found' }
  }
  if (items.some((g) => g.id !== id && namesConflict(g.name, n))) {
    return { ok: false, error: 'duplicate_name' }
  }
  const next = items.map((g) =>
    g.id === id
      ? {
          ...g,
          name: n,
          config: {
            periods: config.periods,
            periodDurationMinutes: config.periodDurationMinutes,
            breakDurationMinutes: config.breakDurationMinutes,
          },
        }
      : g,
  )
  persist(next)
  const gameType = next.find((g) => g.id === id)
  return { ok: true, gameType: gameType! }
}

export function renameGameType(id: string, newName: string): SaveGameTypeResult {
  const n = normalizeName(newName)
  if (n === '') {
    return { ok: false, error: 'empty_name' }
  }
  const items = loadItems()
  if (!items.some((g) => g.id === id)) {
    return { ok: false, error: 'not_found' }
  }
  if (items.some((g) => g.id !== id && namesConflict(g.name, n))) {
    return { ok: false, error: 'duplicate_name' }
  }
  const next = items.map((g) => (g.id === id ? { ...g, name: n } : g))
  persist(next)
  const gameType = next.find((g) => g.id === id)
  return { ok: true, gameType: gameType! }
}

export function deleteGameType(id: string): void {
  const items = loadItems().filter((g) => g.id !== id)
  persist(items)
}
