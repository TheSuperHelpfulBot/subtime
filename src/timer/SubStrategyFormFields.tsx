import { useEffect, useState } from 'react'
import ToggleSwitch from '../roster/ToggleSwitch'
import type { SubStrategyConfig } from './subStrategy/types'

export type SubStrategyFormFieldsProps = {
  config: SubStrategyConfig
  onConfigChange: (config: SubStrategyConfig) => void
  idPrefix?: string
}

type RuleToggleRowProps = {
  id: string
  leftLabel: string
  rightLabel: string
  checked: boolean
  onChange: (checked: boolean) => void
  testId: string
  /** When true, `checked` means the right-hand mode is active. */
  rightWhenChecked?: boolean
}

function RuleToggleRow({
  id,
  leftLabel,
  rightLabel,
  checked,
  onChange,
  testId,
  rightWhenChecked = true,
}: RuleToggleRowProps) {
  const rightActive = rightWhenChecked ? checked : !checked
  return (
    <div className="sub-strategy-rule-row">
      <span
        className={[
          'sub-strategy-rule-end-label',
          !rightActive ? 'sub-strategy-rule-end-label-active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {leftLabel}
      </span>
      <ToggleSwitch
        id={id}
        checked={checked}
        onChange={onChange}
        label=""
        testId={testId}
      />
      <span
        className={[
          'sub-strategy-rule-end-label',
          rightActive ? 'sub-strategy-rule-end-label-active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {rightLabel}
      </span>
    </div>
  )
}

type RangeWithEndLabelsProps = {
  id: string
  label: string
  min: number
  max: number
  step: number
  value: number
  leftEnd: string
  rightEnd: string
  testId: string
  ariaValueText: (value: number) => string
  onChange: (value: number) => void
}

function RangeWithEndLabels({
  id,
  label,
  min,
  max,
  step,
  value,
  leftEnd,
  rightEnd,
  testId,
  ariaValueText,
  onChange,
}: RangeWithEndLabelsProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="sub-strategy-tolerance-slider">
        <span className="sub-strategy-tolerance-end-label">{leftEnd}</span>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
          data-testid={testId}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={ariaValueText(value)}
        />
        <span className="sub-strategy-tolerance-end-label">{rightEnd}</span>
      </div>
    </div>
  )
}

function formatStoppageMinutes(seconds: number): string {
  const minutes = seconds / 60
  return Number.isInteger(minutes) ? String(minutes) : String(Math.round(minutes * 10) / 10)
}

type StoppageMeanFieldProps = {
  id: string
  seconds: number
  onSecondsChange: (seconds: number) => void
}

function StoppageMeanField({ id, seconds, onSecondsChange }: StoppageMeanFieldProps) {
  const [minutesText, setMinutesText] = useState(() => formatStoppageMinutes(seconds))

  useEffect(() => {
    setMinutesText(formatStoppageMinutes(seconds))
  }, [seconds])

  function commit(raw: string) {
    const t = raw.trim()
    const n = Number(t)
    if (t === '' || !Number.isFinite(n) || n < 0 || n > 2) {
      setMinutesText(formatStoppageMinutes(seconds))
      return
    }
    const sec = Math.round(n * 60)
    onSecondsChange(sec)
    setMinutesText(formatStoppageMinutes(sec))
  }

  return (
    <div className="field sub-strategy-stoppage-mean">
      <label htmlFor={id}>Mean time between stoppages (minutes)</label>
      <div className="sub-strategy-tolerance-slider">
        <span className="sub-strategy-tolerance-end-label">0 min</span>
        <input
          id={`${id}-slider`}
          type="range"
          min={0}
          max={120}
          step={15}
          value={seconds}
          onChange={(e) => onSecondsChange(Number.parseInt(e.target.value, 10))}
          data-testid="strategy-stoppage-mean-slider"
          aria-valuemin={0}
          aria-valuemax={120}
          aria-valuenow={seconds}
          aria-valuetext={`${formatStoppageMinutes(seconds)} minutes between stoppages`}
        />
        <span className="sub-strategy-tolerance-end-label">2 min</span>
      </div>
      <input
        id={id}
        type="number"
        min={0}
        max={2}
        step={0.25}
        value={minutesText}
        className="sub-strategy-stoppage-mean-input"
        onChange={(e) => {
          setMinutesText(e.target.value)
          const t = e.target.value.trim()
          const n = Number(t)
          if (t !== '' && Number.isFinite(n) && n >= 0 && n <= 2) {
            onSecondsChange(Math.round(n * 60))
          }
        }}
        onBlur={() => commit(minutesText)}
        data-testid="strategy-stoppage-mean-minutes"
      />
    </div>
  )
}

export default function SubStrategyFormFields({
  config,
  onConfigChange,
  idPrefix = 'strategy',
}: SubStrategyFormFieldsProps) {
  const returnsId = `${idPrefix}-returns`
  const duringPlayId = `${idPrefix}-during-play`
  const toleranceId = `${idPrefix}-tolerance`
  const rotationId = `${idPrefix}-rotation`
  const stoppageMeanId = `${idPrefix}-stoppage-mean`

  return (
    <div className="sub-strategy-form">
      <fieldset className="sub-strategy-rules-fieldset">
        <legend className="sub-strategy-rules-legend">Substitution rules</legend>

        <RuleToggleRow
          id={returnsId}
          leftLabel="Permanent"
          rightLabel="Unlimited"
          checked={config.unlimitedReturns}
          onChange={(unlimitedReturns) => onConfigChange({ ...config, unlimitedReturns })}
          testId="strategy-unlimited-returns"
        />

        <RuleToggleRow
          id={duringPlayId}
          leftLabel="During play"
          rightLabel="Stoppage only"
          checked={config.stoppageOnly}
          onChange={(stoppageOnly) => onConfigChange({ ...config, stoppageOnly })}
          testId="strategy-stoppage-only"
        />

        {config.stoppageOnly ? (
          <StoppageMeanField
            id={stoppageMeanId}
            seconds={config.meanStoppageIntervalSeconds}
            onSecondsChange={(meanStoppageIntervalSeconds) =>
              onConfigChange({ ...config, meanStoppageIntervalSeconds })
            }
          />
        ) : null}
      </fieldset>

      <RangeWithEndLabels
        id={toleranceId}
        label="Game time fairness"
        min={0}
        max={10}
        step={1}
        value={config.toleranceFactor}
        leftEnd="Fair"
        rightEnd="Flexible"
        testId="strategy-tolerance"
        ariaValueText={(value) =>
          value === 0
            ? 'Fair — strict equal on-field time'
            : value === 10
              ? 'Flexible — allow larger imbalances'
              : `${value} of 10 toward flexible`
        }
        onChange={(toleranceFactor) => onConfigChange({ ...config, toleranceFactor })}
      />

      {config.unlimitedReturns ? (
        <RangeWithEndLabels
          id={rotationId}
          label="Rotation frequency"
          min={0}
          max={10}
          step={1}
          value={config.rotationFrequencyFactor}
          leftEnd="Less"
          rightEnd="More"
          testId="strategy-rotation-frequency"
          ariaValueText={(value) =>
            value === 0
              ? 'About one full rotation per game'
              : value === 5
                ? 'About one full rotation per period'
                : value === 10
                  ? 'About two rotations per period'
                  : `${value} of 10 toward more frequent rotation`
          }
          onChange={(rotationFrequencyFactor) =>
            onConfigChange({ ...config, rotationFrequencyFactor })
          }
        />
      ) : null}
    </div>
  )
}
