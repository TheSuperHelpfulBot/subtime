import { useMemo, useState } from 'react'
import { getRosterById } from '../storage/rosterStorage'
import type { GameTypeRecord } from '../storage/gameTypesStorage'
import SubStrategyFormFields from './SubStrategyFormFields'
import {
  DEFAULT_SUB_STRATEGY_CONFIG,
  type SubStrategyConfig,
} from './subStrategy/types'

export type SubStrategySetupProps = {
  gameType: GameTypeRecord
  rosterId: string
  initialConfig?: SubStrategyConfig
  onBack: () => void
  onStartGame: (config: SubStrategyConfig) => void
}

export default function SubStrategySetup({
  gameType,
  rosterId,
  initialConfig,
  onBack,
  onStartGame,
}: SubStrategySetupProps) {
  const roster = useMemo(() => getRosterById(rosterId), [rosterId])
  const [config, setConfig] = useState<SubStrategyConfig>(
    initialConfig ?? DEFAULT_SUB_STRATEGY_CONFIG,
  )

  if (!roster) {
    return (
      <div className="sub-strategy-setup" data-testid="sub-strategy-setup">
        <p role="status">Roster not found.</p>
        <button type="button" className="btn-secondary" onClick={onBack}>
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="sub-strategy-setup" data-testid="sub-strategy-setup">
      <h1 className="timer-config-title">Substitution strategy</h1>
      <p className="timer-config-lead">
        {gameType.name} · {roster.name}
      </p>

      <SubStrategyFormFields
        config={config}
        onConfigChange={setConfig}
        idPrefix="setup"
      />

      <div className="sub-strategy-setup-actions">
        <button
          type="button"
          className="cta"
          data-testid="strategy-start-game"
          onClick={() => onStartGame(config)}
        >
          Start game
        </button>
        <button type="button" className="btn-secondary" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  )
}
