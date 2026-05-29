import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import type { GameTypeRecord } from '../storage/gameTypesStorage'
import { saveRoster } from '../storage/rosterStorage'
import SubStrategySetup from './SubStrategySetup'

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

  it('calls onStartGame with config only', async () => {
    const user = userEvent.setup()
    let captured: unknown = null

    render(
      <SubStrategySetup
        gameType={GAME_TYPE}
        rosterId={rosterId}
        onBack={() => {}}
        onStartGame={(config) => {
          captured = config
        }}
      />,
    )

    await user.click(screen.getByTestId('strategy-start-game'))

    expect(captured).toMatchObject({
      toleranceFactor: 0,
      rotationFrequencyFactor: 5,
      unlimitedReturns: true,
      stoppageOnly: false,
      meanStoppageIntervalSeconds: 60,
    })
  })
})
