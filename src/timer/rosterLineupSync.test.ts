import { describe, expect, test } from 'vitest'
import { syncLineupWithRoster } from './rosterLineupSync'

describe('syncLineupWithRoster', () => {
  test('preserves existing lineup and playtime while adding new roster players to the bench', () => {
    const result = syncLineupWithRoster({
      fieldIds: ['alex', 'blake'],
      benchIds: ['casey'],
      playtime: {
        alex: 12,
        blake: 8,
        casey: 0,
      },
      rosterPlayerIds: ['alex', 'blake', 'casey', 'dana'],
    })

    expect(result.fieldIds).toEqual(['alex', 'blake'])
    expect(result.benchIds).toEqual(['casey', 'dana'])
    expect(result.playtime).toEqual({
      alex: 12,
      blake: 8,
      casey: 0,
      dana: 0,
    })
  })

  test('removes deleted players without resetting remaining player order or playtime', () => {
    const result = syncLineupWithRoster({
      fieldIds: ['alex', 'blake'],
      benchIds: ['casey', 'dana'],
      playtime: {
        alex: 20,
        blake: 18,
        casey: 4,
        dana: 0,
      },
      rosterPlayerIds: ['alex', 'casey', 'dana'],
    })

    expect(result.fieldIds).toEqual(['alex'])
    expect(result.benchIds).toEqual(['casey', 'dana'])
    expect(result.playtime).toEqual({
      alex: 20,
      casey: 4,
      dana: 0,
    })
  })
})
