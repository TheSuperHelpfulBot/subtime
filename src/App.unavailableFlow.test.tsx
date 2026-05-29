import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { saveGameType } from './storage/gameTypesStorage'
import { addPlayerToRoster, saveRoster } from './storage/rosterStorage'

describe('App · unavailable roster flow', () => {
  let rosterId: string
  let unavailablePlayerId: string

  beforeEach(() => {
    localStorage.clear()

    expect(
      saveGameType('U12', { periods: 1, periodDurationMinutes: 10, breakDurationMinutes: 0 }, 2).ok,
    ).toBe(true)

    const roster = saveRoster('Saturday')
    if (!roster.ok) throw new Error('roster save failed')
    rosterId = roster.roster.id

    const alex = addPlayerToRoster(rosterId, { name: 'Alex', shirtNumber: '1' })
    const blake = addPlayerToRoster(rosterId, { name: 'Blake', shirtNumber: '2' })
    const casey = addPlayerToRoster(rosterId, { name: 'Casey', shirtNumber: '3' })
    if (!alex.ok || !blake.ok || !casey.ok) throw new Error('add player failed')
    unavailablePlayerId = blake.player.id
  })

  it('preserves unavailable selections from roster pick through strategy setup into the game', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /get started/i }))
    await user.click(screen.getByRole('button', { name: /^start game$/i }))

    await user.click(screen.getByRole('button', { name: /edit saturday/i }))
    await user.click(screen.getByTestId(`roster-unavailable-${unavailablePlayerId}`))
    await user.click(screen.getByRole('button', { name: /back to roster list/i }))
    await user.click(screen.getByTestId(`use-roster-${rosterId}`))

    expect(screen.getByTestId('sub-strategy-setup')).toBeInTheDocument()
    await user.click(screen.getByTestId('strategy-start-game'))

    expect(screen.getByTestId('on-field-list')).not.toHaveTextContent('Blake')
    expect(screen.getByTestId('bench-list')).not.toHaveTextContent('Blake')
  })
})
