import { render, screen } from '@testing-library/react'
import SubStrategySetup from './SubStrategySetup'
import type { GameTypeRecord } from '../storage/gameTypesStorage'
import { saveRoster } from '../storage/rosterStorage'
import { beforeEach, describe, expect, it } from 'vitest'

const GAME_TYPE: GameTypeRecord = {
  id: 'gt-1',
  name: 'U12',
  onFieldCount: 5,
  config: { periods: 2, periodDurationMinutes: 20, breakDurationMinutes: 5 },
}

describe('SubStrategySetup', () => {
  let rosterId: string

  beforeEach(() => {
    localStorage.clear()
    const saved = saveRoster('Saturday')
    if (!saved.ok) throw new Error('roster save failed')
    rosterId = saved.roster.id
  })

  it('renders substitution rules and fairness defaults', () => {
    render(
      <SubStrategySetup
        gameType={GAME_TYPE}
        rosterId={rosterId}
        onBack={() => {}}
        onStartGame={() => {}}
      />,
    )
    expect(screen.getByRole('heading', { name: /substitution strategy/i })).toBeInTheDocument()
    expect(screen.getByText('Substitution rules')).toBeInTheDocument()
    expect(screen.getByTestId('strategy-tolerance')).toHaveValue('0')
    expect(screen.getByTestId('strategy-rotation-frequency')).toHaveValue('5')
    expect(screen.getByTestId('strategy-unlimited-returns')).toBeChecked()
    expect(screen.queryByTestId('strategy-stoppage-mean-slider')).not.toBeInTheDocument()
  })
})
