import { beforeEach, describe, expect, it } from 'vitest'
import type { TimerConfig } from '../timer/timerConfig'
import {
  deleteGameType,
  getGameTypes,
  renameGameType,
  saveGameType,
  updateGameType,
} from './gameTypesStorage'

const sample: TimerConfig = {
  periods: 4,
  periodDurationMinutes: 12,
  breakDurationMinutes: 2,
}

describe('gameTypesStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty list when nothing stored', () => {
    expect(getGameTypes()).toEqual([])
  })

  it('saves and loads a game type', () => {
    const result = saveGameType('League', sample)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected ok')
    expect(result.gameType.name).toBe('League')
    expect(result.gameType.config).toEqual(sample)
    expect(result.gameType.id).toMatch(/[a-f0-9-]{36}/i)

    const list = getGameTypes()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('League')
    expect(list[0].config).toEqual(sample)
  })

  it('rejects empty name on save', () => {
    const result = saveGameType('   ', sample)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.error).toBe('empty_name')
    expect(getGameTypes()).toHaveLength(0)
  })

  it('rejects duplicate name on save (case-insensitive)', () => {
    expect(saveGameType('League', sample).ok).toBe(true)
    const dup = saveGameType('  league ', sample)
    expect(dup.ok).toBe(false)
    if (dup.ok) throw new Error('expected failure')
    expect(dup.error).toBe('duplicate_name')
    expect(getGameTypes()).toHaveLength(1)
  })

  it('deletes a game type by id', () => {
    const a = saveGameType('A', sample)
    const b = saveGameType('B', { ...sample, periods: 2 })
    if (!a.ok || !b.ok) throw new Error('save failed')
    deleteGameType(a.gameType.id)
    const names = getGameTypes().map((g) => g.name)
    expect(names).toEqual(['B'])
  })

  it('rename updates name', () => {
    const saved = saveGameType('Old', sample)
    if (!saved.ok) throw new Error('save failed')
    const r = renameGameType(saved.gameType.id, 'New')
    expect(r.ok).toBe(true)
    expect(getGameTypes()[0].name).toBe('New')
  })

  it('rename rejects empty name', () => {
    const saved = saveGameType('Old', sample)
    if (!saved.ok) throw new Error('save failed')
    const r = renameGameType(saved.gameType.id, '  ')
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected failure')
    expect(r.error).toBe('empty_name')
    expect(getGameTypes()[0].name).toBe('Old')
  })

  it('rename rejects duplicate of another type', () => {
    saveGameType('A', sample)
    const b = saveGameType('B', { ...sample, periods: 3 })
    if (!b.ok) throw new Error('save failed')
    const r = renameGameType(b.gameType.id, 'A')
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected failure')
    expect(r.error).toBe('duplicate_name')
    expect(getGameTypes().map((g) => g.name).sort()).toEqual(['A', 'B'])
  })

  it('allows renaming to same name with different casing', () => {
    const saved = saveGameType('League', sample)
    if (!saved.ok) throw new Error('save failed')
    const r = renameGameType(saved.gameType.id, 'LEAGUE')
    expect(r.ok).toBe(true)
    expect(getGameTypes()[0].name).toBe('LEAGUE')
  })

  it('updateGameType changes name and config', () => {
    const saved = saveGameType('Old', sample)
    if (!saved.ok) throw new Error('save failed')
    const nextConfig = { ...sample, periods: 3 }
    const r = updateGameType(saved.gameType.id, 'New', nextConfig)
    expect(r.ok).toBe(true)
    const list = getGameTypes()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('New')
    expect(list[0].config).toEqual(nextConfig)
  })

  it('updateGameType rejects duplicate name', () => {
    saveGameType('A', sample)
    const b = saveGameType('B', { ...sample, periods: 2 })
    if (!b.ok) throw new Error('save failed')
    const r = updateGameType(b.gameType.id, 'A', sample)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected failure')
    expect(r.error).toBe('duplicate_name')
  })

  it('updateGameType rejects missing id', () => {
    const r = updateGameType('00000000-0000-4000-8000-000000000000', 'X', sample)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected failure')
    expect(r.error).toBe('not_found')
  })
})
