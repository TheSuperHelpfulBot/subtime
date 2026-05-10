import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import TimerConfigForm from './TimerConfigForm'

describe('TimerConfigForm', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows defaults and a valid summary', () => {
    render(<TimerConfigForm />)
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

  it('saves a game type and lists it', async () => {
    const user = userEvent.setup()
    render(<TimerConfigForm />)

    await user.type(screen.getByLabelText(/game type name/i), 'Club match')
    await user.click(screen.getByRole('button', { name: /save game type/i }))

    expect(screen.getByTestId('saved-game-types')).toHaveTextContent('Club match')
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

  it('removes a saved game type when Delete is clicked', async () => {
    const user = userEvent.setup()
    render(<TimerConfigForm />)

    await user.type(screen.getByLabelText(/game type name/i), 'Temp')
    await user.click(screen.getByRole('button', { name: /save game type/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    expect(screen.getByTestId('saved-game-types-empty')).toBeInTheDocument()
  })

  it('loads a saved game type into the form', async () => {
    const user = userEvent.setup()
    render(<TimerConfigForm />)

    await user.clear(screen.getByLabelText(/number of periods/i))
    await user.type(screen.getByLabelText(/number of periods/i), '3')
    await user.clear(screen.getByLabelText(/period length/i))
    await user.type(screen.getByLabelText(/period length/i), '15')
    await user.clear(screen.getByLabelText(/break length/i))
    await user.type(screen.getByLabelText(/break length/i), '5')

    await user.type(screen.getByLabelText(/game type name/i), 'Fifteen')
    await user.click(screen.getByRole('button', { name: /save game type/i }))

    await user.clear(screen.getByLabelText(/number of periods/i))
    await user.type(screen.getByLabelText(/number of periods/i), '1')

    await user.click(screen.getByRole('button', { name: /^load$/i }))

    expect(screen.getByLabelText(/number of periods/i)).toHaveValue(3)
    expect(screen.getByLabelText(/period length/i)).toHaveValue('15')
    expect(screen.getByLabelText(/break length/i)).toHaveValue('5')
  })
})
