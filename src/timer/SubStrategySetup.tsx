import { useMemo, useState } from 'react'
import SetupScreenPanel, { SetupScreenBody, SetupScreenHeader } from '../SetupScreen'
import { getRosterById } from '../storage/rosterStorage'
import type { GameTypeRecord } from '../storage/gameTypesStorage'
import SubStrategyFormFields from './SubStrategyFormFields'
import SubStrategyTargetSummary from './SubStrategyTargetSummary'
import {
  DEFAULT_SUB_STRATEGY_CONFIG,
  type SubStrategyConfig,
} from './subStrategy/types'

export type SubStrategySetupProps = {
  gameType: GameTypeRecord
  rosterId: string
  unavailableIds?: string[]
  initialConfig?: SubStrategyConfig
  onBack: () => void
  onStartGame: (config: SubStrategyConfig) => void
}

export default function SubStrategySetup({
  gameType,
  rosterId,
  unavailableIds = [],
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
    <SetupScreenPanel className="sub-strategy-setup" testId="sub-strategy-setup">
      <SetupScreenHeader>
        <h1 className="screen-title">Substitution strategy</h1>
        <p className="screen-lead">
          {gameType.name} · {roster.name}
        </p>
      </SetupScreenHeader>

      <SetupScreenBody>
        <SubStrategyFormFields
          config={config}
          onConfigChange={setConfig}
          idPrefix="setup"
        />

        <SubStrategyTargetSummary
          timerConfig={gameType.config}
          onFieldCount={gameType.onFieldCount}
          rosterPlayerIds={roster.players.map((player) => player.id)}
          unavailableIds={unavailableIds}
          config={config}
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
      </SetupScreenBody>
    </SetupScreenPanel>
  )
}
