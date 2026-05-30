import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'
import type { RecommendedSubPair } from './recommendedSubPairs'

export type RecommendedSubOverlayProps = {
  pairs: RecommendedSubPair[]
  onSwap: (offId: string, onId: string) => void
  containerRef: RefObject<HTMLElement | null>
}

function pairKey(pair: RecommendedSubPair): string {
  return `${pair.offId}:${pair.onId}`
}

function playerCardInContainer(container: HTMLElement, playerId: string): HTMLElement | null {
  return container.querySelector<HTMLElement>(
    `[data-game-player-card="true"][data-player-id="${playerId}"]`,
  )
}

function verticalCenterInContainer(element: HTMLElement, container: HTMLElement): number {
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  return elementRect.top + elementRect.height / 2 - containerRect.top
}

function measurePairCenterY(
  container: HTMLElement,
  offId: string,
  onId: string,
): number | null {
  const fieldCard = playerCardInContainer(container, offId)
  const benchCard = playerCardInContainer(container, onId)
  if (!fieldCard || !benchCard) return null

  const fieldCenter = verticalCenterInContainer(fieldCard, container)
  const benchCenter = verticalCenterInContainer(benchCard, container)
  return (fieldCenter + benchCenter) / 2
}

export default function RecommendedSubOverlay({
  pairs,
  onSwap,
  containerRef,
}: RecommendedSubOverlayProps) {
  const [centerYByKey, setCenterYByKey] = useState<Record<string, number>>({})

  const pairsKey = pairs.map(pairKey).join('|')

  useLayoutEffect(() => {
    if (pairs.length === 0) {
      setCenterYByKey({})
      return
    }

    let cancelled = false

    const update = () => {
      if (cancelled) return
      const container = containerRef.current
      if (!container) return

      const next: Record<string, number> = {}
      for (const pair of pairs) {
        const y = measurePairCenterY(container, pair.offId, pair.onId)
        if (y !== null) next[pairKey(pair)] = y
      }
      setCenterYByKey(next)
    }

    update()

    let resizeObserver: ResizeObserver | undefined
    const connectObserver = () => {
      const container = containerRef.current
      if (!container || typeof ResizeObserver === 'undefined') return

      resizeObserver = new ResizeObserver(update)
      resizeObserver.observe(container)

      const observed = new Set<HTMLElement>()
      for (const pair of pairs) {
        for (const id of [pair.offId, pair.onId]) {
          const card = playerCardInContainer(container, id)
          if (card && !observed.has(card)) {
            observed.add(card)
            resizeObserver.observe(card)
          }
        }
      }
    }

    if (containerRef.current) {
      connectObserver()
    } else {
      const frameId = requestAnimationFrame(() => {
        update()
        connectObserver()
      })
      return () => {
        cancelled = true
        cancelAnimationFrame(frameId)
        resizeObserver?.disconnect()
      }
    }

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
    }
  }, [pairsKey, containerRef])

  if (pairs.length === 0) return null

  return (
    <>
      {pairs.map((pair, index) => {
        const y = centerYByKey[pairKey(pair)]
        if (y === undefined) return null

        return (
          <button
            key={pairKey(pair)}
            type="button"
            className="game-recommended-sub-swap-btn"
            data-testid={index === 0 ? 'game-recommended-sub-swap' : `game-recommended-sub-swap-${index}`}
            aria-label="Swap recommended players"
            style={{ '--swap-btn-top': `${y}px` } as CSSProperties}
            onClick={() => onSwap(pair.offId, pair.onId)}
          >
            <span className="game-recommended-sub-swap-icon" aria-hidden>
              ↔
            </span>
          </button>
        )
      })}
    </>
  )
}
