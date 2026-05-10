import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { saveGameType } from './storage/gameTypesStorage'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the Simple Subs welcome screen', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /simple subs/i })).toBeInTheDocument()
    expect(screen.getByText(/substitution scheduling/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
  })

  it('shows Set Up Game Type after Get started when there are no saved types', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /get started/i }))
    expect(screen.getByRole('heading', { name: /set up game type/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/game type name/i)).toBeInTheDocument()
  })

  it('shows Load Saved Game Type after Get started when saves exist', async () => {
    expect(
      saveGameType('Existing', {
        periods: 2,
        periodDurationMinutes: 10,
        breakDurationMinutes: 0,
      }).ok,
    ).toBe(true)

    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /get started/i }))
    expect(screen.getByRole('heading', { name: /load saved game type/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create new game type/i })).toBeInTheDocument()
    expect(screen.getByTestId('saved-game-types')).toHaveTextContent('Existing')
  })
})
