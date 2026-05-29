import { describe, expect, it } from 'vitest'
import {
  computeIdealSubStintSeconds,
  computeRotationsPerGame,
  computeRotationsPerPeriod,
  computeRotationStintTargetSeconds,
} from './rotationAim'

describe('computeRotationsPerPeriod', () => {
  it('aims for one rotation per game at the less end', () => {
    expect(computeRotationsPerPeriod(0, 2)).toBeCloseTo(0.5, 5)
  })

  it('aims for one rotation per period at the middle', () => {
    expect(computeRotationsPerPeriod(5, 2)).toBeCloseTo(1, 5)
  })

  it('aims for two rotations per period at the more end', () => {
    expect(computeRotationsPerPeriod(10, 2)).toBeCloseTo(2, 5)
  })
})

describe('computeRotationsPerGame', () => {
  it('combines period count with per-period rate', () => {
    expect(computeRotationsPerGame(5, 2)).toBeCloseTo(2, 5)
  })
})

describe('computeIdealSubStintSeconds', () => {
  it('spaces two sub windows across a period for fifteen players and ten on field', () => {
    expect(computeIdealSubStintSeconds(240, 10, 15, 1)).toBeCloseTo(80, 5)
  })

  it('shortens stints when more rotations per period are requested', () => {
    expect(computeIdealSubStintSeconds(240, 10, 15, 2)).toBeCloseTo(40, 5)
  })
})
