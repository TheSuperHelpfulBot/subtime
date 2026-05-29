import { describe, expect, it } from 'vitest'
import { syncLineupWithRoster } from './rosterLineupSync'

describe('syncLineupWithRoster · available again', () => {
  it('returns a previously unavailable player to the bench when they become available', () => {
    const result = syncLineupWithRoster({
      fieldIds: ['alex'],
      benchIds: ['casey'],
      playtime: { alex: 10, blake: 0, casey: 5 },
      rosterPlayerIds: ['alex', 'blake', 'casey'],
      unavailableIds: [],
    })

    expect(result.fieldIds).toEqual(['alex'])
    expect(result.benchIds).toEqual(['casey', 'blake'])
  })
})
