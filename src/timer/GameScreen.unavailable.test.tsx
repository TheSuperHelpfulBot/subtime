import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { saveGameType, type GameTypeRecord } from '../storage/gameTypesStorage'
import { addPlayerToRoster, saveRoster } from '../storage/rosterStorage'
import GameScreen from './GameScreen'
import { DEFAULT_SUB_STRATEGY_CONFIG } from './subStrategy/types'

describe('GameScreen · unavailable players', () => {
  let rosterId: string
  let unavailableId: string
  let gameType: GameTypeRecord

  beforeEach(() => {
    localStorage.clear()
    const saved = saveGameType('Test', { periods: 1, periodDurationMinutes: 10, breakDurationMinutes: 0 }, 2)
    if (!saved.ok) throw new Error('game type save failed')
    gameType = saved.gameType

    const roster = saveRoster('Squad')
    if (!roster.ok) throw new Error('roster save failed')
    rosterId = roster.roster.id

    const a = addPlayerToRoster(rosterId, { name: 'Alex', shirtNumber: '1' })
    const b = addPlayerToRoster(rosterId, { name: 'Blake', shirtNumber: '2' })
    const c = addPlayerToRoster(rosterId, { name: 'Casey', shirtNumber: '3' })
    if (!a.ok || !b.ok || !c.ok) throw new Error('add player failed')
    unavailableId = b.player.id
  })

  it('keeps unavailable players off the field on load', () => {
    render(
      <GameScreen
        gameType={gameType}
        rosterId={rosterId}
        subStrategyConfig={DEFAULT_SUB_STRATEGY_CONFIG}
        unavailableIds={[unavailableId]}
        onConfigChange={() => {}}
        onUnavailableChange={() => {}}
        onLeave={() => {}}
      />,
    )

    expect(screen.getByTestId('on-field-list')).not.toHaveTextContent('Blake')
    expect(screen.getByTestId('bench-list')).not.toHaveTextContent('Blake')
  })
})
