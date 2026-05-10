import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveGameType } from '../storage/gameTypesStorage'
import LoadSavedGameTypes from './LoadSavedGameTypes'

const sampleConfig = {
  periods: 4,
  periodDurationMinutes: 12,
  breakDurationMinutes: 2,
}

describe('LoadSavedGameTypes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows empty state when there are no saved types', () => {
    render(
      <LoadSavedGameTypes onCreateNew={() => {}} onEdit={() => {}} onLoad={() => {}} />,
    )
    expect(screen.getByRole('heading', { name: /load saved game type/i })).toBeInTheDocument()
    expect(screen.getByTestId('saved-game-types-empty')).toBeInTheDocument()
  })

  it('lists saved game types and invokes callbacks', async () => {
    const user = userEvent.setup()
    expect(saveGameType('Club', sampleConfig).ok).toBe(true)

    const onCreateNew = vi.fn()
    const onEdit = vi.fn()
    const onLoad = vi.fn()

    render(
      <LoadSavedGameTypes
        onCreateNew={onCreateNew}
        onEdit={onEdit}
        onLoad={onLoad}
      />,
    )

    expect(screen.getByTestId('saved-game-types')).toHaveTextContent('Club')
    await user.click(screen.getByRole('button', { name: /^create new game type$/i }))
    expect(onCreateNew).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /^load$/i }))
    expect(onLoad).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /^edit$/i }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('removes an item when Delete is clicked', async () => {
    const user = userEvent.setup()
    expect(saveGameType('Temp', sampleConfig).ok).toBe(true)

    render(
      <LoadSavedGameTypes onCreateNew={() => {}} onEdit={() => {}} onLoad={() => {}} />,
    )

    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(screen.getByTestId('saved-game-types-empty')).toBeInTheDocument()
  })
})
