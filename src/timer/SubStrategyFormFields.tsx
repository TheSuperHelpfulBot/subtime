import ToggleSwitch from '../roster/ToggleSwitch'
import type { SubStrategyConfig } from './subStrategy/types'

export type SubStrategyFormFieldsProps = {
  config: SubStrategyConfig
  onConfigChange: (config: SubStrategyConfig) => void
  idPrefix?: string
}

export function parseSubWindowMinutes(raw: string): number | null {
  const t = raw.trim()
  if (t === '') return null
  const n = Number(t)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 60)
}

export function formatSubWindowMinutes(seconds: number): string {
  const minutes = seconds / 60
  return Number.isInteger(minutes) ? String(minutes) : String(Math.round(minutes * 10) / 10)
}

export default function SubStrategyFormFields({
  config,
  onConfigChange,
  idPrefix = 'strategy',
}: SubStrategyFormFieldsProps) {
  const toleranceId = `${idPrefix}-tolerance`
  const intervalId = `${idPrefix}-interval`
  const rollingId = `${idPrefix}-rolling`

  return (
    <div className="sub-strategy-form">
      <div className="field">
        <label htmlFor={toleranceId}>
          Fairness tolerance ({config.toleranceFactor}/10)
        </label>
        <input
          id={toleranceId}
          type="range"
          min={0}
          max={10}
          step={1}
          value={config.toleranceFactor}
          onChange={(e) =>
            onConfigChange({
              ...config,
              toleranceFactor: Number.parseInt(e.target.value, 10),
            })
          }
          data-testid="strategy-tolerance"
        />
        <p className="timer-config-lead">0 = equal on-field time; 10 = more flexible.</p>
      </div>

      <div className="field">
        <label htmlFor={intervalId}>Time between sub opportunities (minutes)</label>
        <input
          id={intervalId}
          type="number"
          min={1}
          step={1}
          value={formatSubWindowMinutes(config.subWindowIntervalSeconds)}
          onChange={(e) => {
            const sec = parseSubWindowMinutes(e.target.value)
            if (sec !== null) {
              onConfigChange({ ...config, subWindowIntervalSeconds: sec })
            }
          }}
          data-testid="strategy-interval-minutes"
        />
      </div>

      <ToggleSwitch
        id={rollingId}
        checked={config.rollingSubsAllowed}
        onChange={(checked) => onConfigChange({ ...config, rollingSubsAllowed: checked })}
        label="Rolling substitutions allowed"
        testId="strategy-rolling-subs"
      />
    </div>
  )
}
