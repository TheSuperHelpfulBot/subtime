import SubStrategyFormFields from './SubStrategyFormFields'
import SubStrategyTargetSummary from './SubStrategyTargetSummary'
import SetupScreenPanel, { SetupScreenBody, SetupScreenHeader } from '../SetupScreen'
import type { SubStrategyConfig } from './subStrategy/types'
import type { TimerConfig } from './timerConfig'

export type SubStrategyEditorProps = {
  config: SubStrategyConfig
  onConfigChange: (config: SubStrategyConfig) => void
  timerConfig: TimerConfig
  onFieldCount: number
  rosterPlayerIds: readonly string[]
  unavailableIds: readonly string[]
  onBack: () => void
  backLabel?: string
}

export default function SubStrategyEditor({
  config,
  onConfigChange,
  timerConfig,
  onFieldCount,
  rosterPlayerIds,
  unavailableIds,
  onBack,
  backLabel = 'Back to game',
}: SubStrategyEditorProps) {
  return (
    <SetupScreenPanel className="roster-editor sub-strategy-editor" testId="sub-strategy-editor">
      <SetupScreenHeader>
        <button
          type="button"
          className="btn-text roster-editor-back"
          data-testid="strategy-editor-back"
          onClick={onBack}
        >
          {backLabel}
        </button>
        <h2 className="screen-title">Substitution strategy</h2>
        <p className="screen-lead roster-editor-hint">
          Adjust substitution fairness, sub windows, and rolling substitution rules.
        </p>
      </SetupScreenHeader>

      <SetupScreenBody>
      <SubStrategyFormFields
        config={config}
        onConfigChange={onConfigChange}
        idPrefix="game-editor"
      />
      <SubStrategyTargetSummary
        timerConfig={timerConfig}
        onFieldCount={onFieldCount}
        rosterPlayerIds={rosterPlayerIds}
        unavailableIds={unavailableIds}
        config={config}
      />
      </SetupScreenBody>
    </SetupScreenPanel>
  )
}
