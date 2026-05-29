export type SubStrategyConfig = {
  toleranceFactor: number
  subWindowIntervalSeconds: number
  rollingSubsAllowed: boolean
}

export const DEFAULT_SUB_STRATEGY_CONFIG: SubStrategyConfig = {
  toleranceFactor: 3,
  subWindowIntervalSeconds: 300,
  rollingSubsAllowed: true,
}
