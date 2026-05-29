import { describe, expect, it } from 'vitest'
import { syncLineupWithRoster } from './rosterLineupSync'

describe('syncLineupWithRoster · unavailable', () => {
  it('moves unavailable players off the field after sync', () => {
    const result = syncLineupWithRoster({
      fieldIds: ['alex', 'blake'],
      benchIds: ['casey'],
      playtime: { alex: 10, blake: 5, casey: 0 },
      rosterPlayerIds: ['alex', 'blake', 'casey'],
      unavailableIds: ['blake'],
    })

    expect(result.fieldIds).toEqual(['alex'])
    expect(result.benchIds).toEqual(['casey'])
    expect(result.benchIds).not.toContain('blake')
  })
})
