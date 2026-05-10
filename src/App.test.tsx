import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the Simple Subs welcome screen', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /simple subs/i })).toBeInTheDocument()
    expect(screen.getByText(/substitution scheduling/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
  })
})
