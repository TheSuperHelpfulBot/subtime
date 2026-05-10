import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the Simple Subs welcome screen', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /simple subs/i })).toBeInTheDocument()
    expect(screen.getByText(/substitution scheduling/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
  })

  it('shows game timer configuration after Get started', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /get started/i }))
    expect(screen.getByRole('heading', { name: /set up game type/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/number of periods/i)).toBeInTheDocument()
  })
})
