import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import SubStrategySetup from './SubStrategySetup'
import type { GameTypeRecord } from '../storage/gameTypesStorage'
import { addPlayerToRoster, saveRoster } from '../storage/rosterStorage'

const GAME_TYPE: GameTypeRecord = {
  id: 'gt-1',
  name: 'U12',
  onFieldCount: 5,
  config: { periods: 2, periodDurationMinutes: 20, breakDurationMinutes: 5 },
}

function seedRoster(playerCount: number): string {
  const saved = saveRoster('Saturday')
  if (!saved.ok) throw new Error('roster save failed')
  for (let i = 0; i < playerCount; i += 1) {
    addPlayerToRoster(saved.roster.id, { name: `P${i + 1}`, shirtNumber: String(i + 1) })
  }
  return saved.roster.id
}

describe('SubStrategyTargetSummary', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows target on-field time per player from game type and roster', () => {
    const rosterId = seedRoster(10)

    render(
      <SubStrategySetup
        gameType={GAME_TYPE}
        rosterId={rosterId}
        unavailableIds={[]}
        onBack={() => {}}
        onStartGame={() => {}}
      />,
    )

    // 2 × 20 min = 40:00 playing; 5 on field / 10 squad → 20:00 each
    expect(screen.getByTestId('sub-strategy-target-time')).toHaveTextContent('20:00')
    expect(screen.getByTestId('sub-strategy-target-time')).toHaveTextContent('per player')
    expect(screen.getByTestId('sub-strategy-target-summary')).toHaveTextContent(
      '10 available · 5 on field · 40:00 of playing time',
    )
  })

  it('recalculates when unavailable players are excluded', () => {
    const saved = saveRoster('Saturday')
    if (!saved.ok) throw new Error('roster save failed')
    const a = addPlayerToRoster(saved.roster.id, { name: 'A', shirtNumber: '1' })
    const b = addPlayerToRoster(saved.roster.id, { name: 'B', shirtNumber: '2' })
    const c = addPlayerToRoster(saved.roster.id, { name: 'C', shirtNumber: '3' })
    const d = addPlayerToRoster(saved.roster.id, { name: 'D', shirtNumber: '4' })
    if (!a.ok || !b.ok || !c.ok || !d.ok) throw new Error('add player failed')

    render(
      <SubStrategySetup
        gameType={GAME_TYPE}
        rosterId={saved.roster.id}
        unavailableIds={[d.player.id]}
        onBack={() => {}}
        onStartGame={() => {}}
      />,
    )

    // 40:00 × 5 / 3 → 66:40
    expect(screen.getByTestId('sub-strategy-target-time')).toHaveTextContent('66:40')
    expect(screen.getByTestId('sub-strategy-target-summary')).toHaveTextContent(
      '1 unavailable player',
    )
  })

  it('updates typical stint when rotation frequency changes', () => {
    const rosterId = seedRoster(10)

    render(
      <SubStrategySetup
        gameType={GAME_TYPE}
        rosterId={rosterId}
        unavailableIds={[]}
        onBack={() => {}}
        onStartGame={() => {}}
      />,
    )

    expect(screen.getByTestId('sub-strategy-stint-target')).toHaveTextContent('10:00')

    fireEvent.change(screen.getByTestId('strategy-rotation-frequency'), {
      target: { value: '10' },
    })

    expect(screen.getByTestId('sub-strategy-stint-target')).toHaveTextContent('5:00')
  })

  it('hides stint target when unlimited returns is off', async () => {
    const user = userEvent.setup()
    const rosterId = seedRoster(10)

    render(
      <SubStrategySetup
        gameType={GAME_TYPE}
        rosterId={rosterId}
        unavailableIds={[]}
        onBack={() => {}}
        onStartGame={() => {}}
      />,
    )

    expect(screen.getByTestId('sub-strategy-stint-target')).toBeInTheDocument()
    await user.click(screen.getByTestId('strategy-unlimited-returns'))
    expect(screen.queryByTestId('sub-strategy-stint-target')).not.toBeInTheDocument()
  })
})
