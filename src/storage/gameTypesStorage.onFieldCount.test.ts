import { beforeEach, describe, expect, it } from 'vitest'
import type { TimerConfig } from '../timer/timerConfig'
import { writeJson } from './appStorage'
import { getGameTypes, saveGameType, updateGameType } from './gameTypesStorage'

const sample: TimerConfig = {
  periods: 4,
  periodDurationMinutes: 12,
  breakDurationMinutes: 2,
}

describe('gameTypesStorage · onFieldCount', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('migrates legacy persisted items missing onFieldCount to the default', () => {
    writeJson('gameTypes', {
      items: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          name: 'Legacy',
          config: sample,
        },
      ],
    })

    const list = getGameTypes()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Legacy')
    expect(list[0].onFieldCount).toBe(11)
  })

  it('saveGameType stores onFieldCount', () => {
    const result = saveGameType('Five', sample, 5)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected ok')
    expect(result.gameType.onFieldCount).toBe(5)
    expect(getGameTypes()[0].onFieldCount).toBe(5)
  })

  it('saveGameType rejects onFieldCount below 1', () => {
    const result = saveGameType('Bad', sample, 0)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.error).toBe('invalid_on_field_count')
    expect(getGameTypes()).toHaveLength(0)
  })

  it('updateGameType updates onFieldCount', () => {
    const saved = saveGameType('T', sample, 7)
    if (!saved.ok) throw new Error('save failed')
    const r = updateGameType(saved.gameType.id, 'T', sample, 9)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')
    expect(r.gameType.onFieldCount).toBe(9)
    expect(getGameTypes()[0].onFieldCount).toBe(9)
  })

  it('updateGameType rejects onFieldCount below 1', () => {
    const saved = saveGameType('T', sample, 5)
    if (!saved.ok) throw new Error('save failed')
    const r = updateGameType(saved.gameType.id, 'T', sample, 0)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected failure')
    expect(r.error).toBe('invalid_on_field_count')
    expect(getGameTypes()[0].onFieldCount).toBe(5)
  })
})
