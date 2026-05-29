import { useLayoutEffect, useState, type RefObject } from 'react'

export type RecommendedSubOverlayProps = {
  pair: { offId: string; onId: string } | null
  onSwap: (offId: string, onId: string) => void
  containerRef: RefObject<HTMLElement | null>
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
  pair,
  onSwap,
  containerRef,
}: RecommendedSubOverlayProps) {
  const [centerY, setCenterY] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (!pair) {
      setCenterY(null)
      return
    }

    const container = containerRef.current
    if (!container) return

    const update = () => {
      setCenterY(measurePairCenterY(container, pair.offId, pair.onId))
    }

    update()

    if (typeof ResizeObserver === 'undefined') return

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(container)

    const fieldCard = playerCardInContainer(container, pair.offId)
    const benchCard = playerCardInContainer(container, pair.onId)
    if (fieldCard) resizeObserver.observe(fieldCard)
    if (benchCard) resizeObserver.observe(benchCard)

    return () => resizeObserver.disconnect()
  }, [pair, containerRef])

  if (!pair || centerY === null) return null

  return (
    <button
      type="button"
      className="game-recommended-sub-swap-btn"
      data-testid="game-recommended-sub-swap"
      aria-label="Swap recommended players"
      style={{ top: centerY }}
      onClick={() => onSwap(pair.offId, pair.onId)}
    >
      <span className="game-recommended-sub-swap-icon" aria-hidden>
        ↔
      </span>
    </button>
  )
}
