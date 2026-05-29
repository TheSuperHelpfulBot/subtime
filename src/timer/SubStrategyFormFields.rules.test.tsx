import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import SubStrategyFormFields from './SubStrategyFormFields'
import { DEFAULT_SUB_STRATEGY_CONFIG } from './subStrategy/types'

function ControlledForm() {
  const [config, setConfig] = useState(DEFAULT_SUB_STRATEGY_CONFIG)
  return <SubStrategyFormFields config={config} onConfigChange={setConfig} idPrefix="test" />
}

describe('SubStrategyFormFields · substitution rules', () => {
  it('shows mean stoppage control when stoppage only is enabled', async () => {
    const user = userEvent.setup()
    render(<ControlledForm />)

    await user.click(screen.getByTestId('strategy-stoppage-only'))
    expect(screen.getByTestId('strategy-stoppage-mean-slider')).toBeInTheDocument()
    expect(screen.getByTestId('strategy-stoppage-mean-minutes')).toHaveValue(1)
  })

  it('hides rotation frequency when unlimited returns is off', async () => {
    const user = userEvent.setup()
    render(<ControlledForm />)

    expect(screen.getByTestId('strategy-rotation-frequency')).toBeInTheDocument()
    await user.click(screen.getByTestId('strategy-unlimited-returns'))
    expect(screen.queryByTestId('strategy-rotation-frequency')).not.toBeInTheDocument()
  })
})
