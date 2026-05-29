/** Imbalance threshold: target × ((fairness × 0.95 + 0.05) / 10). */
export function computeFairnessImbalanceThreshold(
  targetTime: number,
  toleranceFactor: number,
): number {
  const clamped = Math.max(0, Math.min(10, toleranceFactor))
  const scale = (clamped * 0.95 + 0.05) / 10
  return targetTime * scale
}

/** Kept for warnings / display — same scale as imbalance threshold. */
export function computeTolerance(targetTime: number, toleranceFactor: number): number {
  return computeFairnessImbalanceThreshold(targetTime, toleranceFactor)
}
