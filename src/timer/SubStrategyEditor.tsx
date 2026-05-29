import SubStrategyFormFields from './SubStrategyFormFields'
import type { SubStrategyConfig } from './subStrategy/types'

export type SubStrategyEditorProps = {
  config: SubStrategyConfig
  onConfigChange: (config: SubStrategyConfig) => void
  onBack: () => void
  backLabel?: string
}

export default function SubStrategyEditor({
  config,
  onConfigChange,
  onBack,
  backLabel = 'Back to game',
}: SubStrategyEditorProps) {
  return (
    <div className="roster-editor sub-strategy-editor" data-testid="sub-strategy-editor">
      <button
        type="button"
        className="btn-text roster-editor-back"
        data-testid="strategy-editor-back"
        onClick={onBack}
      >
        {backLabel}
      </button>
      <h2 className="roster-editor-title">Substitution strategy</h2>
      <p className="roster-editor-hint">
        Adjust substitution fairness, sub windows, and rolling substitution rules.
      </p>
      <SubStrategyFormFields
        config={config}
        onConfigChange={onConfigChange}
        idPrefix="game-editor"
      />
    </div>
  )
}
