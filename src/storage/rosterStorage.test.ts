import { beforeEach, describe, expect, it } from 'vitest'
import {
  MAX_PLAYER_NAME_LENGTH,
  MAX_ROSTER_NAME_LENGTH,
  MAX_SHIRT_NUMBER_LENGTH,
  addPlayerToRoster,
  deleteRoster,
  getRosters,
  removePlayerFromRoster,
  saveRoster,
  updatePlayerInRoster,
  updateRosterName,
} from './rosterStorage'

describe('rosterStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty list when nothing stored', () => {
    expect(getRosters()).toEqual([])
  })

  it('saveRoster creates a roster with trimmed name', () => {
    const r = saveRoster('  Saturday squad  ')
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')
    expect(r.roster.name).toBe('Saturday squad')
    expect(r.roster.players).toEqual([])
    expect(getRosters()).toHaveLength(1)
  })

  it('saveRoster rejects empty name', () => {
    const r = saveRoster('   ')
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected failure')
    expect(r.error).toBe('empty_name')
    expect(getRosters()).toHaveLength(0)
  })

  it('saveRoster rejects duplicate name (case-insensitive)', () => {
    expect(saveRoster('Team').ok).toBe(true)
    const dup = saveRoster('  team ')
    expect(dup.ok).toBe(false)
    if (dup.ok) throw new Error('expected failure')
    expect(dup.error).toBe('duplicate_name')
    expect(getRosters()).toHaveLength(1)
  })

  it('saveRoster rejects name longer than max', () => {
    const r = saveRoster('x'.repeat(MAX_ROSTER_NAME_LENGTH + 1))
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected failure')
    expect(r.error).toBe('name_too_long')
  })

  it('updateRosterName changes name', () => {
    const saved = saveRoster('Old')
    if (!saved.ok) throw new Error('save failed')
    const r = updateRosterName(saved.roster.id, 'New')
    expect(r.ok).toBe(true)
    expect(getRosters()[0].name).toBe('New')
  })

  it('updateRosterName rejects duplicate of another roster', () => {
    saveRoster('A')
    const b = saveRoster('B')
    if (!b.ok) throw new Error('save failed')
    const r = updateRosterName(b.roster.id, 'A')
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected failure')
    expect(r.error).toBe('duplicate_name')
  })

  it('deleteRoster removes roster', () => {
    const saved = saveRoster('X')
    if (!saved.ok) throw new Error('save failed')
    deleteRoster(saved.roster.id)
    expect(getRosters()).toHaveLength(0)
  })

  it('addPlayerToRoster adds player with name and shirt number', () => {
    const saved = saveRoster('Squad')
    if (!saved.ok) throw new Error('save failed')
    const r = addPlayerToRoster(saved.roster.id, {
      name: 'Alex',
      shirtNumber: '10',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')
    expect(r.player.name).toBe('Alex')
    expect(r.player.shirtNumber).toBe('10')
    expect(getRosters()[0].players).toHaveLength(1)
  })

  it('addPlayerToRoster allows shirt-only player when name empty', () => {
    const saved = saveRoster('Squad')
    if (!saved.ok) throw new Error('save failed')
    const r = addPlayerToRoster(saved.roster.id, { name: '', shirtNumber: '7' })
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')
    expect(r.player.name).toBe('')
    expect(r.player.shirtNumber).toBe('7')
  })

  it('addPlayerToRoster rejects when both name and shirt are empty', () => {
    const saved = saveRoster('Squad')
    if (!saved.ok) throw new Error('save failed')
    const r = addPlayerToRoster(saved.roster.id, { name: '  ', shirtNumber: '' })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected failure')
    expect(r.error).toBe('empty_player')
  })

  it('addPlayerToRoster rejects name longer than max', () => {
    const saved = saveRoster('Squad')
    if (!saved.ok) throw new Error('save failed')
    const r = addPlayerToRoster(saved.roster.id, {
      name: 'x'.repeat(MAX_PLAYER_NAME_LENGTH + 1),
      shirtNumber: '',
    })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected failure')
    expect(r.error).toBe('name_too_long')
  })

  it('addPlayerToRoster rejects shirt number longer than max', () => {
    const saved = saveRoster('Squad')
    if (!saved.ok) throw new Error('save failed')
    const r = addPlayerToRoster(saved.roster.id, {
      name: 'A',
      shirtNumber: '1'.repeat(MAX_SHIRT_NUMBER_LENGTH + 1),
    })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected failure')
    expect(r.error).toBe('shirt_too_long')
  })

  it('removePlayerFromRoster removes player by id', () => {
    const saved = saveRoster('Squad')
    if (!saved.ok) throw new Error('save failed')
    const ap = addPlayerToRoster(saved.roster.id, { name: 'A', shirtNumber: '1' })
    if (!ap.ok) throw new Error('add failed')
    removePlayerFromRoster(saved.roster.id, ap.player.id)
    expect(getRosters()[0].players).toHaveLength(0)
  })

  it('updatePlayerInRoster updates fields', () => {
    const saved = saveRoster('Squad')
    if (!saved.ok) throw new Error('save failed')
    const ap = addPlayerToRoster(saved.roster.id, { name: 'A', shirtNumber: '1' })
    if (!ap.ok) throw new Error('add failed')
    const up = updatePlayerInRoster(saved.roster.id, ap.player.id, {
      name: 'B',
      shirtNumber: '2',
    })
    expect(up.ok).toBe(true)
    const p = getRosters()[0].players[0]
    expect(p.name).toBe('B')
    expect(p.shirtNumber).toBe('2')
  })
})
