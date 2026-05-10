import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getGameTypes } from '../storage/gameTypesStorage'
import TimerConfigForm from './TimerConfigForm'

describe('TimerConfigForm', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows defaults with game type name first and a valid summary', () => {
    render(<TimerConfigForm />)

    const fields = screen.getAllByRole('textbox')
    expect(fields[0]).toHaveAccessibleName(/game type name/i)

    expect(screen.getByLabelText(/number of periods/i)).toHaveValue(4)
    expect(screen.getByLabelText(/period length/i)).toHaveValue('12')
    expect(screen.getByLabelText(/break length/i)).toHaveValue('2')
    expect(screen.getByTestId('timer-summary')).toHaveTextContent(/4 periods of 12 minutes/)
    expect(screen.getByTestId('timer-summary')).toHaveTextContent(/2-minute breaks/)
  })

  it('updates summary when values change', async () => {
    const user = userEvent.setup()
    render(<TimerConfigForm />)

    await user.clear(screen.getByLabelText(/number of periods/i))
    await user.type(screen.getByLabelText(/number of periods/i), '2')

    expect(screen.getByTestId('timer-summary')).toHaveTextContent(/2 periods/)
  })

  it('shows validation when periods is zero', async () => {
    const user = userEvent.setup()
    render(<TimerConfigForm />)

    await user.clear(screen.getByLabelText(/number of periods/i))
    await user.type(screen.getByLabelText(/number of periods/i), '0')

    expect(screen.getByRole('alert')).toHaveTextContent(/at least one period/i)
  })

  it('persists a game type when Save is clicked', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    render(<TimerConfigForm onSaved={onSaved} />)

    await user.type(screen.getByLabelText(/game type name/i), 'Club match')
    await user.click(screen.getByRole('button', { name: /save game type/i }))

    expect(getGameTypes().some((g) => g.name === 'Club match')).toBe(true)
    expect(onSaved).toHaveBeenCalled()
  })

  it('shows duplicate name message when saving twice', async () => {
    const user = userEvent.setup()
    render(<TimerConfigForm />)

    const nameField = screen.getByLabelText(/game type name/i)
    await user.type(nameField, 'Dup')
    await user.click(screen.getByRole('button', { name: /save game type/i }))
    await user.type(nameField, 'Dup')
    await user.click(screen.getByRole('button', { name: /save game type/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i)
  })
})
