import { useMemo } from 'react'
import { formatClock } from './gameTimer'
import { deriveSubStrategyTargets } from './subStrategy/targetPlaytime'
import type { SubStrategyConfig } from './subStrategy/types'
import type { TimerConfig } from './timerConfig'

export type SubStrategyTargetSummaryProps = {
  timerConfig: TimerConfig
  onFieldCount: number
  rosterPlayerIds: readonly string[]
  unavailableIds: readonly string[]
  config: SubStrategyConfig
}

export default function SubStrategyTargetSummary({
  timerConfig,
  onFieldCount,
  rosterPlayerIds,
  unavailableIds,
  config,
}: SubStrategyTargetSummaryProps) {
  const summary = useMemo(
    () =>
      deriveSubStrategyTargets({
        timerConfig,
        onFieldCount,
        rosterPlayerIds,
        unavailableIds,
        config,
      }),
    [timerConfig, onFieldCount, rosterPlayerIds, unavailableIds, config],
  )

  if (summary.activeSquadSize <= 0) {
    return (
      <div
        className="sub-strategy-target-summary timer-summary"
        data-testid="sub-strategy-target-summary"
        role="status"
      >
        <p className="sub-strategy-target-heading">Fair on-field time</p>
        <p className="sub-strategy-target-detail">
          Add available players to your roster to calculate a target.
        </p>
      </div>
    )
  }

  return (
    <div
      className="sub-strategy-target-summary timer-summary"
      data-testid="sub-strategy-target-summary"
      role="status"
    >
      <p className="sub-strategy-target-heading">Fair on-field time</p>
      <p className="sub-strategy-target-value" data-testid="sub-strategy-target-time">
        {formatClock(summary.targetPlaytimeSeconds)}{' '}
        <span className="sub-strategy-target-per">per player</span>
      </p>
      <p className="sub-strategy-target-detail">
        {summary.activeSquadSize} available · {onFieldCount} on field ·{' '}
        {formatClock(summary.totalPlayingSeconds)} of playing time
      </p>
      {summary.typicalStintSeconds !== null && summary.typicalStintSeconds > 0 ? (
        <p className="sub-strategy-target-detail" data-testid="sub-strategy-stint-target">
          Typical stint before rotation: {formatClock(summary.typicalStintSeconds)}
        </p>
      ) : null}
      {summary.unavailableCount > 0 ? (
        <p className="sub-strategy-target-detail">
          Based on {summary.unavailableCount} unavailable player
          {summary.unavailableCount === 1 ? '' : 's'} excluded from the squad.
        </p>
      ) : null}
    </div>
  )
}
