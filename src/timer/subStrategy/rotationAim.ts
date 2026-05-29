/** Rotations per period: 0→1/game, 5→1/period, 10→2/period (linear segments). */
export function computeRotationsPerPeriod(
  rotationFrequencyFactor: number,
  periodCount: number,
): number {
  const f = Math.max(0, Math.min(10, rotationFrequencyFactor))
  const periods = Math.max(1, periodCount)

  if (f <= 5) {
    const perGame = 1
    const perPeriod = 1
    return perGame / periods + (f / 5) * (perPeriod - perGame / periods)
  }

  return 1 + ((f - 5) / 5) * (2 - 1)
}

export function computeRotationsPerGame(
  rotationFrequencyFactor: number,
  periodCount: number,
): number {
  return computeRotationsPerPeriod(rotationFrequencyFactor, periodCount) * Math.max(1, periodCount)
}

/** Expected seconds a field stint should last before rotation, for even spread. */
export function computeRotationStintTargetSeconds(
  totalPlayingSeconds: number,
  onFieldCount: number,
  rotationsPerGame: number,
): number {
  if (onFieldCount <= 0 || rotationsPerGame <= 0 || totalPlayingSeconds <= 0) return 0
  return totalPlayingSeconds / (onFieldCount * rotationsPerGame)
}

/**
 * Ideal seconds on field before a sub window in one period.
 * periodFair ÷ swapWaves ÷ rotationsPerPeriod, where swapWaves = ceil(onField ÷ bench).
 */
export function computeIdealSubStintSeconds(
  periodLengthSeconds: number,
  onFieldCount: number,
  activeSquadSize: number,
  rotationsPerPeriod: number,
): number {
  const benchSize = activeSquadSize - onFieldCount
  if (
    periodLengthSeconds <= 0 ||
    onFieldCount <= 0 ||
    benchSize <= 0 ||
    activeSquadSize <= onFieldCount
  ) {
    return 0
  }

  const periodFairTarget = (periodLengthSeconds * onFieldCount) / activeSquadSize
  const wavesPerRotation = Math.max(1, Math.ceil(onFieldCount / benchSize))
  return periodFairTarget / (wavesPerRotation * Math.max(rotationsPerPeriod, 0.001))
}
