import { tick } from '../gameTimer'
import { tickPlaytime } from '../substitutionPlaytime'
import { swapFieldWithBench } from '../substitutionPlaytime'
import { elapsedPlayingSeconds } from '../elapsedPlayingTime'
import { calculateStrategy } from './calculateStrategy'
import { shouldRecommendSubstitutions } from './recommendationTiming'
import type { GameState, SubAction, SubStrategy } from './types'

const SIM_TICK_SECONDS = 30

function applySubBatch(state: GameState, subs: SubAction[]): GameState {
  let fieldIds = [...state.fieldIds]
  let benchIds = [...state.benchIds]
  let permanentlyOutIds = [...state.permanentlyOutIds]

  for (const sub of subs) {
    const result = swapFieldWithBench({ fieldIds, benchIds }, sub.offPlayerId, sub.onPlayerId)
    if (!result.ok) continue
    fieldIds = result.lineup.fieldIds
    benchIds = result.lineup.benchIds
    if (!state.config.unlimitedReturns && !permanentlyOutIds.includes(sub.offPlayerId)) {
      permanentlyOutIds.push(sub.offPlayerId)
    }
  }

  return {
    ...state,
    fieldIds,
    benchIds,
    permanentlyOutIds,
    lastSubElapsedPlayingSeconds: elapsedPlayingSeconds(state.timer),
  }
}

export function simulateForward(state: GameState, seconds: number): SubStrategy[] {
  if (seconds <= 0) return [calculateStrategy(state)]

  const snapshots: SubStrategy[] = [calculateStrategy(state)]
  let current = state
  let remainingSim = seconds

  while (remainingSim > 0) {
    const step = Math.min(remainingSim, SIM_TICK_SECONDS)
    remainingSim -= step

    let timer = current.timer
    if (timer.runStatus === 'running') {
      timer = tick(timer, step)
    }

    let playtimeSeconds = current.playtimeSeconds
    if (timer.runStatus === 'running' && timer.segment === 'period') {
      playtimeSeconds = tickPlaytime(playtimeSeconds, current.fieldIds, step, {
        runStatus: 'running',
        segment: 'period',
      })
    }

    current = { ...current, timer, playtimeSeconds }

    if (shouldRecommendSubstitutions(current)) {
      const strategy = calculateStrategy(current)
      if (strategy.recommendedSubs.length > 0) {
        current = applySubBatch(current, strategy.recommendedSubs)
      }
      snapshots.push(calculateStrategy(current))
    }
  }

  if (snapshots[snapshots.length - 1] !== calculateStrategy(current)) {
    snapshots.push(calculateStrategy(current))
  }

  return snapshots
}
